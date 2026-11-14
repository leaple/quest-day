/* QUEST DAY 1.5 — friends cards (privacy-first offline beta).
   Shares only nickname, avatar, XP, level, completed quests and streak.
   Does not send user records to a server. Existing storage key remains unchanged. */
(function(){
  "use strict";
  const TAG="QD-FRIEND", LIMIT=100;
  const characters=new Set(["starter","sprout","paper_messenger","dawn_runner","sunset_scribe","forest","clockkeeper","star_scribe","ninja","mage","knight","dream_whale","time_guardian","astronaut"]);
  const css=document.createElement("style");
  css.textContent=[
    ".fr-page{padding-top:4px}.fr-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0}.fr-title h2{margin:0;font-size:22px}",
    ".fr-panel{background:white;border:1px solid #e8e7f3;border-radius:18px;padding:16px;margin:12px 0}",
    ".fr-muted{font-size:12px;color:#8588a2;line-height:1.6;margin:8px 0}",
    ".fr-user,.fr-list-row{display:flex;align-items:center;gap:12px;min-width:0}.fr-user-main{min-width:0;flex:1}.fr-name{font-weight:850;font-size:15px;overflow-wrap:anywhere}",
    ".fr-avatar{height:70px;width:70px;flex:0 0 70px;background:#f3efff;border-radius:16px;display:grid;place-items:center;overflow:hidden}",
    ".fr-avatar img{width:100%;height:100%;object-fit:contain}.fr-avatar span{font-size:34px}",
    ".fr-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:13px 0}.fr-stats div{background:#f4f1ff;border-radius:11px;padding:10px 5px;text-align:center}",
    ".fr-stats strong{display:block;font-size:15px;color:#5a50a2}.fr-stats small{font-size:10px;color:#8c8eaa}",
    ".fr-btn{background:#7766e8;color:white;border:0;border-radius:11px;font-size:12px;font-weight:800;padding:11px 12px;cursor:pointer}",
    ".fr-btn.alt{background:#edeaff;color:#6254c2}.fr-btn.remove{background:#ffeff1;color:#ab5771}",
    ".fr-buttons{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.fr-buttons .fr-btn{flex:1}",
    ".fr-field{display:grid;gap:7px;margin:11px 0}.fr-field label{font-size:12px;font-weight:800;color:#62647b}",
    ".fr-field input,.fr-field textarea{background:#fafaff;border:1px solid #e4e3ef;border-radius:11px;padding:12px;width:100%;box-sizing:border-box;font:inherit;font-size:13px}",
    ".fr-field textarea{min-height:85px;resize:vertical;word-break:break-all}.fr-list-row{border-bottom:1px solid #efedf6;padding:12px 0}",
    ".fr-list-row:last-child{border-bottom:0}.fr-list-row .fr-avatar{width:55px;height:55px;flex-basis:55px}.fr-xp{white-space:nowrap;color:#6454cd;font-size:12px;font-weight:900}",
    ".fr-tiny{font-size:11px;color:#989caf;line-height:1.55}.fr-badge{border-radius:20px;padding:6px 9px;background:#ece8ff;color:#695abf;font-size:11px;font-weight:800;white-space:nowrap}",
    ".fr-preview{border:1px solid #d5cdfa;background:#f8f6ff;border-radius:13px;padding:12px;margin:10px 0}.fr-empty{padding:22px 4px;text-align:center;color:#9498a9;font-size:12px}",
    ".fr-note{background:#f0effb;border-radius:13px;padding:14px;font-size:12px;line-height:1.65;color:#69647f}",
    "nav{overflow-x:auto;scrollbar-width:none;gap:3px}nav::-webkit-scrollbar{display:none}nav button{min-width:46px;flex:1;white-space:nowrap;font-size:10px}nav button b{font-size:19px}",
    "@media(max-width:380px){.fr-panel{padding:12px}nav button{min-width:46px;flex:0 0 46px}}"
  ].join("");
  document.head.appendChild(css);

  const page=document.createElement("section");page.className="page fr-page";page.id="frFriends";
  const app=document.querySelector(".app"),nav=document.querySelector("nav");
  if(app)app.appendChild(page);
  const tab=document.createElement("button");tab.dataset.page="frFriends";tab.innerHTML="<b>♧</b>친구";
  if(nav){const settings=nav.querySelector('[data-page="settings"]');if(settings)nav.insertBefore(tab,settings);else nav.appendChild(tab);}
  tab.onclick=function(){
    prepare();
    document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b===tab));
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p===page));
    draw();window.scrollTo(0,0);
  };

  function idNew(){
    if(window.crypto?.randomUUID)return window.crypto.randomUUID();
    if(window.crypto?.getRandomValues){
      const bytes=new Uint8Array(16);window.crypto.getRandomValues(bytes);
      return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
    }
    return "friend_"+uid()+uid();
  }
  function prepare(){
    let changed=false;
    if(!state.friends||typeof state.friends!=="object"||Array.isArray(state.friends)){state.friends={};changed=true;}
    if(!state.friends.profile||typeof state.friends.profile.id!=="string"){
      state.friends.profile={id:idNew(),nickname:"모험가"};changed=true;
    }
    if(!Array.isArray(state.friends.contacts)){state.friends.contacts=[];changed=true;}
    if(changed){try{saveState();}catch(e){console.warn("Friends save failed",e);}}
    return state.friends;
  }
  function escape(v){return escapeHtml(String(v));}
  function nick(v){return String(v||"").trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,16);}
  function myStats(){
    return {level:levelInfo().level,xp:totalXp(),quests:state.events.length,
      streak:streakCount(),avatar:characters.has(state.rpg?.equipped)?state.rpg.equipped:"sprout",updated:Date.now()};
  }
  function myCard(){
    return {tag:TAG,v:1,id:prepare().profile.id,name:nick(state.friends.profile.nickname)||"모험가",stats:myStats()};
  }
  function encodeCard(card){
    const bytes=new TextEncoder().encode(JSON.stringify(card));
    let b="";for(const x of bytes)b+=String.fromCharCode(x);
    return btoa(b).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  }
  function decodeCard(source){
    let raw=String(source||"").trim();
    if(raw.length>3500)throw new Error("코드가 너무 길어요.");
    if(/^https?:\/\//.test(raw)){
      let url;try{url=new URL(raw);}catch(e){throw new Error("올바른 공유 링크가 아니에요.");}
      if(url.origin!==location.origin||url.pathname!==location.pathname)
        throw new Error("QUEST DAY 공유 링크만 등록할 수 있어요.");
      raw=new URLSearchParams(url.hash.slice(1)).get("friend")||"";
    }
    raw=raw.replace(/^QD1:/,"");
    if(!raw||raw.length>3200||!/^[a-zA-Z0-9_-]+$/.test(raw))throw new Error("친구 코드 형식을 확인해 주세요.");
    let obj;
    try{
      const binary=atob(raw.replace(/-/g,"+").replace(/_/g,"/"));
      obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(binary,x=>x.charCodeAt(0))));
    }catch(e){throw new Error("읽을 수 없는 친구 코드예요.");}
    if(!obj||obj.tag!==TAG||obj.v!==1||typeof obj.id!=="string"||
      !/^[a-zA-Z0-9_-]{12,100}$/.test(obj.id)||typeof obj.name!=="string"||
      !nick(obj.name)||nick(obj.name)!==obj.name||!obj.stats)
      throw new Error("친구 프로필 형식이 올바르지 않아요.");
    const s=obj.stats;
    for(const [k,max] of [["level",100000],["xp",1000000000],["quests",10000000],["streak",100000]]){
      if(!Number.isSafeInteger(s[k])||s[k]<0||s[k]>max||(k==="level"&&s[k]<1))
        throw new Error("성장 정보가 올바르지 않아요.");
    }
    if(!characters.has(s.avatar)||!Number.isSafeInteger(s.updated)||
       s.updated<1600000000000||s.updated>Date.now()+86400000)
      throw new Error("캐릭터 또는 공유 날짜가 올바르지 않아요.");
    return {id:obj.id,name:obj.name,stats:{
      avatar:s.avatar,level:s.level,xp:s.xp,quests:s.quests,streak:s.streak,updated:s.updated
    }};
  }
  function portrait(avatar){
    const id=characters.has(avatar)?avatar:"sprout";
    if(id==="astronaut")return '<div class="fr-avatar"><span>🚀</span></div>';
    return '<div class="fr-avatar"><img src="./art/'+escape(id==="starter"?"sprout":id)+
      '.png?v=4" loading="lazy" alt=""></div>';
  }
  function statsMarkup(stats){
    return '<div class="fr-stats"><div><strong>Lv.'+stats.level+'</strong><small>레벨</small></div>'+
      '<div><strong>'+stats.quests+'</strong><small>완료 퀘스트</small></div>'+
      '<div><strong>'+stats.streak+'일</strong><small>연속 기록</small></div></div>';
  }
  function when(ms){
    const d=new Date(ms);
    return Number.isFinite(d.getTime())?d.toLocaleDateString("ko-KR"):"날짜 미상";
  }
  function friendRow(c,index){
    return '<div class="fr-list-row"><span class="fr-badge">'+(index+1)+'위</span>'+
      portrait(c.stats.avatar)+'<div class="fr-user-main"><div class="fr-name">'+escape(c.name)+'</div>'+
      '<div class="fr-tiny">Lv.'+c.stats.level+' · 완료 '+c.stats.quests+'개</div>'+
      (c.self?'':'<div class="fr-tiny">마지막 공유 '+escape(when(c.stats.updated))+'</div>')+
      '</div><span class="fr-xp">'+c.stats.xp+' XP</span></div>';
  }
  let pending=null,pendingLink="";
  function draw(){
    if(!page.classList.contains("active"))return;
    const friends=prepare(),mine=myCard();
    const contacts=friends.contacts.filter(c=>c&&c.stats&&typeof c.id==="string");
    const ranked=[{...mine,self:true},...contacts].sort((a,b)=>b.stats.xp-a.stats.xp||a.name.localeCompare(b.name,"ko"));
    page.innerHTML=
      '<div class="fr-title"><div><h2>♧ 모험 친구</h2><p class="fr-muted">함께 성장 기록을 비교해 보세요.</p></div><span class="fr-badge">친구 '+contacts.length+'명</span></div>'+
      '<div class="fr-panel"><div class="fr-user">'+portrait(mine.stats.avatar)+
      '<div class="fr-user-main"><div class="fr-name">'+escape(mine.name)+'</div>'+
      '<div class="fr-muted">Lv.'+mine.stats.level+' · '+mine.stats.xp+' XP</div></div></div>'+
      statsMarkup(mine.stats)+
      '<div class="fr-field"><label for="frNick">내 닉네임 (실명 대신 별명을 사용하세요)</label>'+
      '<input id="frNick" maxlength="16" autocomplete="off" value="'+escape(mine.name)+'"></div>'+
      '<button class="fr-btn alt" data-fr="nickname">닉네임 저장</button></div>'+
      '<div class="fr-panel"><strong>🔗 내 친구 프로필 공유</strong>'+
      '<p class="fr-muted">닉네임, 캐릭터, 레벨, XP, 완료 횟수, 연속 기록만 공유돼요. 퀘스트 제목이나 상세 활동 내역은 포함되지 않아요.</p>'+
      '<div class="fr-buttons"><button class="fr-btn" data-fr="link">초대 링크 복사</button>'+
      '<button class="fr-btn alt" data-fr="code">친구 코드 복사</button></div>'+
      '<p class="fr-muted">이 코드는 공유 순간의 기록이에요. 최신 기록을 보내려면 새 코드를 공유하세요.</p></div>'+
      '<div class="fr-panel"><strong>📨 친구 프로필 가져오기</strong>'+
      '<p class="fr-muted">친구에게 받은 링크 또는 코드를 붙여 넣으세요.</p>'+
      '<div class="fr-field"><label for="frInput">친구 코드 / 초대 링크</label>'+
      '<textarea id="frInput" maxlength="3500" autocapitalize="off" spellcheck="false"></textarea></div>'+
      '<button class="fr-btn" data-fr="preview">프로필 확인</button><div id="frPreview"></div></div>'+
      '<div class="fr-panel"><strong>🏆 친구 성장 비교</strong>'+
      '<p class="fr-muted">실시간 순위가 아닌, 마지막으로 받은 기록의 비교예요.</p>'+
      ranked.map(friendRow).join("")+'</div>'+
      '<div class="fr-panel"><strong>👥 등록한 친구</strong>'+
      (contacts.length?contacts.map(c=>'<div class="fr-list-row">'+portrait(c.stats.avatar)+
        '<div class="fr-user-main"><div class="fr-name">'+escape(c.name)+'</div>'+
        '<div class="fr-tiny">Lv.'+c.stats.level+' · '+c.stats.xp+' XP</div></div>'+
        '<button class="fr-btn alt" data-fr="cheer" data-id="'+escape(c.id)+'">응원</button>'+
        '<button class="fr-btn remove" data-fr="remove" data-id="'+escape(c.id)+'">삭제</button></div>').join(""):
        '<div class="fr-empty">친구 코드를 교환하면 여기에 나타나요.</div>')+'</div>'+
      '<div class="fr-note">🔒 친구 기록은 이 기기 안에 저장돼요. 실시간 동기화·친구 신청·채팅은 지원하지 않아요. 공유 정보는 별도 인증을 거치지 않아 공식 순위가 아닙니다.</div>';
    if(pendingLink)document.getElementById("frInput").value=pendingLink;
  }
  function previewCard(c){
    document.getElementById("frPreview").innerHTML=
      '<div class="fr-preview"><strong>'+escape(c.name)+'</strong>'+
      '<p class="fr-muted">Lv.'+c.stats.level+' · '+c.stats.xp+' XP · 퀘스트 '+c.stats.quests+'개</p>'+
      '<div class="fr-buttons"><button class="fr-btn" data-fr="add">친구 카드 등록 / 갱신</button>'+
      '<button class="fr-btn alt" data-fr="cancel">취소</button></div></div>';
  }
  async function copy(text){
    if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return true;}catch(e){}}
    const input=document.createElement("textarea");input.value=text;
    input.style.position="fixed";input.style.opacity="0";
    document.body.appendChild(input);input.select();
    let ok=false;try{ok=document.execCommand("copy");}catch(e){}
    input.remove();return ok;
  }
  page.addEventListener("click",async event=>{
    const button=event.target.closest("button");
    if(!button)return;
    const action=button.dataset.fr;
    if(!action)return;
    const friends=prepare();
    if(action==="nickname"){
      const value=nick(document.getElementById("frNick").value);
      if(!value)return alert("닉네임을 입력해 주세요.");
      const old=friends.profile.nickname;friends.profile.nickname=value;
      try{saveState();draw();}catch(e){friends.profile.nickname=old;alert("닉네임 저장에 실패했어요.");}
    }else if(action==="link"||action==="code"){
      const code=encodeCard(myCard());
      const value=action==="link"?location.origin+location.pathname+"#friend="+code:"QD1:"+code;
      if(await copy(value))alert("친구 "+(action==="link"?"링크":"코드")+"를 복사했어요.");
      else{const field=document.getElementById("frInput");field.value=value;field.focus();field.select();alert("직접 선택해서 복사해 주세요.");}
    }else if(action==="preview"){
      const input=document.getElementById("frInput");
      pendingLink=input.value.trim();
      try{
        pending=decodeCard(pendingLink);
        if(pending.id===friends.profile.id)throw new Error("자신의 프로필은 등록할 수 없어요.");
        previewCard(pending);
      }catch(e){pending=null;document.getElementById("frPreview").innerHTML="";alert(e.message||"코드를 확인해 주세요.");}
    }else if(action==="cancel"){
      pending=null;document.getElementById("frPreview").innerHTML="";
    }else if(action==="add"){
      if(!pending)return;
      const oldIndex=friends.contacts.findIndex(c=>c.id===pending.id);
      if(oldIndex<0&&friends.contacts.length>=LIMIT){alert("친구는 최대 100명까지 등록할 수 있어요.");return;}
      if(oldIndex>=0&&friends.contacts[oldIndex].stats.updated>pending.stats.updated&&!confirm("이전 기록으로 바꿀까요?"))return;
      const next={...pending,addedAt:oldIndex<0?Date.now():friends.contacts[oldIndex].addedAt};
      const original=friends.contacts.slice();
      if(oldIndex<0)friends.contacts.push(next);else friends.contacts[oldIndex]=next;
      try{saveState();pending=null;pendingLink="";draw();alert("친구 카드가 등록됐어요.");}
      catch(e){friends.contacts=original;alert("저장에 실패했어요.");}
    }else if(action==="remove"){
      const found=friends.contacts.find(c=>c.id===button.dataset.id);
      if(!found||!confirm(found.name+"의 카드를 삭제할까요?"))return;
      const original=friends.contacts;friends.contacts=original.filter(c=>c.id!==found.id);
      try{saveState();draw();}catch(e){friends.contacts=original;alert("삭제 내용을 저장하지 못했어요.");}
    }else if(action==="cheer"){
      const found=friends.contacts.find(c=>c.id===button.dataset.id);if(!found)return;
      const text=found.name+"! 오늘의 QUEST DAY 모험도 응원해! ✨";
      if(await copy(text))alert("응원 문구를 복사했어요. 메신저로 보내 보세요.");
      else alert(text);
    }
  });

  const previousRender=render;
  render=function(){previousRender();if(page.classList.contains("active"))draw();};

  // Opening a shared URL pre-fills a preview but never registers a friend automatically.
  try{
    const code=new URLSearchParams(location.hash.slice(1)).get("friend");
    if(code&&code.length<=3200){
      pendingLink=code;tab.click();
      const input=document.getElementById("frInput");if(input)input.value=code;
      window.history.replaceState(null,"",location.pathname+location.search);
    }
  }catch(e){console.warn("Friend link could not be opened",e);}
})();