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
   Part1: タブ切り替え（完全動作版）
========================= */

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {

    // タブボタンの active 切り替え
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // タブ内容の切り替え
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    const target = document.getElementById("tab-" + btn.dataset.tab);
    if (target) target.classList.add("active");

    // タブごとの処理
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
      case "guide":
        renderGuide();
        break;
      case "settings":
        // 特に処理なし
        break;
    }
  });
});

/* =========================
   DOM取得
========================= */

const foodName = document.getElementById("foodName");
const foodAmount = document.getElementById("foodAmount");
const foodBulk = document.getElementById("foodBulk");

const drinkName = document.getElementById("drinkName");
const drinkAmount = document.getElementById("drinkAmount");
const drinkBulk = document.getElementById("drinkBulk");

const miscText = document.getElementById("miscText");

const logList = document.getElementById("logList");

const dashboardDateInfo = document.getElementById("dashboardDateInfo");
const dashboardContent = document.getElementById("dashboardContent");

const reportDateInfo = document.getElementById("reportDateInfo");
const reportContent = document.getElementById("reportContent");

const guideContent = document.getElementById("guideContent");

/* Settings */
const targetWater = document.getElementById("targetWater");
const targetSteps = document.getElementById("targetSteps");
const coffeeLimit = document.getElementById("coffeeLimit");
const lateSnackAlert = document.getElementById("lateSnackAlert");

const d3Dose = document.getElementById("d3Dose");
const multiDose = document.getElementById("multiDose");
const omegaDose = document.getElementById("omegaDose");
const zincDose = document.getElementById("zincDose");
const mgDose = document.getElementById("mgDose");
const proteinDose = document.getElementById("proteinDose");

const notify18 = document.getElementById("notify18");
const notify21 = document.getElementById("notify21");
const notify22 = document.getElementById("notify22");

const backupBtn = document.getElementById("backupBtn");
const restoreBtn = document.getElementById("restoreBtn");
const restoreFile = document.getElementById("restoreFile");

const clearTodayBtn = document.getElementById("clearTodayBtn");
const clearAllLogsBtn = document.getElementById("clearAllLogsBtn");
const resetAppBtn = document.getElementById("resetAppBtn");

/* =========================
   Part2: ログ追加（v11）
========================= */

let selectedCategory = "";
let selectedFoodUnit = "";
let selectedDrinkUnit = "";

/* カテゴリボタン */
document.querySelectorAll(".log-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".log-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.category || "";
  });
});

/* 単位ボタン */
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



console.log("food button", document.getElementById("addFoodLogBtn"));
/* 食べ物ログ */
document.getElementById("addFoodLogBtn").addEventListener("click", () => {
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

/* 飲料ログ */
document.getElementById("addDrinkLogBtn").addEventListener("click", () => {
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

/* その他ログ */
document.getElementById("addMiscLogBtn").addEventListener("click", () => {
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
   Part3: ログ表示
========================= */

function renderLogList() {
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
   Part4: Dashboard
========================= */

function renderDashboard() {
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
      <div class="dashboard-label">水分摂取</div>
      <div class="dashboard-value">${water} ml</div>
    </div>
    <div class="dashboard-card">
      <div class="dashboard-label">コーヒー</div>
      <div class="dashboard-value">${coffee} 杯</div>
    </div>
  `;
}

/* =========================
   Part5: Report
========================= */

function renderReport() {
  const today = todayStr();
  reportDateInfo.textContent = `対象日：${today}`;

  const count = {};
  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;
    const m = l.text.match(/\[(.+?)\]/);
    const key = m ? m[1] : "その他";
    count[key] = (count[key] || 0) + 1;
  });

  reportContent.innerHTML = `
    <div class="dashboard-card">
      <h3>カテゴリ別 回数</h3>
      <ul>
        ${Object.entries(count)
          .map(([k, v]) => `<li>${k}：${v} 回</li>`)
          .join("")}
      </ul>
    </div>
  `;
}

/* =========================
   Part6: Settings
========================= */

function loadSettingsToUI() {
  targetWater.value = settings.targetWater || "";
  targetSteps.value = settings.targetSteps || "";
  coffeeLimit.value = settings.coffeeLimit || "";
  lateSnackAlert.checked = settings.lateSnackAlert || false;

  d3Dose.value = settings.d3Dose || "";
  multiDose.value = settings.multiDose || "";
  omegaDose.value = settings.omegaDose || "";
  zincDose.value = settings.zincDose || "";
  mgDose.value = settings.mgDose || "";
  proteinDose.value = settings.proteinDose || "";

  notify18.checked = settings.notify18 || false;
  notify21.checked = settings.notify21 || false;
  notify22.checked = settings.notify22 || false;
}
loadSettingsToUI();

document.querySelectorAll("#tab-settings input").forEach(input => {
  input.addEventListener("change", () => {
    settings.targetWater = Number(targetWater.value || 0);
    settings.targetSteps = Number(targetSteps.value || 0);
    settings.coffeeLimit = Number(coffeeLimit.value || 0);
    settings.lateSnackAlert = lateSnackAlert.checked;

    settings.d3Dose = Number(d3Dose.value || 0);
    settings.multiDose = Number(multiDose.value || 0);
    settings.omegaDose = Number(omegaDose.value || 0);
    settings.zincDose = Number(zincDose.value || 0);
    settings.mgDose = Number(mgDose.value || 0);
    settings.proteinDose = Number(proteinDose.value || 0);

    settings.notify18 = notify18.checked;
    settings.notify21 = notify21.checked;
    settings.notify22 = notify22.checked;

    saveSettings();
  });
});

/* バックアップ */
if (backupBtn) backupBtn.addEventListener("click", () => {
  const data = { logs, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "food-diary-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

/* 復元 */
restoreBtn.addEventListener("click", () => {
  if (!restoreFile.files.length) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    logs = data.logs || [];
    settings = data.settings || {};
    saveLogs();
    saveSettings();
    loadSettingsToUI();
    renderLogList();
    alert("復元が完了しました");
  };
  reader.readAsText(restoreFile.files[0]);
});

/* 今日削除 */
clearTodayBtn.addEventListener("click", () => {
  const today = todayStr();
  logs = logs.filter(l => !l.time.startsWith(today));
  saveLogs();
  renderLogList();
});

/* 全削除 */
clearAllLogsBtn.addEventListener("click", () => {
  if (!confirm("全期間のログを削除しますか？")) return;
  logs = [];
  saveLogs();
  renderLogList();
});

/* 初期化 */
resetAppBtn.addEventListener("click", () => {
  if (!confirm("アプリを初期化しますか？")) return;
  logs = [];
  settings = {};
  saveLogs();
  saveSettings();
  loadSettingsToUI();
  renderLogList();
});


function renderGuide() {
  // iframe表示なので何もしない
}


renderLogList();
renderDashboard();
renderReport();
