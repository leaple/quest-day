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
    /* 2.4 extended surfaces: codex, characters, friends, account, calendar */
    .ch-page,.fr-page,.cdx-shell,.qd14-calendar{color:var(--ink)}
    .ch-card,.ch-dialog,.ch-growth-panel,.ch-hero,.fr-panel,.fr-list-row,.cdx-card,.cdx-header,.cdx-detail,.qd14-dialog,.qd14-card,.qd20-card,.qd20-shell{border-radius:20px!important}
    .ch-card,.ch-dialog,.ch-growth-panel,.fr-panel,.fr-list-row,.cdx-card,.cdx-detail,.qd14-dialog,.qd14-card,.qd20-card{box-shadow:var(--qd-shadow)}
    .ch-tab,.cdx-filter,.cdx-stage-tab,.qd14-arrow,.fr-page button,.ch-page button,.cdx-shell button,.qd20-entry button{touch-action:manipulation;min-height:40px}
    .ch-tab,.cdx-filter,.cdx-stage-tab{border-radius:12px!important}
    .cdx-grid,.ch-grid{gap:12px}
    .cdx-card,.ch-card{overflow:hidden}
    .ch-dialog,.cdx-detail,.qd14-dialog,.qd20-card{max-height:calc(100dvh - 36px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain}
    .qd14-overlay.open .qd14-dialog,.cdx-detail-mask.open .cdx-detail,.ch-modal.open .ch-dialog{animation:qd24-dialog-in .22s cubic-bezier(.2,.8,.2,1) both}
    .qd14-overlay,.cdx-detail-mask,.ch-modal{overscroll-behavior:contain}
    .fr-page input,.fr-page textarea,.qd20-entry input,.ch-page input,.cdx-shell input{min-height:44px;font-size:16px;max-width:100%}
    html.qd24-dark .ch-hero{background:linear-gradient(130deg,#2a2745,#211f35)!important;border-color:var(--line)!important}
    html.qd24-dark .ch-hero-copy h3,html.qd24-dark .cdx-header h2{color:var(--ink)!important}
    html.qd24-dark .ch-hero-copy p,html.qd24-dark .cdx-sub{color:var(--muted)!important}
    html.qd24-dark .ch-hero-footer{background:#26253b!important}
    html.qd24-dark .ch-card,html.qd24-dark .ch-dialog,html.qd24-dark .ch-growth-panel,
    html.qd24-dark .fr-panel,html.qd24-dark .fr-list-row,html.qd24-dark .cdx-card,
    html.qd24-dark .cdx-detail,html.qd24-dark .qd14-dialog,html.qd24-dark .qd14-card,
    html.qd24-dark .qd20-card,html.qd24-dark .qd20-shell{background:var(--qd-surface)!important;color:var(--ink)!important;border-color:var(--line)!important}
    html.qd24-dark .cdx-header{background:linear-gradient(130deg,#2c2845,#1b1e2c)!important;border-color:var(--line)!important}
    html.qd24-dark .cdx-shell,html.qd24-dark .ch-page,html.qd24-dark .fr-page{color:var(--ink)!important}
    html.qd24-dark .qd14-dialog input,html.qd24-dark .qd14-dialog select,
    html.qd24-dark .qd20-entry input,html.qd24-dark .fr-page input,
    html.qd24-dark .fr-page textarea,html.qd24-dark .cdx-shell input{background:var(--bg)!important;color:var(--ink)!important;border-color:var(--line)!important}
    html.qd24-dark .ch-note,html.qd24-dark .fr-muted,html.qd24-dark .qd14-dialog p{color:var(--muted)!important}
    html.qd24-dark .cdx-filter,html.qd24-dark .ch-tab{background:var(--qd-soft);color:var(--ink)}

    /* 2.5: iOS safe areas and responsive layout across narrow and wide devices. */
    html,body{min-width:0;width:100%;max-width:100%;overflow-x:clip}
    body{min-height:100vh;min-height:100dvh}
    .app{min-width:0;width:100%;max-width:760px;padding-top:max(16px,env(safe-area-inset-top));padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right));padding-bottom:calc(118px + env(safe-area-inset-bottom))}
    .app *{min-width:0}
    .stats,.ch-grid,.cdx-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr))}
    .ch-hero-main,.fr-user,.section-title{min-width:0;flex-wrap:wrap}
    .ch-hero-visual{flex:0 1 42%;min-width:min(110px,36vw);max-width:190px}
    img,svg,canvas{max-width:100%}
    nav{box-sizing:border-box;position:fixed!important;bottom:0!important;bottom:env(safe-area-inset-bottom,0px)!important;left:0;right:0;width:100%;max-width:760px;z-index:80!important;padding:6px max(6px,env(safe-area-inset-right)) 6px max(6px,env(safe-area-inset-left))!important;gap:clamp(1px,1vw,8px);overflow:visible}
    nav button{flex:1 1 0;min-width:0!important;min-height:50px;max-width:100%;padding:5px 1px;font-size:clamp(9px,2.6vw,12px);white-space:normal;line-height:1.15;overflow-wrap:anywhere}
    nav button b{font-size:clamp(17px,5vw,22px)}
    .modal,.qd14-overlay,.ch-modal,.cdx-detail-mask{padding-bottom:max(12px,env(safe-area-inset-bottom))}
    .dialog,.ch-dialog,.cdx-detail,.qd14-dialog,.qd20-card{max-width:min(100%,520px);max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px);overflow-y:auto}
    .fr-avatar-art .ch-art,.fr-avatar-art .ch-art svg{width:100%;height:100%;max-height:none}
    .fr-avatar-art .ch-art img{object-fit:contain}
    /* Complete dark surfaces left white by legacy feature modules. */
    html.qd24-dark .fr-avatar,html.qd24-dark .ch-image-wrap,
    html.qd24-dark .ch-collection-divider,html.qd24-dark .qd14-calendar,
    html.qd24-dark .qd14-overlay .qd14-dialog,html.qd24-dark .ch-modal .ch-dialog,
    html.qd24-dark .cdx-detail-mask .cdx-detail{background-color:var(--qd-surface)!important;color:var(--ink)!important;border-color:var(--line)!important}
    html.qd24-dark .ch-page input,html.qd24-dark .ch-page select,html.qd24-dark .ch-page textarea,
    html.qd24-dark .fr-page input,html.qd24-dark .fr-page textarea,
    html.qd24-dark .qd14-dialog input,html.qd24-dark .qd14-dialog select,
    html.qd24-dark .qd20-shell input,html.qd24-dark .qd20-shell select,
    html.qd24-dark .cdx-shell input,html.qd24-dark .cdx-shell select,
    html.qd24-dark .dialog input,html.qd24-dark .dialog select{background:var(--bg)!important;color:var(--ink)!important;border-color:var(--line)!important}
    html.qd24-dark .fr-btn,html.qd24-dark .ch-tab,html.qd24-dark .ch-btn,
    html.qd24-dark .cdx-filter,html.qd24-dark .cdx-stage-tab,
    html.qd24-dark .qd14-arrow,html.qd24-dark .qd14-edit,
    html.qd24-dark .setting-btn,html.qd24-dark .secondary{background:var(--qd-soft)!important;color:var(--ink)!important;border-color:var(--line)!important}
    html.qd24-dark .fr-page p,html.qd24-dark .ch-page p,html.qd24-dark .cdx-shell p{color:inherit}

    /* 2.6: cover all growth/report/social surfaces left light by older modules. */
    html.qd24-dark .page .card,html.qd24-dark .page .stat,
    html.qd24-dark .page .achievement,html.qd24-dark .page .s17-wrap,
    html.qd24-dark .page .s17-card,html.qd24-dark .page .s17-chat,
    html.qd24-dark .page .s17-bubble,html.qd24-dark .page .s17-note,
    html.qd24-dark .page .qd14-day,html.qd24-dark .page .qd14-log-icon,
    html.qd24-dark .page .fr-panel,html.qd24-dark .page .fr-list-row,
    html.qd24-dark .page .ch-card,html.qd24-dark .page .cdx-card,
    html.qd24-dark .page .qd20-card,
    html.qd24-dark .page [style*="background: white"],
    html.qd24-dark .page [style*="background:white"],
    html.qd24-dark .page [style*="background: #fff"],
    html.qd24-dark .page [style*="background:#fff"],
    html.qd24-dark .page [style*="background-color: white"],
    html.qd24-dark .page [style*="background-color:#fff"]{
      background:var(--qd-surface)!important;color:var(--ink)!important;border-color:var(--line)!important;
    }
    html.qd24-dark .page .s17-card.soft,html.qd24-dark .page .s17-bubble.mine,
    html.qd24-dark .page .s17-tab,html.qd24-dark .page .s17-pill,
    html.qd24-dark .page .s17-progress,html.qd24-dark .page .qd14-day.selected,
    html.qd24-dark .page .qd14-count,html.qd24-dark .page .s17-btn.alt,
    html.qd24-dark .page .s17-btn.danger{background:var(--qd-soft)!important;color:var(--purple)!important}
    html.qd24-dark .page .s17-tab.active,html.qd24-dark .page .s17-btn:not(.alt):not(.danger){
      background:#6656d3!important;color:#fff!important;
    }
    html.qd24-dark .page .s17-heading,html.qd24-dark .page .s17-title,
    html.qd24-dark .page .s17-strong,html.qd24-dark .page .qd14-field label,
    html.qd24-dark .page .achievement strong{color:var(--ink)!important}
    html.qd24-dark .page .s17-muted,html.qd24-dark .page .s17-caption,
    html.qd24-dark .page .s17-empty,html.qd24-dark .page .qd14-info,
    html.qd24-dark .page .qd14-log-main small{color:var(--muted)!important}
    html.qd24-dark .page .s17-input,html.qd24-dark .page .s17-select,
    html.qd24-dark .page .s17-textarea{background:var(--bg)!important;color:var(--ink)!important;border-color:var(--line)!important}
    /* The bottom safe area belongs inside the navigation, not below it. */
    nav{bottom:0!important;padding-bottom:calc(6px + env(safe-area-inset-bottom,0px))!important;
      border-radius:0!important;max-width:760px}
    @media(min-width:700px){nav{border-radius:20px 20px 0 0!important}}

    @media(max-width:350px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-hero-visual{flex-basis:100%;max-width:170px}.ch-hero-copy{flex-basis:100%}nav button{font-size:9px}}
    @media(max-width:390px){.cdx-grid,.ch-grid{gap:8px}.ch-hero-main{gap:9px;padding:12px}.ch-hero-visual{min-width:95px}}
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
