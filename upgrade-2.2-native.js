/* QUEST DAY 2.2: native-only device navigation and keyboard quality of life.
 * Changes presentation and navigation only. NEVER touches local/cloud game data.
 * Capacitor plugins are installed/synced in package.json; static web needs no bundler.
 */
(function(){
 "use strict";
 const cap=window.Capacitor;
 if(!cap?.isNativePlatform?.())return;

 document.documentElement.classList.add("qd-native-app");
 const style=document.createElement("style");
 style.id="qd22NativeStyle";
 style.textContent=[
  "html.qd-native-app{overscroll-behavior-y:none}",
  "html.qd-native-app .app{padding-top:max(18px,env(safe-area-inset-top))}",
  "html.qd-native-app.qd-keyboard-open nav{transform:translateY(120%);pointer-events:none;visibility:hidden}",
  "html.qd-native-app.qd-keyboard-open .app{padding-bottom:24px}",
  "html.qd-native-app .dialog,html.qd-native-app .qd14-dialog,html.qd-native-app .qd-delete-box{scroll-padding-bottom:32px}",
  "html.qd-native-app .modal,html.qd-native-app .qd14-overlay,html.qd-native-app .cdx-detail-mask{overscroll-behavior:contain}",
  "@media(prefers-reduced-motion:no-preference){html.qd-native-app nav{transition:transform .17s ease}}"
 ].join("");
 document.head.appendChild(style);

 const root=document.documentElement;
 const visible=id=>{const node=document.getElementById(id);return node&&node.classList.contains("open")?node:null;};
 // Order from highest z-index/modal priority to lowest. Do not dismiss a busy
 // deletion dialog: its Cancel button is disabled until the server replies.
 function closeTopLayer(){
  const deletion=document.querySelector(".qd-delete-shade:not([hidden])");
  if(deletion){
   const cancel=deletion.querySelector('[data-qd-delete="cancel"]');
   if(cancel&&!cancel.disabled)cancel.click();
   return true;
  }
  const entry=document.getElementById("qd20Entry");
  if(entry&&!entry.hidden){
   // First-run onboarding cannot be dismissed without a choice.
   const close=entry.querySelector('[data-qd20="close"]');
   if(close&&!close.disabled)close.click();
   return true;
  }
  const codex=visible("cdxDetailMask");
  if(codex){
   codex.querySelector("[data-cdx-close]")?.click();
   return true;
  }
  // The evolution celebration overlay has no ID; its close button distinguishes it.
  const evolution=[...document.querySelectorAll(".qd14-overlay.open")].find(el=>el.querySelector("[data-qd14-evo-close]"));
  if(evolution){
   evolution.querySelector("[data-qd14-evo-close]")?.click();
   return true;
  }
  const edit=visible("qd14EditOverlay");
  if(edit){
   edit.querySelector("#qd14Cancel")?.click();
   return true;
  }
  const character=visible("chCharacterModal");
  if(character){
   character.querySelector("[data-ch-close]")?.click();
   return true;
  }
  const task=document.getElementById("modal");
  if(task?.classList.contains("show")){
   document.getElementById("cancelBtn")?.click();
   return true;
  }
  const active=document.activeElement;
  if(active?.matches?.("input,textarea,select,[contenteditable=true]")){
   active.blur();
   return true;
  }
  return false;
 }
 function handleBack(app){
  if(closeTopLayer())return;
  const selected=document.querySelector('nav button[data-page].active');
  if(selected?.dataset.page!=="home"){
   document.querySelector('nav button[data-page="home"]')?.click();
   return;
  }
  // Android Home/back behaviour: put the app in the background, do not
  // force-kill it and do not reset storage or the current Supabase session.
  if(typeof app.minimizeApp==="function"){
   Promise.resolve(app.minimizeApp()).catch(err=>console.warn("Could not minimize app",err));
  }
 }
 const app=cap.Plugins?.App;
 if(app?.addListener){
  Promise.resolve(app.addListener("backButton",()=>handleBack(app)))
   .catch(err=>console.warn("QUEST DAY native back listener unavailable",err));
 }else{
  console.warn("QUEST DAY native App plugin unavailable; Android default back handling applies");
 }

 // WebView keyboard events are more reliable than viewport height alone.
 const keyboard=cap.Plugins?.Keyboard;
 function scrollFocused(){
  const element=document.activeElement;
  if(!element?.matches?.("input,textarea,select,[contenteditable=true]"))return;
  // Scroll the nearest modal/scroller instead of scrolling the background page.
  setTimeout(()=>{
   if(document.activeElement===element){
    element.scrollIntoView?.({block:"nearest",inline:"nearest",behavior:"smooth"});
   }
  },120);
 }
 function toggleKeyboard(visible){
  root.classList.toggle("qd-keyboard-open",visible);
  if(visible)scrollFocused();
 }
 if(keyboard?.addListener){
  for(const name of ["keyboardWillShow","keyboardDidShow"]){
   Promise.resolve(keyboard.addListener(name,()=>toggleKeyboard(true)))
    .catch(err=>console.warn("Keyboard show listener unavailable",err));
  }
  for(const name of ["keyboardWillHide","keyboardDidHide"]){
   Promise.resolve(keyboard.addListener(name,()=>toggleKeyboard(false)))
    .catch(err=>console.warn("Keyboard hide listener unavailable",err));
  }
 }
 // A conservative fallback on platforms where the event isn't delivered.
 const viewport=window.visualViewport;
 if(viewport&&!keyboard?.addListener){
  viewport.addEventListener("resize",()=>{
   const focused=document.activeElement;
   const editing=focused?.matches?.("input,textarea,select,[contenteditable=true]");
   const shrunk=viewport.height < window.innerHeight*0.72;
   toggleKeyboard(!!(editing&&shrunk));
  });
 }
 document.addEventListener("focusin",()=>{if(root.classList.contains("qd-keyboard-open"))scrollFocused();});
 window.QuestDayNative=Object.freeze({version:"2.2",navigation:"Android back/keyboard"});
})();
