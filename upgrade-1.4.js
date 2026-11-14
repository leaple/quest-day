/* QUEST DAY 1.4 — quest editing, activity calendar, safe backup and evolution celebration.
   The existing quest-day-mvp-v1 storage key and the original task/event IDs stay unchanged. */
(function () {
  "use strict";

  const backupKey = KEY + ":autosnapshot-v1";
  const css = document.createElement("style");
  css.textContent = [
    ".qd14-edit{border:0;border-radius:8px;background:#f0edff;color:#6554c9;padding:7px 8px;font-size:12px;font-weight:800;white-space:nowrap}",
    ".qd14-overlay{position:fixed;inset:0;z-index:90;background:#111631b8;padding:12px;display:none;justify-content:center;align-items:center}",
    ".qd14-overlay.open{display:flex}.qd14-dialog{width:min(100%,470px);background:white;border-radius:24px;padding:20px;box-shadow:0 20px 55px #10112755;max-height:94vh;overflow:auto}",
    ".qd14-dialog h2{font-size:19px;margin:0 0 8px}.qd14-dialog p{font-size:12px;color:#898ca2;line-height:1.5}",
    ".qd14-field{display:grid;gap:7px;margin:12px 0}.qd14-field label{font-size:12px;font-weight:750;color:#555878}",
    ".qd14-field input,.qd14-field select{background:#f9f8ff;border:1px solid #e6e5f1;border-radius:11px;padding:12px;width:100%;font:inherit;box-sizing:border-box}",
    ".qd14-actions{display:flex;gap:8px;margin-top:15px}.qd14-actions button{flex:1;border:0;border-radius:11px;padding:12px;font-size:13px;font-weight:800}",
    ".qd14-save{background:#7566e8;color:white}.qd14-cancel{background:#eeeeF8;color:#6658b0}",
    ".qd14-page-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0}.qd14-page-title h2{margin:0}",
    ".qd14-card{background:#fff;border:1px solid #e8e9f2;border-radius:18px;padding:16px;margin:12px 0}",
    ".qd14-month{display:flex;justify-content:space-between;align-items:center;margin:5px 0 13px}.qd14-month strong{font-size:17px}",
    ".qd14-arrow{border:0;border-radius:10px;background:#eeebff;color:#6758c7;padding:8px 13px;font-weight:900}",
    ".qd14-week,.qd14-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}",
    ".qd14-week span{text-align:center;padding:9px 0 6px;color:#9295aa;font-size:11px;font-weight:700}",
    ".qd14-day{border:1px solid transparent;background:#f6f6fa;min-height:58px;padding:7px 3px;border-radius:11px;text-align:center;color:#40445d;font-size:12px;display:flex;align-items:center;flex-direction:column;gap:5px}",
    ".qd14-day.muted{opacity:.42}.qd14-day.is-today{border-color:#ae9ef2}.qd14-day.selected{background:#e8e4ff;color:#5546c4;border-color:#8572e8;font-weight:900}",
    ".qd14-count{font-size:10px;color:#6d5cc9;background:#e4e0fa;padding:3px 5px;border-radius:8px}.qd14-dots{display:flex;gap:3px}.qd14-dots i{width:5px;height:5px;border-radius:50%;background:#8b75f5}",
    ".qd14-info{font-size:12px;color:#858aa3;line-height:1.6}.qd14-empty{text-align:center;color:#9a9db1;font-size:13px;padding:18px 8px}",
    ".qd14-log{display:flex;gap:10px;align-items:center;padding:12px 2px;border-bottom:1px solid #efeff6}.qd14-log:last-child{border:0}",
    ".qd14-log-icon{background:#efecff;border-radius:12px;width:35px;height:35px;flex:none;display:grid;place-items:center;font-size:17px;color:#6457cc}",
    ".qd14-log-main{min-width:0;flex:1}.qd14-log-main strong{display:block;font-size:13px;overflow-wrap:anywhere}",
    ".qd14-log-main small{display:block;font-size:11px;color:#9a9cae;margin-top:4px}.qd14-log-xp{font-size:12px;color:#6e5ccd;font-weight:850;white-space:nowrap}",
    ".qd14-evo-stage2{filter:drop-shadow(0 0 7px #a58dff88)}.qd14-evo-stage3{filter:drop-shadow(0 0 13px #f2c96499)}",
    ".qd14-evo-celebrate{background:radial-gradient(circle at 50% 10%,#6255a5,#1c1e3e);color:white;border-radius:24px;text-align:center;overflow:hidden;position:relative}",
    ".qd14-evo-celebrate h2{font-size:26px;color:white;margin:12px 0}.qd14-evo-celebrate p{color:#dbd5ff}",
    ".qd14-evo-spark{font-size:57px;animation:qd14-pop 1s ease-in-out infinite alternate}",
    "@keyframes qd14-pop{from{transform:translateY(5px) scale(.95);filter:brightness(1)}to{transform:translateY(-7px) scale(1.08);filter:brightness(1.25)}}",
    "@media(max-width:430px){.qd14-card{padding:12px}.qd14-calendar,.qd14-week{gap:3px}.qd14-day{min-height:55px;padding:6px 1px}.qd14-edit{padding:7px 6px}nav{gap:1px;padding-left:3px;padding-right:3px}nav button{flex:1;min-width:0;font-size:10px}}"
  ].join("");
  document.head.appendChild(css);

  const questList = document.getElementById("questList");
  const app = document.querySelector(".app");
  const nav = document.querySelector("nav");
  const historyPage = document.createElement("section");
  historyPage.className = "page";
  historyPage.id = "qd14History";
  if (app) app.appendChild(historyPage);

  const navButton = document.createElement("button");
  navButton.dataset.page = "qd14History";
  navButton.innerHTML = "<b>▦</b>기록";
  if (nav) {
    const settings = nav.querySelector('[data-page="settings"]');
    if (settings) nav.insertBefore(navButton, settings);
    else nav.appendChild(navButton);
  }

  navButton.addEventListener("click", function () {
    if (nav) nav.querySelectorAll("button").forEach(btn =>
      btn.classList.toggle("active", btn === navButton));
    document.querySelectorAll(".page").forEach(page =>
      page.classList.toggle("active", page === historyPage));
    window.scrollTo(0, 0);
  });

  const editOverlay = document.createElement("div");
  editOverlay.className = "qd14-overlay";
  editOverlay.id = "qd14EditOverlay";
  editOverlay.setAttribute("role", "dialog");
  editOverlay.setAttribute("aria-modal", "true");
  editOverlay.setAttribute("aria-label", "퀘스트 편집");
  editOverlay.innerHTML =
    '<form class="qd14-dialog" id="qd14EditForm">' +
    '<h2>✏️ 퀘스트 편집</h2><p>이름, 카테고리, 반복 주기와 보상을 변경할 수 있어요. 과거에 획득한 경험치는 그대로 유지됩니다.</p>' +
    '<div class="qd14-field"><label for="qd14Name">이름</label><input id="qd14Name" maxlength="60" required></div>' +
    '<div class="qd14-field"><label for="qd14Category">카테고리</label>' +
    '<select id="qd14Category"><option>일상</option><option>공부</option><option>자기계발</option><option>건강</option><option>취미</option></select></div>' +
    '<div class="qd14-field"><label for="qd14Frequency">반복 주기</label>' +
    '<select id="qd14Frequency"><option value="daily">매일</option><option value="weekly">매주</option>' +
    '<option value="monthly">매월</option><option value="once">한 번만</option></select></div>' +
    '<div class="qd14-field"><label for="qd14Xp">다음 완료부터 받을 경험치</label>' +
    '<select id="qd14Xp"><option value="10">쉬움 · 10 XP</option><option value="20">보통 · 20 XP</option>' +
    '<option value="30">도전 · 30 XP</option><option value="50">보스 · 50 XP</option></select></div>' +
    '<div class="qd14-actions"><button type="button" class="qd14-cancel" id="qd14Cancel">취소</button>' +
    '<button class="qd14-save" type="submit">변경 저장</button></div></form>';
  document.body.appendChild(editOverlay);

  let editingId = null;
  function closeEdit() {editOverlay.classList.remove("open");editingId=null;}
  editOverlay.addEventListener("click", function (event) {
    if (event.target === editOverlay || event.target.id === "qd14Cancel") closeEdit();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && editOverlay.classList.contains("open")) closeEdit();
  });
  function openEdit(id) {
    const task = state.tasks.find(item => item.id === id);
    if (!task) return;
    editingId = id;
    const category = document.getElementById("qd14Category");
    if (!Array.from(category.options).some(o => o.value === task.category)) {
      const option = document.createElement("option");
      option.value = task.category || "기타";
      option.textContent = task.category || "기타";
      category.appendChild(option);
    }
    document.getElementById("qd14Name").value = task.name || "";
    category.value = task.category || "일상";
    document.getElementById("qd14Frequency").value =
      ["daily","weekly","monthly","once"].includes(task.frequency) ? task.frequency : "daily";
    const xp = document.getElementById("qd14Xp");
    const prior = xp.querySelector('option[data-old]');
    if (prior) prior.remove();
    if (![10,20,30,50].includes(Number(task.xp))) {
      const option = document.createElement("option");
      option.value = Number(task.xp) || 20;
      option.textContent = "이전 보상 · " + option.value + " XP";
      option.dataset.old = "1";
      xp.appendChild(option);
    }
    xp.value = String(Number(task.xp) || 20);
    editOverlay.classList.add("open");
    document.getElementById("qd14Name").focus();
  }

  function freezeSnapshots(ids) {
    const taskMap = new Map(state.tasks.map(task => [task.id, task]));
    const filter = ids ? new Set(ids) : null;
    let changed = false;
    for (const e of state.events) {
      if (filter && !filter.has(e.taskId)) continue;
      const task = taskMap.get(e.taskId);
      if (!task) continue;
      if (typeof e.taskNameSnapshot !== "string") {
        e.taskNameSnapshot = task.name;
        changed = true;
      }
      if (typeof e.categorySnapshot !== "string") {
        e.categorySnapshot = task.category || "기타";
        changed = true;
      }
      if (typeof e.frequencySnapshot !== "string") {
        e.frequencySnapshot = task.frequency || "daily";
        changed = true;
      }
    }
    return changed;
  }

  const originalSave = saveState;
  function snapshotPreviousState() {
    try {
      const currentRaw = localStorage.getItem(KEY);
      if (!currentRaw || currentRaw === JSON.stringify(state)) return;
      const older = JSON.parse(localStorage.getItem(backupKey) || "null");
      if (older && older.day === dateKey()) return;
      localStorage.setItem(backupKey, JSON.stringify({
        app:"QUEST DAY", schema:1, day:dateKey(), createdAt:new Date().toISOString(),
        data:JSON.parse(currentRaw)
      }));
    } catch (error) {
      console.warn("QUEST DAY automatic snapshot unavailable",error);
    }
  }
  saveState = function () {
    snapshotPreviousState();
    originalSave();
  };

  if (freezeSnapshots(null)) {
    try {saveState();} catch (error) {console.warn("Historical event metadata could not be saved",error);}
  }

  if (questList) {
    questList.addEventListener("click", function (event) {
      const editButton = event.target.closest("[data-qd14-edit]");
      if (editButton) {
        event.preventDefault();
        openEdit(editButton.dataset.qd14Edit);
        return;
      }
      const deleteButton = event.target.closest("[data-delete]");
      if (deleteButton && freezeSnapshots([deleteButton.dataset.delete])) {
        try {saveState();} catch (error) {console.warn("Delete snapshot could not be saved",error);}
      }
    }, true);
  }

  editOverlay.querySelector("#qd14EditForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const task = state.tasks.find(t => t.id === editingId);
    if (!task) return closeEdit();
    const name = document.getElementById("qd14Name").value.trim();
    const category = document.getElementById("qd14Category").value;
    const frequency = document.getElementById("qd14Frequency").value;
    const xp = Number(document.getElementById("qd14Xp").value);
    if (!name || name.length > 60) return alert("퀘스트 이름을 1~60자로 입력해 주세요.");
    if (!["daily","weekly","monthly","once"].includes(frequency)) return;
    if (!Number.isFinite(xp) || xp < 1 || xp > 100) return alert("경험치 값이 올바르지 않아요.");

    const previous = JSON.stringify(state);
    freezeSnapshots([task.id]);
    task.name = name;
    task.category = category;
    task.frequency = frequency;
    task.xp = xp;
    try {
      saveState();
    } catch (error) {
      state = JSON.parse(previous);
      alert("저장 공간 문제로 수정이 저장되지 않았어요. 데이터를 백업한 뒤 다시 시도해 주세요.");
      return;
    }
    closeEdit();
    render();
  });

  // Snapshot task details on completion so future edits don't rewrite history.
  const previousToggle = toggleTask;
  toggleTask = function (id) {
    const before = new Set(state.events.map(e => e.id));
    previousToggle(id);
    const task = state.tasks.find(t => t.id === id);
    const e = state.events.find(e => !before.has(e.id) && e.taskId === id);
    if (e && task) {
      e.taskNameSnapshot = task.name;
      e.categorySnapshot = task.category || "기타";
      e.frequencySnapshot = task.frequency || "daily";
      try {saveState();} catch (error) {console.warn("New task snapshot save failed",error);}
    }
    render();
  };
  // The initial 1.0 quest-list click handler calls the latest global toggleTask at runtime.

  const now = new Date();
  let calendarYear = now.getFullYear();
  let calendarMonth = now.getMonth();
  let selectedDay = dateKey();
  function calendarData() {
    const dates = new Map();
    for (const e of state.events) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.day)) continue;
      if (!dates.has(e.day)) dates.set(e.day, []);
      dates.get(e.day).push(e);
    }
    return dates;
  }
  function eventName(event, tasks) {
    return event.taskNameSnapshot || tasks.get(event.taskId)?.name || "이전에 삭제된 퀘스트";
  }
  function eventCategory(event, tasks) {
    return event.categorySnapshot || tasks.get(event.taskId)?.category || "기타";
  }
  function eventLine(e, tasks, showDate) {
    const iso = typeof e.completedAt === "string" ? new Date(e.completedAt) : null;
    const time = iso && !Number.isNaN(iso.getTime()) ?
      " · "+iso.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : "";
    return '<div class="qd14-log"><span class="qd14-log-icon">✓</span>' +
      '<div class="qd14-log-main"><strong>'+escapeHtml(eventName(e,tasks))+'</strong>' +
      '<small>'+(showDate ? escapeHtml(e.day)+" · " : "")+
      escapeHtml(eventCategory(e,tasks))+time+'</small></div>' +
      '<span class="qd14-log-xp">+'+Math.max(0, Number(e.xp)||0)+' XP</span></div>';
  }
  function renderCalendar() {
    if (!historyPage.isConnected) return;
    const today = dateKey();
    const days = calendarData();
    const tasks = new Map(state.tasks.map(t => [t.id,t]));
    const first = new Date(calendarYear, calendarMonth,1,12);
    const starts = first.getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth+1,0).getDate();
    const cellCount = Math.ceil((starts+daysInMonth)/7)*7;
    const monthTitle = calendarYear+"년 "+(calendarMonth+1)+"월";
    const cells = [];
    for (let i=0;i<cellCount;i++){
      const d=new Date(calendarYear,calendarMonth,1-starts+i,12);
      const key=dateKey(d);
      const count=days.get(key)?.length||0;
      const isCurrent=d.getMonth()===calendarMonth;
      const names=["qd14-day",isCurrent?"":"muted",key===today?"is-today":"",key===selectedDay?"selected":""].filter(Boolean).join(" ");
      cells.push('<button type="button" class="'+names+'" data-qd14-day="'+key+'" aria-label="'+key+' 완료 '+count+'개">' +
        '<span>'+d.getDate()+'</span>'+(count?'<span class="qd14-count">'+count+'개</span>':'')+'</button>');
    }
    const selected = (days.get(selectedDay)||[]).slice().reverse();
    const recent=state.events.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.day))
      .slice().sort((a,b)=>{
        const aStamp=a.completedAt||a.day, bStamp=b.completedAt||b.day;
        return String(bStamp).localeCompare(String(aStamp));
      }).slice(0,30);
    const dateDays=new Set(state.events.map(e=>e.day));
    const week = [];
    const anchor=new Date();anchor.setHours(12,0,0,0);
    for(let i=0;i<7;i++){const d=new Date(anchor);d.setDate(d.getDate()-i);week.push(dateKey(d));}
    const weekCompleted=state.events.filter(e=>week.includes(e.day)).length;
    const thirty=new Set();
    for(let i=0;i<30;i++){const d=new Date(anchor);d.setDate(d.getDate()-i);thirty.add(dateKey(d));}
    const last30 = state.events.filter(e=>thirty.has(e.day));
    historyPage.innerHTML =
      '<div class="qd14-page-title"><h2>📅 활동 달력</h2><span class="qd14-info">완료 기록은 날짜별로 저장돼요.</span></div>' +
      '<div class="qd14-card"><div class="qd14-month">' +
      '<button class="qd14-arrow" data-qd14-month="-1" aria-label="이전 달">‹</button>' +
      '<strong>'+monthTitle+'</strong>' +
      '<button class="qd14-arrow" data-qd14-month="1" aria-label="다음 달">›</button></div>' +
      '<div class="qd14-week">'+["일","월","화","수","목","금","토"].map(d=>'<span>'+d+'</span>').join("")+'</div>' +
      '<div class="qd14-calendar">'+cells.join("")+'</div>' +
      '<p class="qd14-info">날짜를 누르면 그날 완료한 퀘스트를 확인할 수 있어요.</p></div>' +
      '<div class="qd14-card"><strong>📌 '+selectedDay+'의 완료 기록</strong>' +
      (selected.length?selected.map(e=>eventLine(e,tasks,false)).join(""):
        '<div class="qd14-empty">이 날짜에는 완료한 퀘스트가 없어요.</div>')+'</div>' +
      '<div class="qd14-card"><strong>📈 활동 요약</strong>' +
      '<p class="qd14-info">최근 7일 '+weekCompleted+'개 완료 · 최근 30일 '+last30.length+
      '개 완료 · 활동한 날짜 '+dateDays.size+'일</p></div>' +
      '<div class="qd14-card"><strong>🗒️ 최근 활동 30건</strong>' +
      (recent.length?recent.map(e=>eventLine(e,tasks,true)).join(""):
        '<div class="qd14-empty">아직 완료한 퀘스트가 없어요.</div>')+'</div>';
  }
  historyPage.addEventListener("click", function(event){
    const month=event.target.closest("[data-qd14-month]");
    if(month){
      const d=new Date(calendarYear,calendarMonth+Number(month.dataset.qd14Month),1,12);
      calendarYear=d.getFullYear();calendarMonth=d.getMonth();
      selectedDay=dateKey(new Date(calendarYear,calendarMonth,1,12));
      renderCalendar();return;
    }
    const day=event.target.closest("[data-qd14-day]");
    if(day){
      selectedDay=day.dataset.qd14Day;
      const date=selectedDay.split("-").map(Number);
      calendarYear=date[0];calendarMonth=date[1]-1;
      renderCalendar();
    }
  });

  function addEditButtons() {
    if (!questList) return;
    questList.querySelectorAll(".quest").forEach(row=>{
      if(row.querySelector("[data-qd14-edit]"))return;
      const taskId=row.querySelector("[data-toggle]")?.dataset.toggle;
      if(!taskId)return;
      const button=document.createElement("button");
      button.className="qd14-edit";
      button.type="button";
      button.dataset.qd14Edit=taskId;
      button.setAttribute("aria-label","퀘스트 수정");
      button.textContent="✎";
      const del=row.querySelector("[data-delete]");
      if(del)row.insertBefore(button,del);else row.appendChild(button);
    });
  }

  function parseBackup(value) {
    const data=value && value.app==="QUEST DAY" && value.data ? value.data : value;
    if(!data || typeof data!=="object" || !Array.isArray(data.tasks) ||
       !Array.isArray(data.events) || data.tasks.length>10000 || data.events.length>100000) {
      throw new Error("퀘스트 또는 기록 형식이 올바르지 않습니다.");
    }
    const taskIds=new Set();
    for(const t of data.tasks) {
      if(!t || typeof t!=="object" || typeof t.id!=="string" || !t.id ||
         taskIds.has(t.id) || typeof t.name!=="string" || t.name.length>500 ||
         typeof t.frequency!=="string" || !["once","daily","weekly","monthly"].includes(t.frequency) ||
         !Number.isFinite(t.xp) || t.xp<0 || t.xp>1000) throw new Error("퀘스트 데이터에 문제가 있습니다.");
      taskIds.add(t.id);
    }
    for(const e of data.events){
      if(!e || typeof e.id!=="string" || !e.id ||
         typeof e.taskId!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.day) ||
         !Number.isFinite(e.xp) || e.xp<0 || e.xp>1000) throw new Error("활동 기록에 문제가 있습니다.");
    }
    if(data.rpg !== undefined) {
      if(!data.rpg || typeof data.rpg!=="object" || Array.isArray(data.rpg)) throw new Error("캐릭터 데이터에 문제가 있습니다.");
      if(data.rpg.purchases!==undefined &&
         (!Array.isArray(data.rpg.purchases) || data.rpg.purchases.some(p=>!p ||
         typeof p.id!=="string" || !Number.isFinite(p.cost) || p.cost<0))) throw new Error("상점 기록에 문제가 있습니다.");
      if(data.rpg.claimed!==undefined &&
         (!data.rpg.claimed || typeof data.rpg.claimed!=="object" || Array.isArray(data.rpg.claimed) ||
         Object.values(data.rpg.claimed).some(v=>!Number.isFinite(Number(v)) || Number(v)<0)))
         throw new Error("골드 보상 기록에 문제가 있습니다.");
    }
    return data;
  }
  function downloadBackup() {
    const output={app:"QUEST DAY",schemaVersion:2,exportedAt:new Date().toISOString(),data:state};
    const blob=new Blob([JSON.stringify(output,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;
    anchor.download="quest-day-backup-1.4-"+dateKey()+".json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  const backupBtn=document.getElementById("backupBtn");
  const restoreBtn=document.getElementById("restoreBtn");
  const restoreFile=document.getElementById("restoreFile");
  if(backupBtn) backupBtn.onclick=downloadBackup;
  if(restoreBtn && restoreFile) restoreBtn.onclick=function(){restoreFile.click();};
  if(restoreFile) restoreFile.onchange=async function(event){
    const file=event.target.files?.[0];
    if(!file)return;
    try{
      if(file.size > 5*1024*1024) throw new Error("백업 파일이 너무 큽니다 (최대 5MB).");
      const parsed=JSON.parse(await file.text());
      const restored=parseBackup(parsed);
      if(!confirm("현재 퀘스트·골드·아이템·활동 기록을 백업 내용으로 교체할까요?")) return;
      const currentState=state;
      snapshotPreviousState();
      state=restored;
      try {saveState();render();}
      catch(error){state=currentState;throw error;}
      alert("백업 복원이 완료됐어요.");
    }catch(error){
      alert("복원 실패: "+(error?.message || "파일을 확인해 주세요."));
    }finally {restoreFile.value="";}
  };

  const evoDialog=document.createElement("div");
  evoDialog.className="qd14-overlay";
  evoDialog.setAttribute("role","dialog");
  evoDialog.setAttribute("aria-modal","true");
  evoDialog.setAttribute("aria-label","캐릭터 진화");
  document.body.appendChild(evoDialog);
  evoDialog.addEventListener("click",function(e){
    if(e.target===evoDialog || e.target.closest("[data-qd14-evo-close]"))
      evoDialog.classList.remove("open");
  });

  function bestStreak(){
    const arr=[...new Set(state.events.map(e=>e.day))].sort();
    let best=0,run=0,last=0;
    for(const d of arr){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;
      const now=Date.parse(d+"T12:00:00Z");
      run=now-last===86400000?run+1:1;
      best=Math.max(best,run);last=now;
    }
    return best;
  }
  function progression(metricName){
    const parts=metricName.split(":");
    const tasks=new Map(state.tasks.map(t=>[t.id,t]));
    if(parts[0]==="completedQuests")return state.events.length;
    if(parts[0]==="currentLevel")return levelInfo().level;
    if(parts[0]==="bestStreakDays")return bestStreak();
    if(parts[0]==="claimedChallenges")return Object.keys(state.rpg?.claimed||{}).length;
    if(parts[0]==="createdQuestCount")return Number(state.rpg?.createdQuestCount)||0;
    if(parts[0]==="dailyGoalAchievedDays")return Object.keys(state.rpg?.goalDays||{}).length;
    if(parts[0]==="bossQuestCompletions")return state.events.filter(e=>Number(e.xp)===50).length;
    if(parts[0]==="completedByCategory")return state.events.filter(e=>
      (e.categorySnapshot||tasks.get(e.taskId)?.category)===parts[1]).length;
    if(parts[0]==="completedByFrequency")return state.events.filter(e=>
      (e.frequencySnapshot||tasks.get(e.taskId)?.frequency)===parts[1]).length;
    if(parts[0]==="completedInHourRange"){
      const range=parts[1].split("-").map(Number);
      return state.events.filter(e=>{
        if(!e.completedAt)return false;
        const date=new Date(e.completedAt);
        return Number.isFinite(date.getTime()) && date.getHours()>=range[0] && date.getHours()<range[1];
      }).length;
    }
    return 0;
  }
  let catalog=null;
  function stage(character){
    let level=1;
    for(const e of character.evolution||[]){
      if(e.stage===1 || (e.requirement && progression(e.requirement.metric)>=e.requirement.min))
        level=e.stage;
    }
    return level;
  }
  function showEvolution(character,level){
    const description=character.evolution?.find(e=>e.stage===level)?.visualChange || "성장의 빛이 반짝여요.";
    evoDialog.innerHTML='<div class="qd14-dialog qd14-evo-celebrate">' +
      '<div class="qd14-evo-spark">✨</div><p>CHARACTER EVOLVED</p>' +
      '<h2>'+escapeHtml(character.name)+' 진화!</h2>'+
      '<p>진화 '+level+'단계 달성</p><p>'+escapeHtml(description)+'</p>' +
      '<button class="qd14-save" data-qd14-evo-close style="border:0;border-radius:12px;padding:12px 22px;margin-top:13px">계속 모험하기</button></div>';
    evoDialog.classList.add("open");
  }
  function updateEvolution(){
    if(!catalog || !state.rpg || !Array.isArray(state.events))return;
    if(!state.rpg.evolutionSeen || typeof state.rpg.evolutionSeen!=="object"){
      state.rpg.evolutionSeen={};
      for(const c of catalog)state.rpg.evolutionSeen[c.id]=stage(c);
      try{saveState();}catch(error){console.warn("Evolution initial save unavailable",error);}
    } else {
      let changed = false;
      for(const c of catalog){
        const current=stage(c);
        const seen=state.rpg.evolutionSeen[c.id];
        if(!Number.isFinite(seen)){state.rpg.evolutionSeen[c.id]=current;changed=true;continue;}
        if(current>seen){
          state.rpg.evolutionSeen[c.id]=current;
          changed=true;
          const equipped=state.rpg.equipped==="starter"?"sprout":state.rpg.equipped;
          if(equipped===c.id && !evoDialog.classList.contains("open"))showEvolution(c,current);
        }
      }
      if(changed){
        try{saveState();}catch(error){console.warn("Evolution progress save unavailable",error);}
      }
    }
    const characterId=state.rpg.equipped==="starter"?"sprout":state.rpg.equipped;
    const equipped=catalog.find(c=>c.id===characterId);
    if(equipped){
      const curr=stage(equipped);
      document.querySelectorAll("#rpgAvatarHome .ch-art,#rpgGrowthCharacter .ch-art").forEach(el=>{
        el.classList.remove("qd14-evo-stage2","qd14-evo-stage3");
        if(curr>=2)el.classList.add("qd14-evo-stage"+Math.min(curr,3));
      });
    }
  }

  const priorRender=render;
  render=function(){
    priorRender();
    const settingsNote = document.querySelector("#settings .note");
    if(settingsNote && settingsNote.innerHTML.includes("MVP 1.3")){
      settingsNote.innerHTML = settingsNote.innerHTML.replace("MVP 1.3","MVP 1.4");
    }
    addEditButtons();
    renderCalendar();
    updateEvolution();
  };
  fetch("./characters-1.3.json",{cache:"no-cache"})
    .then(response=>{if(!response.ok)throw new Error("Evolution catalog could not load");return response.json();})
    .then(data=>{
      if(!Array.isArray(data.characters))return;
      catalog=data.characters;
      updateEvolution();
    })
    .catch(error=>console.warn("QUEST DAY 1.4 evolution graphics unavailable",error));
  render();
})();