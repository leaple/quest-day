/* QUEST DAY 2.0 — mobile-first welcome, email login/registration, guest mode.
   Preserve legacy localStorage and Supabase Auth IDs. Never sign out an anonymous
   user automatically. All login actions are explicit and user initiated.
 */
(function(){
 "use strict";
 const bridge=window.QuestDayRealtime;
 if(!bridge||!bridge.ensureClient)return;
 const DONE="qd20-onboarding-complete-v1";
 const CONSENT="quest-day-realtime-opt-in-v1";
 const CLOUD="qd19-game-cloud-consent-v1:";
 const HOLD="qd18-remote-profile-sync-hold-v1";
 const SETTINGS=document.getElementById("settings");
 const root=document.createElement("div");
 root.id="qd20Entry";
 root.className="qd20-entry";
 root.setAttribute("role","dialog");
 root.setAttribute("aria-modal","true");
 root.setAttribute("aria-label","QUEST DAY 계정 시작");
 root.hidden=true;
 document.body.appendChild(root);
 const css=document.createElement("style");
 css.textContent=[
 ".qd20-entry[hidden]{display:none!important}",
 ".qd20-entry{position:fixed;inset:0;z-index:100500;background:linear-gradient(160deg,#15152d 0%,#29234d 58%,#544681 100%);color:#fff;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:flex;align-items:center;justify-content:center;padding:max(24px,env(safe-area-inset-top)) 18px max(30px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif}",
 ".qd20-entry *{box-sizing:border-box}",
 ".qd20-shell{width:min(100%,420px);margin:auto;position:relative}",
 ".qd20-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:26px}",
 ".qd20-brand{font-weight:900;letter-spacing:1.6px;font-size:14px}",
 ".qd20-logo{width:78px;height:78px;display:grid;place-items:center;border-radius:23px;margin:8px auto 15px;background:linear-gradient(145deg,#a790ff,#7060d6);box-shadow:0 15px 36px #0004;color:white;font-size:39px}",
 ".qd20-title{font-size:29px;font-weight:950;letter-spacing:-1px;text-align:center;margin:0 0 9px;line-height:1.3}",
 ".qd20-sub{font-size:13px;text-align:center;line-height:1.75;color:#d0c9ec;margin:0 auto 26px;max-width:290px}",
 ".qd20-card{background:#ffffff13;border:1px solid #ffffff2b;border-radius:24px;padding:18px;backdrop-filter:blur(12px)}",
 ".qd20-btn{display:flex;align-items:center;justify-content:center;text-align:center;gap:9px;width:100%;min-height:51px;padding:13px 16px;border:1px solid transparent;border-radius:14px;margin:9px 0;background:#8f7afb;color:#fff;font-size:14px;font-weight:850;cursor:pointer;touch-action:manipulation}",
 ".qd20-btn.alt{background:#ffffff1a;border-color:#ffffff33;color:white}",
 ".qd20-btn.ghost{background:transparent;border:0;color:#d0c9f3;text-decoration:underline;min-height:42px}",
 ".qd20-btn:disabled{opacity:.6;cursor:wait}",
 ".qd20-field{display:block;font-size:12px;font-weight:750;color:#e6e1f7;margin:14px 0 6px}",
 ".qd20-input{display:block;width:100%;height:49px;border:1px solid #ffffff44;background:#15152c66;color:white;border-radius:12px;padding:12px;font:inherit;font-size:16px;outline-offset:2px}",
 ".qd20-input:focus{outline:2px solid #bba8ff}",
 ".qd20-input::placeholder{color:#aca5c9}",
 ".qd20-notice{font-size:12px;line-height:1.65;color:#f1e8d9;background:#ffffff17;padding:12px 14px;border-radius:12px;margin:14px 0}",
 ".qd20-error{font-size:12px;line-height:1.6;color:#ffe5e8;background:#ab334744;padding:12px 14px;border-radius:12px;margin:12px 0}",
 ".qd20-row{display:flex;gap:10px}.qd20-row>.qd20-btn{flex:1;min-width:0}",
 ".qd20-foot{font-size:11px;text-align:center;color:#c3badd;line-height:1.65;margin:19px 8px 0}",
 ".qd20-settings{margin:12px 0;background:#fff;border:1px solid #e7e5f5;border-radius:17px;padding:16px;display:flex;align-items:center;gap:12px;justify-content:space-between}",
 ".qd20-settings strong{display:block;color:#514878;font-size:14px}.qd20-settings span{display:block;color:#8b89a3;font-size:11px;margin-top:5px;line-height:1.4}",
 ".qd20-settings button{border:0;background:#f0edff;color:#6d5bd7;border-radius:11px;padding:12px;font-weight:800;min-height:44px;font-size:12px}",
 "@media(max-width:359px){.qd20-card{padding:14px}.qd20-title{font-size:25px}.qd20-logo{width:64px;height:64px;font-size:31px}}"
 ].join("");
 document.head.appendChild(css);
 const note=document.createElement("div");
 note.className="qd20-settings";
 note.innerHTML='<div><strong>🛡️ 계정 및 로그인</strong><span>로그인 · 회원가입 · 게스트 계정 연결</span></div>'+
  '<button type="button" id="qd20AccountButton">계정 관리</button>';
 SETTINGS?.insertBefore(note,SETTINGS.querySelector("#qd19Cloud")||SETTINGS.querySelector("#qd18Protection")||null);
 note.querySelector("#qd20AccountButton")?.addEventListener("click",()=>show("account",true));
 const safe=s=>escapeHtml(String(s??""));
 const localHasHistory=()=>{
  try{
   if(localStorage.getItem("quest-day-mvp-v1"))return true;
   if(localStorage.getItem(CONSENT)==="yes")return true;
   if(localStorage.getItem("quest-day-realtime-offline-choice-v1")==="yes")return true;
   const meta=JSON.parse(localStorage.getItem("qd19-game-cloud-meta-v1")||"null");
   return !!meta?.userId;
  }catch(e){return !!localStorage.getItem("quest-day-mvp-v1");}
 };
 let mode="welcome",settingsOpen=false,busy=false,error="",noticeText="",emailDraft="",flow="",requestId=0;
 const body=document.body;
 let oldOverflow="",appInert=[],lastFocus=null;
 function holdInterface(){
  if(!root.hidden)return;
  lastFocus=document.activeElement;
  oldOverflow=body.style.overflow;
  body.style.overflow="hidden";
  for(const element of [document.querySelector(".app"),document.querySelector("nav")]){
   if(element&&!element.hasAttribute("inert")){element.setAttribute("inert","");appInert.push(element);}
  }
  root.hidden=false;
 }
 function releaseInterface(){
  root.hidden=true;body.style.overflow=oldOverflow;
  for(const el of appInert)el.removeAttribute("inert");
  appInert=[];
  if(settingsOpen&&lastFocus?.focus)lastFocus.focus();
  settingsOpen=false;
 }
 function finish(kind){
  localStorage.setItem(DONE,kind);
  requestId++;
  releaseInterface();
 }
 function heading(){
  if(mode==="login")return ["다시 만나서 반가워요!","계정으로 로그인하면 저장된 모험을 이어갈 수 있어요."];
  if(mode==="signup")return ["새로운 모험 시작하기","이메일 계정을 만들면 여러 기기에서 기록을 이어갈 수 있어요."];
  if(mode==="link")return ["게스트 기록을 지키세요","현재 익명 계정을 그대로 이메일과 연결해 친구·게임 기록을 유지해요."];
  if(mode==="verifyLink")return ["이메일 확인","받은 인증 코드로 기존 계정을 확인해 주세요."];
  if(mode==="finishLink")return ["계정 비밀번호 설정","인증한 계정에 비밀번호를 등록해 다른 기기에서도 로그인하세요."];
  if(mode==="verifySignup")return ["메일함을 확인해 주세요","인증 메일을 받았다면 링크를 열거나 인증 코드를 입력하세요."];
  if(mode==="account")return ["계정 관리","현재 기록을 유지하면서 계정을 연결하거나 전환할 수 있어요."];
  return ["오늘의 모험을 시작하세요","작은 퀘스트를 달성하며 나만의 캐릭터를 성장시켜요."];
 }
 function field(id,label,type,placeholder,autocomplete,extra=""){
  return '<label class="qd20-field" for="'+id+'">'+label+'</label>'+
   '<input class="qd20-input" id="'+id+'" type="'+type+'" placeholder="'+placeholder+'" autocomplete="'+autocomplete+'" '+extra+'>';
 }
 function button(label,action,variant=""){
  return '<button type="button" class="qd20-btn '+variant+'" data-qd20="'+action+'"'+(busy?' disabled':'')+'>'+label+'</button>';
 }
 function content(){
  if(mode==="welcome")return button("로그인","login")+
    button("회원가입하고 시작","signup","alt")+
    button("게스트로 시작하기","guest","ghost");
  if(mode==="login")return field("qd20Email","이메일","email","name@example.com","username",'maxlength="180" inputmode="email"')+
    field("qd20Password","비밀번호","password","비밀번호","current-password",'maxlength="128"')+
    button("로그인","submitLogin")+
    button("회원가입","signup","alt")+
    button("이전 화면","back","ghost");
  if(mode==="signup"||mode==="link")return field("qd20Email","이메일","email","name@example.com","email",'maxlength="180" inputmode="email"')+
    (mode==="signup"?field("qd20Password","새 비밀번호 (12자 이상)","password","12자 이상","new-password",'minlength="12" maxlength="128"'):"")+
    button(mode==="link"?"기존 계정에 이메일 연결":"가입하고 인증 메일 받기","submitSignup")+
    button("뒤로","back","ghost");
  if(mode==="verifySignup"||mode==="verifyLink")return '<div class="qd20-notice">'+safe(emailDraft)+' 주소로 인증을 요청했어요. 메일을 확인해 주세요.</div>'+
    field("qd20Code","인증 코드가 있는 경우","text","이메일의 숫자 코드","one-time-code",'maxlength="8" inputmode="numeric"')+
    button("인증 코드 확인","verify")+
    button("메일 인증 완료 후 로그인","login","alt")+
    button("이전 화면","back","ghost");
  if(mode==="finishLink")return field("qd20Password","새 비밀번호 (12자 이상)","password","비밀번호 설정","new-password",'minlength="12" maxlength="128"')+
    button("비밀번호 저장하고 시작","savePassword")+
    button("나중에 설정","finishLinked","ghost");
  if(mode==="account")return '<div class="qd20-notice">이미 사용 중인 계정이나 익명 친구 계정은 삭제하지 않아요. '+
    '다른 계정으로 로그인하면 서버 기록과 이 기기의 기록을 비교한 뒤 안전하게 동기화해요.</div>'+
    button("기존 계정으로 로그인","login")+
    button("현재 기록에 계정 연결","signup","alt")+
    button("닫기","close","ghost");
  return button("시작하기","back");
 }
 function render(){
  const [title,subtitle]=heading();
  root.innerHTML='<div class="qd20-shell"><div class="qd20-top">'+
   '<span class="qd20-brand">QUEST DAY</span>'+
   (settingsOpen?'<button type="button" class="qd20-btn ghost" style="width:auto;margin:0" data-qd20="close">닫기 ✕</button>':'<span style="font-size:12px;color:#c1b8df">YOUR ADVENTURE</span>')+'</div>'+
   '<div class="qd20-logo" aria-hidden="true">✦</div>'+
   '<h1 class="qd20-title">'+title+'</h1><p class="qd20-sub">'+subtitle+'</p>'+
   '<div class="qd20-card">'+content()+
   (error?'<div class="qd20-error" role="alert">'+safe(error)+'</div>':"")+
   (noticeText?'<div class="qd20-notice" role="status">'+safe(noticeText)+'</div>':"")+
   '</div><p class="qd20-foot">게스트 기록은 계정 연결 전까지 다른 기기에서 복구할 수 없어요.<br>'+
   '이메일·비밀번호는 Supabase 인증 서비스에서 처리하며 게임 기록에 저장하지 않아요.</p></div>';
  if(document.getElementById("qd20Email")&&emailDraft)
   document.getElementById("qd20Email").value=emailDraft;
 }
 function show(next,fromSettings=false){
  if(busy)return;
  if(fromSettings){settingsOpen=true;holdInterface();}
  else holdInterface();
  mode=next;error="";noticeText="";render();
 }
 function getInputs(){
  return {
   email:(document.getElementById("qd20Email")?.value||"").trim().toLowerCase(),
   password:document.getElementById("qd20Password")?.value||"",
   code:(document.getElementById("qd20Code")?.value||"").trim()
  };
 }
 function guardEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=180;}
 function guardPass(v){return typeof v==="string"&&v.length>=12&&v.length<=128;}
 async function client(){return bridge.ensureClient();}
 function fail(e){
  const msg=e?.message||String(e||"인증 처리 중 오류가 발생했어요.");
  error=msg.slice(0,230);noticeText="";render();
 }
 async function activate(userId,was=null){
  if(!userId)throw Error("로그인 계정 정보를 찾지 못했어요.");
  // Protect the signed-in account's existing cloud progress before bootstrapping.
  const previousId=was||bridge.getUser()?.id;
  if(previousId&&previousId!==userId)localStorage.setItem(HOLD,"yes");
  localStorage.setItem(CLOUD+userId,"yes");
  localStorage.setItem(CONSENT,"yes");
  localStorage.removeItem("quest-day-realtime-offline-choice-v1");
  await bridge.switchIdentity();
  if(!bridge.isReady())throw Error("로그인했지만 서버 초기화에 실패했어요. 연결을 확인해 주세요.");
  finish("account");
 }
 async function submitLogin(values){
  if(!guardEmail(values.email)||!values.password)throw Error("이메일과 비밀번호를 입력해 주세요.");
  const sup=await client();
  const prev=bridge.getUser()?.id;
  // Never silently abandon an unlinked anonymous social identity.
  if(prev){
   const existing=await sup.auth.getUser();
   if(existing.data?.user?.is_anonymous){
    if(!confirm("현재 익명 친구 계정에서 다른 계정으로 로그인하면 기존 익명 계정의 친구 관계는 새 계정으로 자동 이전되지 않아요. 이 기기의 게임 기록은 유지되고 새 계정 기록과 충돌하면 선택할 수 있어요. 계속할까요?"))return;
   }
  }
  const result=await sup.auth.signInWithPassword({email:values.email,password:values.password});
  if(result.error)throw result.error;
  const id=result.data?.user?.id;
  await activate(id,prev);
 }
 async function submitSignup(values){
  if(!guardEmail(values.email))throw Error("올바른 이메일을 입력해 주세요.");
  emailDraft=values.email;
  const sup=await client();
  const get=await sup.auth.getUser();
  const u=get.data?.user;
  if(u?.email&&!u.is_anonymous){
   throw Error("이미 로그인된 이메일 계정이 있어요. 설정의 계정 관리에서 계정을 확인해 주세요.");
  }
  if(u?.is_anonymous){
   // Converting in place preserves friend and cloud ownership under the same user id.
   const result=await sup.auth.updateUser({email:values.email});
   if(result.error)throw result.error;
   flow="link";mode="verifyLink";noticeText="기존 게스트 계정의 친구·게임 데이터를 유지하면서 이메일을 연결해요.";
   render();return;
  }
  if(!guardPass(values.password))throw Error("비밀번호는 12~128자로 입력해 주세요.");
  const result=await sup.auth.signUp({
   email:values.email,password:values.password,
   options:{emailRedirectTo:window.location.origin+window.location.pathname}
  });
  if(result.error)throw result.error;
  // A project with Email Confirmation enabled returns no session until verification.
  if(result.data?.session?.user?.id){
   await activate(result.data.session.user.id,null);
  }else{
   flow="signup";mode="verifySignup";
   noticeText="인증 메일을 보냈다면 안내에 따라 인증해 주세요. 이미 가입된 이메일일 수도 있으니 확인되지 않은 계정 생성으로 안내하지 않아요.";
   render();
  }
 }
 async function verify(values){
  if(!guardEmail(emailDraft)||!/^\d{6,8}$/.test(values.code))
   throw Error("이메일과 6~8자리 인증 코드를 확인해 주세요.");
  const sup=await client();
  const result=await sup.auth.verifyOtp({
   email:emailDraft,token:values.code,type:flow==="link"?"email_change":"signup"
  });
  if(result.error)throw result.error;
  if(flow==="link"){
   mode="finishLink";noticeText="이메일 인증이 완료됐어요. 계정 복구를 위해 비밀번호를 설정해 주세요.";
   render();
  }else if(result.data?.session?.user?.id){
   await activate(result.data.session.user.id,null);
  }else{
   mode="login";noticeText="메일 인증을 완료했어요. 이메일과 비밀번호로 로그인해 주세요.";render();
  }
 }
 async function savePassword(values){
  if(!guardPass(values.password))throw Error("비밀번호를 12~128자로 설정해 주세요.");
  const sup=await client(),userResult=await sup.auth.getUser();
  const u=userResult.data?.user;
  if(!u?.email||!u.email_confirmed_at)throw Error("먼저 이메일 인증을 완료해 주세요.");
  const result=await sup.auth.updateUser({password:values.password});
  if(result.error)throw result.error;
  await activate(u.id,u.id);
 }
 async function handle(action,values){
  if(busy)return;
  if(action==="close"){releaseInterface();return;}
  if(action==="guest"){finish("guest");return;}
  if(action==="back"){
   show(settingsOpen?"account":"welcome");return;
  }
  if(action==="login"||action==="signup"){
   if(action==="login")show("login");
   else{
    // The user may be an existing guest; handle linking during submitSignup.
    show("signup");
   }
   return;
  }
  if(action==="finishLinked"){
   const sup=await client(),user=(await sup.auth.getUser()).data?.user;
   if(user?.id)await activate(user.id,user.id);
   return;
  }
  busy=true;error="";noticeText="";render();
  try{
   if(action==="submitLogin")await submitLogin(values);
   else if(action==="submitSignup")await submitSignup(values);
   else if(action==="verify")await verify(values);
   else if(action==="savePassword")await savePassword(values);
  }catch(e){fail(e);}
  finally{busy=false;if(!root.hidden)render();}
 }
 root.addEventListener("click",event=>{
  const btn=event.target.closest("button[data-qd20]");
  if(!btn)return;
  const v=getInputs();
  handle(btn.dataset.qd20,v);
 });
 root.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&settingsOpen){event.preventDefault();releaseInterface();}
  if(event.key==="Enter"&&event.target.matches("input")){
   event.preventDefault();
   const action=mode==="login"?"submitLogin":mode==="signup"||mode==="link"?"submitSignup":
    mode==="verifyLink"||mode==="verifySignup"?"verify":mode==="finishLink"?"savePassword":"";
   if(action)handle(action,getInputs());
  }
 });
 // New users see onboarding. Existing local data or realtime clients are never
 // forced through an irreversible registration screen after an update.
 const legacy=localHasHistory();
 if(!localStorage.getItem(DONE)&&legacy)localStorage.setItem(DONE,"existing");
 // Also finish a signup email callback when the user started from guest mode.
 // This is intentionally scoped to an Auth callback: ordinary returning guests
 // are never silently converted into a different account.
 const hasAuthCallback=/(?:^|[?&#])(?:code|access_token|token_hash)=/.test(
  window.location.search+window.location.hash);
 if(!localStorage.getItem(DONE)||hasAuthCallback){
  if(!localStorage.getItem(DONE))show("welcome");
  const ticket=++requestId;
  (async()=>{
   try{
    const sup=await client();
    const session=await sup.auth.getSession();
    if(ticket!==requestId)return;
    const id=session.data?.session?.user?.id;
    if(id&&!session.data.session.user.is_anonymous){
     await activate(id,bridge.getUser()?.id||null);
    }
   }catch(e){
    // Guest play remains available offline or if the auth CDN cannot load.
    console.info("QUEST DAY optional session check:",e?.message||e);
   }
  })();
 }
 window.QuestDayEntry={open:()=>show("account",true)};
})();