/* QUEST DAY — Collection Codex 2.2. Presentation only; never changes quests, gold, evolution, or purchase records. */
(function(){
  "use strict";
  const style=document.createElement("style");style.textContent="\n#chCollection.cdx-enabled{padding-top:10px}\n.cdx-shell{color:#292841;max-width:100%;padding-bottom:28px}\n.cdx-header{background:linear-gradient(130deg,#f4f0ff 0%,#fff 74%);border:1px solid #e6ddfc;border-radius:23px;padding:19px 17px 16px;margin:6px 0 16px;box-shadow:0 12px 28px #3a2d7810}\n.cdx-kicker{color:#7963bf;font-weight:800;letter-spacing:.09em;font-size:10px;margin:0 0 5px}\n.cdx-header h2{font-size:23px;letter-spacing:-.04em;margin:0 0 4px;line-height:1.3;color:#292744}\n.cdx-sub{font-size:12px;color:#838097;margin:0;line-height:1.5}\n.cdx-summary{display:flex;align-items:center;gap:13px;margin:15px 0}\n.cdx-ring{--pct:0%;width:80px;height:80px;flex:0 0 80px;border-radius:50%;background:conic-gradient(#7662d9 var(--pct),#e5dff7 0);display:grid;place-items:center}\n.cdx-ring-inner{width:66px;height:66px;display:flex;flex-direction:column;justify-content:center;align-items:center;border-radius:50%;background:#fff}\n.cdx-ring-inner strong{font-size:21px;color:#5545ae;line-height:1.1}\n.cdx-ring-inner span{font-size:9px;color:#9993ae;font-weight:700}\n.cdx-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;flex:1;min-width:0}\n.cdx-stat{background:#fff;border:1px solid #eae5f4;border-radius:13px;padding:10px 6px;text-align:center;min-width:0}\n.cdx-stat strong{display:block;color:#37314f;font-size:17px;line-height:1.25}\n.cdx-stat span{font-size:10px;color:#8d879f;white-space:nowrap}\n.cdx-milestone-top{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:11px;color:#8c849e;margin:7px 0}\n.cdx-milestone-top b{color:#6551b7;font-size:11px}\n.cdx-progress{height:8px;background:#e9e5f5;border-radius:99px;overflow:hidden}\n.cdx-progress>i{display:block;height:100%;background:linear-gradient(90deg,#9b81f1,#6c5bdc);border-radius:99px;transition:width .35s}\n.cdx-checkpoints{display:flex;justify-content:space-between;margin-top:10px;gap:4px}\n.cdx-checkpoints span{font-size:10px;font-weight:700;color:#aaa4ba;white-space:nowrap}\n.cdx-checkpoints span.done{color:#6b55ca}\n.cdx-toolbar{background:#fff;border:1px solid #edebf4;border-radius:17px;padding:12px;margin-bottom:12px}\n.cdx-searchbar{display:flex;align-items:center;gap:8px;background:#f5f5fa;border:1px solid #e9e8f2;border-radius:11px;padding:0 12px;height:44px}\n.cdx-searchbar svg{flex-shrink:0}\n.cdx-searchbar input{border:0;background:transparent;outline:none;min-width:0;flex:1;width:100%;font-size:13px;color:#2d2c45}\n.cdx-searchbar input::placeholder{color:#a4a0b3}\n.cdx-filter-row{display:flex;gap:6px;overflow:auto;padding:12px 0 6px;scrollbar-width:none}\n.cdx-filter-row::-webkit-scrollbar{display:none}\n.cdx-filter{border:1px solid #e6e4f0;background:#f8f7fb;color:#736f8b;padding:8px 12px;border-radius:99px;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}\n.cdx-filter[aria-pressed=true]{background:#7160d5;color:white;border-color:#7160d5}\n.cdx-dropdowns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}\n.cdx-dropdowns label{font-size:10px;color:#858098;display:flex;flex-direction:column;gap:5px}\n.cdx-dropdowns select{font:inherit;color:#544a78;background:#fff;border:1px solid #dfdaec;border-radius:10px;padding:9px 10px;min-width:0;font-size:12px}\n.cdx-list-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 1px 11px}\n.cdx-list-head h3{margin:0;font-size:15px;color:#34314b}\n.cdx-list-head span{font-size:11px;color:#8c879c}\n.cdx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}\n.cdx-card{--cdx-tone:#a89bbd;position:relative;background:#fff;border:1px solid #e8e5ee;border-radius:16px;overflow:hidden;box-shadow:0 5px 13px #34305409;min-width:0;transition:transform .16s,box-shadow .16s}\n.cdx-card:focus-within{outline:2px solid #8973e9;outline-offset:1px}\n.cdx-card[data-rarity=legendary]{border-color:#e6d7ac}\n.cdx-card[data-rarity=epic]{border-color:#dfd2f0}\n.cdx-card:hover{box-shadow:0 9px 18px #34305416;transform:translateY(-2px)}\n.cdx-card-main{background:none;border:none;padding:0;display:block;width:100%;text-align:left;cursor:pointer;color:inherit}\n.cdx-figure{height:173px;position:relative;background:radial-gradient(ellipse at 50% 34%,#fff 0%,var(--cdx-tone) 175%);overflow:hidden}\n.cdx-figure .ch-art{height:100%;width:100%}\n.cdx-card.unseen .cdx-figure .ch-art{filter:grayscale(.85) brightness(.72) saturate(.25);opacity:.76}\n.cdx-card.obtainable .cdx-figure{background:radial-gradient(ellipse at 50% 30%,#fff 0%,#e6e0fc 100%)}\n.cdx-topline{position:absolute;left:7px;right:33px;top:7px;display:flex;gap:4px;flex-wrap:wrap;z-index:2}\n.cdx-rarity{background:#fffffff5;color:#776f8b;font-size:9px;font-weight:900;border-radius:99px;padding:5px 7px;letter-spacing:.02em}\n.cdx-rarity.legendary{color:#9f7220;background:#fff5d9}\n.cdx-rarity.epic{color:#855cbb;background:#f5eaff}\n.cdx-rarity.rare{color:#447bbb;background:#ebf4ff}\n.cdx-rarity.common{color:#41986f;background:#eaf8ee}\n.cdx-equip-marker{background:#6052c4;color:#fff;font-size:9px;font-weight:800;padding:5px 7px;border-radius:99px}\n.cdx-fav{position:absolute;top:7px;right:7px;z-index:4;background:#fffffff0;color:#a7a1bc;border:1px solid #ebe6f5;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;font-size:19px;cursor:pointer}\n.cdx-fav[aria-pressed=true]{color:#f2a62d;background:#fffae9}\n.cdx-card-body{padding:10px 10px 11px}\n.cdx-card-body h4{font-size:13px;margin:0 0 4px;line-height:1.3;color:#282743;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}\n.cdx-card-body small{display:block;font-size:10px;color:#9a95a8;min-height:14px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}\n.cdx-state{display:flex;align-items:center;gap:5px;margin-top:10px;font-size:10px;font-weight:800;color:#817b94}\n.cdx-state.owned{color:#6c57be}.cdx-state.obtainable{color:#347e67}.cdx-state.locked{color:#8e869a}\n.cdx-stage-bars{display:flex;gap:4px;margin-top:7px}\n.cdx-stage-bars span{background:#e8e5ef;border-radius:8px;height:4px;flex:1}\n.cdx-stage-bars span.on{background:var(--cdx-tone)}\n.cdx-cta{text-align:center;border-top:1px solid #f1eef7;font-size:10px;font-weight:750;color:#7769bd;padding:9px 5px;background:#fbfaff}\n.cdx-empty{grid-column:1/-1;text-align:center;padding:38px 15px;background:#fff;border-radius:16px;color:#8a849b;font-size:12px;line-height:1.7}\n.cdx-footer{color:#938da5;text-align:center;margin:17px 2px 35px;font-size:11px;line-height:1.6}\n.cdx-detail-mask{display:none;position:fixed;inset:0;z-index:90;background:#161428b8;align-items:flex-end;justify-content:center;padding:8px}\n.cdx-detail-mask.open{display:flex}\n.cdx-detail{background:#fff;border-radius:21px 21px 16px 16px;padding:15px 16px 24px;width:100%;max-width:570px;max-height:92dvh;overflow:auto;box-shadow:0 20px 65px #08041466}\n.cdx-detail-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.cdx-detail-heading{font-size:20px;font-weight:900;margin:6px 0 4px;color:#282543}\n.cdx-detail-sub{font-size:11px;color:#878097;margin:0 0 12px;line-height:1.5}\n.cdx-close{border:0;background:#f1eff9;border-radius:10px;width:35px;height:35px;font-size:22px;color:#5a4f7c;cursor:pointer}\n.cdx-detail-image{width:100%;height:auto;aspect-ratio:1/1;background:radial-gradient(ellipse at 50% 36%,#fff,#f0eaf9);border:1px solid #ebe7f7;border-radius:16px;position:relative;overflow:hidden;isolation:isolate}\n.cdx-detail-image img{position:absolute;top:12px;left:12px;width:calc(100% - 24px);height:calc(100% - 24px);display:block;object-fit:contain;object-position:center;max-width:none;max-height:none;min-width:0;min-height:0}\n.cdx-stage-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}\n.cdx-stage-tab{border:1px solid #e7e4f1;background:#faf9fd;border-radius:11px;padding:10px 5px;font-size:12px;color:#8c869c;font-weight:800;cursor:pointer}\n.cdx-stage-tab[aria-pressed=true]{border-color:#8774df;background:#ebe7ff;color:#5649b9}\n.cdx-stage-tab span{font-size:9px;display:block;color:#aaa4bb;margin-top:3px}\n.cdx-detail-progress{background:#f8f6fd;border:1px solid #efebfa;border-radius:13px;padding:11px 12px;margin:12px 0}\n.cdx-detail-progress h4{margin:0 0 5px;font-size:12px;color:#4c436b}\n.cdx-detail-progress p{margin:0 0 9px;font-size:11px;color:#9b95ab;line-height:1.5}\n.cdx-rule{margin-top:9px}\n.cdx-rule-title{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:#70698a;margin-bottom:5px}\n.cdx-rule-title strong{color:#5045a2;font-variant-numeric:tabular-nums}\n.cdx-rule-track{height:6px;border-radius:99px;background:#e6e0f1;overflow:hidden}\n.cdx-rule-track>i{display:block;height:100%;background:#8972de;border-radius:99px}\n.cdx-detail-status{font-size:11px;font-weight:800;color:#6550ba;margin:9px 0}\n.cdx-detail-action{width:100%;border:0;border-radius:12px;background:#7261d8;padding:13px 10px;color:#fff;font-weight:850;font-size:13px;cursor:pointer}\n.cdx-detail-action:disabled{background:#efedf5;color:#9390a0;cursor:default}\n.cdx-detail-secondary{display:block;text-align:center;color:#887fa8;font-size:11px;margin-top:9px;line-height:1.5}\n@media(min-width:600px){.cdx-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.cdx-figure{height:197px}.cdx-detail-mask{align-items:center}.cdx-detail{border-radius:22px}}\n@media(min-width:850px){.cdx-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}\n@media(max-width:375px){.cdx-ring{width:68px;height:68px;flex-basis:68px}.cdx-ring-inner{width:56px;height:56px}.cdx-stat strong{font-size:15px}.cdx-figure{height:157px}.cdx-card-body{padding:8px}.cdx-detail-image{height:auto;aspect-ratio:1/1}}\n@media(prefers-reduced-motion:reduce){.cdx-card,.cdx-progress>i{transition:none}}\n\n.cdx-next-goal{display:flex;gap:10px;align-items:center;border:1px solid #e9e2fa;border-radius:15px;background:#fff;padding:10px;margin-top:15px;text-align:left}\n.cdx-next-portrait{width:72px;height:80px;flex:0 0 72px;display:grid;place-items:center;border-radius:12px;background:radial-gradient(circle,#fff,#eeebfb);overflow:hidden}\n.cdx-next-portrait img{width:90%;height:90%;object-fit:contain}\n.cdx-next-copy{flex:1;min-width:0}\n.cdx-next-eyebrow{font-size:10px;letter-spacing:.04em;font-weight:800;color:#8c75d7;margin:0 0 3px}\n.cdx-next-name{font-size:13px;font-weight:900;color:#37314f;margin:0 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.cdx-next-hint{font-size:10px;color:#8e859f;margin:0 0 6px;line-height:1.4}\n.cdx-next-meter{height:5px;overflow:hidden;border-radius:20px;background:#ece9f5}\n.cdx-next-meter i{display:block;height:100%;border-radius:20px;background:#9277dd}\n.cdx-next-open{border:1px solid #cfc6ee;flex:0 0 auto;background:#f4f0ff;color:#5f4bb7;border-radius:10px;padding:10px 9px;font-size:11px;font-weight:850;cursor:pointer}\n.cdx-compare-label{display:flex;justify-content:space-between;align-items:center;margin:13px 0 6px;color:#827a95;font-size:11px;font-weight:700;gap:8px}\n.cdx-stage-tabs{gap:7px}\n.cdx-stage-tab{padding:6px 5px 8px;min-width:0;overflow:hidden}\n.cdx-stage-thumb{height:clamp(78px,24vw,119px);width:100%;display:grid;place-items:center;background:radial-gradient(circle,#fff,#f2eef9);border-radius:8px;overflow:hidden;margin-bottom:5px}\n.cdx-stage-thumb img{display:block;width:94%;height:94%;object-fit:contain;object-position:center}\n.cdx-stage-tab[aria-pressed=true] .cdx-stage-thumb{background:radial-gradient(circle,#fff,#e2d9ff)}\n.cdx-stage-tab .cdx-stage-title{display:block;font-size:11px;font-weight:900}\n@media(max-width:375px){.cdx-next-portrait{width:60px;height:70px;flex-basis:60px}.cdx-next-open{padding:8px 7px}.cdx-next-name{font-size:12px}.cdx-stage-thumb{height:76px}}\n";document.head.appendChild(style);
  const FAVORITES_KEY="quest-day-codex-favorites-v1";
  const ranks={common:0,rare:1,epic:2,legendary:3};
  const rarityLabels={common:"일반",rare:"희귀",epic:"영웅",legendary:"전설"};
  const tones={common:"#68c397",rare:"#82aff0",epic:"#ae8aec",legendary:"#e1ba69"};
  const milestone=[6,12,18,24];
  const state={status:"all",group:"all",rarity:"all",sort:"featured",query:"",favoriteOnly:false,detailStage:1,detailId:""};
  let context=null;
  let favorites=new Set();
  try{const value=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");if(Array.isArray(value))favorites=new Set(value.filter(x=>typeof x==="string"));}catch(_){}
  function esc(x){return String(x??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));}
  function pct(n,d){return d>0?Math.min(100,Math.round(Math.max(0,n)/d*100)):100}
  function isOwned(c){return !!context.owned(c)}
  function isUnlocked(c){return !!context.unlocked(c)}
  function stage(c){return Math.max(1,Math.min(3,context.stage(c)))}
  function canBuy(c){return !isOwned(c)&&isUnlocked(c)&&context.gold>=Number(c.price||0)}
  function status(c){return isOwned(c)?"owned":canBuy(c)?"obtainable":isUnlocked(c)?"affordable":"locked";}
  function matches(c){
    const st=status(c);
    if(state.status==="owned"&&st!=="owned")return false;
    if(state.status==="missing"&&st==="owned")return false;
    if(state.status==="obtainable"&&st!=="obtainable")return false;
    if(state.status==="favorite"&&!favorites.has(c.id))return false;
    if(state.group==="original"&&c.collection==="vanguard")return false;
    if(state.group==="vanguard"&&c.collection!=="vanguard")return false;
    if(state.rarity!=="all"&&state.rarity!==c.rarity)return false;
    const query=state.query.trim().toLocaleLowerCase();
    return !query || (c.name+" "+(c.role||"")+" "+(c.id||"")).toLocaleLowerCase().includes(query);
  }
  function sorting(a,b){
    if(state.sort==="rarity")return (ranks[b.rarity]-ranks[a.rarity]) || a.name.localeCompare(b.name,"ko");
    if(state.sort==="name")return a.name.localeCompare(b.name,"ko");
    if(state.sort==="stage")return (isOwned(b)?stage(b):0)-(isOwned(a)?stage(a):0) || (ranks[b.rarity]-ranks[a.rarity]);
    function key(c){const s=status(c);return s==="obtainable"?0:s==="owned"?1:s==="affordable"?2:3;}
    return key(a)-key(b)||(ranks[b.rarity]-ranks[a.rarity])||a.name.localeCompare(b.name,"ko");
  }
  function artUrl(c,n){
    const id=encodeURIComponent(c.id);
    if(c.collection==="vanguard"){
      const ext=c.id==="hero_elin"&&n===1?".svg":".webp";
      return "./art/painted/individual/"+id+"-stage"+n+ext+"?v=20261115-24";
    }
    return "./art/evolution/"+id+"-stage"+n+".svg?v=35";
  }
  function milestoneMessage(count){
    const next=milestone.find(n=>n>count);
    return next?"다음 마일스톤까지 "+(next-count)+"명 남았어요":"24명의 수호자를 모두 모았어요!";
  }
  function card(c){
    const s=status(c),lv=isOwned(c)?stage(c):0;
    const rarityLabel=rarityLabels[c.rarity]||"일반";
    const isEquipped=context.equipped===c.id;
    const fav=favorites.has(c.id),tone=tones[c.rarity]||"#9f90bc";
    const stateText=s==="owned"?"✓ 보유 · 진화 "+lv+"/3":s==="obtainable"?"✦ 지금 획득 가능":s==="affordable"?"🪙 골드가 더 필요해요":"🔒 해금 조건 달성 전";
    const title=c.role?(c.name+" · "+c.role):c.name;
    return '<article class="cdx-card '+(s==="locked"?"unseen ":"")+s+'" data-rarity="'+esc(c.rarity)+'" style="--cdx-tone:'+tone+'">'+
      '<button type="button" class="cdx-fav" data-cdx-fav="'+esc(c.id)+'" aria-label="'+esc(c.name)+(fav?" 관심 해제":" 관심 캐릭터 등록")+'" aria-pressed="'+fav+'">'+(fav?"★":"☆")+'</button>'+
      '<button type="button" class="cdx-card-main" data-cdx-detail="'+esc(c.id)+'" aria-label="'+esc(title)+' 상세 보기">'+
        '<div class="cdx-figure"><div class="cdx-topline"><span class="cdx-rarity '+esc(c.rarity)+'">'+rarityLabel+'</span>'+(isEquipped?'<span class="cdx-equip-marker">대표</span>':'')+'</div>'+
        context.portrait(c)+'</div>'+
        '<div class="cdx-card-body"><h4>'+esc(c.name)+'</h4><small>'+esc(c.role||(c.collection==="vanguard"?"전투 영웅":"기존 수호자"))+'</small>'+
        '<span class="cdx-state '+(s==="owned"?"owned":s==="obtainable"?"obtainable":"locked")+'">'+stateText+'</span>'+
        '<div class="cdx-stage-bars" aria-label="보유 진화 단계 '+lv+'/3">'+[1,2,3].map(n=>'<span class="'+(lv>=n?"on":"")+'"></span>').join("")+'</div></div>'+
      '</button><div class="cdx-cta">'+(s==="owned"?"진화 정보 · 외형 보기":s==="obtainable"?"획득 조건 달성! 자세히 보기":"해금 목표 · 일러스트 미리보기")+'</div>'+
    '</article>';
  }
  function paintGrid(){
    if(!context)return;
    const grid=context.container.querySelector("#cdxGrid");
    if(!grid)return;
    const chosen=context.catalog.filter(matches).sort(sorting);
    grid.innerHTML=chosen.length?chosen.map(card).join(""):'<div class="cdx-empty">해당 조건의 캐릭터가 없어요.<br>필터를 바꾸거나 검색어를 지워 보세요.</div>';
    const result=context.container.querySelector("#cdxResultCount");
    if(result)result.textContent=chosen.length+"명 표시 중";
  }
  function recommendedGoal(){
    const remaining=context.catalog.filter(c=>!isOwned(c));
    if(!remaining.length)return null;
    function ruleProgress(c){
      const rules=c.unlockCondition?.rules||[];
      if(!rules.length)return 1;
      return Math.min(...rules.map(r=>Math.min(1,Math.max(0,Number(context.metric(r.metric))||0)/Math.max(1,Number(r.min)||1))));
    }
    remaining.sort((a,b)=>{
      const priority=c=>canBuy(c)?0:isUnlocked(c)?1:2;
      return priority(a)-priority(b) || ruleProgress(b)-ruleProgress(a) ||
        (ranks[b.rarity]||0)-(ranks[a.rarity]||0);
    });
    const character=remaining[0],unlockReady=isUnlocked(character);
    const unmetGold=Math.max(0,Number(character.price||0)-context.gold);
    const progress=unlockReady ? (unmetGold?Math.min(99,pct(context.gold,Math.max(1,Number(character.price||0)))):100) : Math.round(ruleProgress(character)*100);
    return {character,progress,
      hint:canBuy(character)?"획득 조건을 모두 달성했어요":unlockReady?"필요한 골드 "+unmetGold.toLocaleString("ko-KR")+" G": "해금 조건 "+progress+"% 진행 중"};
  }
  function goalCard(){
    const goal=recommendedGoal();
    if(!goal)return '<div class="cdx-next-goal"><div class="cdx-next-copy"><p class="cdx-next-eyebrow">COLLECTION COMPLETE</p><p class="cdx-next-name">모든 캐릭터를 모았어요!</p><p class="cdx-next-hint">이제 각 영웅의 진화 과정을 완성해 보세요.</p></div></div>';
    const c=goal.character;
    return '<div class="cdx-next-goal"><div class="cdx-next-portrait"><img src="'+artUrl(c,1)+'" alt="" loading="lazy" decoding="async"></div>'+
      '<div class="cdx-next-copy"><p class="cdx-next-eyebrow">다음 수집 목표</p><p class="cdx-next-name">'+esc(c.name)+(c.role?' · '+esc(c.role):'')+'</p>'+
      '<p class="cdx-next-hint">'+esc(goal.hint)+'</p><div class="cdx-next-meter"><i style="width:'+goal.progress+'%"></i></div></div>'+
      '<button class="cdx-next-open" type="button" data-cdx-goal="'+esc(c.id)+'">상세 보기</button></div>';
  }
  function summary(){
    const all=context.catalog,ownedCount=all.filter(isOwned).length;
    const maxed=all.filter(c=>isOwned(c)&&stage(c)===3).length;
    const available=all.filter(canBuy).length;
    const progress=pct(ownedCount,all.length);
    const earnedSteps=milestone.map(n=>'<span class="'+(ownedCount>=n?"done":"")+'">'+(ownedCount>=n?"✓ ":"") + n+'명</span>').join("");
    return '<section class="cdx-header"><p class="cdx-kicker">MY GUARDIAN COLLECTION</p><h2>나만의 수호자 도감</h2>'+
      '<p class="cdx-sub">오늘의 작은 성취가 새로운 동료가 되는 곳</p>'+
      '<div class="cdx-summary"><div class="cdx-ring" role="img" aria-label="수집률 '+progress+'퍼센트" style="--pct:'+progress+'%"><div class="cdx-ring-inner"><strong>'+progress+'%</strong><span>수집률</span></div></div>'+
      '<div class="cdx-stats"><div class="cdx-stat"><strong>'+ownedCount+'/'+all.length+'</strong><span>보유 영웅</span></div>'+
      '<div class="cdx-stat"><strong>'+maxed+'</strong><span>최종 진화</span></div>'+
      '<div class="cdx-stat"><strong>'+available+'</strong><span>획득 가능</span></div></div></div>'+
      '<div class="cdx-milestone-top"><span>컬렉션 마일스톤</span><b>'+milestoneMessage(ownedCount)+'</b></div>'+
      '<div class="cdx-progress" role="progressbar" aria-label="보유 캐릭터 수집 진행도" aria-valuenow="'+ownedCount+'" aria-valuemin="0" aria-valuemax="'+all.length+'"><i style="width:'+progress+'%"></i></div>'+
      '<div class="cdx-checkpoints">'+earnedSteps+'</div>'+goalCard()+'</section>';
  }
  function toolbar(){
    const types=[["all","전체"],["owned","보유 중"],["missing","미보유"],["obtainable","획득 가능"],["favorite","★ 관심"]];
    return '<section class="cdx-toolbar" aria-label="도감 검색 및 필터">'+
      '<label class="cdx-searchbar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="#8e85ac" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>'+
      '<input id="cdxSearch" type="search" placeholder="캐릭터 이름이나 직업 검색" aria-label="캐릭터 검색" autocomplete="off" value="'+esc(state.query)+'"></label>'+
      '<div class="cdx-filter-row" role="group" aria-label="보유 상태 필터">'+types.map(t=>'<button type="button" class="cdx-filter" data-cdx-status="'+t[0]+'" aria-pressed="'+(state.status===t[0])+'">'+t[1]+'</button>').join("")+'</div>'+
      '<div class="cdx-dropdowns">'+
        '<label>컬렉션<select id="cdxGroup"><option value="all"'+(state.group==="all"?" selected":"")+'>전체 24명</option><option value="original"'+(state.group==="original"?" selected":"")+'>기존 수호자</option><option value="vanguard"'+(state.group==="vanguard"?" selected":"")+'>신규 영웅단</option></select></label>'+
        '<label>희귀도<select id="cdxRarity">'+[["all","전체 희귀도"],["common","일반"],["rare","희귀"],["epic","영웅"],["legendary","전설"]].map(x=>'<option value="'+x[0]+'"'+(state.rarity===x[0]?" selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
      '</div><div class="cdx-dropdowns">'+
        '<label>정렬<select id="cdxSort">'+[["featured","추천순 (획득 가능 먼저)"],["rarity","희귀도 높은 순"],["stage","진화 단계 높은 순"],["name","이름순"]].map(x=>'<option value="'+x[0]+'"'+(state.sort===x[0]?" selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
        '<label>보유 골드<input value="'+Math.max(0,context.gold).toLocaleString("ko-KR")+' G" disabled aria-label="현재 보유 골드" style="width:100%;font-size:12px;color:#8a71a8;border:1px solid #dfdaec;background:#f9f7fc;padding:9px 10px;border-radius:10px"></label>'+
      '</div></section>';
  }
  function ruleRows(rules){
    if(!rules.length)return '<p>기본 캐릭터 또는 별도의 잠금 해제 조건이 없습니다.</p>';
    return rules.map(rule=>{
      const actual=Math.max(0,Number(context.metric(rule.metric))||0),required=Math.max(0,Number(rule.min)||0);
      const progress=pct(actual,required);
      return '<div class="cdx-rule"><div class="cdx-rule-title"><span>'+esc(context.ruleLabel(rule.metric))+'</span><strong>'+actual+' / '+required+(actual>=required?' ✓':'')+'</strong></div>'+
        '<div class="cdx-rule-track"><i style="width:'+progress+'%"></i></div></div>';
    }).join("");
  }
  function modalMarkup(c){
    const stageNumber=state.detailStage,owned=isOwned(c),currentStage=stage(c);
    const unlocked=isUnlocked(c),equip=context.equipped===c.id;
    const rarity=rarityLabels[c.rarity]||"일반",evo=c.evolution?.find(x=>x.stage===stageNumber),req=evo?.requirement;
    const stageText=!owned?"보유 후 진화할 수 있어요":stageNumber<=currentStage?"달성한 진화 단계예요":"아직 진화하지 않은 미래 모습이에요";
    const buttonText=equip?"대표 캐릭터로 장착 중":owned?"대표 캐릭터로 장착하기":!unlocked?"해금 조건을 먼저 달성해 주세요":context.gold<(c.price||0)?(Number(c.price||0)-context.gold)+" G 더 필요해요":Number(c.price||0)===0?"캐릭터 획득하기":(c.price||0)+" G로 획득하기";
    const disabled=equip||(!owned&&(!unlocked||context.gold<(c.price||0)));
    let progressTitle="",progressBody="";
    if(!owned){
      progressTitle="캐릭터 획득 조건";
      progressBody=ruleRows(c.unlockCondition?.rules||[]);
    }else if(req&&stageNumber>currentStage){
      progressTitle="이 단계로 진화하려면";
      progressBody=ruleRows([req]);
    }else{
      const next=c.evolution?.find(x=>x.stage===currentStage+1);
      progressTitle=next?"다음 진화 목표":"캐릭터 성장 기록";
      progressBody=next?.requirement?ruleRows([next.requirement]):'<p>현재 달성 가능한 최고 진화 단계예요!</p>';
    }
    return '<div class="cdx-detail" role="document">'+
      '<div class="cdx-detail-top"><span class="cdx-rarity '+esc(c.rarity)+'">'+rarity+'</span>'+
      '<button type="button" class="cdx-close" data-cdx-close aria-label="상세 닫기">×</button></div>'+
      '<h3 class="cdx-detail-heading">'+esc(c.name)+(c.role?' · '+esc(c.role):'')+'</h3>'+
      '<p class="cdx-detail-sub">'+esc(c.tagline||"")+'</p>'+
      '<div class="cdx-detail-image"><img src="'+artUrl(c,stageNumber)+'" alt="'+esc(c.name)+' 진화 '+stageNumber+'단계 일러스트" loading="eager" decoding="async"></div>'+
      '<div class="cdx-compare-label"><span>진화 단계별 원화 비교</span><span>그림을 눌러 크게 보기</span></div>'+
      '<div class="cdx-stage-tabs" role="group" aria-label="진화 단계 원화 비교">'+[1,2,3].map(n=>'<button type="button" class="cdx-stage-tab" data-cdx-stage="'+n+'" aria-label="'+esc(c.name)+' '+n+'단계 원화 확대" aria-pressed="'+(n===stageNumber)+'">'+
        '<span class="cdx-stage-thumb"><img src="'+artUrl(c,n)+'" alt="" loading="lazy" decoding="async"></span><span class="cdx-stage-title">'+n+'단계</span><span>'+(!owned?"미리보기":n<=currentStage?"달성":"미달성")+'</span></button>').join("")+'</div>'+
      '<p class="cdx-detail-status">'+(owned?"✓ 보유 중 · 현재 "+currentStage+"/3단계":"🔒 미보유 · "+(unlocked?"획득 조건 달성":"해금 진행 중"))+' · '+stageText+'</p>'+
      '<section class="cdx-detail-progress"><h4>'+progressTitle+'</h4><p>'+(!owned?"조건을 충족하면 획득할 수 있어요.": "퀘스트 성과가 쌓이면 자동으로 진화해요.")+'</p>'+progressBody+'</section>'+
      '<button type="button" class="cdx-detail-action" data-cdx-action="'+esc(c.id)+'"'+(disabled?' disabled':'')+'>'+esc(buttonText)+'</button>'+
      '<span class="cdx-detail-secondary">이 화면은 실제 보유 기록을 변경하지 않는 원화 미리보기를 제공합니다.</span></div>';
  }
  function closeDetail(){const mask=document.getElementById("cdxDetailMask");if(mask)mask.classList.remove("open");document.body.style.overflow="";if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
  let lastFocus=null;
  function showDetail(id,stageNumber){
    const c=context?.catalog.find(c=>c.id===id);if(!c)return;
    const mask=document.getElementById("cdxDetailMask");if(!mask)return;
    const wasOpen=mask.classList.contains("open");
    if(!wasOpen)lastFocus=document.activeElement;
    state.detailId=c.id;
    state.detailStage=Math.max(1,Math.min(3,Number(stageNumber)||stage(c)));
    const prior=mask.querySelector(".cdx-detail")?.scrollTop||0;
    mask.innerHTML=modalMarkup(c);mask.classList.add("open");document.body.style.overflow="hidden";
    if(wasOpen){mask.querySelector(".cdx-detail").scrollTop=prior}
    else mask.querySelector(".cdx-close")?.focus();
  }
  function render(ctx){
    if(!ctx || !Array.isArray(ctx.catalog) || !ctx.container)return;
    context=ctx;
    ctx.container.classList.add("cdx-enabled");
    ctx.container.innerHTML='<div class="cdx-shell">'+summary()+toolbar()+
      '<div class="cdx-list-head"><h3>전체 캐릭터</h3><span id="cdxResultCount"></span></div>'+
      '<div id="cdxGrid" class="cdx-grid"></div>'+
      '<p class="cdx-footer">보유한 캐릭터만 진화 수집 현황에 반영됩니다.<br>관심 표시와 미리보기는 골드나 게임 기록을 소모하지 않아요.</p></div>';
    if(!document.getElementById("cdxDetailMask")){
      const mask=document.createElement("div");mask.className="cdx-detail-mask";mask.id="cdxDetailMask";
      mask.setAttribute("role","dialog");mask.setAttribute("aria-modal","true");mask.setAttribute("aria-label","수호자 도감 상세");
      document.body.appendChild(mask);
      mask.addEventListener("click",event=>{
        if(event.target===mask||event.target.closest("[data-cdx-close]")){closeDetail();return;}
        const nextStage=event.target.closest("[data-cdx-stage]");
        if(nextStage){showDetail(state.detailId,nextStage.dataset.cdxStage);return;}
        const action=event.target.closest("[data-cdx-action]");
        if(action){closeDetail();context.action(action.dataset.cdxAction);}
      });
      document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&mask.classList.contains("open")){ev.preventDefault();closeDetail()}});
    }
    if(!ctx.container.dataset.cdxBound){
      ctx.container.dataset.cdxBound="yes";
      ctx.container.addEventListener("click",event=>{
        const star=event.target.closest("[data-cdx-fav]");
        if(star){
          const id=star.dataset.cdxFav;
          if(favorites.has(id))favorites.delete(id);else favorites.add(id);
          try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));}catch(_){}
          paintGrid();return;
        }
        const button=event.target.closest("[data-cdx-status]");
        if(button){
          state.status=button.dataset.cdxStatus;
          ctx.container.querySelectorAll("[data-cdx-status]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
          paintGrid();return;
        }
        const goal=event.target.closest("[data-cdx-goal]");
        if(goal){showDetail(goal.dataset.cdxGoal);return;}
        const detail=event.target.closest("[data-cdx-detail]");
        if(detail){showDetail(detail.dataset.cdxDetail);}
      });
      ctx.container.addEventListener("input",event=>{
        if(event.target.id==="cdxSearch"){state.query=event.target.value;paintGrid();}
      });
      ctx.container.addEventListener("change",event=>{
        if(event.target.id==="cdxGroup")state.group=event.target.value;
        else if(event.target.id==="cdxRarity")state.rarity=event.target.value;
        else if(event.target.id==="cdxSort")state.sort=event.target.value;
        else return;
        paintGrid();
      });
    }
    paintGrid();
  }
  window.QuestDayCodex=Object.freeze({render});
})();
