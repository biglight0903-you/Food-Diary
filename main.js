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
   DOM取得（安全化）
========================= */

function getEl(id) {
  return document.getElementById(id);
}

let foodName, foodAmount, foodBulk;
let drinkName, drinkAmount, drinkBulk;
let miscText;
let logList;

let dashboardDateInfo, dashboardContent;
let reportDateInfo, reportContent;

/* =========================
   初期化（DOM確定後）
========================= */

document.addEventListener("DOMContentLoaded", () => {

  foodName = getEl("foodName");
  foodAmount = getEl("foodAmount");
  foodBulk = getEl("foodBulk");

  drinkName = getEl("drinkName");
  drinkAmount = getEl("drinkAmount");
  drinkBulk = getEl("drinkBulk");

  miscText = getEl("miscText");
  logList = getEl("logList");

  dashboardDateInfo = getEl("dashboardDateInfo");
  dashboardContent = getEl("dashboardContent");

  reportDateInfo = getEl("reportDateInfo");
  reportContent = getEl("reportContent");

  /* =========================
     初期描画（ここで実行）
  ========================= */

  renderLogList();
  renderDashboard();
  renderReport();
});

/* =========================
   Part1: タブ切り替え
========================= */

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    const target = document.getElementById("tab-" + btn.dataset.tab);
    if (target) target.classList.add("active");

    switch (btn.dataset.tab) {
      case "log":
        renderLogList();
        break;
      case "dashboard":
        renderDashboard();
        break;
      case "report":
        renderReport();
        break;
    }
  });
});

/* =========================
   Part2: ログ追加
========================= */

let selectedCategory = "";
let selectedFoodUnit = "";
let selectedDrinkUnit = "";

/* カテゴリ */
document.querySelectorAll(".log-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".log-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.category || "";
  });
});

/* 単位 */
document.querySelectorAll(".unit-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;

    document.querySelectorAll(`.unit-btn[data-target="${target}"]`)
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    if (target === "foodUnit") selectedFoodUnit = btn.dataset.unit;
    if (target === "drinkUnit") selectedDrinkUnit = btn.dataset.unit;
  });
});

/* 食べ物ログ */
document.getElementById("addFoodLogBtn")?.addEventListener("click", () => {

  const name = foodName?.value?.trim() || "";
  const amount = foodAmount?.value?.trim() || "";
  const bulk = foodBulk?.value?.trim() || "";

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

/* 飲料ログ */
document.getElementById("addDrinkLogBtn")?.addEventListener("click", () => {

  const name = drinkName?.value?.trim() || "";
  const amount = drinkAmount?.value?.trim() || "";
  const bulk = drinkBulk?.value?.trim() || "";

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

/* その他ログ */
document.getElementById("addMiscLogBtn")?.addEventListener("click", () => {

  const misc = miscText?.value?.trim() || "";
  if (!misc && !selectedCategory) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";

  logs.push({ time, text: `${cat} Misc: ${misc}` });
  saveLogs();
  renderLogList();

  miscText.value = "";
});

/* =========================
   Part3: ログ表示（修正済み）
========================= */

function renderLogList() {

  if (!logList) return; // ★スマホ対策

  logList.innerHTML = logs
    .map((l, i) => {
      const t = new Date(l.time);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");

      return `
        <div class="log-item">
          <div>${hh}:${mm}｜${l.text}</div>
          <button class="delete-log-btn" onclick="deleteLog(${i})">削除</button>
        </div>
      `;
    })
    .join("");
}

function deleteLog(i) {
  logs.splice(i, 1);
  saveLogs();
  renderLogList();
}

/* =========================
   Dashboard
========================= */

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
      let val = Number(m[1]);
      if (m[2] === "L") val *= 1000;
      water += val;
    }

    if (l.text.includes("コーヒー")) coffee++;
  });

  dashboardContent.innerHTML = `
    <div class="dashboard-card">
      <div>水分：${water} ml</div>
      <div>コーヒー：${coffee}</div>
    </div>
  `;
}

/* =========================
   Report
========================= */

function renderReport() {

  if (!reportContent) return;

  const today = todayStr();
  reportDateInfo.textContent = `対象日：${today}`;

  const count = {};

  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;

    const m = l.text.match(/\[(.+?)\]/);
    const key = m ? m[1] : "その他";

    count[key] = (count[key] || 0) + 1;
  });

  reportContent.innerHTML = Object.entries(count)
    .map(([k, v]) => `<div>${k}: ${v}</div>`)
    .join("");
}
