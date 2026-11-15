/* QUEST DAY 2.3 notification logic: automated regression without deleting game data. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const code=readFileSync(new URL("../upgrade-2.3-notifications.js",import.meta.url),"utf8");
const timers=[];
let clock=Date.parse("2026-11-15T18:00:00Z");
class ClockDate extends Date {
 constructor(...args){if(args.length===0)super(clock);else super(...args);}
 static now(){return clock;}
}
const dayKey=date=>{
 const d=date||new ClockDate();
 return String(d.getFullYear())+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};
const memory=new Map();
const localStorage={
 getItem:k=>memory.has(k)?memory.get(k):null,
 setItem:(k,v)=>memory.set(k,String(v)),
 removeItem:k=>memory.delete(k)
};
const scheduled=new Map();
let schedulingCalls=0,renderCalls=0,currentId="user-alpha";
const plugin={
 async checkPermissions(){return {display:"granted"};},
 async requestPermissions(){return {display:"granted"};},
 async getPending(){return {notifications:[...scheduled.values()]};},
 async cancel({notifications}){for(const n of notifications)scheduled.delete(n.id);},
 async schedule({notifications}){
  schedulingCalls++;
  for(const n of notifications)scheduled.set(n.id,n);
  return {notifications};
 },
 async addListener(){return {remove(){}};}
};
const channels=[];
const client={
 from(table){
  assert.equal(table,"qd_notification_prefs");
  return {
   select(){return this;},
   eq(){return this;},
   async maybeSingle(){return {data:null,error:null};},
   async upsert(){return {error:null};}
  };
 },
 channel(name){
  const handlers={};
  const channel={
   handlers,name,
   on(_,config,handler){handlers[config.table]=handler;return this;},
   subscribe(){return this;}
  };
  channels.push(channel);
  return channel;
 },
 async removeChannel(){return "ok";}
};
const bridge={
 getClient:()=>client,
 getUser:()=>({id:currentId,is_anonymous:true})
};
const windowListeners={};
const documentListeners={};
const document={
 documentElement:{},
 getElementById:()=>null,
 querySelector:()=>null,
 createElement:()=>({className:"",textContent:"",remove(){}}),
 head:{appendChild(){}},
 body:{appendChild(){}},
 visibilityState:"visible",
 addEventListener:(n,f)=>{documentListeners[n]=f;}
};
const window={
 Capacitor:{isNativePlatform:()=>true,Plugins:{LocalNotifications:plugin}},
 QuestDayRealtime:bridge,
 addEventListener:(n,f)=>{windowListeners[n]=f;},
 dispatchEvent(event){windowListeners[event.type]?.(event);}
};
const state={tasks:[{id:"task-daily",name:"test only",frequency:"daily",xp:20}],events:[]};
const context={
 window,document,localStorage,Date:ClockDate,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
 dateKey:dayKey,state,
 render(){renderCalls++;},
 saveState(){},
 setInterval(){return 1;},
 setTimeout(fn,ms){return setTimeout(fn,ms);},
 clearTimeout,console
};
runInNewContext(code,context);
const notify=window.QuestDayNotifications;
assert(notify,"Notification service must register");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await sleep(550);
assert.equal(notify.account,"user-alpha");
assert.equal(notify.settings.morning,true);
assert.equal(notify.settings.evening,true);
assert.equal(notify.settings.friends,true);
assert(scheduled.has(922001),"09:00 daily reminder must be scheduled");
assert(scheduled.has(922100),"21:00 unfinished reminder must be scheduled");
assert.deepEqual(scheduled.get(922001).schedule.on,{hour:9,minute:0},"morning schedule should be 09:00");
assert.equal(scheduled.get(922100).schedule.at.getHours(),21,"evening schedule should be 21:00");
console.log("PASS: Morning 09:00 and unfinished 21:00 local schedules");

const initialCount=schedulingCalls;
notify.refresh();
await sleep(550);
assert(schedulingCalls<=initialCount+1,"Repeated refresh must not duplicate scheduling");
console.log("PASS: Fixed scheduling identifiers deduplicate refresh");

state.events.push({id:"test-event",taskId:"task-daily",day:"2026-11-15",xp:20});
context.saveState();
await sleep(550);
assert(!scheduled.has(922100),"Completing today must cancel today's 21:00 reminder");
assert(scheduled.has(922101),"Tomorrow's recurring task should remain scheduled");
console.log("PASS: Today completed -> cancel today's alert without losing future reminders");

const before=renderCalls;
clock=Date.parse("2026-11-16T00:00:03Z");
notify.refresh();
assert.equal(renderCalls,before+1,"Midnight must refresh visible dashboard");
assert.equal(notify.countIncomplete(new ClockDate()),1,"Daily task must be incomplete on a new day");
assert.equal(state.events.length,1,"Old completion history must remain untouched");
console.log("PASS: Local midnight rollover refreshes but preserves historical events");

const channel=channels.find(c=>c.name==="qd-alarms-user-alpha");
assert(channel&&channel.handlers.qd_messages,"Per-user realtime channel must exist");
const event={new:{id:"new-message-1",recipient_id:"user-alpha",sender_id:"friend-one"}};
channel.handlers.qd_messages(event);
channel.handlers.qd_messages(event);
await sleep(20);
const ledger=JSON.parse(memory.get("qd-notify-seen-v1:user-alpha"));
assert.equal(ledger.length,1,"Realtime repeated event must not double notify");
console.log("PASS: Friend event deduplication");

memory.set("qd-notify-prefs-v1:user-beta",JSON.stringify({
 morning:false,evening:false,friends:false,updated_at:"2026-11-15T12:00:00Z"
}));
currentId="user-beta";
windowListeners["qd:realtime-ready"]?.();
await sleep(550);
assert.equal(notify.account,"user-beta","Auth switch should isolate account settings");
assert.equal(notify.settings.morning,false,"Account B must get its own morning preference");
assert.equal(notify.settings.friends,false,"Account B must get its own friend preference");
assert(!scheduled.has(922001),"Switch to account with disabled morning should cancel alarm");
assert(!scheduled.has(922101),"Switch to account with disabled evening should cancel alarm");
console.log("PASS: Per-account preferences and cancellation on identity switch");

console.log("RESULT: QUEST DAY notifications regression tests passed");
