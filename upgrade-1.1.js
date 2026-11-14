/* QUEST DAY 1.1 — daily goals and a seven-day growth dashboard.
   Preserves the original localStorage key, tasks and completion events. */
(function () {
  "use strict";

  const css = document.createElement("style");
  css.textContent = [
    ".qd-panel{background:#fff;border:1px solid #e8e9f2;border-radius:18px;padding:18px;margin:14px 0}",
    ".qd-panel h3{font-size:16px;margin:0 0 12px;color:#22243c}",
    ".qd-sub{font-size:12px;color:#898da5;line-height:1.5}",
    ".qd-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}",
    ".qd-selector{border:1px solid #dddafa;background:#f5f4ff;color:#6657d5;border-radius:9px;padding:8px;font-size:12px}",
    ".qd-track{background:#eeedf8;border-radius:20px;height:10px;overflow:hidden;margin:12px 0 8px}",
    ".qd-fill{display:block;background:linear-gradient(90deg,#7566e8,#37c9a6);height:100%;border-radius:20px}",
    ".qd-tag{background:#eae7ff;color:#6655d8;border-radius:20px;padding:7px 12px;font-weight:800;font-size:12px}",
    ".qd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}",
    ".qd-metric{background:#f5f4ff;border-radius:13px;padding:12px 7px;text-align:center;min-width:0}",
    ".qd-metric strong{display:block;font-size:20px;color:#6658d7;margin:5px 0}",
    ".qd-chart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;align-items:end;height:145px;margin-top:16px}",
    ".qd-day{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px}",
    ".qd-daybox{height:98px;width:100%;display:flex;justify-content:center;align-items:flex-end;background:#f6f5fb;border-radius:8px;overflow:hidden}",
    ".qd-daybar{display:block;width:100%;border-radius:8px 8px 0 0;background:linear-gradient(0deg,#7566e8,#aa95ff)}",
    ".qd-day b{font-size:11px;color:#66678c}.qd-day small{font-size:10px;color:#898da5}",
    ".qd-category{display:flex;justify-content:space-between;gap:14px;font-size:13px;padding:10px 0;border-bottom:1px solid #eeeef4}",
    ".qd-category:last-child{border-bottom:0}",
    "@media(max-width:410px){.qd-panel{padding:14px}.qd-chart{gap:5px}.qd-metric strong{font-size:17px}}"
  ].join("");
  document.head.appendChild(css);

  const homeGoal = document.createElement("section");
  homeGoal.id = "qdTodayGoal";
  const homeStats = document.querySelector("#home .stats");
  if (homeStats) homeStats.insertAdjacentElement("afterend", homeGoal);

  const growth = document.getElementById("growth");
  const dashboard = document.createElement("section");
  dashboard.id = "qdGrowthDashboard";
  if (growth) growth.appendChild(dashboard);

  function lastDays(count) {
    const days = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (let n = count - 1; n >= 0; n--) {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      days.push({key:dateKey(d), label:(d.getMonth() + 1) + "/" + d.getDate()});
    }
    return days;
  }

  function longestStreak() {
    const unique = Array.from(new Set(state.events.map(e => e.day))).sort();
    let best = 0, current = 0, previous = null;
    for (const date of unique) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const millis = Date.parse(date + "T12:00:00Z");
      if (!Number.isFinite(millis)) continue;
      current = previous !== null && millis - previous === 86400000 ? current + 1 : 1;
      best = Math.max(best, current);
      previous = millis;
    }
    return best;
  }

  function rankName(level) {
    return level >= 15 ? "전설의 모험가" :
      level >= 10 ? "마스터 모험가" :
      level >= 5 ? "숙련 모험가" : "초보 모험가";
  }

  function updateDashboard() {
    if (!homeGoal.isConnected || !dashboard.isConnected) return;

    const validGoals = [1, 3, 5];
    const goal = validGoals.includes(Number(state.dailyGoal)) ? Number(state.dailyGoal) : 3;
    const completedToday = todayEvents().length;
    const choices = validGoals.map(n => '<option value="' + n + '"' +
      (n === goal ? " selected" : "") + ">" + n + "개</option>").join("");

    homeGoal.innerHTML =
      '<div class="qd-panel">' +
      '<div class="qd-row"><h3 style="margin:0">🎯 오늘의 목표</h3>' +
      '<label class="qd-sub" for="qdGoal">목표 <select id="qdGoal" class="qd-selector">' +
      choices + '</select></label></div>' +
      '<div class="qd-track"><i class="qd-fill" style="width:' +
      Math.min(100, completedToday / goal * 100) + '%"></i></div>' +
      '<div class="qd-sub">' + completedToday + " / " + goal + "개 완료 · " +
      (completedToday >= goal ? "오늘의 목표를 달성했어요! 🎉" :
        "퀘스트를 하나씩 완료해 보세요.") + "</div></div>";

    const days = lastDays(7);
    const daySet = new Set(days.map(d => d.key));
    const counts = days.map(d => state.events.filter(e => e.day === d.key).length);
    const weekDone = counts.reduce((a, b) => a + b, 0);
    const weekXp = state.events.filter(e => daySet.has(e.day))
      .reduce((sum, e) => sum + Number(e.xp || 0), 0);
    const max = Math.max(1, ...counts);

    const bars = days.map((d, i) =>
      '<div class="qd-day"><b>' + counts[i] + '</b>' +
      '<div class="qd-daybox"><span class="qd-daybar" style="height:' +
      (counts[i] ? Math.max(8, counts[i] / max * 100) : 0) +
      '%"></span></div><small>' + d.label + '</small></div>'
    ).join("");

    const categoryNames = new Map(state.tasks.map(task => [task.id, task.category || "기타"]));
    const categoryCounts = new Map();
    for (const event of state.events) {
      const name = categoryNames.get(event.taskId) || "삭제된 퀘스트";
      categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
    }
    const categories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(entry => '<div class="qd-category"><span>' + escapeHtml(entry[0]) +
        '</span><strong>' + entry[1] + '회</strong></div>').join("");

    const level = levelInfo().level;
    dashboard.innerHTML =
      '<div class="qd-panel"><div class="qd-row"><h3>✨ 현재 칭호</h3>' +
      '<span class="qd-tag">' + rankName(level) + '</span></div>' +
      '<p class="qd-sub">현재 레벨 ' + level + ' · 레벨을 올리면 칭호가 바뀝니다.</p></div>' +
      '<div class="qd-panel"><h3>📊 최근 7일 성장 리포트</h3>' +
      '<div class="qd-grid">' +
      '<div class="qd-metric"><span class="qd-sub">완료</span><strong>' + weekDone +
      '</strong><span class="qd-sub">개</span></div>' +
      '<div class="qd-metric"><span class="qd-sub">획득 XP</span><strong>' + weekXp +
      '</strong><span class="qd-sub">XP</span></div>' +
      '<div class="qd-metric"><span class="qd-sub">최장 연속</span><strong>' + longestStreak() +
      '</strong><span class="qd-sub">일</span></div></div>' +
      '<div class="qd-chart" role="img" aria-label="최근 7일 완료 횟수: ' +
      counts.join(", ") + '">' + bars + '</div>' +
      '<p class="qd-sub">날짜별 퀘스트 완료 개수입니다.</p></div>' +
      '<div class="qd-panel"><h3>📚 카테고리별 누적 완료</h3>' +
      (categories || '<p class="qd-sub">첫 퀘스트를 완료하면 통계가 표시돼요.</p>') +
      '</div>';

    const select = document.getElementById("qdGoal");
    if (select) select.addEventListener("change", function () {
      state.dailyGoal = Number(this.value);
      saveState();
      render();
    });
  }

  // Wrap the existing render() without touching the localStorage key or quests.
  const originalRender = render;
  render = function () {
    originalRender();
    updateDashboard();
  };

  window.addEventListener("storage", function (event) {
    if (event.key === KEY) {
      state = loadState();
      render();
    }
  });
  window.addEventListener("pageshow", function () { render(); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) render();
  });
  render();
})();
