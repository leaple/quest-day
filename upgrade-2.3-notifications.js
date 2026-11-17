/* QUEST DAY 2.3 — calendar rollover and opt-in, per-account notifications.
   The existing quest/cloud storage key and game records are never changed here.
   Native notifications require OS permission; web displays foreground friend notices.
   Background friend pushes require a separate APNs/FCM server integration.
*/
(function(){
"use strict";
if(window.QuestDayNotifications)return;
const native=!!window.Capacitor?.isNativePlatform?.();
const plugin=native?window.Capacitor?.Plugins?.LocalNotifications:null;
const bridge=window.QuestDayRealtime;
const STORE="qd-notify-prefs-v1:";
const LEDGER="qd-notify-seen-v1:";
const DEFAULTS=Object.freeze({morning:true,evening:true,friends:true});
const PERMISSION_ASKED="qd23-native-permission-prompted-v1";
const MORNING_ID=922001;
const EVENING_IDS=Array.from({length:14},(_,i)=>922100+i);
const MANAGED_IDS=[MORNING_ID,...EVENING_IDS];
let userId=bridge?.getUser?.()?.id||"local";
let prefs=readPrefs(userId);
let hasLocalPrefs=!!localStorage.getItem(STORE+userId);
let permission="unknown";
let panel=null,channel=null,friendSubscribedFor="";
let lastDate=dateKey(),zone=new Date().getTimezoneOffset();
let midnightTimer=null,syncTimer=null,refreshId=0,activeEpoch=0;
let lastNativeSignature="",inNativeSync=Promise.resolve();
let pendingCloudWrite=null,cloudWriteTimer=null;
let sdkChecked=false;

function dayKey(d){return dateKey(d);}
function readPrefs(id){
 try{
  const value=JSON.parse(localStorage.getItem(STORE+id)||"{}");
  return {morning:value.morning!==false,evening:value.evening!==false,friends:value.friends!==false,
    updated_at:typeof value.updated_at==="string"?value.updated_at:""};
 }catch(_){return {...DEFAULTS,updated_at:""};}
}
function writeLocal(){
 prefs.updated_at=new Date().toISOString();
 localStorage.setItem(STORE+userId,JSON.stringify(prefs));
 hasLocalPrefs=true;
}
function showStatus(msg){
 const status=document.getElementById("qd23Status");
 if(status)status.textContent=msg;
}
function renderSettings(){
 if(!panel)return;
 for(const key of ["morning","evening","friends"]){
  const checkbox=panel.querySelector('[data-qd23-setting="'+key+'"]');
  if(checkbox)checkbox.checked=!!prefs[key];
 }
 const account=panel.querySelector("#qd23Account");
 if(account)account.textContent=userId==="local"?
  "오프라인 기기 설정":("현재 계정별 설정 · "+(bridge?.getUser?.()?.is_anonymous?"게스트":"로그인 사용자"));
 const info=panel.querySelector("#qd23PermissionLabel");
 if(info){
  info.textContent=!native?"웹 버전에서는 설정을 저장하고 친구 알림을 앱 화면에 표시해요. 휴대폰 알림은 설치한 앱에서만 사용해요.":
    !plugin?"이 앱 빌드에 알림 플러그인이 없어요. 최신 버전으로 업데이트해 주세요.":
    permission==="granted"?"휴대폰 알림 권한 허용됨 · 09:00 / 21:00 예약 적용":
    permission==="denied"?"휴대폰 알림 권한이 차단돼 있어요. 휴대폰 앱 설정에서 알림을 허용해 주세요.":
    "휴대폰 알림 권한을 확인하고 있어요.";
 }
}
function mount(){
 const settings=document.getElementById("settings");
 if(!settings||panel)return;
 panel=document.createElement("section");
 panel.id="qd23NotificationSettings";
 panel.className="qd23-panel";
 panel.innerHTML='<h3>🔔 퀘스트 알림</h3>'+
  '<p id="qd23Account" class="qd23-sub"></p>'+
  '<label class="qd23-row"><span><b>☀️ 아침 퀘스트 알림</b><small>매일 오전 9:00 · 오늘의 퀘스트 안내</small></span><input type="checkbox" data-qd23-setting="morning" aria-label="아침 9시 퀘스트 알림"></label>'+
  '<label class="qd23-row"><span><b>🌙 미완료 퀘스트 알림</b><small>오후 9:00 · 남은 퀘스트가 있을 때 예약</small></span><input type="checkbox" data-qd23-setting="evening" aria-label="저녁 9시 미완료 퀘스트 알림"></label>'+
  '<label class="qd23-row"><span><b>🤝 친구 알림</b><small>친구 요청·메시지·응원·파티 초대</small></span><input type="checkbox" data-qd23-setting="friends" aria-label="친구 및 메시지 알림"></label>'+
  '<p id="qd23PermissionLabel" class="qd23-sub" role="status"></p>'+
  '<p class="qd23-warning">알림은 선택 사항이며 언제든 끌 수 있어요. 앱이 꺼진 뒤 다른 기기에서 완료한 퀘스트는 예약된 저녁 알림에 즉시 반영되지 않을 수 있어요. 친구 알림은 앱이 연결된 동안 동작하며, 앱 종료 상태의 서버 푸시는 아직 지원하지 않아요.</p>'+
  '<p id="qd23Status" class="qd23-sub" aria-live="polite"></p>';
 const style=document.createElement("style");style.id="qd23NotificationStyle";
 style.textContent=[
  ".qd23-panel{background:white;border:1px solid #e5e0f4;border-radius:18px;margin:16px 0;padding:17px;box-shadow:0 7px 20px #2820540a}",
  ".qd23-panel h3{font-size:16px;margin:0 0 5px;color:#34304c}",
  ".qd23-sub{font-size:11px;color:#9188a7;line-height:1.6;margin:6px 0 10px}",
  ".qd23-row{display:flex;align-items:center;justify-content:space-between;gap:11px;padding:13px 0;border-bottom:1px solid #f2eff8}",
  ".qd23-row span{flex:1;min-width:0}.qd23-row b{font-size:13px;color:#48405d;display:block}.qd23-row small{display:block;margin-top:5px;color:#9189a4;font-size:11px;line-height:1.5}",
  ".qd23-row input{appearance:auto;accent-color:#7664d8;width:22px;height:22px;flex:0 0 22px;cursor:pointer}",
  ".qd23-permit{background:#7664dc;color:white;border:0;padding:11px 15px;border-radius:12px;font-weight:800;min-height:44px;margin:13px 0 2px;font-size:12px}",
  ".qd23-warning{font-size:10px;color:#968da7;line-height:1.65;margin:10px 0}",
  ".qd23-toast{position:fixed;z-index:80000;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(92vw,430px);width:max-content;background:#36304f;color:white;padding:11px 15px;border-radius:14px;box-shadow:0 10px 28px #16102840;font-size:12px;line-height:1.5;pointer-events:none}"
 ].join("");
 document.head.appendChild(style);
 const old=settings.querySelector("#resetBtn")?.closest(".card");
 if(old)old.insertAdjacentElement("beforebegin",panel);else settings.appendChild(panel);
 panel.addEventListener("change",async event=>{
  const input=event.target.closest("[data-qd23-setting]");
  if(!input)return;
  const key=input.dataset.qd23Setting;
  if(!["morning","evening","friends"].includes(key))return;
  prefs[key]=!!input.checked;
  if(plugin&&prefs[key]&&permission!=="granted"){
   await requestNativePermission();
   if(permission!=="granted"){
    prefs[key]=false;
    input.checked=false;
    showStatus("알림 권한이 허용되지 않아 알림을 꺼 두었어요. iPhone 설정에서 QUEST DAY 알림을 허용할 수 있어요.");
   }
  }
  writeLocal();
  queueCloudWrite();
  if(key==="friends")subscribeFriends();
  queueNativeSync();
  showStatus("설정이 저장됐어요.");
 });
 renderSettings();
}
async function requestNativePermission(){
 if(!plugin)return;
 try{
  const p=await plugin.checkPermissions();
  permission=p?.display||"unknown";
  if(permission!=="granted"){
   const result=await plugin.requestPermissions();
   permission=result?.display||"unknown";
  }
 }catch(err){console.warn("QUEST DAY notification permission",err);permission="denied";}
 renderSettings();
}
async function checkPermission(){
 if(!plugin)return;
 try{const p=await plugin.checkPermissions();permission=p?.display||"unknown";}
 catch(err){permission="unknown";console.warn("QUEST DAY permission check",err);}
 renderSettings();
}
function countIncomplete(when){
 const snapshot=(typeof state!=="undefined"?state:null);
 if(!snapshot||!Array.isArray(snapshot.tasks)||!Array.isArray(snapshot.events))return 0;
 const target=dayKey(when),month=target.slice(0,7);
 const weekStart=x=>{
  const bits=x.split("-").map(Number);
  const d=new Date(bits[0],bits[1]-1,bits[2],12);
  d.setDate(d.getDate()-(d.getDay()+6)%7);
  return dayKey(d);
 };
 const targetWeek=weekStart(target);
 let count=0;
 for(const task of snapshot.tasks){
  const frequency=task.frequency||"daily";
  const completed=snapshot.events.some(e=>{
   if(e.taskId!==task.id||typeof e.day!=="string")return false;
   if(frequency==="once")return true;
   if(frequency==="weekly")return weekStart(e.day)===targetWeek;
   if(frequency==="monthly")return e.day.slice(0,7)===month;
   return e.day===target;
  });
  if(!completed)count++;
 }
 return count;
}
function proposedNotifications(){
 const notifications=[];
 const now=new Date();
 if(prefs.morning){
  notifications.push({
   id:MORNING_ID,title:"QUEST DAY · 새로운 모험",body:"오전 9시! 오늘의 퀘스트를 확인해 보세요.",
   schedule:{on:{hour:9,minute:0}},extra:{qd_owner:userId,qd_kind:"morning"}
  });
 }
 if(prefs.evening)for(let i=0;i<14;i++){
  const day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,21,0,0);
  if(day.getTime()<=now.getTime()+2000)continue;
  const count=countIncomplete(day);
  if(count===0)continue;
  notifications.push({
   id:EVENING_IDS[i],title:"QUEST DAY · 아직 남은 퀘스트",
   body:"오늘 완료하지 않은 퀘스트가 있어요. 내일의 모험 전에 확인해 보세요!",
   schedule:{at:day},extra:{qd_owner:userId,qd_kind:"evening",qd_day:dayKey(day)}
  });
 }
 return notifications;
}
function scheduleFingerprint(wanted){
 return JSON.stringify([userId,permission,wanted.map(n=>[
  n.id,n.schedule?.on?.hour||null,n.schedule?.at?.toISOString?.()||null
 ])]);
}
async function syncNative(force){
 if(!plugin)return;
 await checkPermission();
 // Serial queue avoids overlapping calls cancelling freshly scheduled items.
 const ready=permission==="granted";
 const wanted=ready?proposedNotifications():[];
 const digest=scheduleFingerprint(wanted);
 if(!force&&digest===lastNativeSignature)return;
 const scheduled=await plugin.getPending();
 const present=new Set((scheduled?.notifications||[]).map(item=>item.id));
 const owned=MANAGED_IDS.filter(id=>present.has(id));
 if(owned.length)await plugin.cancel({notifications:owned.map(id=>({id}))});
 if(ready&&wanted.length)await plugin.schedule({notifications:wanted});
 lastNativeSignature=digest;
 showStatus(ready?"알림 예약이 갱신됐어요.":"알림 권한을 허용하면 휴대폰 예약이 시작돼요.");
}
function queueNativeSync(force=false){
 if(!plugin)return;
 if(syncTimer)clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>{
  inNativeSync=inNativeSync.then(()=>syncNative(force)).catch(err=>{
   lastNativeSignature="";
   console.warn("QUEST DAY notification schedule",err);
   showStatus("휴대폰 알림 예약을 확인하지 못했어요. 앱을 다시 열어 확인해 주세요.");
  });
 },350);
}
function queueCloudWrite(){
 if(userId==="local")return;
 clearTimeout(cloudWriteTimer);
 const owner=userId,copy={...prefs};
 cloudWriteTimer=setTimeout(async()=>{
  const client=bridge?.getClient?.();
  if(!client||bridge?.getUser?.()?.id!==owner)return;
  try{
   const {error}=await client.from("qd_notification_prefs").upsert({
    user_id:owner,morning:copy.morning,evening:copy.evening,friends:copy.friends,
    updated_at:copy.updated_at
   },{onConflict:"user_id"});
   if(error)throw error;
  }catch(err){console.warn("QUEST DAY notification preferences sync",err);showStatus("설정은 이 기기에 저장됐지만 클라우드 동기화는 나중에 다시 시도해요.");}
 },700);
}
async function loadCloudPrefs(owner,epoch){
 const client=bridge?.getClient?.();
 if(!client||owner==="local")return;
 try{
  const res=await client.from("qd_notification_prefs")
   .select("morning,evening,friends,updated_at").eq("user_id",owner).maybeSingle();
  if(res.error)throw res.error;
  if(owner!==userId||epoch!==activeEpoch)return;
  const remote=res.data;
  const serverTime=Date.parse(remote?.updated_at||"")||0;
  const localTime=Date.parse(prefs.updated_at||"")||0;
  if(remote&&(!hasLocalPrefs||serverTime>localTime)){
   prefs={morning:remote.morning!==false,evening:remote.evening!==false,
    friends:remote.friends!==false,updated_at:remote.updated_at||""};
   localStorage.setItem(STORE+owner,JSON.stringify(prefs));
   hasLocalPrefs=true;
   renderSettings();queueNativeSync(true);subscribeFriends();
  }else if(hasLocalPrefs&&(!remote||localTime>serverTime)){
   queueCloudWrite();
  }
 }catch(err){console.warn("QUEST DAY notification cloud load",err);}
}
function consumeEvent(id){
 const key=LEDGER+userId;
 try{
  const recent=JSON.parse(localStorage.getItem(key)||"[]");
  if(recent.includes(id))return false;
  recent.push(id);
  localStorage.setItem(key,JSON.stringify(recent.slice(-180)));
  return true;
 }catch(_){return true;}
}
function toast(message){
 if(document.visibilityState==="hidden")return;
 const old=document.querySelector(".qd23-toast");old?.remove();
 const el=document.createElement("div");el.className="qd23-toast";
 el.textContent=message;document.body.appendChild(el);
 setTimeout(()=>el.remove(),3800);
}
function intIdFromEvent(value){
 let h=2166136261;
 for(let i=0;i<value.length;i++){h=Math.imul(h^value.charCodeAt(i),16777619);}
 return 930000+(h>>>0)%1000000000;
}
async function alertFriend(kind,event){
 const data=event?.new||{},owner=userId;
 if(!prefs.friends||data.recipient_id!==owner&&data.invitee_id!==owner)return;
 const unique=kind+":"+String(data.id||data.created_at||"unknown");
 if(!consumeEvent(unique))return;
 const texts={
  messages:["친구에게 새 메시지가 도착했어요","💬 새 메시지를 확인해 보세요."],
  friend_requests:["새 친구 요청이 도착했어요","🤝 QUEST DAY에서 친구 요청을 확인해 보세요."],
  cheers:["친구의 응원이 도착했어요","✨ 오늘도 힘내세요!"],
  parties:["공동 퀘스트 초대가 도착했어요","⚔️ 친구의 파티 초대를 확인해 보세요."]
 };
 const [title,body]=texts[kind]||["QUEST DAY 친구 알림","친구 활동이 있어요."];
 if(!native||!plugin||permission!=="granted") {
  toast(title);
  return;
 }
 try{
  await plugin.schedule({notifications:[{
   id:intIdFromEvent(owner+unique),title,body,
   schedule:{at:new Date(Date.now()+750)},extra:{qd_owner:owner,qd_kind:"friends"}
  }]});
 }catch(err){
  console.warn("QUEST DAY friend local alert",err);
  toast(title);
 }
}
function stopFriends(){
 if(channel&&bridge?.getClient?.()){
  bridge.getClient().removeChannel(channel).catch?.(()=>{});
 }
 channel=null;friendSubscribedFor="";
}
function subscribeFriends(){
 if(!prefs.friends){stopFriends();return;}
 const client=bridge?.getClient?.(),owner=bridge?.getUser?.()?.id;
 if(!client||!owner||owner!==userId)return;
 if(channel&&friendSubscribedFor===owner)return;
 stopFriends();
 friendSubscribedFor=owner;
 channel=client.channel("qd-alarms-"+owner)
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_messages",filter:"recipient_id=eq."+owner},event=>alertFriend("messages",event))
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_friend_requests",filter:"recipient_id=eq."+owner},event=>alertFriend("friend_requests",event))
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_cheers",filter:"recipient_id=eq."+owner},event=>alertFriend("cheers",event))
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"qd_parties",filter:"invitee_id=eq."+owner},event=>alertFriend("parties",event))
  .subscribe(status=>{if(status==="CHANNEL_ERROR")console.warn("QUEST DAY friend alert channel error");});
}
async function updateUser(){
 const current=bridge?.getUser?.()?.id||"local";
 if(current===userId){
  if(current!=="local")subscribeFriends();
  return;
 }
 activeEpoch++;
 const epoch=activeEpoch;
 stopFriends();
 clearTimeout(cloudWriteTimer);
 userId=current;
 prefs=readPrefs(current);
 hasLocalPrefs=!!localStorage.getItem(STORE+current);
 lastNativeSignature="";
 renderSettings();queueNativeSync(true);
 if(current!=="local"){
  subscribeFriends();
  await loadCloudPrefs(current,epoch);
 }
}
function checkRollover(){
 const now=dayKey(),currentZone=new Date().getTimezoneOffset();
 if(now===lastDate&&currentZone===zone)return;
 const was=lastDate;
 lastDate=now;zone=currentZone;
 try{if(typeof render==="function")render();}catch(err){console.warn("QUEST DAY midnight rerender",err);}
 window.dispatchEvent(new CustomEvent("qd:day-rollover",{detail:{previous:was,current:now}}));
 queueNativeSync(true);
}
function armMidnight(){
 if(midnightTimer)clearTimeout(midnightTimer);
 const now=new Date();
 const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1);
 midnightTimer=setTimeout(()=>{checkRollover();armMidnight();},
  Math.max(1000,Math.min(next.getTime()-now.getTime(),2**31-1)));
}
function onWake(){checkRollover();armMidnight();updateUser();queueNativeSync();}
function start(){
 mount();
 // Use the same local calendar date as QUEST DAY; no deletes or reset calls.
 armMidnight();
 setInterval(checkRollover,30000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)onWake();});
 window.addEventListener("pageshow",onWake);
 window.addEventListener("focus",onWake);
 window.addEventListener("online",()=>{updateUser();queueNativeSync();});
 window.addEventListener("qd:realtime-ready",updateUser);
 window.addEventListener("qd:realtime-stopped",()=>{stopFriends();updateUser();});
 window.addEventListener("storage",e=>{
  if(e.key===STORE+userId){prefs=readPrefs(userId);renderSettings();subscribeFriends();queueNativeSync(true);}
  if(e.key==="quest-day-mvp-v1")queueNativeSync();
 });
 try{
  if(typeof saveState==="function"){
   const previous=saveState;
   saveState=function(){const answer=previous.apply(this,arguments);queueNativeSync();return answer;};
  }
 }catch(err){console.warn("QUEST DAY notification state listener",err);}
 if(plugin){
  checkPermission().then(async()=>{
   if(!localStorage.getItem(PERMISSION_ASKED)){
    localStorage.setItem(PERMISSION_ASKED,"yes");
    await requestNativePermission();
    if(permission!=="granted"){
     prefs.morning=false;prefs.evening=false;prefs.friends=false;
     writeLocal();renderSettings();
    }
   }
   queueNativeSync(true);
  });
  plugin.addListener?.("localNotificationActionPerformed",event=>{
   const type=event?.notification?.extra?.qd_kind;
   document.querySelector('nav button[data-page="'+(type==="friends"?"growth":"home")+'"]')?.click();
  });
 }
 updateUser();
 // Delay initial Realtime hookup until existing auth bootstrap can complete.
 setTimeout(updateUser,1200);
}
window.QuestDayNotifications=Object.freeze({
 get settings(){return {...prefs};},
 get permission(){return permission;},
 get account(){return userId;},
 isFriendEnabled:()=>prefs.friends,
 refresh:()=>{checkRollover();queueNativeSync(true);updateUser();},
 countIncomplete,dayKey,proposedNotifications
});
start();
})();