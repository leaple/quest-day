/* QUEST DAY 1.2 — RPG shop, character, recurring quests and challenges.
   Compatible with QUEST DAY 1.0/1.1. The existing localStorage key is unchanged. */
(function () {
  "use strict";

  const shopItems = [
    {id:"starter", name:"기본 모험가", icon:"🧑‍🎒", price:0, level:1, desc:"모험의 시작"},
    {id:"forest", name:"숲의 탐험가", icon:"🧝", price:60, level:1, desc:"자연을 좋아하는 탐험가"},
    {id:"mage", name:"별빛 마법사", icon:"🧙", price:120, level:2, desc:"별빛을 다루는 마법사"},
    {id:"ninja", name:"그림자 닌자", icon:"🥷", price:180, level:3, desc:"조용히 목표를 완수하는 달인"},
    {id:"knight", name:"빛의 기사", icon:"🦸", price:260, level:5, desc:"꾸준함으로 빛나는 영웅"},
    {id:"astronaut", name:"우주 개척자", icon:"👩‍🚀", price:400, level:8, desc:"새로운 세계를 탐험해요"}
  ];

  const css = document.createElement("style");
  css.textContent = [
    ".rpg-shell{margin:15px 0;padding:18px;border-radius:19px;background:linear-gradient(120deg,#eeebff,#f7f4ff);border:1px solid #e6e1ff}",
    ".rpg-line{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
    ".rpg-avatar{font-size:49px;line-height:1.2;display:grid;place-items:center;width:78px;height:78px;border-radius:23px;background:#fff;box-shadow:0 5px 14px #5144c51a}",
    ".rpg-name{font-size:15px;font-weight:850;margin-bottom:5px}.rpg-muted{font-size:12px;color:#7f809b;line-height:1.5}",
    ".rpg-coin{font-size:13px;font-weight:800;color:#ac7b1b;background:#fff5d7;padding:8px 12px;border-radius:25px}",
    ".rpg-panel{background:#fff;border:1px solid #e8e9f2;border-radius:18px;padding:17px;margin:13px 0}",
    ".rpg-panel h3{font-size:16px;margin:0 0 10px}",
    ".rpg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}",
    ".rpg-item{border:1px solid #e8e9f2;border-radius:15px;padding:15px;background:#fff;text-align:center}",
    ".rpg-item-icon{font-size:45px;display:grid;place-items:center;background:#f5f3ff;border-radius:15px;width:77px;height:77px;margin:0 auto 8px}",
    ".rpg-item strong{font-size:13px}.rpg-item .rpg-muted{min-height:36px;margin:6px 0}",
    ".rpg-action{background:#7665e5;color:#fff;font-size:12px;font-weight:800;border-radius:10px;padding:10px 11px;width:100%}",
    ".rpg-action:disabled{background:#eeeef4;color:#9497a9;cursor:default}",
    ".rpg-badge{display:inline-block;font-size:11px;font-weight:750;background:#eeeaff;color:#6555d5;border-radius:20px;padding:6px 10px}",
    ".rpg-challenge{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid #eeeef4}",
    ".rpg-challenge:last-child{border-bottom:0}.rpg-challenge-icon{font-size:26px;flex:none}",
    ".rpg-challenge-detail{min-width:0;flex:1}.rpg-challenge-detail strong{font-size:13px}",
    ".rpg-challenge-detail .rpg-muted{margin-top:3px}",
    ".rpg-challenge .rpg-action{width:auto;white-space:nowrap;min-width:76px}",
    ".rpg-periods{display:flex;gap:7px;flex-wrap:wrap;margin:3px 0 14px}",
    ".rpg-period{background:#fff;color:#8588a2;padding:7px 10px;border-radius:20px;border:1px solid #e8e9f2;font-size:12px}",
    ".rpg-period.selected{background:#eae7ff;border-color:#d9d2ff;color:#6655d5;font-weight:800}",
    ".rpg-hero{display:flex;align-items:center;gap:14px}.rpg-hero-text{flex:1;min-width:0}",
    ".rpg-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px}",
    ".rpg-detail span{background:#f6f4ff;padding:11px;border-radius:11px;font-size:12px}",
    "@media(max-width:400px){.rpg-item{padding:11px}.rpg-panel{padding:14px}.rpg-challenge{gap:8px}.rpg-challenge .rpg-action{min-width:65px;padding:9px 7px}}"
  ].join("");
  document.head.appendChild(css);

  const rank = level => level >= 15 ? "전설의 모험가" :
    level >= 10 ? "마스터 모험가" :
    level >= 5 ? "숙련 모험가" : "초보 모험가";

  function ensureRpg() {
    if (!state.rpg || typeof state.rpg !== "object") {
      state.rpg = {purchases:[], claimed:{}, equipped:"starter"};
      saveState();
    }
    if (!Array.isArray(state.rpg.purchases)) state.rpg.purchases = [];
    if (!state.rpg.claimed || typeof state.rpg.claimed !== "object") state.rpg.claimed = {};
    if (typeof state.rpg.equipped !== "string") state.rpg.equipped = "starter";
  }

  function owned(itemId) {
    return itemId === "starter" || state.rpg.purchases.some(p => p && p.id === itemId);
  }

  function goldBalance() {
    const earned = state.events.reduce((sum, event) =>
      sum + Math.max(0, Math.floor(Number(event.xp) / 2) || 0), 0);
    const bonuses = Object.values(state.rpg.claimed).reduce((sum, value) =>
      sum + (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0), 0);
    const spent = state.rpg.purchases.reduce((sum, purchase) =>
      sum + (Number.isFinite(Number(purchase.cost)) ? Math.max(0, Number(purchase.cost)) : 0), 0);
    return earned + bonuses - spent;
  }

  function mondayKey(day) {
    const bits = day.split("-").map(Number);
    const d = new Date(bits[0], bits[1] - 1, bits[2], 12, 0, 0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return dateKey(d);
  }

  function isCompleted(task) {
    return state.events.find(event => {
      if (event.taskId !== task.id) return false;
      if (task.frequency === "once") return true;
      if (task.frequency === "weekly") return mondayKey(event.day) === mondayKey(dateKey());
      if (task.frequency === "monthly") return event.day.slice(0, 7) === dateKey().slice(0, 7);
      return event.day === dateKey();
    });
  }

  // Override old task-completion rules to support weekly/monthly period resets.
  completion = isCompleted;
  visibleTasks = function () {
    return state.tasks.filter(task => {
      if (task.frequency !== "once") return true;
      const event = isCompleted(task);
      return !event || event.day === dateKey();
    });
  };
  toggleTask = function (id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const event = isCompleted(task);
    if (event) {
      state.events = state.events.filter(e => e.id !== event.id);
    } else {
      state.events.push({
        id: uid(), taskId: id, day: dateKey(), xp: Number(task.xp) || 0
      });
    }
    saveState();
    render();
  };

  const frequencySelect = document.getElementById("frequency");
  if (frequencySelect && !frequencySelect.querySelector('[value="weekly"]')) {
    frequencySelect.insertAdjacentHTML("beforeend",
      '<option value="weekly">매주 반복</option><option value="monthly">매월 반복</option>');
  }

  const home = document.getElementById("home");
  const hero = home && home.querySelector(".hero");
  const avatarCard = document.createElement("section");
  avatarCard.id = "rpgAvatarHome";
  if (hero) hero.insertAdjacentElement("afterend", avatarCard);

  const growth = document.getElementById("growth");
  const growPanel = document.createElement("div");
  growPanel.id = "rpgGrowthCharacter";
  if (growth) growth.insertBefore(growPanel, growth.querySelector(".section-title"));

  const challenges = document.createElement("section");
  challenges.id = "rpgChallenges";
  if (growth) growth.appendChild(challenges);

  const filters = document.createElement("div");
  filters.className = "rpg-periods";
  filters.id = "rpgFilters";
  filters.setAttribute("aria-label", "퀘스트 반복 주기 필터");
  const questList = document.getElementById("questList");
  if (questList) questList.insertAdjacentElement("beforebegin", filters);

  const app = document.querySelector(".app");
  const shopPage = document.createElement("section");
  shopPage.className = "page";
  shopPage.id = "rpgShop";
  if (app) app.appendChild(shopPage);
  const nav = document.querySelector("nav");
  const shopNav = document.createElement("button");
  shopNav.dataset.page = "rpgShop";
  shopNav.innerHTML = "<b>🛍</b>상점";
  if (nav) {
    nav.insertBefore(shopNav, nav.querySelector('[data-page="settings"]'));
    shopNav.addEventListener("click", function () {
      nav.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn === shopNav));
      document.querySelectorAll(".page").forEach(page =>
        page.classList.toggle("active", page.id === "rpgShop"));
      window.scrollTo(0, 0);
    });
  }

  const periodLabels = {daily:"매일",once:"1회",weekly:"매주",monthly:"매월"};
  let selectedPeriod = "all";
  filters.addEventListener("click", e => {
    const btn = e.target.closest("[data-period]");
    if (!btn) return;
    selectedPeriod = btn.dataset.period;
    render();
  });

  const challengeDefs = [
    {id:"first",icon:"🌟",title:"첫 발걸음",desc:"퀘스트 1개 완료",gold:20,
      check:() => state.events.length >= 1},
    {id:"five",icon:"🏅",title:"작은 승리",desc:"퀘스트 5개 완료",gold:35,
      check:() => state.events.length >= 5},
    {id:"ten",icon:"🏆",title:"열 번의 도전",desc:"퀘스트 10개 완료",gold:65,
      check:() => state.events.length >= 10},
    {id:"lv5",icon:"👑",title:"성장한 모험가",desc:"레벨 5 달성",gold:100,
      check:() => levelInfo().level >= 5},
    {id:"week5",icon:"📅",title:"이번 주의 영웅",desc:"이번 주 퀘스트 5개 완료",gold:40,
      check:() => state.events.filter(e => mondayKey(e.day) === mondayKey(dateKey())).length >= 5},
    {id:"month20",icon:"💎",title:"한 달의 도전자",desc:"이번 달 퀘스트 20개 완료",gold:120,
      check:() => state.events.filter(e => e.day.slice(0,7) === dateKey().slice(0,7)).length >= 20}
  ];

  function shopHtml() {
    const equipped = shopItems.find(item => item.id === state.rpg.equipped) || shopItems[0];
    const level = levelInfo().level;
    return '<h2>🛍️ 모험가 상점</h2><div class="rpg-panel">' +
      '<div class="rpg-line"><div><strong>현재 장착: ' + equipped.name + '</strong>' +
      '<div class="rpg-muted">퀘스트로 모은 골드로 외형을 바꿔 보세요.</div></div>' +
      '<span class="rpg-coin">🪙 ' + Math.max(0, goldBalance()) + ' G</span></div></div>' +
      '<div class="rpg-grid">' + shopItems.map(item => {
        const has = owned(item.id);
        const active = state.rpg.equipped === item.id;
        const levelLocked = level < item.level;
        const canBuy = goldBalance() >= item.price;
        const label = active ? "장착 중" : has ? "장착하기" :
          levelLocked ? "Lv." + item.level + " 필요" :
          !canBuy ? item.price + " G 필요" : item.price + " G 구매";
        return '<article class="rpg-item"><div class="rpg-item-icon">' + item.icon +
          '</div><strong>' + item.name + '</strong><p class="rpg-muted">' + item.desc +
          '</p><button class="rpg-action" data-buy="' + item.id + '"' +
          (active || (!has && (levelLocked || !canBuy)) ? " disabled" : "") + '>' +
          label + '</button></article>';
      }).join("") + '</div><p class="rpg-muted">아이템은 캐릭터 외형을 꾸미는 용도이며 실제 결제가 필요하지 않습니다.</p>';
  }

  shopPage.addEventListener("click", event => {
    const button = event.target.closest("[data-buy]");
    if (!button) return;
    ensureRpg();
    const item = shopItems.find(i => i.id === button.dataset.buy);
    if (!item) return;
    if (!owned(item.id)) {
      if (levelInfo().level < item.level || goldBalance() < item.price) return;
      state.rpg.purchases.push({id:item.id, cost:item.price});
    }
    state.rpg.equipped = item.id;
    saveState();
    render();
  });

  challenges.addEventListener("click", event => {
    const button = event.target.closest("[data-claim]");
    if (!button) return;
    ensureRpg();
    const ch = challengeDefs.find(x => x.id === button.dataset.claim);
    if (!ch || state.rpg.claimed[ch.id] !== undefined || !ch.check()) return;
    state.rpg.claimed[ch.id] = ch.gold;
    saveState();
    render();
  });

  function drawRpg() {
    ensureRpg();
    const level = levelInfo().level;
    const item = shopItems.find(i => i.id === state.rpg.equipped) || shopItems[0];
    const count = state.events.length;
    const gold = Math.max(0, goldBalance());

    avatarCard.innerHTML =
      '<div class="rpg-shell"><div class="rpg-hero">' +
      '<div class="rpg-avatar" aria-hidden="true">' + item.icon + '</div>' +
      '<div class="rpg-hero-text"><div class="rpg-name">' + rank(level) +
      '</div><div class="rpg-muted">Lv. ' + level + ' · ' + item.name +
      '</div><div style="margin-top:8px"><span class="rpg-coin">🪙 ' + gold +
      ' G</span></div></div></div></div>';

    const headerAvatar = document.querySelector("header .avatar");
    if (headerAvatar) headerAvatar.textContent = item.icon;

    growPanel.innerHTML =
      '<div class="rpg-panel"><div class="rpg-hero">' +
      '<div class="rpg-avatar" aria-hidden="true">' + item.icon +
      '</div><div class="rpg-hero-text"><div class="rpg-name">' + rank(level) +
      '</div><div class="rpg-muted">장착 외형: ' + item.name +
      '</div><span class="rpg-badge">🪙 ' + gold + ' G</span></div></div>' +
      '<div class="rpg-detail"><span>⭐ 누적 완료 <b>' + count +
      '개</b></span><span>🎽 소유 외형 <b>' + (state.rpg.purchases.length + 1) +
      '개</b></span></div></div>';

    challenges.innerHTML =
      '<div class="rpg-panel"><h3>🏅 특별 도전과제 · 골드 보상</h3>' +
      challengeDefs.map(ch => {
        const claimed = state.rpg.claimed[ch.id] !== undefined;
        const ready = ch.check();
        const label = claimed ? "수령 완료" : ready ? "수령하기" : "도전 중";
        return '<div class="rpg-challenge">' +
          '<div class="rpg-challenge-icon">' + ch.icon + '</div>' +
          '<div class="rpg-challenge-detail"><strong>' + ch.title +
          '</strong><div class="rpg-muted">' + ch.desc + ' · 🪙 ' +
          ch.gold + ' G</div></div><button class="rpg-action" data-claim="' +
          ch.id + '"' + (!ready || claimed ? " disabled" : "") + '>' +
          label + '</button></div>';
      }).join("") + '</div>';

    const availablePeriods = ["all", "daily", "weekly", "monthly", "once"];
    const label = {all:"전체",daily:"매일",weekly:"매주",monthly:"매월",once:"1회"};
    filters.innerHTML = availablePeriods.map(p =>
      '<button class="rpg-period' + (selectedPeriod === p ? " selected" : "") +
      '" data-period="' + p + '">' + label[p] + '</button>').join("");

    let shown = 0;
    document.querySelectorAll("#questList .quest").forEach(row => {
      const id = row.querySelector("[data-toggle]")?.dataset.toggle;
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;
      const meta = row.querySelector(".quest-meta");
      if (meta) meta.textContent = (task.category || "기타") + " · " +
        (periodLabels[task.frequency] || "매일") + " 반복";
      const show = selectedPeriod === "all" || task.frequency === selectedPeriod;
      row.style.display = show ? "" : "none";
      if (show) shown++;
    });
    let empty = document.getElementById("rpgPeriodEmpty");
    if (empty) empty.remove();
    if (!shown && questList && questList.querySelector(".quest")) {
      empty = document.createElement("div");
      empty.id = "rpgPeriodEmpty";
      empty.className = "empty";
      empty.textContent = "해당 반복 주기의 퀘스트가 없어요.";
      questList.appendChild(empty);
    }

    shopPage.innerHTML = shopHtml();
    const settingsNote = document.querySelector("#settings .note");
    if (settingsNote && settingsNote.innerHTML.includes("MVP 1.0")) {
      settingsNote.innerHTML = settingsNote.innerHTML.replace("MVP 1.0", "MVP 1.2");
    }
  }

  // Preserve original 1.0/1.1 rendering and storage (including XP and achievements).
  const earlierRender = render;
  render = function () {
    earlierRender();
    drawRpg();
  };
  render();
})();
