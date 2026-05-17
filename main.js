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
   Part2: ログ追加
========================= */

document.getElementById("addLogBtn").addEventListener("click", () => {
  const text = document.getElementById("textInput").value.trim();
  if (!text) return;

  const time = new Date().toISOString();

  logs.push({
    time,
    text
  });

  saveLogs();
  document.getElementById("textInput").value = "";
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

  let water = 0;
  let coffee = 0;

  logs.forEach(l => {
    if (l.text.includes("水")) {
      const m = l.text.match(/(\d+)ml/);
      if (m) water += Number(m[1]);
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

  const count = {};
  logs.forEach(l => {
    const key = l.text.split("：")[0] || "その他";
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

/* -------------------------
   設定ロード
------------------------- */
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

/* -------------------------
   設定変更イベント
------------------------- */
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

/* -------------------------
   バックアップ
------------------------- */
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

/* -------------------------
   復元
------------------------- */
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

/* -------------------------
   今日のログ削除
------------------------- */
document.getElementById("clearTodayBtn").addEventListener("click", () => {
  const today = todayStr();
  logs = logs.filter(l => l.time.slice(0, 10) !== today);
  saveLogs();
  renderLogList();
  alert("今日のログを削除しました");
});

/* -------------------------
   全期間ログ削除
------------------------- */
document.getElementById("clearAllLogsBtn").addEventListener("click", () => {
  if (!confirm("本当に全期間のログを削除しますか？")) return;
  logs = [];
  saveLogs();
  renderLogList();
  alert("全期間のログを削除しました");
});

/* -------------------------
   アプリ初期化
------------------------- */
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
