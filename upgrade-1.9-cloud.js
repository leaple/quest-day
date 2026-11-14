/* QUEST DAY 1.9 — opt-in complete game-state cloud sync.
 * Existing localStorage key, tasks, events, RPG, gold and achievements stay intact.
 * Cloud SQL must be installed; RLS + CAS protect account data.
 * First cloud import and ambiguous conflicts never silently discard local progress.
 */
(function(){
 "use strict";
 const bridge=window.QuestDayRealtime;
 const settings=document.getElementById("settings");
 if(!bridge||!settings)return;
 const META="qd19-game-cloud-meta-v1";
 const CONSENT="qd19-game-cloud-consent-v1:";
 const safetyPrefix="qd19-local-safety-v1:";
 const MAX_BYTES=5242880;
 const css=document.createElement("style");
 css.textContent=[
 ".qd19-box{margin:15px 0;background:#fff;border:1px solid #e5e1f6;border-radius:18px;padding:16px}",
 ".qd19-box h3{color:#51438c;font-size:17px;margin:0 0 8px}",
 ".qd19-box p{color:#807f99;font-size:12px;line-height:1.65;margin:8px 0}",
 ".qd19-state{font-size:12px;background:#f3f0ff;border-radius:12px;padding:11px;color:#6859ba;line-height:1.65;margin:10px 0}",
 ".qd19-state.warn{background:#fff5ec;color:#946846}",
 ".qd19-box button{border:0;border-radius:11px;background:#7566e8;color:white;font-weight:800;font-size:12px;min-height:44px;padding:11px 13px;margin:5px 6px 4px 0}",
 ".qd19-box button.alt{background:#eeebff;color:#6455bd}",
 ".qd19-box button:disabled{opacity:.55;cursor:not-allowed}",
 ".qd19-box small{color:#9391a3;display:block;line-height:1.6;font-size:11px}"
 ].join("");
 document.head.appendChild(css);
 const panel=document.createElement("section");
 panel.id="qd19Cloud";panel.className="qd19-box";
 const protection=document.getElementById("qd18Protection");
 if(protection&&protection.parentNode===settings)settings.insertBefore(panel,protection);
 else settings.appendChild(panel);
 let user="",enabled=false,ready=false,loading=false,writing=false,blocked=false,base=null;
 let rev=0,dirty=false,issue="",remotePending=null,localConflict=null,pushTimer=null,pullTimer=null;
 let poll=null,channel=null,epoch=0,lastSuccessful="";
 const esc=x=>escapeHtml(String(x??""));
 const localJSON=()=>JSON.stringify(state);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const valid=x=>x&&typeof x==="object"&&!Array.isArray(x)&&Array.isArray(x.tasks)&&Array.isArray(x.events);
 const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
 const c=()=>bridge.getClient();
 const myID=()=>bridge.getUser()?.id||"";
 const saveConsent=uid=>localStorage.getItem(CONSENT+uid)==="yes";
 const metaRead=()=>{
  try {return JSON.parse(localStorage.getItem(META)||"null")||{};}
  catch(e){return {};}
 };
 const metaWrite=(uid,r,stateText)=>{
  try{localStorage.setItem(META,JSON.stringify({userId:uid,revision:r,lastHash:hash(stateText)}));}
  catch(e){console.warn("Cloud sync marker unavailable",e);}
 };
 // Not cryptographic: fast change detection, never used for permissions/security.
 function hash(str){let v=2166136261;for(let i=0;i<str.length;i++){v^=str.charCodeAt(i);v=Math.imul(v,16777619)}return (v>>>0).toString(16)+":"+str.length;}
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const MISSING=Symbol("missing"),UNRESOLVED=Symbol("unresolved");
 function merge3(before,here,there,depth=0){
  if(depth>24)return UNRESOLVED;
  if(same(here,there))return here;
  if(same(here,before))return there;
  if(same(there,before))return here;
  if(here===MISSING||there===MISSING||before===MISSING)return UNRESOLVED;
  const object=x=>x&&typeof x==="object"&&!Array.isArray(x);
  if(Array.isArray(here)&&Array.isArray(there)&&Array.isArray(before)){
   const indexed=x=>x.every(v=>object(v)&&typeof v.id==="string") &&
      new Set(x.map(v=>v.id)).size===x.length;
   if(!indexed(here)||!indexed(there)||!indexed(before))return UNRESOLVED;
   const bm=new Map(before.map(v=>[v.id,v])),hm=new Map(here.map(v=>[v.id,v])),
     tm=new Map(there.map(v=>[v.id,v]));
   const keys=[...new Set([...tm.keys(),...hm.keys(),...bm.keys()])],out=[];
   for(const k of keys){
    const merged=merge3(bm.has(k)?bm.get(k):MISSING,
     hm.has(k)?hm.get(k):MISSING,tm.has(k)?tm.get(k):MISSING,depth+1);
    if(merged===UNRESOLVED)return UNRESOLVED;
    if(merged!==MISSING)out.push(merged);
   }
   return out;
  }
  if(object(here)&&object(there)&&object(before)){
   const out=Object.create(null);
   for(const key of new Set([...Object.keys(before),...Object.keys(here),...Object.keys(there)])){
    if(key==="__proto__"||key==="prototype"||key==="constructor")return UNRESOLVED;
    const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
    const result=merge3(own(before,key)?before[key]:MISSING,
     own(here,key)?here[key]:MISSING,own(there,key)?there[key]:MISSING,depth+1);
    if(result===UNRESOLVED)return UNRESOLVED;
    if(result!==MISSING)out[key]=result;
   }
   return out;
  }
  return UNRESOLVED;
 }
 function status(msg){issue=msg;draw();}
 function draw(){
  const connected=bridge.isReady()&&!!myID();
  const statusText=!connected?"실시간 계정에 연결되면 클라우드 동기화를 사용할 수 있어요.":
   loading?"계정의 게임 기록을 확인하고 있어요…":
   blocked?"서로 다른 기록이 감지됐어요. 두 기록을 보존하고 선택을 기다리고 있어요.":
   !enabled?"모든 게임 기록을 계정에 연결하려면 한 번 동의해 주세요.":
   ready?(dirty||writing?"변경 사항을 저장하는 중…":"☁️ 계정과 자동 동기화 중"):
   "서버 연결을 확인하는 중…";
  const opts=connected&&blocked?
   (remotePending?.exists?'<button data-qd19="remote">클라우드 기록 사용</button>':"")+
   '<button data-qd19="local" class="alt">이 기기 기록 사용</button>':
   connected&&!enabled?
   '<button data-qd19="enable">내 모든 기록 클라우드 동기화 시작</button>':
   connected&&ready?
   '<button data-qd19="sync" class="alt">지금 동기화</button>':
   connected&&enabled&&!loading?
   '<button data-qd19="retry" class="alt">연결 다시 시도</button>':"";
  panel.innerHTML='<h3>☁️ 계정 전체 데이터 동기화</h3>'+
   '<p>퀘스트·완료 기록·XP·골드 계산에 필요한 기록·구매 캐릭터·업적·설정까지 '+
   '<strong>현재 게임 저장 데이터 전체</strong>를 Supabase의 내 계정에 보관해요. '+
   '친구·채팅은 기존 계정 연동을 유지해요.</p>'+
   '<div class="qd19-state'+(blocked||issue?' warn':'')+'">'+esc(statusText)+
   (lastSuccessful&&ready?'<small>마지막 동기화: '+esc(lastSuccessful)+'</small>':'')+
   (issue?'<small>'+esc(issue)+'</small>':'')+'</div>'+
   opts+
   (blocked?'<p>안전하게 비교할 수 없는 변경이 있어 자동 덮어쓰기를 중지했어요. '+
   '두 기록 중 하나를 선택하면 다른 쪽 기록은 이 기기의 내부 안전 보관본으로 남겨요.</p>':"")+
   '<small>계정이 익명 상태라면 다른 기기에서 같은 계정에 로그인할 수 없어요. '+
   '다른 기기로 옮기려면 아래에서 이메일 인증과 비밀번호 설정을 먼저 마쳐 주세요. '+
   '서버 연결이 끊긴 동안에는 기기에 저장하고, 연결되면 다시 동기화를 시도해요.</small>';
 }
 function safetyCopy(data,label){
  try{
   const key=safetyPrefix+user;
   const record={savedAt:new Date().toISOString(),label,data};
   localStorage.setItem(key,JSON.stringify(record));
   return true;
  }catch(e){console.warn("Local recovery copy unavailable",e);return false;}
 }
 function applyRemote(obj,saveRecovery=true){
  if(!valid(obj))throw Error("클라우드 기록의 구조가 올바르지 않아요.");
  if(bytes(obj)>MAX_BYTES)throw Error("클라우드 기록이 너무 커요.");
  const old=clone(state);
  if(saveRecovery&&!same(old,obj)&&!safetyCopy(old,"cloud import"))
   throw Error("기존 기기 기록의 안전 보관 공간이 부족해서 가져오기를 중단했어요. 기기 저장 공간을 확인해 주세요.");
  const snapshot=clone(obj);
  state=snapshot;
  // Existing save wrappers keep local evolution / RPG render behavior.
  const oldLoading=loading;loading=true;
  try{saveState();render();}
  finally{loading=oldLoading;}
  return localJSON();
 }
 function markSynced(payload,revision){
  rev=Number(revision);
  base=clone(payload);
  metaWrite(user,rev,JSON.stringify(payload));
  lastSuccessful=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  dirty=!same(state,payload);
  ready=true;issue="";
  if(dirty)schedulePush();
  if(bridge.isProfileSyncHeld?.()){
   bridge.resumeProfileSync().catch(e=>{issue=explain(e);draw();});
  }else{
   bridge.syncProfile?.().catch(e=>console.warn("Cloud profile summary sync failed",e));
  }
  draw();
 }
 async function rpc(name,args){
  const result=await c().rpc(name,args||{});
  if(result.error)throw result.error;
  return result.data;
 }
 function isDefaultLocal(){
  const ids=new Set((state.tasks||[]).map(x=>x.id));
  const standard=["demo1","demo2","demo3"];
  const r=state.rpg||{};
  return (state.events||[]).length===0 &&
   ids.size<=3&&[...ids].every(id=>standard.includes(id)) &&
   (!Array.isArray(r.purchases)||r.purchases.length===0) &&
   (!r.claimed||Object.keys(r.claimed).length===0) &&
   (!state.friends?.contacts || state.friends.contacts.length===0);
 }
 async function bootstrap(){
  if(!bridge.isReady()||!myID())return;
  const uid=myID(),ticket=++epoch;
  user=uid;enabled=saveConsent(uid);ready=false;blocked=false;
  rev=0;base=null;remotePending=null;localConflict=null;
  clearTimeout(pushTimer);clearTimeout(pullTimer);
  clearInterval(poll);poll=null;
  if(channel&&c())c().removeChannel(channel);
  channel=null;issue="";
  if(!enabled){draw();return;}
  loading=true;draw();
  try{
   const server=await rpc("qd_cloud_load");
   if(ticket!==epoch||myID()!==uid)return;
   await reconcile(server,true);
   if(ready)subscribe();
  }catch(e){issue=explain(e);ready=false;}
  finally{if(ticket===epoch){loading=false;if(dirty&&ready)schedulePush();draw();}}
 }
 function explain(e){
  const message=e?.message||String(e||"네트워크 오류");
  return /PGRST202|qd_cloud_load|qd_cloud_write|does not exist|not found|permission denied|schema cache/i.test(message)?
   "Supabase에서 quest-day-cloud-1.9.sql을 실행했는지 확인해 주세요. ("+message.slice(0,120)+")":
   message.slice(0,220);
 }
 async function reconcile(server,initial=false){
  if(!server||typeof server!=="object")throw Error("클라우드 응답을 확인할 수 없어요.");
  const meta=metaRead();
  const local=clone(state);
  if(!server.exists){
   rev=0;base=null;
   if(meta.userId&&meta.userId!==user&&!isDefaultLocal()){
    blocked=true;localConflict=local;remotePending={exists:false,revision:0,data:null};draw();return;
   }
   const sent=await writeExact(local,0);
   if(!sent)return;
   return;
  }
  if(!valid(server.data)||!Number.isSafeInteger(Number(server.revision))||Number(server.revision)<1)
   throw Error("저장된 계정 데이터를 확인할 수 없어요.");
  const remote=clone(server.data),serverRev=Number(server.revision);
  const lastKnown=meta.userId===user&&meta.lastHash===hash(JSON.stringify(local));
  if(same(local,remote)){
   markSynced(remote,serverRev);return;
  }
  if(isDefaultLocal()||lastKnown){
   applyRemote(remote,false);
   markSynced(remote,serverRev);return;
  }
  if(base&&meta.userId===user){
   const merged=merge3(base,local,remote);
   if(merged!==UNRESOLVED&&valid(merged)){
    safetyCopy(local,"three-way merge");
    applyRemote(merged,false);
    rev=serverRev;base=remote;
    metaWrite(user,serverRev,JSON.stringify(remote));
    ready=true;dirty=true;blocked=false;schedulePush();draw();return;
   }
  }
  blocked=true;ready=false;localConflict=local;
  remotePending={exists:true,revision:serverRev,data:remote};draw();
 }
 async function writeExact(data,expected){
  if(!valid(data)||bytes(data)>MAX_BYTES){
   issue="기록이 5MB를 넘거나 저장 형식이 올바르지 않아 동기화를 중지했어요.";
   draw();return false;
  }
  const uid=user,ticket=epoch;
  const result=await rpc("qd_cloud_write",{payload:data,expected_revision:expected});
  if(ticket!==epoch||myID()!==uid)return false;
  markSynced(data,result.revision);
  return true;
 }
 function schedulePush(){
  if(!enabled||!ready||blocked||loading||!bridge.isReady())return;
  clearTimeout(pushTimer);
  pushTimer=setTimeout(()=>push().catch(e=>{issue=explain(e);dirty=true;draw();}),1200);
 }
 function localSaved(){
  if(loading||!ready||blocked)return;
  dirty=!!base&&!same(state,base);
  if(dirty)schedulePush();
 }
 async function push(){
  if(writing||!enabled||!ready||blocked||loading||!bridge.isReady()||!dirty)return;
  const payload=clone(state),expected=rev,ticket=epoch,uid=user;
  writing=true;draw();
  try{
   const result=await rpc("qd_cloud_write",{payload,expected_revision:expected});
   if(ticket!==epoch||uid!==myID())return;
   markSynced(payload,result.revision);
  }catch(e){
   if(/SAVE_CONFLICT/.test(e?.message||"")){
    await pull();
   }else{dirty=true;issue=explain(e);}
  }finally{writing=false;draw();/* transient retry handled by next poll */}
 }
 async function pull(){
  if(!enabled||!bridge.isReady()||loading||blocked)return;
  const uid=user,ticket=epoch;loading=true;
  try{
   const server=await rpc("qd_cloud_load");
   if(ticket!==epoch||uid!==myID())return;
   if(Number(server.revision)===rev&&!!server.exists){
    // We may have unsent changes from this device.
    if(base&&!same(state,base)){dirty=true;schedulePush();}
   }else await reconcile(server);
  }catch(e){issue=explain(e);}
  finally{if(ticket===epoch){loading=false;if(dirty&&ready)schedulePush();draw();}}
 }
 function subscribe(){
  clearInterval(poll);
  poll=setInterval(()=>{
   if(enabled&&bridge.isReady()&&navigator.onLine!==false){
    if(dirty)schedulePush();
    else pull();
   }
  },30000);
  if(channel&&c())c().removeChannel(channel);
  if(!c()||!user)return;
  channel=c().channel("qd-cloud-"+user)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_cloud_saves"},event=>{
    if(event.new?.user_id===user)schedulePull();
   })
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"qd_cloud_saves"},event=>{
    if(event.new?.user_id===user)schedulePull();
   }).subscribe();
 }
 function schedulePull(){
  clearTimeout(pullTimer);pullTimer=setTimeout(()=>{
   if(dirty)schedulePush();
   else pull();
  },550);
 }
 async function enable(){
  if(!bridge.isReady()||!myID())return status("먼저 계정에 로그인해 주세요.");
  if(!confirm("이 기기의 퀘스트 이름·활동 기록·XP·구매·캐릭터·설정 등 게임 저장 데이터 전체를 내 Supabase 계정에 보관할까요?\n\n계정 보호(이메일 인증)를 하지 않은 익명 계정은 다른 기기에서 복구할 수 없어요."))return;
  try{
   localStorage.setItem(CONSENT+myID(),"yes");
   await bootstrap();
  }catch(e){status(explain(e));}
 }
 async function resolve(useRemote){
  if(!blocked||!remotePending)return;
  const snapshot=remotePending,local=clone(state);
  blocked=false;loading=true;draw();
  try{
   if(useRemote&&snapshot.exists){
    // Pull the latest snapshot again so a cloud choice isn't stale.
    const latest=await rpc("qd_cloud_load");
    if(!latest.exists||!valid(latest.data))throw Error("최신 클라우드 저장본을 읽지 못했어요.");
    applyRemote(latest.data,true);
    markSynced(latest.data,latest.revision);
   }else{
    if(snapshot.exists&&!safetyCopy(snapshot.data,"replaced cloud save"))
     throw Error("이전 클라우드 기록의 안전 보관 공간이 부족해서 덮어쓰지 않았어요.");
    // If server changed since we displayed the dialog, CAS rejects the overwrite.
    const ok=await writeExact(local,snapshot.revision);
    if(ok){blocked=false;ready=true;}
   }
   if(ready)subscribe();
  }catch(e){
   blocked=true;ready=false;issue=explain(e);
  }finally{loading=false;draw();}
 }
 async function requestReset(){
  if(enabled&&!ready){
   status("클라우드 연결을 확인하거나 기록 충돌을 해결한 뒤 초기화할 수 있어요.");
   return;
  }
  if(!enabled||!bridge.isReady()){
   if(!confirm("이 기기의 게임 기록을 초기화할까요? 서버 동기화가 설정되지 않았으므로 이 기기 기록만 변경돼요."))return;
   state={tasks:[],events:[]};saveState();render();return;
  }
  if(writing||loading||blocked){status("동기화가 끝난 뒤 다시 시도해 주세요.");return;}
  if(!confirm("계정에 연결된 모든 기기의 퀘스트·XP·골드·캐릭터·업적 기록을 초기화할까요?\n이 작업은 되돌리기 어려워요."))return;
  if(!confirm("최종 확인: 이 계정의 전체 게임 저장 기록을 빈 상태로 변경합니다. 계속할까요?"))return;
  const empty={tasks:[],events:[]};
  safetyCopy(state,"before explicit reset");
  loading=true;draw();
  try{
   const result=await rpc("qd_cloud_write",{payload:empty,expected_revision:rev});
   state=clone(empty);
   saveState();render();
   markSynced(empty,result.revision);
  }catch(e){status("초기화가 완료되지 않았어요. "+explain(e));}
  finally{loading=false;draw();}
 }
 panel.addEventListener("click",e=>{
  const button=e.target.closest("button[data-qd19]");
  if(!button)return;
  const action=button.dataset.qd19;
  if(action==="enable")enable();
  else if(action==="sync"){if(dirty)push();else pull();}
  else if(action==="remote")resolve(true);
  else if(action==="local")resolve(false);
  else if(action==="retry")bootstrap();
 });
 const earlierSave=saveState;
 saveState=function(){earlierSave();localSaved();};
 window.QuestDayCloud={get ready(){return ready&&!blocked;},requestReset,
  syncNow:()=>dirty?push():pull()};
 window.addEventListener("qd:realtime-ready",()=>bootstrap());
 window.addEventListener("qd:realtime-stopped",()=>{
  epoch++;ready=false;user="";enabled=false;blocked=false;loading=false;
  clearTimeout(pushTimer);clearTimeout(pullTimer);clearInterval(poll);poll=null;
  if(channel&&c())c().removeChannel(channel);channel=null;draw();
 });
 document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&bridge.isReady()&&enabled){
   if(dirty)schedulePush();else pull();
  }
 });
 window.addEventListener("online",()=>{
  if(bridge.isReady()&&enabled){if(dirty)schedulePush();else pull();}
 });
 if(bridge.isReady())bootstrap();
 draw();
})();