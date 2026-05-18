/* =========================
   Part0: 初期データ
========================= */

let logs = JSON.parse(localStorage.getItem("logs") || "[]");
let settings = JSON.parse(localStorage.getItem("settings") || "{}");

function saveLogs() {
  localStorage.setItem("logs", JSON.stringify(logs));
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* =========================
   DOM helper
========================= */

function getEl(id) {
  return document.getElementById(id);
}

/* =========================
   ★ DOMContentLoaded を削除して即実行
========================= */

/* ===== DOM取得 ===== */
const foodName = getEl("foodName");
const foodAmount = getEl("foodAmount");
const foodBulk = getEl("foodBulk");

const drinkName = getEl("drinkName");
const drinkAmount = getEl("drinkAmount");
const drinkBulk = getEl("drinkBulk");

const miscText = getEl("miscText");
const logList = getEl("logList");

const dashboardDateInfo = getEl("dashboardDateInfo");
const dashboardContent = getEl("dashboardContent");

const reportDateInfo = getEl("reportDateInfo");
const reportContent = getEl("reportContent");

/* ===== 状態 ===== */
let selectedCategory = "";
let selectedFoodUnit = "";
let selectedDrinkUnit = "";

/* =========================
   タブ切り替え
========================= */

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab-button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    document.querySelectorAll(".tab-content")
      .forEach(t => t.classList.remove("active"));

    const target = document.getElementById("tab-" + btn.dataset.tab);
    if (target) target.classList.add("active");

    if (btn.dataset.tab === "log") renderLogList();
    if (btn.dataset.tab === "dashboard") renderDashboard();
    if (btn.dataset.tab === "report") renderReport();
  });
});

/* =========================
   カテゴリ・単位
========================= */

document.querySelectorAll(".log-btn").forEach(btn => {

  const handler = (e) => {
    e.preventDefault();
    document.querySelectorAll(".log-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.category || "";
  };

  btn.addEventListener("touchstart", handler, { passive: false });
  btn.addEventListener("click", handler);
});

document.querySelectorAll(".unit-btn").forEach(btn => {

  const handler = (e) => {
    e.preventDefault();
    const target = btn.dataset.target;

    document.querySelectorAll(`.unit-btn[data-target="${target}"]`)
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    if (target === "foodUnit") selectedFoodUnit = btn.dataset.unit;
    if (target === "drinkUnit") selectedDrinkUnit = btn.dataset.unit;
  };

  btn.addEventListener("touchstart", handler, { passive: false });
  btn.addEventListener("click", handler);
});

/* =========================
   ログ追加
========================= */

getEl("addFoodLogBtn")?.addEventListener("click", () => {

  const name = foodName.value.trim();
  const amount = foodAmount.value.trim();
  const bulk = foodBulk.value.trim();

  if (!name && !bulk) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";
  const unit = amount ? `${amount}${selectedFoodUnit || ""}` : "";
  const main = name ? `${name}${unit ? " " + unit : ""}` : "";
  const bulkPart = bulk ? ` / bulk: ${bulk}` : "";

  logs.push({ time, text: `${cat} Food: ${main}${bulkPart}` });

  saveLogs();
  renderLogList();

  foodName.value = "";
  foodAmount.value = "";
  foodBulk.value = "";
});

getEl("addDrinkLogBtn")?.addEventListener("click", () => {

  const name = drinkName.value.trim();
  const amount = drinkAmount.value.trim();
  const bulk = drinkBulk.value.trim();

  if (!name && !bulk) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";
  const unit = amount ? `${amount}${selectedDrinkUnit || ""}` : "";
  const main = name ? `${name}${unit ? " " + unit : ""}` : "";
  const bulkPart = bulk ? ` / bulk: ${bulk}` : "";

  logs.push({ time, text: `${cat} Drink: ${main}${bulkPart}` });

  saveLogs();
  renderLogList();

  drinkName.value = "";
  drinkAmount.value = "";
  drinkBulk.value = "";
});

getEl("addMiscLogBtn")?.addEventListener("click", () => {

  const misc = miscText.value.trim();
  if (!misc && !selectedCategory) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";

  logs.push({ time, text: `${cat} Misc: ${misc}` });

  saveLogs();
  renderLogList();

  miscText.value = "";
});

/* =========================
   表示系
========================= */

function renderLogList() {

  if (!logList) return;

  logList.innerHTML = logs
    .map((l, i) => {
      const t = new Date(l.time);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");

      return `
        <div class="log-item">
          <div>${hh}:${mm}｜${l.text}</div>
          <button onclick="deleteLog(${i})">削除</button>
        </div>
      `;
    })
    .join("");
}

window.deleteLog = function(i) {
  logs.splice(i, 1);
  saveLogs();
  renderLogList();
};

function renderDashboard() {
  if (!dashboardContent) return;

  const today = todayStr();
  dashboardDateInfo.textContent = `対象日：${today}`;

  let water = 0;
  let coffee = 0;

  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;

    const m = l.text.match(/(\d+)(ml|L|cc)/);
    if (m) {
      let v = Number(m[1]);
      if (m[2] === "L") v *= 1000;
      water += v;
    }

    if (l.text.includes("コーヒー")) coffee++;
  });

  dashboardContent.innerHTML = `
    <div>
      水分：${water} ml<br>
      コーヒー：${coffee}
    </div>
  `;
}

function renderReport() {
  if (!reportContent) return;

  const today = todayStr();
  reportDateInfo.textContent = `対象日：${today}`;

  const count = {};

  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;

    const m = l.text.match(/\[(.+?)\]/);  // ← 修正済み
    const key = m ? m[1] : "その他";

    count[key] = (count[key] || 0) + 1;
  });

  reportContent.innerHTML =
    Object.entries(count)
      .map(([k, v]) => `<div>${k}: ${v}</div>`)
      .join("");
}


/* =========================
   初期描画
========================= */

renderLogList();
renderDashboard();
renderReport();
