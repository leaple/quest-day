/* QUEST DAY 2.4 — unified mobile presentation & accessible preferences.
   Does not read/write game state, authentication, cloud saves, or quest history. */
(function(){
  "use strict";
  const KEY="qd-ui-preferences-v1";
  const defaults={theme:"system",density:"comfortable",motion:"system",haptics:false};
  let prefs={...defaults};
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||"{}");
    if(saved&&typeof saved==="object"){
      for(const [k,allowed] of Object.entries({theme:["system","light","dark"],density:["comfortable","compact"],motion:["system","full","reduced"]})){
        if(allowed.includes(saved[k]))prefs[k]=saved[k];
      }
      prefs.haptics=saved.haptics===true;
    }
  }catch(_){}
  const root=document.documentElement;
  const systemDark=window.matchMedia?.("(prefers-color-scheme: dark)");
  const systemReduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
  function apply(){
    const dark=prefs.theme==="dark"||(prefs.theme==="system"&&systemDark?.matches);
    const reduced=prefs.motion==="reduced"||(prefs.motion==="system"&&systemReduced?.matches);
    root.classList.toggle("qd24-dark",!!dark);
    root.classList.toggle("qd24-reduced",!!reduced);
    root.classList.toggle("qd24-compact",prefs.density==="compact");
    root.dataset.qdTheme=dark?"dark":"light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark?"#141624":"#f5f6fb");
  }
  function set(key,value){
    prefs[key]=value;
    try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}
    apply();
  }
  apply();
  systemDark?.addEventListener?.("change",apply);
  systemReduced?.addEventListener?.("change",apply);
  const css=document.createElement("style");
  css.id="qd24-design-system";
  css.textContent=`
    :root{color-scheme:light;--bg:#f5f6fb;--ink:#22243c;--muted:#74798f;--purple:#6d5ce7;--line:#e5e7f0;--qd-surface:#fff;--qd-soft:#f1f0fd;--qd-shadow:0 9px 32px rgba(26,29,66,.055)}
    html.qd24-dark{color-scheme:dark;--bg:#10121c;--ink:#f2f2fb;--muted:#a6abc0;--purple:#a59aff;--line:#303449;--qd-surface:#1b1e2c;--qd-soft:#28263f;--qd-shadow:0 9px 32px rgba(0,0,0,.2)}
    html,body{background:var(--bg);color:var(--ink);-webkit-tap-highlight-color:transparent}
    html{scroll-behavior:smooth}
    body{overscroll-behavior-y:contain}
    .app{padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right));padding-bottom:calc(106px + env(safe-area-inset-bottom))}
    header{margin-bottom:18px}.brand{letter-spacing:.045em}.logo{box-shadow:0 6px 18px rgba(109,92,231,.22)}
    .stat,.card,.quest,.empty,.dialog{background:var(--qd-surface);color:var(--ink);border-color:var(--line);box-shadow:var(--qd-shadow)}
    .stat,.card,.quest{border-radius:19px}
    .hero{background:linear-gradient(135deg,#252847,#51448d);box-shadow:0 12px 30px rgba(34,32,82,.15)}
    .quest{min-height:66px;transition:background-color .2s ease,border-color .2s ease,transform .2s ease}
    .quest:active{transform:scale(.992)}
    .quest-name{font-size:14px;line-height:1.45}
    .quest-meta,.note,.stat span{color:var(--muted)}
    .filter-row{overflow-x:auto;scrollbar-width:none;padding-bottom:3px}.filter-row::-webkit-scrollbar{display:none}
    .filter{white-space:nowrap;background:var(--qd-surface);color:var(--muted);border:1px solid var(--line);min-height:40px}
    .filter.active{background:var(--qd-soft);color:var(--purple);border-color:transparent}
    .primary{background:var(--purple);color:#fff}
    .secondary,.setting-btn{background:var(--qd-soft);color:var(--ink)}
    button{touch-action:manipulation;transition:transform .16s ease,background-color .18s ease,opacity .18s ease}
    button:active{transform:scale(.965)}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--purple);outline-offset:3px}
    .check{width:40px;height:40px;border-radius:13px;background:var(--qd-surface);border-color:var(--line)}
    .delete{min-width:40px;min-height:44px;color:var(--muted)}
    .reward{background:var(--qd-soft);color:var(--purple)}
    nav{z-index:15;max-width:760px;margin:auto;background:var(--qd-surface);border:1px solid var(--line);border-bottom:0;box-shadow:0 -8px 26px rgba(0,0,0,.04);padding:9px 8px calc(9px + env(safe-area-inset-bottom))}
    nav button{min-width:56px;min-height:48px;border-radius:14px;color:var(--muted);padding:4px 8px}
    nav button.active{color:var(--purple);background:var(--qd-soft)}
    .modal{background:rgba(8,10,24,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
    .dialog{max-height:calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow:auto}
    .dialog input,.dialog select{background:var(--bg);color:var(--ink);border-color:var(--line);min-height:46px}
    .page.active{animation:qd24-page-in .24s cubic-bezier(.2,.8,.2,1) both}
    .modal.show .dialog{animation:qd24-dialog-in .22s cubic-bezier(.2,.8,.2,1) both}
    @keyframes qd24-page-in{from{opacity:.45;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes qd24-dialog-in{from{opacity:.5;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
    .qd24-preferences{margin-top:16px}.qd24-setting-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--line)}
    .qd24-setting-row:last-child{border-bottom:0}.qd24-setting-row strong{font-size:14px}.qd24-setting-row p{margin:5px 0 0;font-size:12px;color:var(--muted);line-height:1.45}
    .qd24-setting-row select{max-width:150px;min-width:112px;min-height:44px;padding:8px 9px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink)}
    .qd24-setting-row input[type=checkbox]{width:22px;height:22px;accent-color:var(--purple)}
    html.qd24-compact .quest{min-height:54px;padding:10px 12px;gap:9px}
    html.qd24-compact .card{padding:14px}html.qd24-compact .stat{padding:10px}
    html.qd24-compact .quest-list{gap:7px}
    html.qd24-dark .avatar{background:#302b4d}
    html.qd24-dark .qd21-quest-kicker{background:var(--qd-soft);color:var(--purple)}
    html.qd24-dark .qd21-progress-after{border-color:var(--line)}
    html.qd24-dark .qd21-quest-first #addBtn{box-shadow:none}
    html.qd24-dark .quest.done .quest-name{color:var(--muted)}
    html.qd24-dark a{color:#b9b2ff}
    @media(max-width:430px){.qd24-setting-row{gap:8px}.qd24-setting-row select{max-width:130px}.stats{gap:7px}}
    @media(min-width:700px){.app{padding-bottom:40px}nav{max-width:360px;border-radius:20px 20px 0 0}}
    @media(prefers-reduced-motion:reduce){html:not(.qd24-force-motion) *,html:not(.qd24-force-motion) *::before,html:not(.qd24-force-motion) *::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
    html.qd24-reduced *,html.qd24-reduced *::before,html.qd24-reduced *::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
  `;
  document.head.appendChild(css);
  function mount(){
    const settings=document.getElementById("settings");
    if(!settings||document.getElementById("qd24Preferences"))return;
    const section=document.createElement("section");
    section.className="card qd24-preferences";
    section.id="qd24Preferences";
    section.innerHTML='<h2>화면 및 조작</h2><p class="note">이 기기에서만 적용되는 화면 설정입니다.</p>'+
      '<div class="qd24-setting-row"><div><strong>화면 테마</strong><p>시스템 설정에 맞추거나 직접 선택</p></div><select data-qd24="theme" aria-label="화면 테마"><option value="system">시스템</option><option value="light">라이트</option><option value="dark">다크</option></select></div>'+
      '<div class="qd24-setting-row"><div><strong>화면 간격</strong><p>넓고 편안하게 또는 한 화면에 더 많이</p></div><select data-qd24="density" aria-label="화면 간격"><option value="comfortable">편안하게</option><option value="compact">간결하게</option></select></div>'+
      '<div class="qd24-setting-row"><div><strong>화면 전환 효과</strong><p>움직임을 줄여 멀미와 불편함 방지</p></div><select data-qd24="motion" aria-label="화면 전환 효과"><option value="system">시스템</option><option value="full">부드럽게</option><option value="reduced">최소화</option></select></div>'+
      '<div class="qd24-setting-row"><div><strong>터치 진동</strong><p>지원하는 Android 기기에서 짧게 진동</p></div><input data-qd24="haptics" type="checkbox" aria-label="터치 진동"></div>';
    const title=settings.querySelector("h2");
    if(title)title.insertAdjacentElement("afterend",section);else settings.prepend(section);
    for(const input of section.querySelectorAll("[data-qd24]")){
      const key=input.dataset.qd24;
      if(input.type==="checkbox")input.checked=prefs[key];else input.value=prefs[key];
      input.addEventListener("change",()=>set(key,input.type==="checkbox"?input.checked:input.value));
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
  document.addEventListener("click",event=>{
    if(!prefs.haptics||!navigator.vibrate||!window.Capacitor?.isNativePlatform?.())return;
    if(event.target.closest("button")&&!event.target.closest("[disabled]"))navigator.vibrate(8);
  },{passive:true});
  window.QuestDayUI=Object.freeze({version:"2.4",getPreferences:()=>({...prefs})});
})();
