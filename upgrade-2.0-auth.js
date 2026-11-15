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
 const AUTO_FLAG="qd21-realtime-autoconnect-v1";
 const CLOUD="qd19-game-cloud-consent-v1:";
 const HOLD="qd18-remote-profile-sync-hold-v1";
 const PENDING="qd20-email-confirmation-pending-v1";
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
 // Prior versions automatically saved initial RPG and offline friend objects on
 // the very first visit. The existence of quest-day-mvp-v1 is NOT evidence that
 // a person has played: checking it alone hides onboarding in private browsing.
 function hasRealProgress(raw){
  if(!raw)return false;
  try{
   const data=JSON.parse(raw);
   if(!data || !Array.isArray(data.tasks) || !Array.isArray(data.events))return true;
   if(data.events.length)return true;
   const starter=[
    ["demo1","책 10페이지 읽기","공부","daily",20],
    ["demo2","방 정리하기","일상","daily",10],
    ["demo3","중요한 일 하나 끝내기","자기계발","once",30]
   ];
   if(data.tasks.length!==starter.length)return true;
   const expected=new Map(starter.map(x=>[x[0],x]));
   if(data.tasks.some(t=>{
    const base=expected.get(t?.id);
    return !base||t.name!==base[1]||t.category!==base[2]||
      t.frequency!==base[3]||Number(t.xp)!==base[4];
   }))return true;
   if(data.dailyGoal!==undefined && Number(data.dailyGoal)!==3)return true;
   const rpg=data.rpg||{};
   if((rpg.purchases?.length||0)>0 || Object.keys(rpg.claimed||{}).length>0)return true;
   if(rpg.equipped&&rpg.equipped!=="starter"&&rpg.equipped!=="sprout")return true;
   if(Number(rpg.createdQuestCount||0)>0 || Object.keys(rpg.goalDays||{}).length>0)return true;
   const friends=data.friends||{};
   if((friends.contacts?.length||0)>0)return true;
   if(friends.profile?.nickname&&friends.profile.nickname!=="모험가")return true;
   return false;
  }catch(e){
   // A damaged or unknown save is still treated as user data, never discarded.
   return true;
  }
 }
 const localHasHistory=()=>{
  // Automatic realtime connection is not evidence of an existing player.
  // Preserve legacy manual opt-in sessions, but still show onboarding to
  // brand-new visitors whose anonymous session was just created at startup.
  if(localStorage.getItem(CONSENT)==="yes"&&localStorage.getItem(AUTO_FLAG)!=="yes")return true;
  if(localStorage.getItem("quest-day-realtime-offline-choice-v1")==="yes")return true;
  try{
   const meta=JSON.parse(localStorage.getItem("qd19-game-cloud-meta-v1")||"null");
   if(meta?.userId)return true;
  }catch(e){return true;}
  return hasRealProgress(localStorage.getItem("quest-day-mvp-v1"));
 };
 let mode="welcome",settingsOpen=false,busy=false,error="",noticeText="",emailDraft="",passwordDraft="",codeDraft="",flow="",requestId=0;
 let accountUser=null,accountLoading=false,accountTicket=0;
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
  localStorage.removeItem(PENDING);
  passwordDraft="";codeDraft="";
  requestId++;
  releaseInterface();
 }
 function pendingRead(){
  try{
   const pending=JSON.parse(localStorage.getItem(PENDING)||"null");
   return pending&&Date.now()-pending.ts<86400000?pending:null;
  }catch(e){return null;}
 }
 function heading(){
  if(mode==="login")return ["다시 만나서 반가워요!","계정으로 로그인하면 저장된 모험을 이어갈 수 있어요."];
  if(mode==="signup")return ["새로운 모험 시작하기","이메일 계정을 만들면 여러 기기에서 기록을 이어갈 수 있어요."];
  if(mode==="link")return ["게스트 기록을 지키세요","현재 익명 계정을 그대로 이메일과 연결해 친구·게임 기록을 유지해요."];
  if(mode==="verifyLink")return ["이메일 확인","메일의 확인 링크를 누른 다음 앱으로 돌아와 인증을 확인하세요."];
  if(mode==="finishLink")return ["계정 비밀번호 설정","인증한 계정에 비밀번호를 등록해 다른 기기에서도 로그인하세요."];
  if(mode==="verifySignup")return ["메일함을 확인해 주세요","메일의 Confirm Email 링크를 열어 이메일을 인증해 주세요."];
  if(mode==="account")return ["계정 관리","현재 기록을 유지하면서 계정을 연결하거나 전환할 수 있어요."];
  if(mode==="password")return ["비밀번호 설정·변경","확인된 이메일 계정의 새 비밀번호를 설정해 주세요."];
  if(mode==="authError")return ["이메일 인증 문제","인증 링크에 문제가 있어요. 아래 설명을 확인해 주세요."];
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
    (mode==="signup"?field("qd20Password","새 비밀번호 (10자 이상)","password","10자 이상","new-password",'minlength="10" maxlength="128"'):"")+
    button(mode==="link"?"기존 계정에 이메일 연결":"가입하고 인증 메일 받기","submitSignup")+
    button("이미 가입한 이메일로 로그인","login","alt")+
    button("뒤로","back","ghost");
  if(mode==="verifySignup"||mode==="verifyLink")return '<div class="qd20-notice">'+safe(emailDraft)+
    ' 주소로 확인 메일을 요청했어요. <strong>Supabase 기본 메일은 숫자 코드 대신 Confirm Email 링크를 보냅니다.</strong> 링크를 누른 뒤 아래에서 인증을 확인해 주세요.</div>'+
    button("메일 링크 인증 완료 확인","checkVerification")+
    field("qd20Code","메일에 숫자 코드가 별도로 있는 경우에만 입력 (선택)","text","코드가 없다면 비워 두세요","one-time-code",'maxlength="8" inputmode="numeric"')+
    button("숫자 코드로 확인","verify","alt")+
    button("이전 화면","back","ghost");
  if(mode==="authError")return button("인증 다시 시도","signup")+
    button("기존 계정 로그인","login","alt")+
    button("게스트로 돌아가기","guest","ghost");
  if(mode==="finishLink"||mode==="password")return field("qd20Password","새 비밀번호 (10자 이상)","password","10자 이상","new-password",'minlength="10" maxlength="128"')+
    button("새 비밀번호 저장","savePassword")+
    (mode==="finishLink"?button("나중에 설정 (다른 기기 로그인은 아직 불가)","finishLinked","ghost"):button("계정 관리로 돌아가기","back","ghost"));
  if(mode==="account"){
    const verified=!!(accountUser?.email&&accountUser.email_confirmed_at&&!accountUser.is_anonymous);
    const anonymous=!!(accountUser?.is_anonymous||(!accountUser?.email&&!accountLoading));
    const status=accountLoading?"서버에서 계정 상태 확인 중…":
     verified?"✅ 이메일 인증 완료 · "+safe(accountUser.email):
     accountUser?.new_email?"📩 "+safe(accountUser.new_email)+" 주소의 이메일 인증 대기 중":
     accountUser?.email?"📩 이메일 인증 대기 중 · "+safe(accountUser.email):
     anonymous?"👤 현재 게스트(익명) 계정":"계정 상태를 다시 확인해 주세요.";
    return '<div class="qd20-notice">'+status+'</div>'+
     (verified?button("비밀번호 설정·변경","password","alt"):
       button("현재 게스트 기록에 이메일 연결","link","alt"))+
     button("기존 이메일 계정으로 로그인","login")+
     button("이메일 인증 상태 새로고침","accountRefresh","ghost")+
     (bridge.isProfileSyncHeld?.()?'<div class="qd20-notice">🔒 계정 전환 후 서버의 성장 기록을 보호하고 있어요. 아래 클라우드 동기화에서 충돌을 해결한 다음 성장 기록을 다시 연결해 주세요.</div>'+
       button("성장 기록 동기화 복구","resumeProfileSync","alt"):"")+
     '<div class="qd20-notice">☁️ 퀘스트·골드·캐릭터의 클라우드 저장과 충돌 선택은 설정의 <strong>계정 전체 데이터 동기화</strong>에서 관리해요. 이메일/비밀번호는 게임 로컬 데이터에 저장하지 않아요.</div>'+
     button("닫기","close","ghost");
  }
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
   '</div><p class="qd20-foot">앱을 실행하면 서버에 자동 연결돼요. 게스트는 임시 익명 계정을 사용해요.<br>'+
   '친구로 수락된 상대에게 닉네임·성장 요약이 공유될 수 있어요.<br>'+
   '게스트 기록은 계정 연결 전까지 다른 기기에서 복구할 수 없어요.</p></div>';
  if(document.getElementById("qd20Email")&&emailDraft)
   document.getElementById("qd20Email").value=emailDraft;
  if(document.getElementById("qd20Password")&&passwordDraft)
   document.getElementById("qd20Password").value=passwordDraft;
  if(document.getElementById("qd20Code")&&codeDraft)
   document.getElementById("qd20Code").value=codeDraft;
 }
 function show(next,fromSettings=false){
  if(busy)return;
  if(fromSettings){settingsOpen=true;holdInterface();}
  else holdInterface();
  if(mode!==next){passwordDraft="";codeDraft="";}
  mode=next;error="";noticeText="";render();
  if(next==="account")refreshAccount();
 }
 async function refreshAccount(){
  const ticket=++accountTicket;
  accountLoading=true;
  if(mode==="account"&&!busy)render();
  try{
   const sup=await client();
   await bridge.waitForIdentity?.();
   const result=await sup.auth.getUser();
   if(result.error)throw result.error;
   if(ticket!==accountTicket)return;
   accountUser=result.data?.user||null;
  }catch(e){
   if(ticket!==accountTicket)return;
   error=(e?.message||"계정 연결을 확인하지 못했어요.").slice(0,230);
  }finally{
   if(ticket===accountTicket){
    accountLoading=false;
    if(mode==="account"&&!busy)render();
   }
  }
 }
 function getInputs(){
  return {
   email:(document.getElementById("qd20Email")?.value||"").trim().toLowerCase(),
   password:document.getElementById("qd20Password")?.value||"",
   code:(document.getElementById("qd20Code")?.value||"").trim()
  };
 }
 function guardEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=180;}
 function guardPass(v){return typeof v==="string"&&v.length>=10&&v.length<=128;}
 async function client(){return bridge.ensureClient();}
 function fail(e){
  const msg=e?.message||String(e||"인증 처리 중 오류가 발생했어요.");
  const emailAlreadyExists=/user with this email address has already been registered|email already (?:registered|exists|in use)|identity_already_exists|email_exists|already been registered/i.test(
   String(e?.code||"")+" "+msg);
  if(emailAlreadyExists){
   error="이미 회원가입된 이메일이에요. 새로 연결하거나 가입할 필요 없이 기존 계정으로 로그인해 주세요.";
   noticeText="이 기기의 게스트 퀘스트·XP·골드는 로그인 직후 삭제되지 않아요. 기존 계정에 게임 기록이 있으면 클라우드 기록과 비교한 뒤 선택할 수 있어요. 게스트 친구 관계는 기존 계정으로 자동 이전되지 않아요.";
  }else{
   error=msg.slice(0,230);noticeText="";
  }
  render();
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
  // Wait for launch-time anonymous sign-in before changing Auth credentials.
  await bridge.waitForIdentity?.();
  const existing=await sup.auth.getUser();
  const prev=bridge.getUser()?.id||existing.data?.user?.id||null;
  // Preserve warnings even if realtime friends were switched off: an anonymous
  // auth session can still be stored on this device.
  if(existing.data?.user?.is_anonymous){
   if(!confirm("현재 익명 친구 계정에서 다른 계정으로 로그인하면 기존 익명 계정의 친구 관계는 새 계정으로 자동 이전되지 않아요. 이 기기의 게임 기록은 유지되고 새 계정 기록과 충돌하면 선택할 수 있어요. 계속할까요?"))return;
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
  await bridge.waitForIdentity?.();
  const get=await sup.auth.getUser();
  const u=get.data?.user;
  if(u?.email&&!u.is_anonymous){
   throw Error("이미 로그인된 이메일 계정이 있어요. 설정의 계정 관리에서 계정을 확인해 주세요.");
  }
  if(u?.is_anonymous){
   // Converting in place preserves friend and cloud ownership under the same user id.
   // Capacitor's localhost/custom scheme cannot be used as a public Supabase email callback.
   // On native builds, confirm the email in a browser and then sign in within QUEST DAY.
   const isNative=!!window.Capacitor?.isNativePlatform?.();
   const returnUrl=isNative
     ? "https://leaple.github.io/quest-day/"
     : window.location.origin+window.location.pathname;
   const result=await sup.auth.updateUser({email:values.email},{emailRedirectTo:returnUrl});
   if(result.error)throw result.error;
   localStorage.setItem(PENDING,JSON.stringify({type:"link",userId:u.id,email:values.email,ts:Date.now()}));
   flow="link";mode="verifyLink";noticeText="기존 게스트 계정의 친구·게임 기록을 유지해요. 메일의 Confirm Email 링크를 열고, 이 화면에서 인증 상태를 확인하세요.";
   render();return;
  }
  if(!guardPass(values.password))throw Error("비밀번호는 10~128자로 입력해 주세요.");
  const result=await sup.auth.signUp({
   email:values.email,password:values.password,
   options:{emailRedirectTo:window.Capacitor?.isNativePlatform?.()
      ? "https://leaple.github.io/quest-day/"
      : window.location.origin+window.location.pathname}
  });
  if(result.error)throw result.error;
  // A project with Email Confirmation enabled returns no session until verification.
  if(result.data?.session?.user?.id){
   await activate(result.data.session.user.id,null);
  }else{
   localStorage.setItem(PENDING,JSON.stringify({type:"signup",email:values.email,ts:Date.now()}));
   flow="signup";mode="verifySignup";
   noticeText="메일의 Confirm Email 링크를 눌러 인증해 주세요. 기본 메일은 숫자 코드를 제공하지 않아요. 링크가 잘못된 사이트로 이동하면 Supabase의 Site URL과 Redirect URLs을 확인해 주세요.";
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
 async function checkVerification(){
  const sup=await client();
  const response=await sup.auth.getUser();
  const u=response.data?.user;
  const confirmed=!!(u?.email&&u.email_confirmed_at);
  if(flow==="link"){
   const expected=emailDraft||pendingRead()?.email||u?.new_email||"";
   if(!confirmed || u.email.toLowerCase()!==expected.toLowerCase())
    throw Error("아직 이메일 인증이 확인되지 않았어요. 메일의 Confirm Email 링크를 열고 다시 확인해 주세요.");
   mode="finishLink";noticeText="이메일 인증 완료! 이제 비밀번호를 설정하면 다른 기기에서도 같은 계정을 사용할 수 있어요.";
   passwordDraft="";render();return;
  }
  if(confirmed&&!u.is_anonymous&&u.email.toLowerCase()===emailDraft)
   await activate(u.id,bridge.getUser()?.id||null);
  else{
   mode="login";passwordDraft="";
   noticeText="링크를 열어 이메일 인증을 마쳤다면 가입할 때 사용한 이메일과 비밀번호로 로그인해 주세요.";
   render();
  }
 }
 async function savePassword(values){
  if(!guardPass(values.password))throw Error("비밀번호를 10~128자로 설정해 주세요.");
  const changing=mode==="password";
  const sup=await client(),userResult=await sup.auth.getUser();
  const u=userResult.data?.user;
  if(!u?.email||!u.email_confirmed_at)throw Error("먼저 이메일 인증을 완료해 주세요.");
  const result=await sup.auth.updateUser({password:values.password});
  if(result.error)throw result.error;
  passwordDraft="";
  if(changing){
   mode="account";noticeText="새 비밀번호를 저장했어요. 기존 게임 기록과 친구 관계는 유지돼요.";
   accountUser=u;return;
  }
  await activate(u.id,u.id);
 }
 async function resumeProfileSync(){
  if(!bridge.isProfileSyncHeld?.())return;
  const uid=bridge.getUser()?.id;
  if(localStorage.getItem(CLOUD+uid)==="yes"&&!window.QuestDayCloud?.ready)
   throw Error("클라우드 데이터 확인 또는 충돌 선택을 먼저 완료해 주세요. 저장 기록을 확인하기 전에 성장 기록을 덮어쓰지 않아요.");
  let remoteXP=null;
  try{
   const result=await (await client()).from("qd_profiles").select("xp").eq("user_id",uid).single();
   if(!result.error&&typeof result.data?.xp==="number")remoteXP=result.data.xp;
  }catch(e){}
  const difference=remoteXP===null?"":"서버 XP: "+remoteXP+" · 이 기기 XP: "+totalXp()+"\\n\\n";
  if(!confirm(difference+"성장 요약(레벨·XP·캐릭터)을 이 기기 기록 기준으로 다시 동기화할까요? 클라우드 기록이 더 최신이라면 먼저 불러오세요."))return;
  await bridge.resumeProfileSync();
  noticeText="성장 기록 서버 동기화를 다시 시작했어요.";
 }
 async function handle(action,values){
  if(busy)return;
  if(action==="close"){releaseInterface();return;}
  if(action==="guest"){finish("guest");return;}
  if(action==="back"){
   show(settingsOpen?"account":"welcome");return;
  }
  if(action==="login"||action==="signup"||action==="link"||action==="password"){
   show(action);
   return;
  }
  if(action==="finishLinked"){
   const sup=await client(),user=(await sup.auth.getUser()).data?.user;
   if(user?.id)await activate(user.id,user.id);
   return;
  }
  // Preserve form input before the busy-state refresh.
  if(values.email)emailDraft=values.email;
  if(values.password)passwordDraft=values.password;
  if(values.code)codeDraft=values.code;
  busy=true;error="";noticeText="";render();
  try{
   if(action==="submitLogin")await submitLogin(values);
   else if(action==="submitSignup")await submitSignup(values);
   else if(action==="verify")await verify(values);
   else if(action==="checkVerification")await checkVerification();
   else if(action==="savePassword")await savePassword(values);
   else if(action==="accountRefresh")await refreshAccount();
   else if(action==="resumeProfileSync")await resumeProfileSync();
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
    mode==="verifyLink"||mode==="verifySignup"?"verify":mode==="finishLink"||mode==="password"?"savePassword":"";
   if(action)handle(action,getInputs());
  }
 });
 // New users see onboarding. Existing local data or realtime clients are never
 // forced through an irreversible registration screen after an update.
 const legacy=localHasHistory();
 // Repair the v2.0 first-release false positive ("existing" was set merely
 // because automatic starter data had been saved). Never reset guest/account.
 if(localStorage.getItem(DONE)==="existing"&&!legacy)
  localStorage.removeItem(DONE);
 if(!localStorage.getItem(DONE)&&legacy)localStorage.setItem(DONE,"existing");
 // Email confirmation opens this page with an access token, auth code,
 // or a URL error. Show an actionable result, never silently hide failures.
 const qp=new URLSearchParams(window.location.search||"");
 const hp=new URLSearchParams((window.location.hash||"").replace(/^#/,""));
 const callbackError=qp.get("error_description")||hp.get("error_description")||
  qp.get("error")||hp.get("error")||"";
 const callbackType=qp.get("type")||hp.get("type")||"";
 const hasAuthCallback=/(?:^|[?&#])(?:code|access_token|token_hash|error|error_code)=/.test(
  window.location.search+window.location.hash);
 if(callbackError){
  show("authError");
  error=callbackError.slice(0,210);
  noticeText="인증 링크가 만료됐거나 Supabase의 URL 설정이 맞지 않을 수 있어요. Authentication → URL Configuration에서 Site URL과 Redirect URLs을 확인하고 새 인증 메일을 요청해 주세요.";
  render();
 }else if(!localStorage.getItem(DONE)||hasAuthCallback||pendingRead()?.type==="link"){
  if(!localStorage.getItem(DONE))show("welcome");
  const ticket=++requestId;
  (async()=>{
   try{
    const sup=await client();
    await bridge.waitForIdentity?.();
    const session=await sup.auth.getSession();
    if(ticket!==requestId)return;
    const user=session.data?.session?.user;
    if(!user?.id)return;
    const pending=pendingRead();
    const isLinkConfirmation=user.email&&user.email_confirmed_at&&
     ((pending?.type==="link"&&pending.userId===user.id) ||
       (hasAuthCallback&&callbackType==="email_change"));
    if(isLinkConfirmation){
     flow="link";emailDraft=pending?.email||user.email||"";passwordDraft="";
     show("finishLink");
     noticeText="이메일 인증이 완료됐어요! 계정 복구를 위해 새 비밀번호를 설정해 주세요.";
     render();
    }else if(!user.is_anonymous){
     await activate(user.id,bridge.getUser()?.id||null);
    }
   }catch(e){
    console.info("QUEST DAY email confirmation check:",e?.message||e);
    if(hasAuthCallback){show("authError");error="이메일 인증 결과를 확인하지 못했어요. 앱을 다시 열어 인증 상태를 확인해 주세요.";render();}
   }
  })();
 }
 window.addEventListener("qd:realtime-ready",()=>{
  if(mode==="account"&&!root.hidden)refreshAccount();
 });
 window.QuestDayEntry={open:()=>show("account",true)};
})();