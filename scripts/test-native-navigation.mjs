// Native navigation regression tests without altering game or Supabase data.
// Runs in Node with a minimal mock WebView/Capacitor bridge.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../upgrade-2.2-native.js",import.meta.url),"utf8");
function start(native=true){
 const classNames=new Set();
 const activePage={dataset:{page:"growth"}};
 let closeCount=0,homeCount=0,minimized=0,backCallback=null;
 const keyboardEvents={};
 let activeOverlay=null;
 const button={disabled:false,click(){closeCount++;activeOverlay=null}};
 const home={dataset:{page:"home"},click(){homeCount++;activePage.dataset.page="home"}};
 const entry={hidden:true,querySelector(){return null}};
 const ids={
  cdxDetailMask:{classList:{contains:(name)=>name==="open"&&activeOverlay==="codex"},querySelector:()=>button},
  qd14EditOverlay:{classList:{contains:(name)=>name==="open"&&activeOverlay==="edit"},querySelector:()=>button},
  chCharacterModal:{classList:{contains:(name)=>name==="open"&&activeOverlay==="character"},querySelector:()=>button},
  modal:{classList:{contains:(name)=>name==="show"&&activeOverlay==="task"}},
  qd20Entry:entry,
  cancelBtn:button
 };
 const document={
  documentElement:{classList:{add:v=>classNames.add(v),contains:v=>classNames.has(v),toggle:(v,on)=>on?classNames.add(v):classNames.delete(v)}},
  createElement:()=>({id:"",textContent:""}),
  head:{appendChild(){}},
  querySelector(sel){
   if(sel===".qd-delete-shade:not([hidden])"&&activeOverlay==="delete")
     return {querySelector:()=>button};
   if(sel==='nav button[data-page].active')return {dataset:activePage.dataset};
   if(sel==='nav button[data-page="home"]')return home;
   return null;
  },
  querySelectorAll(sel){
   if(sel===".qd14-overlay.open"&&activeOverlay==="evolution")
     return [{querySelector:()=>button}];
   return [];
  },
  getElementById(id){return ids[id]||null},
  activeElement:{matches:()=>false},
  addEventListener(){},
 };
 const app={
  addListener(name,fn){if(name==="backButton")backCallback=fn;return Promise.resolve({remove(){}})},
  minimizeApp(){minimized++;return Promise.resolve()}
 };
 const keyboard={addListener(name,fn){keyboardEvents[name]=fn;return Promise.resolve({remove(){}})}};
 const window={
  Capacitor:{isNativePlatform:()=>native,Plugins:{App:app,Keyboard:keyboard}},
  visualViewport:{height:740,addEventListener(){}},
  innerHeight:850
 };
 runInNewContext(source,{window,document,console,setTimeout});
 return {
  document,window,keyboardEvents,back:()=>backCallback?.(),
  setOverlay:v=>{activeOverlay=v},
  setPage:v=>{activePage.dataset.page=v},
  get count(){return {closed:closeCount,home:homeCount,minimized}},
  get classNames(){return classNames},
  get backEnabled(){return typeof backCallback==="function"}
 };
}
const app=start();
assert(app.backEnabled,"Native App plugin listener must register");
assert(app.classNames.has("qd-native-app"),"Safe-area class must apply");
app.setOverlay("codex");app.back();
assert.equal(app.count.closed,1,"Back should close codex detail");
assert.equal(app.count.home,0,"Overlay back must not switch tabs");
app.setOverlay("edit");app.back();
assert.equal(app.count.closed,2,"Back should close edit dialog");
app.setOverlay("task");app.back();
assert.equal(app.count.closed,3,"Back should close quest dialog");
app.setOverlay("delete");app.back();
assert.equal(app.count.closed,4,"Back should click deletion cancel");
app.setOverlay("evolution");app.back();
assert.equal(app.count.closed,5,"Back should close evolution celebration");
app.setPage("growth");app.back();
assert.equal(app.count.home,1,"Back in subpage must go home");
app.back();
assert.equal(app.count.minimized,1,"Back at home must minimize app, not reset data");
app.keyboardEvents.keyboardDidShow?.();
assert(app.classNames.has("qd-keyboard-open"),"Keyboard show should hide nav");
app.keyboardEvents.keyboardDidHide?.();
assert(!app.classNames.has("qd-keyboard-open"),"Keyboard hide should restore nav");
const web=start(false);
assert(!web.backEnabled,"PWA must not install native back listener");
console.log("PASS: Android navigation priority, non-destructive home, native keyboard, and web separation");
