/* QUEST DAY 1.3 — collectible characters, evolving portraits, bestiary and shop.
   Data remains in the original "quest-day-mvp-v1" localStorage key.
   Illustrated PNG assets, when uploaded to art/<character-id>.png, replace SVG fallback. */
(function () {
  "use strict";
  const CSS = [
    ".ch-page{padding-top:4px}.ch-hero{border-radius:23px;border:1px solid #e3ddff;overflow:hidden;background:linear-gradient(120deg,#eee8ff,#fdfaff);margin:15px 0}",
    ".ch-hero-main{display:flex;align-items:center;gap:12px;padding:17px}.ch-hero-visual{width:148px;min-width:126px;height:155px;flex:0 0 43%;max-width:190px}",
    ".ch-hero-copy{min-width:0;flex:1}.ch-hero-copy h3{font-size:19px;line-height:1.28;margin:6px 0 8px;color:#252341}.ch-hero-copy p{font-size:12px;color:#77748d;margin:6px 0;line-height:1.5}",
    ".ch-hero-footer{padding:11px 17px;background:#ffffff94;display:flex;gap:10px;align-items:center;justify-content:space-between}",
    ".ch-art{position:relative;width:100%;height:100%;display:grid;place-items:center;overflow:hidden}.ch-art svg{height:100%;width:100%;max-height:220px}",
    ".ch-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;transform:scale(.93);filter:drop-shadow(0 7px 9px #48418917)}",
    ".ch-art{isolation:isolate}.ch-art[data-qdp-stage='2']::after,.ch-art[data-qdp-stage='3']::after{content:'';pointer-events:none;position:absolute;z-index:3;inset:5%;border-radius:50%;mix-blend-mode:screen}",
    ".ch-art[data-qdp-stage='2']::after{box-shadow:inset 0 0 15px var(--qd-aura,#b2b5ff),0 0 8px #b0d3ff88;opacity:.43}",
    ".ch-art[data-qdp-stage='3']::after{box-shadow:inset 0 0 20px var(--qd-aura,#b2b5ff),0 0 17px var(--qd-aura,#b2b5ff);opacity:.7}",
    ".ch-image-wrap{overflow:visible}.ch-image-wrap .ch-art{overflow:hidden;border-radius:12px}",
    ".ch-pill{font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:850;border-radius:30px;padding:6px 9px;display:inline-block;background:#fff;color:#594db4}",
    ".ch-pill.common{color:#2c946e;background:#e4f7ed}.ch-pill.rare{color:#386bb1;background:#e6f1ff}.ch-pill.epic{color:#8352bf;background:#f0e7ff}.ch-pill.legendary{color:#956a19;background:#fff4d3}",
    ".ch-btn{border:0;border-radius:11px;padding:10px 12px;background:#7566e8;color:white;font-size:12px;font-weight:800;cursor:pointer}",
    ".ch-btn.secondary{background:#e8e5ff;color:#6254cc}.ch-btn:disabled{background:#ececf2;color:#999cad;cursor:default}",
    ".ch-wallet{font-size:12px;font-weight:800;color:#9b731d;background:#fff3cf;border-radius:20px;padding:7px 10px}",
    ".ch-collection-header{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap;margin:10px 0 17px}",
    ".ch-collection-header h2{font-size:20px;margin:0 0 5px}.ch-note{font-size:12px;color:#898da5;line-height:1.5}",
    ".ch-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.ch-tab{font-size:12px;border:1px solid #e8e9f2;border-radius:19px;padding:8px 11px;background:white;color:#8589a1}",
    ".ch-tab.on{background:#ebe8ff;border-color:#d7d0ff;color:#6554c9;font-weight:800}",
    ".ch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}",
    ".ch-card{border:1px solid #e8e9f2;background:white;border-radius:18px;overflow:hidden;min-width:0;box-shadow:0 6px 16px #26235808}",
    ".ch-image-wrap{height:176px;position:relative;background:radial-gradient(circle at 50% 36%,#fff 0%,var(--c-bg,#efeaff) 85%);padding:6px}",
    ".ch-card.locked .ch-art{filter:grayscale(.8);opacity:.58}.ch-card:not(.locked) .ch-art{filter:drop-shadow(0 7px 5px #27224d11)}",
    ".ch-tier{position:absolute;left:9px;top:9px;z-index:1}.ch-stage{position:absolute;right:9px;top:9px;background:#ffffffed;color:#5b55a0;font-size:10px;border-radius:20px;padding:6px 8px;z-index:1}",
    ".ch-card-content{padding:11px 12px 13px}.ch-card-content h3{font-size:14px;line-height:1.3;margin:0 0 6px}.ch-card-content p{margin:0 0 9px;font-size:11px;line-height:1.4;color:#8589a1;min-height:31px}",
    ".ch-expression{display:inline-block;background:#f2eeff;color:#6655b8;border-radius:18px;font-size:10px;padding:5px 9px;margin-bottom:11px;font-weight:800}",
    ".ch-mini-actions{display:flex;gap:6px}.ch-mini-actions button{flex:1;min-width:0;padding:9px 6px;font-size:11px}",
    ".ch-progress{background:#eeedf7;border-radius:8px;overflow:hidden;height:6px;margin:9px 0}.ch-progress i{display:block;height:100%;background:#9d8bff;border-radius:8px}",
    ".ch-growth-panel{background:white;border-radius:18px;padding:16px;margin:13px 0;border:1px solid #e9e6f5}",
    ".ch-growth-flex{display:flex;align-items:center;gap:15px}.ch-growth-flex .ch-art{width:120px;min-width:120px;height:136px}",
    ".ch-modal{position:fixed;inset:0;z-index:55;display:none;align-items:flex-end;justify-content:center;background:#161932aa;padding:10px}.ch-modal.open{display:flex}",
    ".ch-dialog{width:100%;max-width:500px;max-height:94vh;overflow:auto;background:#fff;border-radius:24px;padding:19px;box-shadow:0 20px 55px #10102448}",
    ".ch-detail-header{display:flex;align-items:center;gap:15px}.ch-detail-art{height:180px;width:46%;flex:0 0 46%;border-radius:15px;background:#f4f0ff}",
    ".ch-detail-title{font-weight:900;font-size:20px;line-height:1.3;margin:6px 0}.ch-condition{font-size:12px;color:#6d6d87;padding:9px 0;border-bottom:1px solid #f0eef5}",
    ".ch-condition strong{color:#7665d4}.ch-label{font-size:12px;font-weight:800;margin:16px 0 8px}",
    ".ch-legacy{margin-top:17px;border-radius:15px;background:#f4f4fb;padding:14px;font-size:12px}",
".ch-art:not(.qdp-failed) svg{display:none}.ch-art.qdp-failed svg{display:block}",
    ".ch-art img{opacity:0;transition:opacity .12s ease-out}.ch-art.qdp-ready img{opacity:1}",
    ".ch-art.qdp-loading::before{content:\"✦\";position:absolute;inset:0;display:grid;place-items:center;color:#8778c9;font-size:29px;background:radial-gradient(circle,#f8f4ff 0%,#ede8fcaa 70%);animation:qdpPulse 1.1s ease-in-out infinite alternate}",
    "@keyframes qdpPulse{from{opacity:.55}to{opacity:1}}",
    "@media(max-width:380px){.ch-hero-main{padding:12px;gap:6px}.ch-hero-visual{min-width:105px;height:134px}.ch-hero-copy h3{font-size:16px}.ch-image-wrap{height:151px}.ch-card-content{padding:10px}.ch-dialog{padding:14px}}"
  ].join("");
  const css = document.createElement("style");
  css.textContent = CSS;
  document.head.appendChild(css);

  let catalog = [];
  let selectedId = "sprout";
  let categoryFilter = "all";
  let availableArt = new Set();
  const rarity = {common:"COMMON",rare:"RARE",epic:"EPIC",legendary:"LEGENDARY"};
  const knownLegacy = {starter:"sprout",forest:"forest",mage:"mage",ninja:"ninja",knight:"knight"};
  const legacyAstronaut = {id:"astronaut",name:"우주 개척자",rarity:"rare",price:400,tagline:"끝없는 우주를 향해 떠나는 개척자",visual:{palette:["#79B8F3","#E6F6FF","#446CAA"]},evolution:[{stage:1}]};
  const defaultAvatar = {id:"sprout",name:"새싹 모험가",rarity:"common",price:0,
    visual:{palette:["#88C98A","#F5E8CF","#457E57"],prop:"새싹 배낭"},evolution:[{stage:1}]};

  function currentRpg() {
    if (!state.rpg || typeof state.rpg !== "object") state.rpg = {};
    if (!Array.isArray(state.rpg.purchases)) state.rpg.purchases = [];
    if (!state.rpg.claimed || typeof state.rpg.claimed !== "object") state.rpg.claimed = {};
    if (typeof state.rpg.equipped !== "string") state.rpg.equipped = "starter";
    if (!state.rpg.goalDays || typeof state.rpg.goalDays !== "object") state.rpg.goalDays = {};
    if (!Number.isFinite(state.rpg.createdQuestCount)) state.rpg.createdQuestCount = 0;
  }
  function canonicalId(id) {return knownLegacy[id] || id;}
  function findCharacter(id) {return catalog.find(c => c.id === canonicalId(id)) || null;}
  function avatar() {return findCharacter(state.rpg.equipped) || (state.rpg.equipped==="astronaut"?legacyAstronaut:defaultAvatar);}
  function owned(c) {
    if (c.id === "sprout") return true;
    return state.rpg.purchases.some(p => p && (p.id === c.id || (c.legacyId && p.id === c.legacyId)));
  }
  function gold() {
    const earned = state.events.reduce((n,e)=>n+Math.max(0,Math.floor(Number(e.xp||0)/2)),0);
    const bonus = Object.values(state.rpg.claimed).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);
    const spent = state.rpg.purchases.reduce((n,p)=>n+Math.max(0,Number(p.cost)||0),0);
    return earned+bonus-spent;
  }
  function bestStreak() {
    const days = [...new Set(state.events.map(e=>e.day))].sort();
    let best=0,current=0,prev=NaN;
    for(const day of days) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const value=Date.parse(day+"T12:00:00Z");
      current = value-prev===86400000 ? current+1 : 1;
      best=Math.max(best,current);
      prev=value;
    }
    return best;
  }
  function metric(name) {
    const parts=name.split(":");
    const taskById=new Map(state.tasks.map(t=>[t.id,t]));
    if(parts[0]==="completedQuests") return state.events.length;
    if(parts[0]==="currentLevel") return levelInfo().level;
    if(parts[0]==="bestStreakDays") return bestStreak();
    if(parts[0]==="claimedChallenges") return Object.keys(state.rpg.claimed).length;
    if(parts[0]==="createdQuestCount") return state.rpg.createdQuestCount;
    if(parts[0]==="dailyGoalAchievedDays") return Object.keys(state.rpg.goalDays).length;
    if(parts[0]==="bossQuestCompletions") return state.events.filter(e=>Number(e.xp)===50).length;
    if(parts[0]==="completedByCategory") return state.events.filter(e=>
      (e.categorySnapshot || taskById.get(e.taskId)?.category)===parts[1]).length;
    if(parts[0]==="completedByFrequency") return state.events.filter(e=>
      (e.frequencySnapshot || taskById.get(e.taskId)?.frequency)===parts[1]).length;
    if(parts[0]==="completedInHourRange") {
      const range=parts[1].split("-").map(Number);
      return state.events.filter(e=>{
        if(!e.completedAt)return false;
        const d=new Date(e.completedAt);
        return Number.isFinite(d.getTime()) && d.getHours()>=range[0] && d.getHours()<range[1];
      }).length;
    }
    return 0;
  }
  function conditionMet(character) {
    return (character.unlockCondition?.rules || []).every(rule=>metric(rule.metric)>=rule.min);
  }
  function evolutionStage(character) {
    let level=1;
    for(const e of character.evolution || []) {
      if(e.stage===1 || (e.requirement && metric(e.requirement.metric)>=e.requirement.min)) level=e.stage;
    }
    return level;
  }
  function gradeName(level) {
    return level >= 15 ? "전설의 모험가" : level>=10 ? "마스터 모험가" :
      level>=5 ? "숙련 모험가" : "초보 모험가";
  }
  function safe(text) {return escapeHtml(text);}
  function ruleLabel(name) {
    const words={
      completedQuests:"퀘스트 완료",
      completedByCategory:"카테고리 완료",
      completedByFrequency:"반복 퀘스트 완료",
      completedInHourRange:"시간대 완료",
      createdQuestCount:"퀘스트 생성",
      dailyGoalAchievedDays:"일일 목표 달성",
      bestStreakDays:"최장 연속 달성",
      bossQuestCompletions:"50 XP 퀘스트 완료",
      currentLevel:"레벨",
      claimedChallenges:"도전과제 보상 수령"
    };
    const parts=name.split(":");
    return (words[parts[0]] || "퀘스트")+(parts[1] ? " ("+parts[1]+")" : "");
  }

  function addStar(x,y,r) {
    return '<path d="M'+x+' '+(y-r)+' L'+(x+r*0.27)+' '+(y-r*0.27)+' L'+(x+r)+' '+y+
      ' L'+(x+r*0.27)+' '+(y+r*0.27)+' L'+x+' '+(y+r)+' L'+(x-r*0.27)+' '+(y+r*0.27)+
      ' L'+(x-r)+' '+y+' L'+(x-r*0.27)+' '+(y-r*0.27)+' Z" fill="#fff9cc" stroke="#fff" stroke-width="1.5"/>';
  }
  function propArt(id) {
    switch(id){
      case "sprout": return '<path d="M118 35 Q105 10 86 22 Q89 41 118 35 Q126 11 150 20 Q146 39 118 35" fill="#7ecf8f" stroke="#437b53" stroke-width="3"/><path d="M118 39L118 25" stroke="#437b53" stroke-width="3"/>';
      case "paper_messenger": return '<path d="M90 32L160 17L139 48L124 40L106 50L113 34Z" fill="#fffaf0" stroke="#b39a77" stroke-width="3"/><path d="M113 34L160 17L124 40" fill="none" stroke="#d5b99f" stroke-width="2"/>';
      case "dawn_runner": return '<ellipse cx="121" cy="31" rx="52" ry="14" fill="#5da7d6" stroke="#346a9b" stroke-width="3"/><circle cx="96" cy="27" r="13" fill="#c9efff" stroke="#376fa7" stroke-width="4"/><circle cx="142" cy="27" r="13" fill="#c9efff" stroke="#376fa7" stroke-width="4"/>';
      case "sunset_scribe": return '<path d="M68 44 Q121 3 169 42 L177 52 Q121 35 64 53Z" fill="#a8739d" stroke="#745077" stroke-width="3"/><path d="M149 22L165 9L164 31Z" fill="#f9d595"/>';
      case "forest": return '<path d="M67 52 Q64 10 118 15 Q166 8 179 52 Q132 20 112 52Z" fill="#499a7c" stroke="#2d715c" stroke-width="3"/><path d="M84 21Q95 3 112 11Q103 28 84 21" fill="#a4de95"/><circle cx="144" cy="21" r="7" fill="#f4eaac"/>';
      case "clockkeeper": return '<path d="M76 46L90 14L149 12L170 46Z" fill="#95714f" stroke="#674c48" stroke-width="3"/><path d="M67 46Q122 30 176 47" fill="none" stroke="#d9bc82" stroke-width="9"/><circle cx="124" cy="20" r="10" fill="#f8e7b7" stroke="#94714b" stroke-width="3"/><path d="M124 20v-7m0 7l5 3" stroke="#766158" stroke-width="2"/>';
      case "star_scribe": return '<path d="M63 43Q119 2 178 41L170 49Q124 29 70 49Z" fill="#8a70d2" stroke="#6555aa" stroke-width="3"/>'+addStar(127,26,11);
      case "ninja": return '<path d="M70 52Q76 7 121 14Q172 11 176 52L153 38Q116 28 82 50Z" fill="#303967" stroke="#20254d" stroke-width="4"/><path d="M75 51L51 72L77 63" fill="#4d4d94"/>';
      case "mage": return '<path d="M70 45L117 0L173 43L149 47L104 29L77 54Z" fill="#594db2" stroke="#39388a" stroke-width="3"/><path d="M66 45Q116 35 176 46" fill="none" stroke="#a89af0" stroke-width="10"/>'+addStar(122,22,12);
      case "knight": return '<path d="M82 48L87 17L152 17L165 47Z" fill="#d5e1ed" stroke="#7e94b0" stroke-width="4"/><path d="M88 39H162M122 18V40" stroke="#6b7c9c" stroke-width="4"/><path d="M117 13Q127 2 136 13" fill="none" stroke="#d3b46d" stroke-width="5"/>';
      case "dream_whale": return '<path d="M79 43Q104 14 157 40Q176 36 182 45Q152 48 125 40Z" fill="#7abbd9" stroke="#457bb3" stroke-width="3"/><circle cx="143" cy="37" r="5" fill="#e9f7ff"/>';
      case "astronaut": return '<path d="M72 74Q66 16 120 12Q179 13 171 75" fill="#b7dcf3" stroke="#537ca4" stroke-width="6"/><ellipse cx="120" cy="78" rx="49" ry="43" fill="#daf3ff" opacity=".55" stroke="#76afdc" stroke-width="4"/>';
      case "time_guardian": return '<circle cx="121" cy="57" r="57" fill="none" stroke="#dcb969" stroke-width="8"/><circle cx="121" cy="57" r="48" fill="none" stroke="#f9e5ae" stroke-width="3" stroke-dasharray="3 10"/>'+addStar(121,7,9);
      default: return addStar(121,23,9);
    }
  }

  // Self-contained original vector fallback; premium hand-painted PNGs replace it when uploaded.
  function svgPortrait(character) {
    const palette=character.visual?.palette || ["#83c99d","#f6dec6","#466b65"];
    const accent=palette[0],light=palette[1]||"#f1e9df",dark=palette[2]||"#625b83";
    const stage=evolutionStage(character);
    const extra=stage>=2?addStar(47,90,8)+addStar(191,118,8):"";
    const aura=stage===3?'<circle cx="120" cy="122" r="105" fill="none" stroke="'+accent+'" stroke-width="4" stroke-dasharray="6 11" opacity=".6"/>':"";
    return '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="119" cy="218" rx="75" ry="11" fill="#2a25501a"/>' +
      '<circle cx="120" cy="115" r="84" fill="'+light+'" opacity=".25"/>'+aura+
      '<path d="M71 141Q119 114 171 141L187 204Q120 228 53 205Z" fill="'+dark+'" opacity=".9" stroke="#49415f" stroke-width="3"/>' +
      '<path d="M89 145Q119 131 150 146L161 194Q119 209 78 195Z" fill="'+accent+'" stroke="'+dark+'" stroke-width="3"/>' +
      '<path d="M92 195L86 218Q104 226 112 216L116 197Z" fill="'+dark+'"/>' +
      '<path d="M127 197L132 218Q154 223 162 214L148 192Z" fill="'+dark+'"/>' +
      '<ellipse cx="68" cy="160" rx="17" ry="22" fill="'+accent+'" stroke="'+dark+'" stroke-width="3" transform="rotate(-23 68 160)"/>' +
      '<ellipse cx="176" cy="160" rx="17" ry="22" fill="'+accent+'" stroke="'+dark+'" stroke-width="3" transform="rotate(23 176 160)"/>' +
      '<circle cx="62" cy="178" r="10" fill="#f3d8c1" stroke="#b88e84" stroke-width="2"/>' +
      '<circle cx="184" cy="177" r="10" fill="#f3d8c1" stroke="#b88e84" stroke-width="2"/>' +
      '<circle cx="120" cy="93" r="48" fill="#f9dbc4" stroke="#b9928f" stroke-width="3"/>' +
      '<path d="M71 88Q78 43 120 41Q168 41 170 92Q152 74 142 66Q124 82 107 71Q92 85 71 88Z" fill="'+dark+'"/>' +
      '<path d="M93 92Q102 86 111 94M131 94Q140 85 149 92" fill="none" stroke="#523b4d" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="104" cy="101" rx="6" ry="9" fill="#292846"/><ellipse cx="139" cy="101" rx="6" ry="9" fill="#292846"/>' +
      '<circle cx="106" cy="98" r="2.5" fill="#fff"/><circle cx="141" cy="98" r="2.5" fill="#fff"/>' +
      '<ellipse cx="89" cy="113" rx="9" ry="4" fill="#f4a9a9" opacity=".7"/><ellipse cx="152" cy="113" rx="9" ry="4" fill="#f4a9a9" opacity=".7"/>' +
      '<path d="M115 116Q122 123 129 116" fill="none" stroke="#b06e76" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M105 149Q120 161 137 149" fill="none" stroke="'+light+'" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="120" cy="179" r="7" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>' +
      propArt(character.id)+extra+'</svg>';
  }

  // Keep already decoded portraits in memory between UI re-renders.
  // SVG appears only when the PNG genuinely fails (never during loading).
  const readyPortraits = new Set();
  const failedPortraits = new Set();
  const warmingPortraits = new Map();
  const PORTRAIT_VERSION = "4";
  // Ten self-contained evolution illustrations: four corrected base portraits
  // plus stage 2/3 designs for three featured characters.
  const stagedArt = {
    knight:new Set([1,2,3]),
    mage:new Set([1,2,3]),
    dream_whale:new Set([1,2,3]),
    time_guardian:new Set([1])
  };
  function portraitStage(id) {
    const c=findCharacter(id);
    return c?evolutionStage(c):1;
  }
  function portraitKey(id) {return id+":"+portraitStage(id);}
  function portraitSrc(id) {
    const stage=portraitStage(id);
    if(stagedArt[id]?.has(stage))
      return "./art/evolution/"+encodeURIComponent(id)+"-stage"+stage+".svg?v=32";
    return "./art/"+encodeURIComponent(id)+".png?v="+PORTRAIT_VERSION;
  }

  function notifyPortrait(id, stateName) {
    document.querySelectorAll(".ch-art[data-qdp-id]").forEach(el => {
      if(el.dataset.qdpId !== id) return;
      el.classList.remove("qdp-loading","qdp-ready","qdp-failed");
      el.classList.add("qdp-"+stateName);
    });
  }

  function warmPortrait(id) {
    const key=portraitKey(id);
    if(readyPortraits.has(key) || failedPortraits.has(key) || warmingPortraits.has(key)) return;
    const image = new Image();
    warmingPortraits.set(key, image);
    image.decoding = "async";
    image.onload = function() {
      const finish = () => {
        warmingPortraits.delete(key);
        readyPortraits.add(key);
        failedPortraits.delete(key);
        notifyPortrait(id, "ready");
      };
      if (typeof image.decode === "function") image.decode().then(finish, finish);
      else finish();
    };
    image.onerror = function() {
      warmingPortraits.delete(key);
      failedPortraits.add(key);
      notifyPortrait(id, "failed");
    };
    image.src = portraitSrc(id);
  }

  document.addEventListener("load", function(event) {
    const img = event.target;
    if(!img || !img.matches || !img.matches("img[data-qdp-portrait]")) return;
    const key = img.dataset.qdpPortrait;
    const el = img.parentElement;
    const mark = () => {
      if(!img.isConnected) return;
      if(el){el.classList.remove("qdp-loading","qdp-failed");el.classList.add("qdp-ready");}
      readyPortraits.add(key);
      failedPortraits.delete(key);
    };
    if (typeof img.decode === "function") img.decode().then(mark, mark);
    else mark();
  }, true);
  document.addEventListener("error", function(event) {
    const img = event.target;
    if(!img || !img.matches || !img.matches("img[data-qdp-portrait]")) return;
    const key = img.dataset.qdpPortrait;
    failedPortraits.add(key);
    readyPortraits.delete(key);
    const el = img.parentElement;
    if(el){el.classList.remove("qdp-loading","qdp-ready");el.classList.add("qdp-failed");}
    img.remove();
  }, true);

  function portrait(character) {
    const id=character.id,key=portraitKey(id),stage=portraitStage(id);
    const status=failedPortraits.has(key)?"failed":readyPortraits.has(key)?"ready":"loading";
    const svg=svgPortrait(character);
    const source=portraitSrc(id);
    const image=failedPortraits.has(key)?"":'<img data-qdp-portrait="'+safe(key)+'" loading="eager" decoding="async" src="'+safe(source)+'" alt="">';
    const aura=character.visual?.palette?.[0]||"#b2b5ff";
    return '<div class="ch-art qdp-'+status+'" data-qdp-id="'+safe(id)+'" data-qdp-stage="'+stage+'" style="--qd-aura:'+safe(aura)+'">'+svg+image+'</div>';
  }

  function cardMarkup(character) {
    const isOwned=owned(character), unlocked=conditionMet(character),
      isEquipped=canonicalId(state.rpg.equipped)===character.id;
    const stage=evolutionStage(character);
    const locked=!isOwned&&!unlocked;
    const border={common:"#87c8aa",rare:"#90b9ed",epic:"#b69deb",legendary:"#e8c871"}[character.rarity];
    const action=isEquipped?"장착 중":isOwned?"장착하기":
      locked?"해금 전":gold()<character.price?"🪙 "+character.price+" G 필요":
      character.price===0?"획득하기":"🪙 "+character.price+" G";
    return '<article class="ch-card'+(locked?' locked':'')+'" style="--c-bg:'+border+'33;border-color:'+border+'66">' +
      '<div class="ch-image-wrap"><div class="ch-tier"><span class="ch-pill '+character.rarity+'">'+rarity[character.rarity]+'</span></div>' +
      '<span class="ch-stage">진화 '+stage+'/3</span>'+portrait(character)+'</div>' +
      '<div class="ch-card-content"><h3>'+safe(character.name)+'</h3>' +
      '<p>'+safe(character.tagline||"")+'</p><div class="ch-expression">'+safe(character.visual?.expressionTag||"")+'</div><div class="ch-mini-actions">' +
      '<button class="ch-btn secondary" data-ch-preview="'+character.id+'">자세히</button>' +
      '<button class="ch-btn" data-ch-action="'+character.id+'"'+
      (isEquipped||locked||(!isOwned&&gold()<character.price)?' disabled':'')+'>'+action+'</button></div></div></article>';
  }

  const app=document.querySelector(".app");
  const store=document.getElementById("rpgShop");
  const homeArt=document.getElementById("rpgAvatarHome");
  const growArt=document.getElementById("rpgGrowthCharacter");
  const collection=document.createElement("section");
  collection.id="chCollection";collection.className="page ch-page";
  if(app)app.appendChild(collection);

  const nav=document.querySelector("nav");
  const collectionNav=document.createElement("button");
  collectionNav.dataset.page="chCollection";
  collectionNav.innerHTML="<b>✦</b>도감";
  if(nav){
    const settingNav=nav.querySelector('[data-page="settings"]');
    if(settingNav)nav.insertBefore(collectionNav,settingNav);
    else nav.appendChild(collectionNav);
  }
  collectionNav.addEventListener("click",function(){
    if(nav)nav.querySelectorAll("button").forEach(button =>
      button.classList.toggle("active",button===collectionNav));
    document.querySelectorAll(".page").forEach(page =>
      page.classList.toggle("active",page.id==="chCollection"));
    window.scrollTo(0,0);
  });

  const modal=document.createElement("div");
  modal.className="ch-modal";modal.id="chCharacterModal";
  modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-label","캐릭터 상세");
  document.body.appendChild(modal);
  function showPreview(id) {
    const character=findCharacter(id);
    if(!character)return;
    selectedId=character.id;
    const isOwned=owned(character),stage=evolutionStage(character);
    const rules=character.unlockCondition?.rules||[];
    const ruleHtml=rules.length?rules.map(rule=>
      '<div class="ch-condition">'+safe(ruleLabel(rule.metric))+
      ' <strong>'+metric(rule.metric)+' / '+rule.min+'</strong>'+
      (metric(rule.metric)>=rule.min?' ✓':'')+'</div>').join(""):
      '<p class="ch-note">기본 지급 캐릭터입니다.</p>';
    const stages=(character.evolution||[]).map(e=>
      '<div class="ch-condition">진화 '+e.stage+' · '+safe(e.visualChange||"")+
      (e.requirement?' ('+metric(e.requirement.metric)+'/'+e.requirement.min+')':'')+
      '</div>').join("");
    modal.innerHTML='<div class="ch-dialog"><div class="ch-row" style="display:flex;justify-content:space-between;align-items:center">' +
      '<span class="ch-pill '+character.rarity+'">'+rarity[character.rarity]+'</span>'+
      '<button class="ch-btn secondary" data-ch-close>닫기 ×</button></div>'+
      '<div class="ch-detail-header"><div class="ch-detail-art">'+portrait(character)+'</div>'+
      '<div><div class="ch-detail-title">'+safe(character.name)+'</div>'+
      '<div class="ch-note">'+safe(character.tagline||"")+'</div>'+
      '<p class="ch-note" style="margin-top:9px">표정: '+safe(character.visual?.expression||"")+'</p>'+
      '<p class="ch-note">포즈: '+safe(character.visual?.pose||"")+'</p>'+
      '<p class="ch-note" style="margin-top:10px">현재 진화 '+stage+'/3 · '+(isOwned?"보유 중":"미보유")+'</p></div></div>'+
      '<div class="ch-label">🔓 해금 조건</div>'+ruleHtml+
      '<div class="ch-label">✨ 성장 단계</div>'+stages+
      '<button class="ch-btn" data-ch-action="'+character.id+'" style="width:100%;margin-top:16px"'+
      ((isOwned&&canonicalId(state.rpg.equipped)===character.id)||(!isOwned&&(!conditionMet(character)||gold()<character.price))?' disabled':'')+'>'+
      (isOwned?"대표 캐릭터로 장착":conditionMet(character)?"🪙 "+character.price+" G 획득":"아직 해금되지 않았어요")+
      '</button></div>';
    modal.classList.add("open");
  }
  modal.addEventListener("click",function(event){
    if(event.target===modal||event.target.closest("[data-ch-close]"))modal.classList.remove("open");
  });

  function takeAction(characterId) {
    const c=findCharacter(characterId);if(!c)return;
    currentRpg();
    if(!owned(c)){
      if(!conditionMet(c)||gold()<c.price)return;
      // The legacy purchase IDs remain intact; never charge an existing owner twice.
      state.rpg.purchases.push({id:c.id,cost:c.price,purchasedAt:new Date().toISOString()});
    }
    state.rpg.equipped=c.id==="sprout"?"starter":c.id;
    saveState();
    modal.classList.remove("open");
    render();
  }
  function controlsClick(event) {
    const action=event.target.closest("[data-ch-action]");
    if(action){takeAction(action.dataset.chAction);return;}
    const preview=event.target.closest("[data-ch-preview]");
    if(preview){showPreview(preview.dataset.chPreview);return;}
    const go=event.target.closest("[data-ch-go]");
    if(go){collectionNav.click();return;}
    const filter=event.target.closest("[data-ch-filter]");
    if(filter){categoryFilter=filter.dataset.chFilter;render();}
  }
  if(store)store.addEventListener("click",controlsClick);
  if(homeArt)homeArt.addEventListener("click",controlsClick);
  if(growArt)growArt.addEventListener("click",controlsClick);
  collection.addEventListener("click",controlsClick);
  modal.addEventListener("click",controlsClick);

  function renderCollection() {
    if(!catalog.length)return;
    currentRpg();
    const character=avatar();
    const lv=levelInfo().level;
    const stage=evolutionStage(character);
    const obtained=catalog.filter(owned).length;
    const name=character.name;
    const g=Math.max(0,gold());
    const ownedProgress=Math.round(obtained/catalog.length*100);

    if(homeArt)homeArt.innerHTML='<div class="ch-hero"><div class="ch-hero-main">' +
      '<div class="ch-hero-visual">'+portrait(character)+'</div>'+
      '<div class="ch-hero-copy"><span class="ch-pill '+character.rarity+'">'+rarity[character.rarity]+'</span>'+
      '<h3>'+safe(name)+'</h3><p>'+gradeName(lv)+' · Lv.'+lv+' · 진화 '+stage+'/3</p>'+
      '<p>'+safe(character.tagline||"")+'</p></div></div>'+
      '<div class="ch-hero-footer"><span class="ch-wallet">🪙 '+g+' G</span>'+
      '<button class="ch-btn secondary" data-ch-go="collection">캐릭터 도감 보기 ✦</button></div></div>';

    const progress=character.evolution?.find(e=>e.stage===stage+1)?.requirement;
    const progression=progress ? Math.min(100,Math.round(metric(progress.metric)/progress.min*100)) : 100;
    if(growArt)growArt.innerHTML='<div class="ch-growth-panel"><div class="ch-growth-flex">'+
      '<div class="ch-art" style="width:120px;min-width:120px;height:136px">'+
      portrait(character)+'</div><div><span class="ch-pill '+character.rarity+'">'+rarity[character.rarity]+'</span>'+
      '<h3 style="font-size:18px;margin:8px 0">'+safe(name)+'</h3>'+
      '<p class="ch-note">'+gradeName(lv)+' · 진화 '+stage+'/3</p>'+
      '<span class="ch-wallet">🪙 '+g+' G</span></div></div>'+
      '<p class="ch-note" style="margin:12px 0 0">'+(progress?
      '다음 진화: '+safe(ruleLabel(progress.metric))+' ('+metric(progress.metric)+'/'+progress.min+')':
      '최종 진화 단계에 도달했어요!')+'</p>'+
      '<div class="ch-progress"><i style="width:'+progression+'%"></i></div>'+
      '<button class="ch-btn secondary" data-ch-go="collection" style="width:100%">도감에서 다른 캐릭터 살펴보기</button></div>';

    const headerAvatar=document.querySelector("header .avatar");
    if(headerAvatar)headerAvatar.innerHTML='<div class="ch-art" style="height:42px;width:42px">'+portrait(character)+'</div>';

    if(store){
      store.innerHTML='<div class="ch-collection-header"><div><h2>🛍 캐릭터 상점</h2>'+
        '<div class="ch-note">갖고 싶은 수호자를 해금하고 성장시켜 보세요.</div></div>'+
        '<span class="ch-wallet">🪙 '+g+' G</span></div>'+
        '<div class="ch-grid">'+catalog.map(cardMarkup).join("")+'</div>'+
        '<p class="ch-note" style="margin-top:12px">모든 캐릭터는 앱 안에서만 사용하는 가상 골드로 획득할 수 있어요.</p>';
    }

    const tabs=[["all","전체"],["owned","보유"],["common","COMMON"],["rare","RARE"],["epic","EPIC"],["legendary","LEGENDARY"]];
    const filtered=catalog.filter(c=>categoryFilter==="all" ||
      (categoryFilter==="owned"?owned(c):c.rarity===categoryFilter));
    collection.innerHTML='<div class="ch-collection-header"><div><h2>✦ 수호자 도감</h2>'+
      '<div class="ch-note">보유 '+obtained+'/'+catalog.length+' · 나만의 모험 동료 컬렉션</div></div>'+
      '<span class="ch-wallet">🪙 '+g+' G</span></div>'+
      '<div class="ch-progress"><i style="width:'+ownedProgress+'%"></i></div>'+
      '<div class="ch-tabs">'+tabs.map(t=>
        '<button class="ch-tab'+(categoryFilter===t[0]?' on':'')+
        '" data-ch-filter="'+t[0]+'">'+t[1]+'</button>').join("")+'</div>'+
      '<div class="ch-grid">'+filtered.map(cardMarkup).join("")+'</div>'+
      (state.rpg.purchases.some(p=>p.id==="astronaut")||state.rpg.equipped==="astronaut"?
        '<div class="ch-legacy"><strong>🚀 기존 우주 개척자 외형</strong>'+
        '<p>1.2에서 구매한 이 외형도 계속 사용할 수 있어요.</p>'+
        '<button class="ch-btn secondary" data-ch-legacy="astronaut">장착하기</button></div>':'');
    const settings=document.querySelector("#settings .note");
    if(settings && settings.innerHTML.includes("MVP 1.2")) {
      settings.innerHTML=settings.innerHTML.replace("MVP 1.2","MVP 1.3");
    }
  }
  collection.addEventListener("click",function(e){
    const legacy=e.target.closest("[data-ch-legacy]");
    if(legacy && state.rpg.purchases.some(p=>p.id==="astronaut")){
      state.rpg.equipped="astronaut";saveState();render();
    }
  });

  // Preserve completion events, add non-destructive metadata only to new events.
  const baseToggle=toggleTask;
  toggleTask=function(id) {
    const before=new Set(state.events.map(e=>e.id));
    baseToggle(id);
    const event=state.events.find(e=>!before.has(e.id)&&e.taskId===id);
    if(event){
      const task=state.tasks.find(t=>t.id===id);
      event.completedAt=new Date().toISOString();
      event.categorySnapshot=task?.category||"기타";
      event.frequencySnapshot=task?.frequency||"daily";
      saveState();
    }
    updateTodayGoal();
    render();
  };

  const baseCreate=createTask;
  createTask=function(){
    const before=new Set(state.tasks.map(t=>t.id));
    baseCreate();
    const newlyMade=state.tasks.filter(t=>!before.has(t.id)).length;
    if(newlyMade){
      currentRpg();
      state.rpg.createdQuestCount+=newlyMade;
      saveState();
    }
    render();
  };

  // The original save button held a reference to createTask before it was wrapped.
  const questSaveButton=document.getElementById("saveBtn");
  if(questSaveButton)questSaveButton.onclick=function(){createTask();};

  function updateTodayGoal(){
    currentRpg();
    const goal=[1,3,5].includes(Number(state.dailyGoal))?Number(state.dailyGoal):3;
    const day=dateKey();
    if(todayEvents().length>=goal && !state.rpg.goalDays[day]){
      state.rpg.goalDays[day]=goal;
      saveState();
    }
  }
  const earlierRender=render;
  render=function(){
    earlierRender();
    updateTodayGoal();
    renderCollection();
  };

  // Fetch the verified design catalog from the same repository / Pages origin.
  fetch("./characters-1.3.json",{cache:"no-cache"})
    .then(res=>{if(!res.ok)throw new Error("Catalog HTTP "+res.status);return res.json();})
    .then(json=>{
      if(!Array.isArray(json.characters)||json.characters.length!==12)throw new Error("Catalog validation failed");
      catalog=json.characters;
      currentRpg();
      // Preload all twelve lightweight portraits once, so swapping characters does not flash placeholders.
      const equippedId=state.rpg.equipped==="starter"?"sprout":state.rpg.equipped;
      warmPortrait(equippedId);
      catalog.forEach(c=>warmPortrait(c.id));
      render();
    })
    .catch(error=>{
      console.warn("QUEST DAY 1.3 catalog could not load; keeping the 1.2 interface.",error);
    });
})();
