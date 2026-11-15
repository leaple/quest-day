/* QUEST DAY: account deletion UI for app and web.
 * No records are touched until the signed-in user explicitly confirms,
 * and the server-side Edge Function reports success.
 */
(function(){
 "use strict";
 const settings=document.getElementById("settings");
 const realtime=window.QuestDayRealtime;
 if(!settings||!realtime)return;
 const css=document.createElement("style");
 css.textContent=[
  ".qd-delete-panel{margin:14px 0;padding:17px;border:1px solid #ebe5f0;border-radius:18px;background:#fff}",
  ".qd-delete-panel h3{font-size:16px;margin:0 0 7px;color:#46405c}",
  ".qd-delete-panel p{font-size:12px;color:#858096;line-height:1.65;margin:6px 0 12px}",
  ".qd-delete-panel .qd-delete-start{border:1px solid #dcc5c5;color:#a13e45;background:#fff5f4;padding:11px 14px;border-radius:11px;font-weight:800;font-size:12px;min-height:44px}",
  ".qd-delete-panel a{color:#7866c7;display:inline-block;margin-left:10px;font-size:12px}",
  ".qd-delete-shade[hidden]{display:none!important}",
  ".qd-delete-shade{position:fixed;inset:0;z-index:120000;background:#171324c4;display:flex;align-items:center;justify-content:center;padding:16px}",
  ".qd-delete-box{background:white;color:#302e45;padding:20px;max-width:440px;width:100%;max-height:90dvh;overflow:auto;border-radius:20px;box-shadow:0 20px 60px #17112766}",
  ".qd-delete-box h3{font-size:20px;margin:0 0 10px}",
  ".qd-delete-box p,.qd-delete-box li{font-size:12px;line-height:1.65;color:#696477}",
  ".qd-delete-box ul{padding-left:20px;margin:8px 0 16px}",
  ".qd-delete-box label{font-size:12px;font-weight:800;display:block;margin:14px 0 6px}",
  ".qd-delete-box input{width:100%;border:1px solid #ded9e7;border-radius:10px;padding:12px;font-size:16px}",
  ".qd-delete-actions{display:flex;gap:9px;margin-top:15px}",
  ".qd-delete-actions button{min-height:44px;flex:1;padding:10px 8px;border:0;border-radius:11px;font-weight:800;font-size:12px}",
  ".qd-delete-actions .cancel{background:#f0eef6;color:#5d576b}",
  ".qd-delete-actions .confirm{background:#ad4952;color:white}",
  ".qd-delete-actions button:disabled{opacity:.45;cursor:not-allowed}",
  ".qd-delete-status{padding:10px 12px;background:#f7f5fa;border-radius:10px;font-size:12px;line-height:1.6;color:#57477c;margin-top:12px;white-space:pre-wrap}",
  ".qd-delete-status.error{background:#fff1f1;color:#9a303d}",
  ".qd-delete-note{margin-top:12px;color:#a4949d;font-size:11px!important}"
 ].join("");
 document.head.appendChild(css);
 const panel=document.createElement("section");
 panel.className="qd-delete-panel";
 panel.innerHTML='<h3>계정·개인정보 관리</h3>'+
  '<p><strong>게임 기록 초기화</strong>와 <strong>계정 영구 삭제</strong>는 다른 기능입니다. 계정 삭제 시 인증 계정과 서버에 연결된 게임 저장·친구·대화 정보가 삭제되며 되돌릴 수 없습니다.</p>'+
  '<button class="qd-delete-start" type="button">계정 영구 삭제</button>'+
  '<a href="./account-deletion.html" target="_blank" rel="noopener">삭제 절차 안내</a>';
 settings.appendChild(panel);
 const shade=document.createElement("div");
 shade.className="qd-delete-shade";
 shade.hidden=true;shade.setAttribute("role","dialog");shade.setAttribute("aria-modal","true");
 shade.setAttribute("aria-label","QUEST DAY 계정 영구 삭제");
 document.body.appendChild(shade);
 let busy=false, activeUser=null,previousFocus=null;
 const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 function alertStatus(value,isError){
  const node=shade.querySelector(".qd-delete-status");
  if(node){node.textContent=value;node.classList.toggle("error",!!isError);}
 }
 function draw(){
  const label=activeUser?(activeUser.is_anonymous?
   "현재 게스트 계정 (이 기기에서 생성된 익명 계정)":
   "현재 로그인 계정: "+esc(activeUser.email||"이메일 정보 없음")):
   "계정 정보를 확인하는 중입니다.";
  shade.innerHTML='<div class="qd-delete-box">'+
   '<h3>계정 영구 삭제</h3>'+
   '<p>'+label+'</p>'+
   '<ul><li>계정과 서버의 저장 기록·친구 관계·대화 및 관련 정보가 삭제됩니다.</li>'+
   '<li>다른 기기에서 같은 계정으로 복구할 수 없습니다.</li>'+
   '<li>삭제 성공이 확인되기 전에는 이 기기 데이터를 지우지 않습니다.</li></ul>'+
   (activeUser?.is_anonymous?'<p>이메일 계정을 삭제하려면 먼저 해당 계정으로 로그인해야 합니다.</p>':'')+
   '<label for="qdDeleteConfirmText">삭제에 동의하면 <strong>계정 삭제</strong>를 입력하세요.</label>'+
   '<input id="qdDeleteConfirmText" autocomplete="off" spellcheck="false" placeholder="계정 삭제" aria-label="계정 삭제 확인 문구">'+
   (activeUser&&!activeUser.is_anonymous?'<label for="qdDeleteCurrentPassword">본인 확인을 위해 현재 비밀번호 입력</label><input id="qdDeleteCurrentPassword" type="password" autocomplete="current-password" placeholder="현재 비밀번호">':'')+
   '<div class="qd-delete-actions"><button type="button" class="cancel" data-qd-delete="cancel">취소</button>'+
   '<button type="button" class="confirm" data-qd-delete="confirm" disabled>영구 삭제</button></div>'+
   (activeUser?.is_anonymous?'<div class="qd-delete-actions"><button type="button" class="cancel" data-qd-delete="login">이메일 계정 로그인</button></div>':'')+
   '<div class="qd-delete-status" role="status" aria-live="polite">삭제는 직접 최종 확인한 경우에만 진행됩니다.</div>'+
   '<p class="qd-delete-note">서버의 삭제 완료 응답이 있기 전에는 데이터를 삭제하지 않습니다.</p></div>';
  const input=shade.querySelector("#qdDeleteConfirmText");
  input?.addEventListener("input",()=>{
   const btn=shade.querySelector('[data-qd-delete="confirm"]');
   if(btn)btn.disabled=busy||!activeUser||input.value.trim()!=="계정 삭제";
  });
 }
 function close(){
  if(busy)return;
  shade.hidden=true;document.body.style.overflow="";
  if(previousFocus?.isConnected)previousFocus.focus();
 }
 async function open(){
  if(busy)return;
  previousFocus=document.activeElement;
  activeUser=null;shade.hidden=false;document.body.style.overflow="hidden";draw();
  shade.querySelector('[data-qd-delete="cancel"]')?.focus();
  try{
   const client=await realtime.ensureClient();
   const {data,error}=await client.auth.getUser();
   if(shade.hidden)return;
   if(error||!data?.user)throw Error("로그인 계정을 확인할 수 없습니다.");
   activeUser=data.user;draw();
  }catch(e){
   if(shade.hidden)return;
   alertStatus("인증 상태 확인 실패: "+String(e?.message||e)+". 인터넷 연결을 확인해 주세요.",true);
  }
 }
 function clearOnlyQuestDayStorage(){
  try{
   const cfg=window.QUEST_DAY_REALTIME_CONFIG;
   const host=cfg?.url?new URL(cfg.url).hostname.split(".")[0]:"";
   const authKey=host?"sb-"+host+"-auth-token":"";
   for(let i=localStorage.length-1;i>=0;i--){
    const key=localStorage.key(i);
    if(key&&(key.startsWith("qd")||key.startsWith("quest-day-")||key===authKey)){
     localStorage.removeItem(key);
    }
   }
  }catch(e){console.warn("Local QUEST DAY cleanup incomplete",e)}
 }
 async function confirmDeletion(){
  const input=shade.querySelector("#qdDeleteConfirmText");
  if(busy||input?.value.trim()!=="계정 삭제"||!activeUser)return;
  const password=shade.querySelector("#qdDeleteCurrentPassword")?.value||"";
  if(!activeUser.is_anonymous&&!password){
   alertStatus("현재 로그인 계정의 비밀번호를 입력해 주세요.",true);return;
  }
  if(!window.confirm("최종 확인: 계정과 클라우드 게임 기록을 영구 삭제할까요? 되돌릴 수 없습니다."))return;
  busy=true;
  shade.querySelectorAll("button,input").forEach(el=>el.disabled=true);
  alertStatus("서버에서 계정 삭제 요청을 확인하고 있습니다. 창을 닫지 마세요.",false);
  try{
   const client=await realtime.ensureClient();
   const {data:identity,error:identityError}=await client.auth.getUser();
   if(identityError||!identity?.user?.id||identity.user.id!==activeUser.id){
    throw Error("인증 계정이 변경됐어요. 창을 닫고 다시 열어 주세요.");
   }
   if(!activeUser.is_anonymous){
    const reauth=await client.auth.signInWithPassword({email:activeUser.email,password});
    if(reauth.error||reauth.data?.user?.id!==activeUser.id){
     throw Error("비밀번호가 일치하지 않거나 계정이 변경됐습니다.");
    }
   }
   const {data,error}=await client.functions.invoke("quest-day-delete-account",{
    body:{confirmation:"계정 삭제"}
   });
   if(error||data?.deleted!==true){
    let detail=null;
    try{detail=await error?.context?.json?.();}catch(_){}
    throw Error(detail?.error||data?.error||error?.message||"서버에서 삭제 완료 응답을 받지 못했습니다.");
   }
   // Only after the server confirms deletion: disconnect and remove local game data.
   try{await client.auth.signOut({scope:"local"});}catch(_){}
   clearOnlyQuestDayStorage();
   window.location.replace("./index.html?account-deleted=1");
  }catch(e){
   alertStatus("삭제가 완료되지 않았습니다. 기기의 데이터는 유지됩니다.\n"+
    String(e?.message||e)+"\n비밀번호 및 인터넷 연결 상태를 확인해 주세요.",true);
  }finally{
   busy=false;
   shade.querySelectorAll('button[data-qd-delete="cancel"],button[data-qd-delete="login"],input').forEach(el=>el.disabled=false);
  }
 }
 panel.querySelector(".qd-delete-start")?.addEventListener("click",open);
 shade.addEventListener("click",ev=>{
  if(ev.target===shade){close();return;}
  const btn=ev.target.closest("[data-qd-delete]");
  if(!btn)return;
  if(btn.dataset.qdDelete==="cancel")close();
  if(btn.dataset.qdDelete==="confirm")confirmDeletion();
  if(btn.dataset.qdDelete==="login"){close();window.QuestDayEntry?.open?.();}
 });
 document.addEventListener("keydown",ev=>{
  if(ev.key==="Escape"&&!shade.hidden){ev.preventDefault();close();}
 });
 window.QuestDayAccountDeletion=Object.freeze({open});
 const params=new URLSearchParams(location.search);
 if(params.get("account-delete")==="1"){
  const launch=()=>{
   document.querySelector('nav [data-page="settings"]')?.click();
   open();
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",launch,{once:true});
  else launch();
 }
})();
