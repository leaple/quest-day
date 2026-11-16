import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script=readFileSync(new URL("../upgrade-2.4-ui.js",import.meta.url),"utf8");
const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
assert.match(index,/upgrade-2\.4-ui\.js\?v=20261116-1/);
assert.match(sw,/upgrade-2\.4-ui\.js\?v=20261116-1/);
assert.match(sw,/quest-day-cache-v65/);
const saved=new Map();
const classes=new Set();
const root={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},dataset:{}};
const meta={setAttribute:(name,value)=>{meta[name]=value;}};
const style={textContent:"",id:""};
const section={className:"",id:"",innerHTML:"",querySelectorAll:()=>[],querySelector:()=>null,prepend:()=>{}};
const settings={querySelector:()=>null,prepend:()=>{}};
const listeners={};
const media={
 "(prefers-color-scheme: dark)":{matches:false,addEventListener:(event,fn)=>{listeners.dark=fn;}},
 "(prefers-reduced-motion: reduce)":{matches:false,addEventListener:(event,fn)=>{listeners.motion=fn;}}
};
const context={
 window:{matchMedia:q=>media[q],Capacitor:{isNativePlatform:()=>false}},
 navigator:{},
 localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
 document:{
   documentElement:root,readyState:"complete",
   createElement:tag=>tag==="style"?style:section,
   head:{appendChild:()=>{}},
   getElementById:id=>id==="settings"?settings:null,
   querySelector:()=>meta,
   addEventListener:()=>{}
 },
 console
};
context.window.window=context.window;
vm.runInNewContext(script,context);
assert.equal(context.window.QuestDayUI.version,"2.4");
assert.equal(root.dataset.qdTheme,"light");
assert.match(style.textContent,/\.cdx-card/);
assert.match(style.textContent,/\.qd20-card/);
assert.match(style.textContent,/\.fr-panel/);
assert.match(style.textContent,/\.ch-card/);
assert.match(style.textContent,/qd24-reduced/);
media["(prefers-color-scheme: dark)"].matches=true;
listeners.dark();
assert.equal(root.dataset.qdTheme,"dark");
assert.equal(meta.content,"#141624");
assert.equal(saved.size,0,"UI initialization must not modify game or cloud storage");
console.log("QUEST DAY UI 2.4: assets, cross-screen styles, system theme, and storage isolation OK");
