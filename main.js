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
   Part1: タブ切り替え
========================= */

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "dashboard") renderDashboard();
    if (btn.dataset.tab === "report") renderReport();
    if (btn.dataset.tab === "guide") renderGuide();
  });
});

/* =========================
   Part2: ログ追加（v11用に修正）
========================= */

/* カテゴリ・単位の選択状態 */
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
    const target = btn.dataset.target; // "foodUnit" or "drinkUnit"
    document
      .querySelectorAll(`.unit-btn[data-target="${target}"]`)
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (target === "foodUnit") selectedFoodUnit = btn.dataset.unit || "";
    if (target === "drinkUnit") selectedDrinkUnit = btn.dataset.unit || "";
  });
});

/* 食べ物ログ追加 */
document.getElementById("addFoodLogBtn").addEventListener("click", () => {
  const name = document.getElementById("foodName").value.trim();
  const amount = document.getElementById("foodAmount").value.trim();
  const bulk = document.getElementById("foodBulk").value.trim();

  if (!name && !bulk) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";
  const unitPart = amount ? `${amount}${selectedFoodUnit || ""}` : "";
  const main = name ? `${name}${unitPart ? " " + unitPart : ""}` : "";
  const bulkPart = bulk ? ` / bulk: ${bulk}` : "";

  const text = `${cat} Food: ${[main, bulkPart].filter(Boolean).join("")}`;

  logs.push({ time, text });
  saveLogs();

  document.getElementById("foodName").value = "";
  document.getElementById("foodAmount").value = "";
  document.getElementById("foodBulk").value = "";

  renderLogList();
});

/* 飲料ログ追加 */
document.getElementById("addDrinkLogBtn").addEventListener("click", () => {
  const name = document.getElementById("drinkName").value.trim();
  const amount = document.getElementById("drinkAmount").value.trim();
  const bulk = document.getElementById("drinkBulk").value.trim();

  if (!name && !bulk) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";
  const unitPart = amount ? `${amount}${selectedDrinkUnit || ""}` : "";
  const main = name ? `${name}${unitPart ? " " + unitPart : ""}` : "";
  const bulkPart = bulk ? ` / bulk: ${bulk}` : "";

  const text = `${cat} Drink: ${[main, bulkPart].filter(Boolean).join("")}`;

  logs.push({ time, text });
  saveLogs();

  document.getElementById("drinkName").value = "";
  document.getElementById("drinkAmount").value = "";
  document.getElementById("drinkBulk").value = "";

  renderLogList();
});

/* サプリ・体調・運動ログ追加 */
document.getElementById("addMiscLogBtn").addEventListener("click", () => {
  const misc = document.getElementById("miscText").value.trim();
  if (!misc && !selectedCategory) return;

  const time = new Date().toISOString();
  const cat = selectedCategory ? `[${selectedCategory}]` : "";
  const text = `${cat} Misc: ${misc || ""}`;

  logs.push({ time, text });
  saveLogs();

  document.getElementById("miscText").value = "";

  renderLogList();
});

/* =========================
   Part3: ログ表示
========================= */

function renderLogList() {
  const list = document.getElementById("logList");
  list.innerHTML = logs
    .map((l, i) => {
      const t = new Date(l.time);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      return `
        <div class="log-item-row">
          <div class="log-main">${hh}:${mm}｜${l.text}</div>
          <button class="log-delete-btn" onclick="deleteLog(${i})">削除</button>
        </div>
      `;
    })
    .join("");
}
renderLogList();

function deleteLog(i) {
  logs.splice(i, 1);
  saveLogs();
  renderLogList();
}

/* =========================
   Part4: Dashboard
========================= */

function renderDashboard() {
  const box = document.getElementById("dashboardContent");
  const dateInfo = document.getElementById("dashboardDateInfo");
  const today = todayStr();

  dateInfo.textContent = `対象日：${today}`;

  let water = 0;
  let coffee = 0;

  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;

    if (l.text.includes("水") || l.text.includes("Drink")) {
      const m = l.text.match(/(\d+)(ml|L|cc)/);
      if (m) {
        let val = Number(m[1]);
        const unit = m[2];
        if (unit === "L") val = val * 1000;
        water += val;
      }
    }
    if (l.text.includes("コーヒー")) coffee++;
  });

  box.innerHTML = `
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
  const box = document.getElementById("reportContent");
  const dateInfo = document.getElementById("reportDateInfo");
  const today = todayStr();

  dateInfo.textContent = `対象日：${today}`;

  const count = {};
  logs.forEach(l => {
    if (!l.time.startsWith(today)) return;
    const keyMatch = l.text.match(/^

\[(.+?)\]

/);
    const key = keyMatch ? keyMatch[1] : "その他";
    count[key] = (count[key] || 0) + 1;
  });

  box.innerHTML = `
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
   Part6: Settings / Backup / Restore / Clear / Reset
========================= */

/* 設定ロード */
function loadSettingsToUI() {
  document.getElementById("targetWater").value = settings.targetWater || "";
  document.getElementById("targetSteps").value = settings.targetSteps || "";
  document.getElementById("coffeeLimit").value = settings.coffeeLimit || "";
  document.getElementById("lateSnackAlert").checked = settings.lateSnackAlert || false;

  document.getElementById("d3Dose").value = settings.d3Dose || "";
  document.getElementById("multiDose").value = settings.multiDose || "";
  document.getElementById("omegaDose").value = settings.omegaDose || "";
  document.getElementById("zincDose").value = settings.zincDose || "";
  document.getElementById("mgDose").value = settings.mgDose || "";
  document.getElementById("proteinDose").value = settings.proteinDose || "";

  document.getElementById("notify18").checked = settings.notify18 || false;
  document.getElementById("notify21").checked = settings.notify21 || false;
  document.getElementById("notify22").checked = settings.notify22 || false;
}
loadSettingsToUI();

/* 設定変更イベント */
document.querySelectorAll("#tab-settings input").forEach(input => {
  input.addEventListener("change", () => {
    settings.targetWater = Number(document.getElementById("targetWater").value || 0);
    settings.targetSteps = Number(document.getElementById("targetSteps").value || 0);
    settings.coffeeLimit = Number(document.getElementById("coffeeLimit").value || 0);
    settings.lateSnackAlert = document.getElementById("lateSnackAlert").checked;

    settings.d3Dose = Number(document.getElementById("d3Dose").value || 0);
    settings.multiDose = Number(document.getElementById("multiDose").value || 0);
    settings.omegaDose = Number(document.getElementById("omegaDose").value || 0);
    settings.zincDose = Number(document.getElementById("zincDose").value || 0);
    settings.mgDose = Number(document.getElementById("mgDose").value || 0);
    settings.proteinDose = Number(document.getElementById("proteinDose").value || 0);

    settings.notify18 = document.getElementById("notify18").checked;
    settings.notify21 = document.getElementById("notify21").checked;
    settings.notify22 = document.getElementById("notify22").checked;

    saveSettings();
  });
});

/* バックアップ */
document.getElementById("backupBtn").addEventListener("click", () => {
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
document.getElementById("restoreBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("restoreFile");
  if (!fileInput.files.length) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      logs = data.logs || [];
      settings = data.settings || {};
      saveLogs();
      saveSettings();
      loadSettingsToUI();
      renderLogList();
      alert("復元が完了しました");
    } catch {
      alert("復元に失敗しました（ファイルが壊れている可能性があります）");
    }
  };
  reader.readAsText(fileInput.files[0]);
});

/* 今日のログ削除 */
document.getElementById("clearTodayBtn").addEventListener("click", () => {
  const today = todayStr();
  logs = logs.filter(l => l.time.slice(0, 10) !== today);
  saveLogs();
  renderLogList();
  alert("今日のログを削除しました");
});

/* 全期間ログ削除 */
document.getElementById("clearAllLogsBtn").addEventListener("click", () => {
  if (!confirm("本当に全期間のログを削除しますか？")) return;
  logs = [];
  saveLogs();
  renderLogList();
  alert("全期間のログを削除しました");
});

/* アプリ初期化 */
document.getElementById("resetAppBtn").addEventListener("click", () => {
  if (!confirm("アプリを完全に初期化しますか？（ログ＋設定）")) return;

  logs = [];
  settings = {};
  saveLogs();
  saveSettings();
  loadSettingsToUI();
  renderLogList();

  alert("アプリを初期化しました");
});

/* =========================
   Part7: Guide（追加）
========================= */

function renderGuide() {
  const box = document.getElementById("guideContent");
  box.innerHTML = `
    <h2>Guide</h2>
    <p>Food / Drink / サプリ・体調・運動を、カテゴリボタン＋入力欄から記録できます。</p>
    <p>Settings で目標値やサプリ規定量、通知設定、バックアップなどを管理します。</p>
  `;
}
