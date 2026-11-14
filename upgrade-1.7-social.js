/* QUEST DAY 1.7 — Social Adventures.
   Uses the consented Supabase anonymous account from v1.6.
   In-app notifications only: no background push permission is requested. */
(function(){
 "use strict";
 const bridge=window.QuestDayRealtime;
 const root=document.getElementById("frFriends");
 if(!bridge||!root)return;
 const st={view:"ranking",peer:"",draft:"",friends:[],ranking:[],parties:[],
  cheers:[],unreads:[],blocked:[],chat:[],ready:false,working:false,
  fetching:false,needsRefresh:false,error:"",chatLoading:false,chatScroll:0,scrollToBottom:false};
 let host=null,channel=null,poll=null,refreshTimer=null,subscribed=false;
 let renderedView="",renderedPeer="",chatSequence=0;
 const icons={spark:"✨ 힘내!",cheer:"🔥 계속 가자!",win:"🏆 멋져!"};
 const esc=v=>escapeHtml(String(v??""));
 const current=()=>bridge.getUser()?.id||"";
 const client=()=>bridge.getClient();
 const friends=()=>bridge.getFriends()||[];
 const isFriend=id=>friends().some(p=>p.user_id===id);
 const friendName=id=>friends().find(p=>p.user_id===id)?.nickname||
  st.ranking.find(p=>p.user_id===id)?.nickname||"친구";
 const date=v=>{try{return new Date(v).toLocaleString("ko-KR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});}catch(e){return "";}};
 function basicButton(text,action,data="",variant=""){
  return '<button type="button" class="s17-btn '+variant+'" data-s17="'+action+'" '+data+'>'+text+'</button>';
 }
 const style=document.createElement("style");
 style.textContent=[
 ".s17-wrap{background:#fff;border:1px solid #e2e0f5;border-radius:19px;padding:15px;margin:13px 0;box-shadow:0 6px 16px #392f6110}",
 ".s17-top{display:flex;justify-content:space-between;align-items:center;gap:7px;flex-wrap:wrap}",
 ".s17-heading{font-weight:900;font-size:18px;color:#55438f;letter-spacing:-.3px}",
 ".s17-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:14px 0 15px}",
 ".s17-tab{padding:10px 2px;background:#f2efff;color:#8379ac;border-radius:11px;font-weight:800;font-size:11px;position:relative}",
 ".s17-tab.active{background:#7666e8;color:white}.s17-pill{background:#f1eaff;border-radius:12px;padding:4px 7px;color:#6654b2;font-size:10px;font-weight:850}",
 ".s17-count{display:inline-block;background:#ff638c;color:white;border-radius:12px;min-width:16px;line-height:16px;font-size:10px;text-align:center}",
 ".s17-card{border:1px solid #edebf5;border-radius:14px;padding:12px;margin:9px 0;background:#fff;min-width:0}",
 ".s17-card.soft{background:#faf9ff}.s17-muted{font-size:11px;color:#9290a6;line-height:1.6;margin:6px 0}",
 ".s17-title{font-size:14px;font-weight:880;color:#4f457a;margin:0 0 6px}",
 ".s17-row{display:flex;gap:9px;align-items:center;min-width:0;flex-wrap:wrap}",
 ".s17-grow{flex:1;min-width:0}.s17-strong{font-weight:840;font-size:13px;color:#3f395c;overflow-wrap:anywhere}",
 ".s17-buttonrow{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}",
 ".s17-btn{background:#7566e8;color:white;font-size:11px;font-weight:800;border:0;border-radius:10px;padding:10px 11px;cursor:pointer}",
 ".s17-btn.alt{background:#efecff;color:#6957c8}.s17-btn.danger{background:#fff0f1;color:#ab556e}",
 ".s17-btn:disabled{opacity:.55;cursor:default}.s17-btn{min-height:42px;touch-action:manipulation}.s17-tab{min-height:43px}",
 ".s17-chat{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}",
 ".s17-textarea{font-size:16px;line-height:1.5}.s17-input,.s17-select,.s17-textarea{border:1px solid #e1dfef;border-radius:10px;padding:11px;background:white;color:#35314d;font:inherit;font-size:12px;min-width:0;box-sizing:border-box}",
 ".s17-input,.s17-select{flex:1}.s17-textarea{width:100%;resize:vertical;min-height:62px;line-height:1.5}",
 ".s17-progress{height:9px;background:#edeaf9;border-radius:9px;margin:12px 0 4px;overflow:hidden}",
 ".s17-progress > div{height:100%;background:linear-gradient(90deg,#8170ed,#53d0b3);border-radius:9px}",
 ".s17-chat{max-height:320px;min-height:150px;overflow-y:auto;background:#f9f8fd;padding:12px;border-radius:13px;margin:10px 0;display:flex;flex-direction:column;gap:9px}",
 ".s17-bubble{max-width:88%;background:white;padding:10px;border-radius:13px;align-self:flex-start;min-width:0;word-break:break-word}",
 ".s17-bubble.mine{align-self:flex-end;background:#e9e4ff}.s17-message{white-space:pre-wrap;font-size:12px;line-height:1.5;overflow-wrap:anywhere}",
 ".s17-caption{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:5px;font-size:10px;color:#9a94af}",
 ".s17-caption button{font-size:10px;color:#9c6c89;background:transparent;border:0;padding:0}",
 ".s17-error{color:#af4563;background:#fff0f4;border-radius:12px;padding:12px;font-size:12px;line-height:1.6}",
 ".s17-empty{padding:20px 6px;color:#9993aa;font-size:12px;text-align:center}",
 ".s17-toast{position:fixed;top:calc(14px + env(safe-area-inset-top));right:12px;left:12px;max-width:480px;margin:auto;z-index:120;background:#3e346e;color:white;border-radius:13px;padding:13px 17px;font-weight:800;font-size:13px;box-shadow:0 10px 26px #22254a55}",
 ".s17-note{background:#f5f3ff;color:#7b7394;border-radius:11px;padding:10px;font-size:11px;line-height:1.6}",
 "@media(max-width:380px){.s17-wrap{padding:11px}.s17-tab{font-size:10px}.s17-btn{padding:9px 7px}}"
 ].join("");
 document.head.appendChild(style);

 function captureDraft(){
  const txt=document.getElementById("s17Message");
  if(txt)st.draft=txt.value;
  const scroll=document.getElementById("s17ChatLog");
  if(scroll)st.chatScroll=scroll.scrollTop;
 }
 function mount(){
  if(!bridge.isReady()||!root.classList.contains("active"))return;
  if(!root.querySelector("#s17Social")){
   const el=document.createElement("section");
   el.id="s17Social";el.className="s17-wrap";host=el;
   const heading=root.firstElementChild;
   if(heading&&heading.after)heading.after(el);
   else root.prepend(el);
  }else host=root.querySelector("#s17Social");
  render();
 }
 function progressCard(p){
  const pending=p.status==="pending";
  const total=Number(p.my_completed||0)+Number(p.partner_completed||0);
  const pct=Math.min(100,Math.round(total/p.target*100));
  const accepted=total>=p.target && !pending;
  return '<div class="s17-card"><div class="s17-row"><strong class="s17-grow">⚔️ '+esc(p.partner_nickname)+
   ' · 함께 '+p.target+'개 완료</strong><span class="s17-pill">'+(pending?"수락 대기":accepted?"🎉 목표 달성":"진행 중")+'</span></div>'+
   (pending?'<div class="s17-muted">'+(p.direction==="received"?"파티 초대가 도착했어요":"친구의 초대 수락을 기다리고 있어요")+'</div>':
   '<div class="s17-progress"><div style="width:'+pct+'%"></div></div>'+
   '<p class="s17-muted">합계 '+total+' / '+p.target+'개 · 나 '+p.my_completed+'개 + 친구 '+p.partner_completed+'개</p>')+
   '<div class="s17-buttonrow">'+(pending&&p.direction==="received"?
   basicButton("수락","partyAccept",'data-id="'+esc(p.id)+'"')+
   basicButton("거절","partyDecline",'data-id="'+esc(p.id)+'"',"alt"):
   basicButton(pending?"초대 취소":"파티 종료","partyCancel",'data-id="'+esc(p.id)+'"',"alt"))+'</div></div>';
 }
 function friendsOptions(placeholder){
  return '<option value="">'+placeholder+'</option>'+
   friends().map(f=>'<option value="'+esc(f.user_id)+'">'+esc(f.nickname)+'</option>').join("");
 }
 function rankingView(){
  return '<p class="s17-muted">이번 주 월요일~일요일(한국 시간) 동안 새로 획득한 XP 순위예요. 설치 전 기록은 제외돼요.</p>'+
   (st.ranking.length?st.ranking.map((p,i)=>
   '<div class="s17-card soft"><div class="s17-row"><span class="s17-pill">'+(i+1)+'위</span>'+
   '<div class="s17-grow"><div class="s17-strong">'+esc(p.nickname)+(p.user_id===current()?" (나)":"")+
   '</div><div class="s17-muted">이번 주 완료 '+p.week_quests+'개</div></div>'+
   '<strong style="color:#6b59ce;font-size:14px">+'+p.week_xp+' XP</strong></div></div>').join(""):
   '<div class="s17-empty">아직 이번 주 랭킹 데이터가 없어요.</div>');
 }
 function partyView(){
  const incoming=st.parties.filter(x=>x.status==="pending"&&x.direction==="received").length;
  return '<p class="s17-muted">친구와 목표를 공유해요. 초대를 수락한 순간부터 두 사람의 퀘스트 완료 수가 합산돼요. 게임 XP를 추가 지급하지는 않아요.</p>'+
  '<div class="s17-card soft"><h4 class="s17-title">새로운 파티 퀘스트</h4>'+
  '<div class="s17-row"><select class="s17-select" id="s17PartyFriend" aria-label="친구 선택">'+friendsOptions("친구 선택")+'</select>'+
  '<select class="s17-select" id="s17Goal" aria-label="공동 목표"><option value="5">5개 완료</option><option value="10">10개 완료</option><option value="20">20개 완료</option></select></div>'+
  '<div class="s17-buttonrow">'+basicButton("친구에게 파티 초대","partyCreate")+'</div></div>'+
  (incoming?'<p class="s17-muted">📨 받은 파티 초대 '+incoming+'개</p>':"")+
  (st.parties.length?st.parties.map(progressCard).join(""):'<div class="s17-empty">진행 중인 파티가 없어요.</div>');
 }
 function notificationsView(){
  const pending=st.parties.filter(x=>x.status==="pending"&&x.direction==="received");
  const unread=st.cheers.filter(c=>!c.seen_at).length;
  return '<p class="s17-muted">친구가 보낸 응원과 파티 초대를 앱 안에서 확인할 수 있어요. 앱이 종료된 동안 푸시 알림은 지원하지 않아요.</p>'+
  '<div class="s17-card soft"><h4 class="s17-title">친구 응원 보내기 ✨</h4>'+
  '<div class="s17-row"><select class="s17-select" id="s17CheerFriend">'+friendsOptions("친구 선택")+'</select>'+
  '<select class="s17-select" id="s17CheerKind"><option value="spark">✨ 힘내!</option><option value="cheer">🔥 계속 가자!</option><option value="win">🏆 멋져!</option></select></div>'+
  '<div class="s17-buttonrow">'+basicButton("응원 보내기","cheerSend")+'</div></div>'+
  '<div class="s17-row"><h4 class="s17-title s17-grow">받은 응원 '+(unread?'('+unread+'개 안 읽음)':'')+'</h4>'+
  (unread?basicButton("모두 읽음","cheerRead","","alt"):"")+'</div>'+
  (pending.length?'<div class="s17-card soft">⚔️ 파티 초대 '+pending.length+
    '개가 도착했어요. <strong>파티</strong> 메뉴에서 수락할 수 있어요.</div>':"")+
  (st.cheers.length?st.cheers.map(c=>
    '<div class="s17-card'+(!c.seen_at?' soft':'')+'"><div class="s17-row"><strong class="s17-grow">'+
    esc(friendName(c.sender_id))+'님의 응원</strong>'+
    (!c.seen_at?'<span class="s17-count">NEW</span>':"")+'</div>'+
    '<div class="s17-strong">'+esc(icons[c.kind]||"✨ 응원!")+'</div>'+
    '<div class="s17-muted">'+esc(date(c.created_at))+'</div></div>').join(""):
    '<div class="s17-empty">아직 받은 응원이 없어요.</div>');
 }
 function chatMessagesHtml(){
  if(st.chatLoading && !st.chat.length)
    return '<div class="s17-empty">대화 불러오는 중...</div>';
  if(!st.chat.length)return '<div class="s17-empty">아직 메시지가 없어요. 인사를 건네 보세요!</div>';
  return st.chat.map(m=>{
    const mine=m.sender_id===current();
    return '<div class="s17-bubble'+(mine?' mine':'')+'"><div class="s17-message">'+esc(m.body)+'</div>'+
      '<div class="s17-caption">'+esc(date(m.created_at))+
      (!mine?'<button type="button" data-s17="report" data-id="'+esc(m.id)+'">신고</button>':"")+
      '</div></div>';
  }).join("");
 }
 function chatsView(){
  const available=friends();
  const totalUnread=st.unreads.reduce((a,u)=>a+Number(u.unread_count||0),0);
  const peer=st.peer;
  return '<p class="s17-muted">서로 친구가 된 사용자에게만 메시지를 보낼 수 있어요. 텍스트만 지원하며, 불편한 대화는 차단·신고할 수 있어요.</p>'+
  '<div class="s17-card soft"><div class="s17-row"><strong class="s17-grow">대화 상대 선택</strong>'+
  (totalUnread?'<span class="s17-count">'+totalUnread+'</span>':"")+'</div>'+
  (available.length?available.map(f=>{
    const count=st.unreads.find(u=>u.partner_id===f.user_id)?.unread_count||0;
    return basicButton(esc(f.nickname)+(count?' ('+count+')':''),"chatOpen",
      'data-id="'+esc(f.user_id)+'"',peer===f.user_id?"":"alt");
  }).join(" "):'<div class="s17-empty">친구가 생기면 채팅을 시작할 수 있어요.</div>')+'</div>'+
  (peer&&isFriend(peer)?
   '<div class="s17-card"><div class="s17-row"><h4 class="s17-title s17-grow">💬 '+esc(friendName(peer))+'</h4>'+
   basicButton("대화 닫기","chatClose","","alt")+
   basicButton("차단","block",'data-id="'+esc(peer)+'"',"danger")+'</div>'+
   '<div class="s17-chat" id="s17ChatLog">'+
     chatMessagesHtml()+
   '</div><textarea class="s17-textarea" id="s17Message" maxlength="500" rows="2" placeholder="친구에게 보낼 메시지 (최대 500자)"></textarea>'+
   '<div class="s17-buttonrow">'+basicButton("메시지 보내기","chatSend")+'</div></div>':
   '<div class="s17-empty">위에서 친구를 선택하면 1:1 채팅을 시작할 수 있어요.</div>')+
  (st.blocked.length?'<div class="s17-card"><h4 class="s17-title">차단한 사용자</h4>'+
    st.blocked.map(b=>'<div class="s17-row" style="margin:5px 0"><span class="s17-grow s17-muted">차단된 계정 ·'+
    esc(b.blocked_id.slice(-6))+'</span>'+basicButton("차단 해제","unblock",
    'data-id="'+esc(b.blocked_id)+'"',"alt")+'</div>').join("")+'</div>':"");
 }
 function statusError(error){
  if(!error)return "";
  const missing=/PGRST202|not found|does not exist|relation .* does not exist|permission denied/i.test(error);
  return '<div class="s17-error">'+(missing?
   '새로운 소셜 기능을 사용하려면 Supabase SQL Editor에서 quest-day-social-1.7.sql을 먼저 실행해 주세요. '+
   '<a href="https://github.com/leaple/quest-day/blob/main/supabase/quest-day-social-1.7.sql" target="_blank" rel="noopener noreferrer">SQL 파일 열기</a>':
   esc(error))+'</div>';
 }
 function render(){
  if(!host||!bridge.isReady())return;
  const needBottom=st.scrollToBottom;
  captureDraft();
  const active=document.activeElement?.id||"";
  const counts=st.cheers.filter(c=>!c.seen_at).length+
   st.parties.filter(p=>p.status==="pending"&&p.direction==="received").length+
   st.unreads.reduce((v,x)=>v+Number(x.unread_count||0),0);
  const menu=[["ranking","🏆 랭킹"],["party","⚔️ 파티"],["notifications","🔔 알림"],["chat","💬 채팅"]];
  // In an open chat only update the message list. Replacing the composer DOM on
  // every realtime tick closes the iOS keyboard and loses selection/focus.
  if(st.view==="chat" && renderedView==="chat" && renderedPeer===st.peer && !st.error){
    const log=host.querySelector("#s17ChatLog");
    if(log){
      const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<85;
      const next=chatMessagesHtml();
      if(log.innerHTML!==next){
        log.innerHTML=next;
        if(nearBottom||st.scrollToBottom)log.scrollTop=log.scrollHeight;
      }
      const counter=host.querySelector("#s17NewsCount");
      if(counter)counter.textContent=counts?"새 소식 "+counts+"개":"친구 전용";
      st.scrollToBottom=false;
      return;
    }
  }
  renderedView=st.view;
  renderedPeer=st.peer;
  host.innerHTML='<div class="s17-top"><div class="s17-heading">QUEST DAY · 함께하는 모험</div>'+
   '<span id="s17NewsCount" class="s17-pill">'+(counts?'새 소식 '+counts+'개':'친구 전용')+'</span>'+'</div>'+
   '<div class="s17-tabs">'+menu.map(([id,name])=>
    '<button class="s17-tab'+(st.view===id?' active':'')+'" type="button" data-s17="view" data-view="'+id+'">'+name+'</button>').join("")+'</div>'+
   (st.working?'<div class="s17-muted">작업을 처리하고 있어요...</div>':"")+
   statusError(st.error)+
   (!st.ready&&!st.error?'<div class="s17-empty">친구 정보를 불러오고 있어요...</div>':
   st.view==="ranking"?rankingView():st.view==="party"?partyView():
   st.view==="notifications"?notificationsView():chatsView())+
   '<div class="s17-note">친구끼리만 공유돼요. 채팅과 응원은 서버에 저장되며, 랭킹 점수는 공유된 성장 수치를 기준으로 집계됩니다. 신고 내용은 프로젝트 관리자가 확인할 수 있지만 즉각적인 자동 제재를 보장하지는 않아요.</div>';
  const input=document.getElementById("s17Message");
  if(input){input.value=st.draft;if(active==="s17Message")input.focus();}
  const chatLog=document.getElementById("s17ChatLog");
  if(chatLog){
   chatLog.scrollTop=needBottom?chatLog.scrollHeight:(st.chatScroll||chatLog.scrollHeight);
   st.chatScroll=chatLog.scrollTop;
  }
  st.scrollToBottom=false;
 }
 async function runRPC(name,args){
  const c=client();if(!c)throw Error("서버 연결이 끊겼어요.");
  const res=await c.rpc(name,args||{});
  if(res.error)throw res.error;
  return res.data;
 }
 async function refresh(){
  if(!bridge.isReady()||!current())return;
  if(st.fetching){st.needsRefresh=true;return;}
  st.fetching=true;
  try{
   const c=client();
   const [ranking,parties,cheers,unreads,blocked]=await Promise.all([
    c.rpc("qd_weekly_ranking"),
    c.rpc("qd_my_parties"),
    c.from("qd_cheers").select("id,sender_id,kind,created_at,seen_at")
      .eq("recipient_id",current()).order("created_at",{ascending:false}).limit(40),
    c.rpc("qd_unread_chat_counts"),
    c.from("qd_blocks").select("blocked_id,created_at").eq("blocker_id",current())
   ]);
   for(const res of [ranking,parties,cheers,unreads,blocked])if(res.error)throw res.error;
   st.ranking=ranking.data||[];st.parties=parties.data||[];
   st.cheers=cheers.data||[];st.unreads=unreads.data||[];
   st.blocked=blocked.data||[];st.error="";st.ready=true;
   if(st.peer&&!isFriend(st.peer)){st.peer="";st.chat=[];st.draft="";}
  }catch(e){st.error=e.message||"소셜 데이터를 가져오지 못했어요.";console.warn("Social refresh",e);}
  finally{
   st.fetching=false;mount();
   if(st.needsRefresh){st.needsRefresh=false;setTimeout(refresh,500);}
  }
 }
 async function fetchChat(){
  if(!st.peer||!isFriend(st.peer)||!current())return;
  const peer=st.peer,me=current();
  const seq=++chatSequence;
  st.chatLoading=true;mount();
  try{
   const query="and(sender_id.eq."+me+",recipient_id.eq."+peer+
    "),and(sender_id.eq."+peer+",recipient_id.eq."+me+")";
   const result=await client().from("qd_messages")
    .select("id,sender_id,recipient_id,body,created_at").or(query)
    .order("created_at",{ascending:false}).limit(60);
   if(result.error)throw result.error;
   if(st.peer!==peer||seq!==chatSequence)return;
   st.chat=(result.data||[]).slice().reverse();
   await runRPC("qd_mark_chat_read",{friend_id:peer});
   st.unreads=st.unreads.filter(u=>u.partner_id!==peer);
   st.scrollToBottom=true;
  }catch(e){st.error=e.message||"채팅을 불러오지 못했어요.";}
  finally{
   if(seq===chatSequence){
     st.chatLoading=false;
     mount();
   }
  }
 }
 function toast(message){
  const element=document.createElement("div");
  element.className="s17-toast";element.setAttribute("role","status");
  element.textContent=message;document.body.appendChild(element);
  setTimeout(()=>element.remove(),4000);
 }
 function subscribe(){
  const c=client(),user=current();
  if(!c||!user)return;
  if(channel)c.removeChannel(channel);
  subscribed=false;
  channel=c.channel("qd-social-"+user)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_messages"},payload=>{
     if(payload.new?.recipient_id===user){
       if(document.visibilityState==="visible")toast("💬 친구에게 메시지가 도착했어요.");
       if(st.view==="chat"&&st.peer===payload.new?.sender_id&&root.classList.contains("active"))fetchChat();
     }
     scheduleRefresh();
   })
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_cheers"},payload=>{
     if(payload.new?.recipient_id===user&&document.visibilityState==="visible")
      toast("✨ 친구의 응원이 도착했어요!");
     scheduleRefresh();
   })
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_parties"},scheduleRefresh)
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_parties"},scheduleRefresh)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_weekly_progress"},scheduleRefresh)
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_weekly_progress"},scheduleRefresh)
   .subscribe(status=>{
     subscribed=status==="SUBSCRIBED";
     if(subscribed)scheduleRefresh();
   });
 }
 function scheduleRefresh(){
  clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,500);
 }
 async function onReady(){
  if(!bridge.isReady())return;
  st.ready=false;st.error="";
  mount();
  await refresh();
  if(!channel||!subscribed)subscribe();
  if(poll===null)poll=setInterval(()=>{
   if(bridge.isReady()&&document.visibilityState==="visible")refresh();
  },45000);
 }
 async function perform(action,id,button,snapshots={}){
  if(st.working)return;
  if(action==="view"){
   captureDraft();st.view=button.dataset.view||"ranking";st.chatScroll=0;
   mount();
   if(st.view==="notifications"){
    try{await runRPC("qd_mark_cheers_seen");await refresh();}
    catch(e){st.error=e.message||"읽음 표시 실패";mount();}
   }
   if(st.view==="chat"&&st.peer)await fetchChat();
   return;
  }
  if(action==="chatOpen"){
   if(!isFriend(id))return;
   captureDraft();
   const previousInput=document.getElementById("s17Message");
   if(previousInput)previousInput.value="";
   chatSequence++;
   st.view="chat";st.peer=id;st.draft="";st.chat=[];
   st.chatScroll=0;mount();await fetchChat();return;
  }
  if(action==="chatClose"){
   const previousInput=document.getElementById("s17Message");
   if(previousInput)previousInput.value="";
   chatSequence++;
   st.peer="";st.chat=[];st.draft="";mount();return;
  }
  st.working=true;mount();
  try{
   if(action==="cheerSend"){
    const friend=snapshots.cheerFriend||document.getElementById("s17CheerFriend")?.value;
    const kind=snapshots.cheerKind||document.getElementById("s17CheerKind")?.value;
    if(!friend||!isFriend(friend))throw Error("응원할 친구를 선택해 주세요.");
    await runRPC("qd_send_cheer",{friend_id:friend,cheer_kind:kind});
    toast("응원을 보냈어요!");
   }else if(action==="cheerRead"){
    await runRPC("qd_mark_cheers_seen");
   }else if(action==="partyCreate"){
    const friend=snapshots.partyFriend||document.getElementById("s17PartyFriend")?.value;
    const goal=Number(snapshots.goal||document.getElementById("s17Goal")?.value);
    if(!friend||!isFriend(friend))throw Error("초대할 친구를 선택해 주세요.");
    await runRPC("qd_create_party",{friend_id:friend,goal});
    toast("파티 초대를 보냈어요.");
   }else if(action==="partyAccept"||action==="partyDecline"){
    await runRPC("qd_respond_party",{party_id:id,approve:action==="partyAccept"});
   }else if(action==="partyCancel"){
    if(!confirm("이 파티 퀘스트를 종료할까요?"))return;
    await runRPC("qd_cancel_party",{party_id:id});
   }else if(action==="chatSend"){
    if(!st.peer||!isFriend(st.peer))throw Error("대화할 친구를 선택해 주세요.");
    const text=(st.draft||document.getElementById("s17Message")?.value||"").trim();
    if(!text||text.length>500)throw Error("메시지는 1~500자로 작성해 주세요.");
    await runRPC("qd_send_message",{friend_id:st.peer,message_body:text});
    st.draft="";
    const field=document.getElementById("s17Message");
    if(field)field.value="";
    st.scrollToBottom=true;
    await fetchChat();
   }else if(action==="report"){
    const value=prompt("신고 사유를 선택하세요: 1 스팸 / 2 괴롭힘 / 3 유해한 내용 / 4 기타","2");
    if(value===null)return;
    const category=({"1":"spam","2":"harassment","3":"unsafe","4":"other"})[value.trim()];
    if(!category)throw Error("1~4 중 하나를 선택해 주세요.");
    await runRPC("qd_report_message",{msg_id:id,report_category:category});
    toast("신고가 저장됐어요. 필요하면 해당 친구를 차단할 수도 있어요.");
   }else if(action==="block"){
    if(!confirm("친구를 차단할까요? 친구 관계와 채팅 접근이 해제되며, 다시 친구가 되려면 새로 신청해야 해요."))return;
    await runRPC("qd_block_user",{friend_id:id});
    st.peer="";st.chat=[];st.draft="";
    await bridge.refreshFriends();
    toast("차단했어요.");
   }else if(action==="unblock"){
    if(!confirm("차단을 해제할까요? 친구 관계는 자동 복구되지 않아요."))return;
    await runRPC("qd_unblock_user",{friend_id:id});
    toast("차단을 해제했어요.");
   }
   await refresh();
  }catch(e){
   st.error=e.message||"작업을 완료하지 못했어요.";
   console.warn("QUEST DAY Social",e);
   mount();
  }finally{st.working=false;mount();}
 }

 root.addEventListener("click",e=>{
  const btn=e.target.closest("[data-s17]");
  if(!btn)return;
  const act=btn.dataset.s17;
  if(act==="view"||act==="chatOpen"||act==="chatClose")perform(act,btn.dataset.id||"",btn);
  else {
   // Capture input before any asynchronous UI update, including busy-state rerenders.
   captureDraft();
   const snapshots={cheerFriend:document.getElementById("s17CheerFriend")?.value,
    cheerKind:document.getElementById("s17CheerKind")?.value,
    partyFriend:document.getElementById("s17PartyFriend")?.value,
    goal:document.getElementById("s17Goal")?.value};
   perform(act,btn.dataset.id||"",btn,snapshots);
  }
 });
 window.QuestDaySocial={mount,captureDraft};
 window.addEventListener("qd:realtime-ready",onReady);
 window.addEventListener("qd:friends-updated",scheduleRefresh);
 window.addEventListener("qd:realtime-stopped",()=>{
  if(channel&&client())client().removeChannel(channel);
  channel=null;subscribed=false;clearInterval(poll);poll=null;
  st.ready=false;chatSequence++;st.peer="";st.chat=[];st.draft="";
  renderedView="";renderedPeer="";host=null;
 });
 document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&bridge.isReady()){
   refresh();if(!subscribed)subscribe();if(st.view==="chat"&&st.peer)fetchChat();
  }
 });
 window.addEventListener("online",()=>{
  if(bridge.isReady()){refresh();if(!subscribed)subscribe();}
 });
 if(bridge.isReady())onReady();
})();
