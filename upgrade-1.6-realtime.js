/* QUEST DAY 1.6 — opt-in realtime friends via Supabase.
   Requires supabase/quest-day-realtime.sql + realtime-config.js.
   No quest titles, dates, event logs, purchase history, or sensitive info is sent.
   Local-only friend cards from 1.5 remain available until opted in. */
(function(){
 "use strict";
 const cfg=window.QUEST_DAY_REALTIME_CONFIG||{};
 const root=document.getElementById("frFriends");
 const tab=document.querySelector('nav button[data-page="frFriends"]');
 if(!root || !tab)return;
 const style=document.createElement("style");
 style.textContent=[
 ".rt16-top{border:1px solid #ded8ff;background:linear-gradient(135deg,#f0edff,#fff);border-radius:16px;padding:15px;margin:13px 0}",
 ".rt16-top h3{margin:0 0 9px;font-size:17px;color:#443b7f}",
 ".rt16-top p{font-size:12px;line-height:1.65;color:#77758c;margin:8px 0}",
 ".rt16-status{display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:17px;padding:7px 10px;font-size:11px;font-weight:800;color:#6a61a0}",
 ".rt16-stat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:14px 0}",
 ".rt16-stat div{background:#f5f3ff;padding:10px 5px;border-radius:12px;text-align:center}",
 ".rt16-stat strong{display:block;font-size:16px;color:#5d4bc5}.rt16-stat small{font-size:10px;color:#9995b0}",
 ".rt16-pair{display:flex;align-items:center;gap:9px;min-width:0;padding:11px 0;border-bottom:1px solid #f0edf8}",
 ".rt16-pair:last-child{border-bottom:0}.rt16-pair .fr-avatar{height:54px;width:54px;flex-basis:54px}",
 ".rt16-pair-main{min-width:0;flex:1}.rt16-pair-main strong{font-size:13px;overflow-wrap:anywhere}",
 ".rt16-small{font-size:11px;line-height:1.45;color:#8988a0;margin-top:5px}",
 ".rt16-actions{display:flex;gap:6px;flex-wrap:wrap}.rt16-actions button{font-size:11px;white-space:nowrap;padding:9px}",
 ".rt16-field{display:flex;gap:7px;margin:10px 0}.rt16-field input{min-width:0;flex:1;border-radius:11px;padding:11px;border:1px solid #e4e1ef;font-size:13px}",
 ".rt16-empty{text-align:center;color:#9999ad;font-size:12px;padding:19px 5px}",
 ".rt16-warning{font-size:12px;line-height:1.7;color:#80778d;background:#f9f5ff;padding:12px;border-radius:12px}",
 ".rt16-pill{border-radius:15px;background:#e9e5ff;color:#6d5ab7;padding:6px 9px;font-size:11px;font-weight:850}",
 ".rt16-options{display:flex;gap:7px;flex-wrap:wrap}.rt16-options button{flex:1}",
 ".rt16-kicker{font-weight:850;color:#554a98;font-size:12px}",
 "@media(max-width:380px){.rt16-field{flex-wrap:wrap}.rt16-field button{width:100%}}"
 ].join("");
 document.head.appendChild(style);

 const URL_OK=typeof cfg.url==="string"&&/^https:\/\/[a-z0-9.-]+(?::443)?\/?$/i.test(cfg.url.trim());
 const KEY_OK=typeof cfg.publishableKey==="string"&&cfg.publishableKey.trim().length>20&&
   !cfg.publishableKey.includes("service_role")&&!cfg.publishableKey.startsWith("sb_secret_");
 const configured=URL_OK&&KEY_OK;
 const CONSENT_KEY="quest-day-realtime-opt-in-v1";
 const OFFLINE_KEY="quest-day-realtime-offline-choice-v1";
 let client=null,me=null,invite="",channel=null,started=false,connecting=false,online=false;
 let requests=[],contacts=[],lastSync="",lastPublished="",syncTimer=null,pollTimer=null,refreshTimer=null;
 let sdkPromise=null,operation=false,errorText="",showCode=false,appCode="";
 let reconnectTimer=null,lastResumeAttempt=0,resuming=false;
 const esc=v=>escapeHtml(String(v??""));
 function shortNick(v){return String(v||"모험가").trim().slice(0,16)||"모험가";}
 function localName(){return shortNick(state.friends?.profile?.nickname);}
 function avatarId(){
   const chosen=state.rpg?.equipped||"starter";
   return /^[a-z_]+$/.test(chosen)&&chosen.length<49 ? (chosen==="starter"?"sprout":chosen):"sprout";
 }
 function stats(){
   return {nickname:localName(),avatar:avatarId(),level:Math.max(1,Math.min(100000,levelInfo().level)),
     xp:Math.max(0,Math.min(1000000000,totalXp())),
     quests:Math.max(0,Math.min(10000000,state.events?.length||0)),
     streak:Math.max(0,Math.min(100000,streakCount()))};
 }
 function avatarMarkup(id){
   if(id==="astronaut")return '<div class="fr-avatar"><span>🚀</span></div>';
   const safeId=/^[a-z_]{1,48}$/.test(id||"")?id:"sprout";
   return '<div class="fr-avatar"><img loading="lazy" src="./art/'+esc(safeId)+'.png?v=4" alt=""></div>';
 }
 function action(label,act,variant="",extra=""){
   return '<button class="fr-btn '+variant+'" type="button" data-rt-action="'+act+'" '+extra+'>'+label+'</button>';
 }
 function setupBanner(){
   const existing=root.querySelector("#rt16Setup");
   if(existing)return;
   const node=document.createElement("div");
   node.id="rt16Setup";node.className="rt16-top";
   node.innerHTML='<h3>🌐 실시간 친구 연결 확인</h3>'+
    '<p>이 기기에서 Supabase 연결 설정을 읽지 못했어요. 최신 설정을 다시 불러와 주세요.</p>'+
    '<div class="rt16-options">'+action("최신 설정 다시 불러오기","reload","")+'</div>'+
    '<p>연결 설정을 아직 입력하지 않았다면 '+
    '<a href="https://github.com/leaple/quest-day/blob/main/supabase/SETUP.md" target="_blank" rel="noopener noreferrer">GitHub 연결 안내서</a>를 확인해 주세요.</p>';
   root.prepend(node);
 }
 function offlineBanner(){
   if(root.querySelector("#rt16OfflineBanner"))return;
   const banner=document.createElement("div");
   banner.id="rt16OfflineBanner";banner.className="rt16-top";
   banner.innerHTML='<h3>🌐 실시간 친구 기능 사용 가능</h3>'+
     '<p>지금은 기존 친구 카드 모드예요. 친구 신청·수락과 자동 갱신을 사용하려면 실시간 모드를 켜세요.</p>'+
     action("실시간 친구 기능 켜기","enable");
   root.prepend(banner);
 }
 function beforeStart(){
   root.innerHTML='<div class="rt16-top"><h3>🌐 실시간 친구 시작하기</h3>'+
    '<p>상대방과 <strong>서로 수락한 친구</strong>만 실시간 성장 정보를 볼 수 있어요. '+
    '공유 정보: 닉네임, 장착 캐릭터, 레벨, 누적 XP, 완료 퀘스트 수, 연속 기록.</p>'+
    '<p>퀘스트 제목·상세 완료 내역·골드·연락처는 서버에 전송되지 않아요. '+
    '서버에는 임시 익명 계정이 만들어지고, 같은 기기에서만 로그인 상태가 유지돼요. '+
    '브라우저 데이터를 삭제하거나 기기를 바꾸면 계정 접근이 사라질 수 있어요.</p>'+
    '<div class="rt16-options">'+action("동의하고 실시간 기능 켜기","enable")+
    action("기존 코드 친구 계속 사용","offline","alt")+'</div></div>';
 }
 function showError(e){
   errorText=typeof e==="string"?e:(e?.message||"서버에 연결하지 못했어요.");
   console.warn("QUEST DAY Realtime:",e);
   if(root.classList.contains("active"))drawLive();
 }
 function loadSDK(){
   if(window.supabase?.createClient)return Promise.resolve(window.supabase);
   if(sdkPromise)return sdkPromise;
   sdkPromise=new Promise((resolve,reject)=>{
     const script=document.createElement("script");
     script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
     script.async=true;
     script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error("실시간 라이브러리가 준비되지 않았어요."));
     script.onerror=()=>reject(new Error("실시간 라이브러리를 다운로드하지 못했어요. 네트워크를 확인해 주세요."));
     document.head.appendChild(script);
   });
   return sdkPromise;
 }
 async function start(){
   if(!configured||started||connecting)return;
   connecting=true;errorText="";
   if(root.classList.contains("active"))drawLive();
   try {
     const lib=await loadSDK();
     client=lib.createClient(cfg.url.trim().replace(/\/$/,""),cfg.publishableKey.trim(),{
       auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
       realtime:{params:{eventsPerSecond:5}}
     });
     let result=await client.auth.getUser();
     if(!result.data?.user){
       const anonymous=await client.auth.signInAnonymously();
       if(anonymous.error)throw anonymous.error;
       result=await client.auth.getUser();
     }
     if(result.error)throw result.error;
     me=result.data.user;
     if(!me?.id)throw new Error("익명 로그인을 완료하지 못했어요.");
     const init=await client.rpc("qd_bootstrap");
     if(init.error)throw init.error;
     invite=init.data||"";
     started=true;
     await publish(true);
     await reload();
     subscribe();
     window.dispatchEvent(new CustomEvent("qd:realtime-ready"));
     clearInterval(pollTimer);
     pollTimer=setInterval(()=>{
       if(!started || navigator.onLine===false || document.visibilityState==="hidden")return;
       publish().catch(showError);
       reload();
     },45000);
   } catch(e){
     started=false;
     online=false;
     lastPublished="";
     if(channel&&client){client.removeChannel(channel);channel=null;}
     showError(e);
   }
   finally {
     connecting=false;
     if(root.classList.contains("active"))drawLive();
   }
 }
 async function publish(force=false){
   if(!client||!me)return;
   const data=stats();
   const signature=JSON.stringify(data);
   if(!force&&lastPublished===signature)return;
   const response=await client.from("qd_profiles").upsert({
     user_id:me.id,...data,updated_at:new Date().toISOString()
   },{onConflict:"user_id"});
   if(response.error)throw response.error;
   lastPublished=signature;
 }
 function scheduleSync(){
   if(!started||!me)return;
   clearTimeout(syncTimer);
   syncTimer=setTimeout(async()=>{
     try{await publish();}catch(e){showError(e);}
   },1400);
 }
 async function reload(){
   if(!client||!me)return;
   try{
     const [friendsResult,requestResult]=await Promise.all([
       client.from("qd_friendships")
         .select("user_a,user_b,active").eq("active",true)
         .or("user_a.eq."+me.id+",user_b.eq."+me.id),
       client.rpc("qd_request_previews")
     ]);
     if(friendsResult.error)throw friendsResult.error;
     if(requestResult.error)throw requestResult.error;
     requests=Array.isArray(requestResult.data)?requestResult.data:[];
     const friendships=friendsResult.data||[];
     const friendIds=friendships.map(f=>f.user_a===me.id?f.user_b:f.user_a);
     if(friendIds.length){
       const profiles=await client.from("qd_profiles")
         .select("user_id,nickname,avatar,level,xp,quests,streak,updated_at").in("user_id",friendIds);
       if(profiles.error)throw profiles.error;
       contacts=profiles.data||[];
     } else contacts=[];
     lastSync=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
     errorText="";
     if(root.classList.contains("active"))drawLive();
     window.dispatchEvent(new CustomEvent("qd:friends-updated"));
   }catch(e){showError(e);}
 }
 function refreshSoon(){
   clearTimeout(refreshTimer);
   refreshTimer=setTimeout(()=>{reload();},400);
 }
 function reconnectSoon(){
   if(reconnectTimer || !started || localStorage.getItem(CONSENT_KEY)!=="yes")return;
   reconnectTimer=setTimeout(()=>{
     reconnectTimer=null;
     if(!started || navigator.onLine===false || document.visibilityState==="hidden")return;
     // Realtime subscriptions can time out while a mobile PWA is suspended.
     subscribe();
     publish().catch(showError);
     reload();
   },6000);
 }
 function subscribe(){
   if(!client||!me)return;
   if(channel)client.removeChannel(channel);
   channel=client.channel("qd-friends-"+me.id)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_profiles"},refreshSoon)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_profiles"},refreshSoon)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_friend_requests"},refreshSoon)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_friend_requests"},refreshSoon)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_friendships"},refreshSoon)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_friendships"},refreshSoon)
    .subscribe(status=>{
      online=status==="SUBSCRIBED";
      if(online){
        clearTimeout(reconnectTimer);
        reconnectTimer=null;
        refreshSoon();
      } else if(status==="TIMED_OUT" || status==="CHANNEL_ERROR" || status==="CLOSED"){
        reconnectSoon();
      }
      if(root.classList.contains("active"))drawLive();
    });
 }
 function showDate(input){
   if(!input)return "방금";
   const date=new Date(input);
   return Number.isFinite(date.getTime())?date.toLocaleString("ko-KR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";
 }
 function currentRow(f){
   return '<div class="rt16-pair">'+avatarMarkup(f.avatar)+
    '<div class="rt16-pair-main"><strong>'+esc(f.nickname)+'</strong>'+
    '<div class="rt16-small">Lv.'+f.level+' · '+f.xp+' XP · '+f.quests+'개 완료 · '+f.streak+'일 연속</div>'+
    '<div class="rt16-small">최근 동기화 '+esc(showDate(f.updated_at))+'</div></div>'+
    action("삭제","remove","remove",'data-target="'+esc(f.user_id)+'"')+'</div>';
 }
 function requestRow(r){
   const received=r.direction==="received";
   return '<div class="rt16-pair">'+avatarMarkup(r.avatar)+
    '<div class="rt16-pair-main"><strong>'+esc(r.nickname)+'</strong>'+
    '<div class="rt16-small">'+(received?"친구 신청이 도착했어요":"수락을 기다리고 있어요")+
    ' · '+esc(showDate(r.created_at))+'</div></div>'+
    '<div class="rt16-actions">'+(received?
    action("수락","accept","",'data-target="'+esc(r.request_id)+'"')+
    action("거절","decline","alt",'data-target="'+esc(r.request_id)+'"'):
    action("취소","cancel","alt",'data-target="'+esc(r.request_id)+'"'))+'</div></div>';
 }
 function drawLive(){
   if(!root.classList.contains("active"))return;
   const draftInvite=document.getElementById("rt16AddCode")?.value||"";
   const draftNickname=document.getElementById("rt16Nick")?.value||"";
   const activeField=document.activeElement?.id||"";
   if(!started){
     root.innerHTML='<div class="rt16-top"><h3>🌐 실시간 친구</h3>'+
       '<p>'+(connecting?"서버에 연결하고 있어요.":"서버 연결이 아직 완료되지 않았어요.")+'</p>'+
       (errorText?'<p style="color:#bf526b">'+esc(errorText)+'</p>':"")+
       (connecting?"":action("다시 연결","retry"))+'</div>';
     return;
   }
   const my=stats();
   const ranked=[{nickname:my.nickname,avatar:my.avatar,level:my.level,xp:my.xp,quests:my.quests,streak:my.streak,self:true},
     ...contacts].sort((a,b)=>b.xp-a.xp||a.nickname.localeCompare(b.nickname,"ko"));
   const incoming=requests.filter(r=>r.direction==="received");
   const outgoing=requests.filter(r=>r.direction==="sent");
   window.QuestDaySocial?.captureDraft?.();
   root.innerHTML=
    '<div class="fr-title"><div><h2>🌐 실시간 친구</h2><p class="fr-muted">서로 친구가 되면 성장 기록이 자동 갱신돼요.</p></div>'+
    '<span class="rt16-status">'+(online?"🟢 연결됨":"🟠 다시 연결 중")+'</span></div>'+
    (errorText?'<div class="rt16-warning">'+esc(errorText)+'</div>':"")+
    '<div class="fr-panel"><div class="fr-user">'+avatarMarkup(my.avatar)+
    '<div class="fr-user-main"><div class="fr-name">'+esc(my.nickname)+'</div>'+
    '<div class="fr-muted">나의 실시간 프로필 · Lv.'+my.level+'</div></div></div>'+
    '<div class="rt16-stat"><div><strong>'+my.xp+'</strong><small>XP</small></div>'+
    '<div><strong>'+my.quests+'</strong><small>퀘스트</small></div>'+
    '<div><strong>'+my.streak+'일</strong><small>연속 달성</small></div></div>'+
    '<div class="rt16-field"><input id="rt16Nick" maxlength="16" value="'+esc(my.nickname)+'" aria-label="공유할 닉네임" placeholder="실명이 아닌 별명">'+
    action("닉네임 변경","nickname","alt")+'</div>'+
    '<p class="fr-muted">실명이 아닌 별명을 권장해요. 레벨·XP 등의 수치는 자동 갱신돼요.</p></div>'+
    '<div class="fr-panel"><strong>✉ 친구 초대 코드</strong>'+
    '<p class="fr-muted">친구에게 코드를 보내고, 상대방이 신청하면 이 화면에서 수락하세요.</p>'+
    '<div class="rt16-field"><input id="rt16Invite" readonly value="'+(showCode?esc(invite):"••••••••••••••••••••••••")+
    '" aria-label="내 초대 코드">'+action("코드 복사","copy","")+'</div>'+
    '<div class="rt16-options">'+action(showCode?"코드 가리기":"코드 보기","reveal","alt")+
    action("초대 코드 재발급","rotate","alt")+'</div>'+
    '<p class="fr-muted">코드를 받은 사람이 신청할 수 있어요. 친구가 되기 전에는 성장 기록이 공개되지 않아요.</p></div>'+
    '<div class="fr-panel"><strong>➕ 친구 신청하기</strong>'+
    '<div class="rt16-field"><input id="rt16AddCode" maxlength="64" placeholder="친구 초대 코드 32자리" autocomplete="off" autocapitalize="off" spellcheck="false">'+
    action("신청","send")+'</div></div>'+
    '<div class="fr-panel"><strong>📨 받은 친구 신청 ('+incoming.length+')</strong>'+
    (incoming.length?incoming.map(requestRow).join(""):'<div class="rt16-empty">받은 신청이 없어요.</div>')+'</div>'+
    '<div class="fr-panel"><strong>📤 보낸 친구 신청 ('+outgoing.length+')</strong>'+
    (outgoing.length?outgoing.map(requestRow).join(""):'<div class="rt16-empty">대기 중인 신청이 없어요.</div>')+'</div>'+
    '<div class="fr-panel"><strong>👥 내 친구 ('+contacts.length+')</strong>'+
    (contacts.length?contacts.map(currentRow).join(""):'<div class="rt16-empty">아직 친구가 없어요.</div>')+'</div>'+
    '<div class="fr-panel"><strong>🏆 실시간 성장 비교</strong>'+
    '<p class="fr-muted">친구끼리 공유한 수치만 비교하며 공개 순위표는 없어요.</p>'+
    ranked.map((f,i)=>'<div class="rt16-pair"><span class="rt16-pill">'+(i+1)+'위</span>'+
      avatarMarkup(f.avatar)+'<div class="rt16-pair-main"><strong>'+esc(f.nickname)+(f.self?" (나)":"")+
      '</strong><div class="rt16-small">Lv.'+f.level+' · 완료 '+f.quests+'개</div></div>'+
      '<strong style="font-size:12px;color:#6a5ac7">'+f.xp+' XP</strong></div>').join("")+'</div>'+
    '<div class="fr-panel"><div class="rt16-options">'+action("지금 새로고침","refresh","alt")+
      action("실시간 연결 끄기","stop","alt")+'</div>'+
      '<div class="rt16-options" style="margin-top:7px">'+action("내 서버 공유 정보 삭제","delete","remove")+'</div>'+
      '<p class="fr-muted">마지막 확인: '+esc(lastSync||"확인 전")+
      '. 연결을 꺼도 서버 데이터는 남으며, 삭제 버튼으로 공유 정보와 친구 관계를 지울 수 있어요.</p></div>'+
    '<div class="rt16-warning">🔒 퀘스트 제목이나 세부 활동 기록은 업로드하지 않아요. '+
    '익명 계정은 기기를 바꾸거나 브라우저 데이터를 삭제하면 복구할 수 없을 수 있어요. '+
    '서로 친구가 된 상대에게만 성장 요약이 보여요.</div>';
   window.QuestDaySocial?.mount?.();
   const addField=document.getElementById("rt16AddCode");
   const nickField=document.getElementById("rt16Nick");
   if(addField&&draftInvite)addField.value=draftInvite;
   if(nickField&&draftNickname&&activeField==="rt16Nick")nickField.value=draftNickname;
   if(activeField==="rt16AddCode")addField?.focus();
   else if(activeField==="rt16Nick")nickField?.focus();
 }
 async function rpc(name,params){
   const r=await client.rpc(name,params||{});
   if(r.error)throw r.error;
   return r.data;
 }
 async function saveNick(value){
   const clean=String(value||"").trim().slice(0,16);
   if(!clean)return alert("닉네임을 입력해 주세요.");
   if(!state.friends)state.friends={profile:{id:"",nickname:clean},contacts:[]};
   if(!state.friends.profile)state.friends.profile={id:"",nickname:clean};
   const old=state.friends.profile.nickname;
   state.friends.profile.nickname=clean;
   try{
     saveState();
     await publish(true);
     drawLive();
   }catch(e){state.friends.profile.nickname=old;showError(e);}
 }
 async function stop(){
   started=false;online=false;me=null;
   clearTimeout(syncTimer);clearTimeout(refreshTimer);clearInterval(pollTimer);
   clearTimeout(reconnectTimer);reconnectTimer=null;
   if(channel&&client){client.removeChannel(channel);channel=null;}
   localStorage.removeItem(CONSENT_KEY);
   window.dispatchEvent(new CustomEvent("qd:realtime-stopped"));
   beforeStart();
 }
 async function execute(action,target){
   if(operation)return;
   operation=true;
   try{
     if(action==="retry"){await start();return;}
     if(action==="enable"){
       if(!confirm("내 닉네임·캐릭터·XP·퀘스트 완료 횟수·연속 기록을 실시간 친구 서버에 저장할까요?"))return;
       localStorage.removeItem(OFFLINE_KEY);
       localStorage.setItem(CONSENT_KEY,"yes");
       await start();return;
     }
     if(action==="offline"){
       localStorage.removeItem(CONSENT_KEY);
       localStorage.setItem(OFFLINE_KEY,"yes");
       tab.onclick();
       offlineBanner();
       return;
     }
     if(!started||!client)return;
     if(action==="copy"){
       try{await navigator.clipboard.writeText(invite);alert("초대 코드를 복사했어요.");}
       catch(e){showCode=true;drawLive();const inp=document.getElementById("rt16Invite");inp?.focus();inp?.select();alert("코드를 길게 눌러 복사해 주세요.");}
     }else if(action==="reveal"){showCode=!showCode;drawLive();}
     else if(action==="nickname"){await saveNick(document.getElementById("rt16Nick")?.value);}
     else if(action==="send"){
       const raw=(document.getElementById("rt16AddCode")?.value||"").trim().toLowerCase();
       if(!/^[0-9a-f]{32}$/.test(raw)){alert("32자리 초대 코드를 확인해 주세요.");return;}
       await rpc("qd_send_request",{invite_code:raw});
       alert("친구 신청을 보냈어요.");await reload();
     }else if(action==="accept"||action==="decline"){
       await rpc("qd_respond_request",{req_id:target,approve:action==="accept"});
       await reload();
     }else if(action==="cancel"){
       await rpc("qd_cancel_request",{req_id:target});await reload();
     }else if(action==="remove"){
       if(!confirm("이 친구 관계를 해제할까요?"))return;
       await rpc("qd_remove_friend",{friend_id:target});await reload();
     }else if(action==="rotate"){
       if(!confirm("기존 초대 코드를 무효화하고 새 코드를 만들까요?"))return;
       invite=await rpc("qd_rotate_invite");showCode=false;drawLive();
     }else if(action==="refresh"){
       await publish();await reload();
     }else if(action==="stop")await stop();
     else if(action==="delete"){
       if(!confirm("서버에 저장한 내 프로필·초대 코드·친구 관계·신청 기록을 삭제할까요? 로컬 퀘스트·골드·캐릭터는 그대로 유지돼요."))return;
       await rpc("qd_remove_my_profile");
       await client.auth.signOut();
       lastPublished="";invite="";contacts=[];requests=[];
       await stop();
       alert("서버의 공유 정보를 삭제했어요. 로컬 퀘스트는 유지돼요.");
     }
   }catch(e){showError(e);alert("실시간 기능 오류: "+(e.message||"연결을 확인해 주세요."));}
   finally{operation=false;}
 }

 root.addEventListener("click",event=>{
   const btn=event.target.closest("button[data-rt-action]");
   if(!btn)return;
   if(btn.dataset.rtAction==="reload"){
     const dest=new URL(window.location.href);
     dest.searchParams.set("qd_update","11");
     window.location.assign(dest.toString());
     return;
   }
   execute(btn.dataset.rtAction,btn.dataset.target||"");
 });
 // The 1.5 legacy button draws its offline view first; this handler shows live mode above it.
 tab.addEventListener("click",()=>{
   if(!configured){setupBanner();return;}
   if(!started && !connecting && localStorage.getItem(OFFLINE_KEY)==="yes") { offlineBanner(); return; }
   if(started||connecting||localStorage.getItem(CONSENT_KEY)==="yes"){
     if(!started&&!connecting)start();
     drawLive();
   }else beforeStart();
 });
 // Once the user has opted in, recovery is automatic when the PWA opens,
 // returns to the foreground, or regains connectivity. No manual refresh needed.
 async function resumeAutomatically(){
   if(!configured || localStorage.getItem(CONSENT_KEY)!=="yes" ||
      navigator.onLine===false || document.visibilityState==="hidden" ||
      connecting || resuming)return;
   const now=Date.now();
   if(now-lastResumeAttempt<2500)return;
   lastResumeAttempt=now;
   resuming=true;
   try{
     if(!started){
       await start();
     }else{
       await publish();
       await reload();
       if(!online)subscribe();
     }
   }catch(e){showError(e);reconnectSoon();}
   finally{resuming=false;}
 }
 document.addEventListener("visibilitychange",()=>{
   if(document.visibilityState==="visible")resumeAutomatically();
 });
 window.addEventListener("pageshow",resumeAutomatically);
 window.addEventListener("focus",resumeAutomatically);
 window.addEventListener("online",resumeAutomatically);
 const savePrevious=saveState;
 saveState=function(){
   savePrevious();
   scheduleSync();
 };
 const renderPrevious=render;
 render=function(){
   renderPrevious();
   if(root.classList.contains("active")){
     if(!configured)setupBanner();
     else if(started||connecting)drawLive();
     else if(localStorage.getItem(OFFLINE_KEY)==="yes")offlineBanner();
     else if(localStorage.getItem(CONSENT_KEY)!=="yes")beforeStart();
   }
 };
 window.QuestDayRealtime={
   getClient:()=>client,
   getUser:()=>me,
   isReady:()=>started,
   getFriends:()=>contacts.slice(),
   refreshFriends:()=>reload()
 };
 if(configured&&localStorage.getItem(CONSENT_KEY)==="yes")start();
})();
