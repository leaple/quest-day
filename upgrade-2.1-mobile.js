/* QUEST DAY 2.1 — responsive presentation and accessibility.
 * No changes to quests, storage, Supabase or account state. */
(function(){
"use strict";
if(document.getElementById("qd21MobileStyle"))return;
const style=document.createElement("style");
style.id="qd21MobileStyle";
style.textContent=[
":root{--qd21-nav-space:112px}",
"html{scroll-padding-bottom:calc(var(--qd21-nav-space) + env(safe-area-inset-bottom));-webkit-text-size-adjust:100%}",
"body{overflow-x:hidden}",
".app{width:100%;max-width:760px;padding:18px clamp(12px,3.8vw,20px) calc(var(--qd21-nav-space) + env(safe-area-inset-bottom))}",
".app>header{margin-bottom:18px;min-height:46px}",
".app .brand{letter-spacing:.5px;font-size:15px}",
".app .hero{padding:clamp(18px,5vw,27px);border-radius:22px;box-shadow:0 12px 28px #20204717}",
".app .hero h1{font-size:clamp(23px,6vw,30px);line-height:1.23;overflow-wrap:anywhere}",
".stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}",
".stat{min-width:0;padding:13px 10px}.stat strong{font-size:clamp(17px,5vw,21px);overflow-wrap:anywhere}",
".quest-list{gap:11px}.quest{min-width:0;min-height:72px;padding:12px;gap:9px}",
".quest-info{min-width:0}.quest-name{line-height:1.4}",
".quest .check{width:44px;height:44px;min-width:44px;display:grid;place-items:center;border-radius:13px;font-size:17px;touch-action:manipulation}",
".quest .delete{min-width:40px;min-height:44px;display:grid;place-items:center;border-radius:11px;touch-action:manipulation}",
".primary,.secondary,.filter,.setting-btn,.qd14-edit,.qd14-arrow,.ch-btn,.ch-tab,.rpg-action,.rpg-period,.fr-btn,.s17-btn{min-height:44px;touch-action:manipulation}",
".filter-row{flex-wrap:wrap}.filter{padding:10px 15px}",
"nav{position:fixed;z-index:80;bottom:0;left:0;right:0;width:100%;max-width:760px;margin:0 auto;display:flex;justify-content:space-between;align-items:stretch;overflow-x:visible;gap:5px;padding:8px 9px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid #e7e5f3;box-shadow:0 -8px 28px #30295b12;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}",
"nav button{flex:1 1 0;min-width:0;min-height:58px;padding:7px 2px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:13px;background:transparent;color:#84869f;font-size:11px;font-weight:750;line-height:1.2;white-space:nowrap;touch-action:manipulation;transition:background .18s,color .18s}",
"nav button b{font-size:21px;line-height:1.1;font-weight:850}",
"nav button.active{background:#edeaff;color:#5545bb}",
"nav button:focus-visible,button:focus-visible{outline:3px solid #a692ff;outline-offset:2px}",
"nav button:active,.primary:active,.ch-btn:active,.fr-btn:active{transform:scale(.975)}",
".modal{z-index:100;overflow-y:auto;overscroll-behavior:contain;align-items:flex-end;padding:12px 12px calc(12px + env(safe-area-inset-bottom))}",
".modal .dialog{width:100%;max-width:500px;max-height:min(88dvh,760px);overflow-y:auto;overscroll-behavior:contain;border-radius:25px 25px 18px 18px;padding:21px 19px;background:#fff;box-shadow:0 22px 50px #11163233}",
".dialog input,.dialog select{font-size:16px;min-height:46px}.dialog .actions button{min-height:48px}",
".qd14-overlay{padding:12px 10px calc(12px + env(safe-area-inset-bottom))}",
".qd14-dialog{max-height:87dvh;overscroll-behavior:contain}",
".ch-card,.rpg-item,.fr-panel,.s17-wrap,.qd14-card{min-width:0}",
"@media(max-width:390px){.app{padding-left:11px;padding-right:11px}.quest{gap:7px;padding:10px}.quest .reward{padding:6px;font-size:10px}.section-title{gap:7px;flex-wrap:wrap}.section-title h2{font-size:17px}nav{gap:2px;padding-left:4px;padding-right:4px}nav button{font-size:10px;min-width:0;flex:1 1 0}nav button b{font-size:20px}.dialog .actions{gap:8px}}",
"@media(min-width:700px){.app{padding-bottom:46px}nav{width:min(100% - 24px,580px);border:1px solid #e6e4f1;border-bottom:0;border-radius:19px 19px 0 0;padding-left:15px;padding-right:15px}.modal{align-items:center}.modal .dialog{border-radius:24px}}",
"@media(prefers-reduced-motion:reduce){nav button,.app .progress div{transition:none!important}nav button:active{transform:none}}"
].join("");
document.head.appendChild(style);
const nav=document.querySelector("nav");
if(nav){
 nav.setAttribute("aria-label","주요 화면 이동");
 const syncTabs=()=>{
  for(const button of nav.querySelectorAll("button[data-page]")){
   button.type="button";
   const label=button.textContent.trim();
   button.setAttribute("aria-label",label||button.dataset.page);
   if(button.classList.contains("active"))button.setAttribute("aria-current","page");
   else button.removeAttribute("aria-current");
  }
 };
 syncTabs();
 if(typeof MutationObserver!=="undefined")
  new MutationObserver(syncTabs).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
 nav.addEventListener("click",syncTabs);
}
const modal=document.getElementById("modal");
if(modal){
 modal.setAttribute("role","dialog");
 modal.setAttribute("aria-modal","true");
 modal.setAttribute("aria-labelledby","qd21ModalTitle");
 const title=modal.querySelector(".dialog h2");
 if(title)title.id="qd21ModalTitle";
 let previousFocus=null,wasOpen=modal.classList.contains("show");
 const syncModal=()=>{
  const isOpen=modal.classList.contains("show");
  if(isOpen===wasOpen)return;
  wasOpen=isOpen;
  if(isOpen){
   previousFocus=document.activeElement;
   document.getElementById("taskName")?.focus({preventScroll:true});
  }else if(previousFocus?.isConnected&&previousFocus.focus){
   previousFocus.focus({preventScroll:true});
   previousFocus=null;
  }
 };
 if(typeof MutationObserver!=="undefined")
  new MutationObserver(syncModal).observe(modal,{attributes:true,attributeFilter:["class"]});
 modal.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&modal.classList.contains("show")){
   event.preventDefault();modal.classList.remove("show");
  }
 });
}
window.QuestDayMobile={version:"2.1"};
})();