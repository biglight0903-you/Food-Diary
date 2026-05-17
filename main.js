/* =========================
   v11.0 Main JS
   Part1: 基本構造 / タブ切り替え / 保存基盤
========================= */

let logs = JSON.parse(localStorage.getItem("logs") || "[]");
let settings = JSON.parse(localStorage.getItem("settings") || "{}");

function saveLogs() {
  localStorage.setItem("logs", JSON.stringify(logs));
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}

/* =========================
   タブ切り替え
========================= */
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(sec => {
      sec.classList.remove("active");
      if (sec.id === "tab-" + tab) sec.classList.add("active");
    });

    if (tab === "dashboard") renderDashboard();
    if (tab === "report") renderReport();
    if (tab === "guide") renderGuide();
  });
});

/* =========================
   日付ユーティリティ
========================= */
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function getPast7Range() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

/* =========================
   ログ追加（共通）
========================= */
function addLog(category, name, amount, unit) {
  logs.push({
    time: new Date().toISOString(),
    category,
    name,
    amount: amount || null,
    unit: unit || null
  });
  saveLogs();
  renderLogList();
}

/* =========================
   ログ一覧表示
========================= */
function renderLogList() {
  const box = document.getElementById("logList");
  box.innerHTML = "";

  logs.slice().reverse().forEach((log, idx) => {
    const div = document.createElement("div");
    div.className = "log-item";

    const text = `${log.category || ""} ${log.name || ""} ${log.amount ? log.amount : ""}${log.unit ? log.unit : ""}`;

    div.innerHTML = `
      <span>${text}</span>
      <button class="delete-log-btn" data-index="${logs.length - 1 - idx}">削除</button>
    `;

    box.appendChild(div);
  });

  document.querySelectorAll(".delete-log-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      logs.splice(i, 1);
      saveLogs();
      renderLogList();
    });
  });
}

renderLogList();


/* =========================
   Part2: 食べ物ログ処理
========================= */

/* -------------------------
   単語候補（食べ物）
------------------------- */
function getFoodHistory() {
  const names = logs
    .filter(l => l.category && (
      l.category.includes("食") ||
      l.category === "例外" ||
      l.category === "外食" ||
      l.category === "食べすぎ" ||
      l.category === "夜食"
    ))
    .map(l => l.name)
    .filter(n => n && n.trim() !== "");

  return Array.from(new Set(names));
}

function showFoodSuggestions(text) {
  const box = document.getElementById("foodNameSuggestions");
  if (!text) {
    box.style.display = "none";
    return;
  }

  const list = getFoodHistory().filter(n => n.includes(text));
  if (list.length === 0) {
    box.style.display = "none";
    return;
  }

  box.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    div.addEventListener("click", () => {
      document.getElementById("foodName").value = item;
      box.style.display = "none";
    });
    box.appendChild(div);
  });

  box.style.display = "block";
}

document.getElementById("foodName").addEventListener("input", e => {
  showFoodSuggestions(e.target.value);
});

/* -------------------------
   単品 食べ物ログ追加
------------------------- */
let selectedFoodUnit = null;

document.querySelectorAll(".unit-btn[data-target='foodUnit']").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".unit-btn[data-target='foodUnit']").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedFoodUnit = btn.dataset.unit;
  });
});

document.getElementById("addFoodLogBtn").addEventListener("click", () => {
  const name = document.getElementById("foodName").value.trim();
  const amount = document.getElementById("foodAmount").value.trim();
  const bulk = document.getElementById("foodBulk").value.trim();

  const category = window.selectedCategory || "食事";

  // まとめ入力がある場合はそちらを優先
  if (bulk) {
    addFoodBulk(category, bulk);
    document.getElementById("foodBulk").value = "";
    return;
  }

  if (!name) return;

  addLog(category, name, amount || null, selectedFoodUnit || null);

  document.getElementById("foodName").value = "";
  document.getElementById("foodAmount").value = "";
});

/* -------------------------
   カテゴリーボタン（食べ物）
------------------------- */
document.querySelectorAll(".log-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    const group = btn.parentElement;

    group.querySelectorAll(".log-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    window.selectedCategory = btn.dataset.category;
  });
});

/* -------------------------
   まとめ入力（食べ物）
   例：卵2個、納豆、味噌汁
------------------------- */
function addFoodBulk(category, text) {
  const items = text.split(/、|,/).map(t => t.trim()).filter(t => t);

  items.forEach(item => {
    // 量抽出（例：卵2個 → name=卵, amount=2, unit=個）
    const match = item.match(/^(.+?)(\d+)([a-zA-Zぁ-んァ-ン一-龥]+)$/);

    if (match) {
      const name = match[1].trim();
      const amount = Number(match[2]);
      const unit = match[3].trim();
      addLog(category, name, amount, unit);
    } else {
      addLog(category, item, null, null);
    }
  });
}


/* =========================
   Part3: 飲料ログ処理
========================= */

/* -------------------------
   単語候補（飲料）
------------------------- */
function getDrinkHistory() {
  const names = logs
    .filter(l => l.category && (
      l.category === "飲料" ||
      l.category === "水" ||
      l.category === "コーヒー" ||
      l.category === "お茶" ||
      l.category === "炭酸水" ||
      l.category === "酒"
    ))
    .map(l => l.name)
    .filter(n => n && n.trim() !== "");

  return Array.from(new Set(names));
}

function showDrinkSuggestions(text) {
  const box = document.getElementById("drinkNameSuggestions");
  if (!text) {
    box.style.display = "none";
    return;
  }

  const list = getDrinkHistory().filter(n => n.includes(text));
  if (list.length === 0) {
    box.style.display = "none";
    return;
  }

  box.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    div.addEventListener("click", () => {
      document.getElementById("drinkName").value = item;
      box.style.display = "none";
    });
    box.appendChild(div);
  });

  box.style.display = "block";
}

document.getElementById("drinkName").addEventListener("input", e => {
  showDrinkSuggestions(e.target.value);
});

/* -------------------------
   単品 飲料ログ追加
------------------------- */
let selectedDrinkUnit = null;

document.querySelectorAll(".unit-btn[data-target='drinkUnit']").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".unit-btn[data-target='drinkUnit']").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDrinkUnit = btn.dataset.unit;
  });
});

document.getElementById("addDrinkLogBtn").addEventListener("click", () => {
  const name = document.getElementById("drinkName").value.trim();
  const amount = document.getElementById("drinkAmount").value.trim();
  const bulk = document.getElementById("drinkBulk").value.trim();

  const category = window.selectedCategory || "飲料";

  // まとめ入力がある場合はそちらを優先
  if (bulk) {
    addDrinkBulk(category, bulk);
    document.getElementById("drinkBulk").value = "";
    return;
  }

  if (!name) return;

  addLog(category, name, amount || null, selectedDrinkUnit || null);

  document.getElementById("drinkName").value = "";
  document.getElementById("drinkAmount").value = "";
});

/* -------------------------
   カテゴリーボタン（飲料）
------------------------- */
document.querySelectorAll(".log-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    const group = btn.parentElement;

    group.querySelectorAll(".log-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    window.selectedCategory = btn.dataset.category;
  });
});

/* -------------------------
   まとめ入力（飲料）
   例：水500ml、コーラゼロ350ml
------------------------- */
function addDrinkBulk(category, text) {
  const items = text.split(/、|,/).map(t => t.trim()).filter(t => t);

  items.forEach(item => {
    // 量抽出（例：水500ml → name=水, amount=500, unit=ml）
    const match = item.match(/^(.+?)(\d+)(ml|ML|l|L|cc|CC)$/);

    if (match) {
      const name = match[1].trim();
      const amount = Number(match[2]);
      const unit = match[3].toLowerCase() === "l" ? "L" : match[3].toLowerCase();
      addLog(category, name, amount, unit);
    } else {
      addLog(category, item, null, null);
    }
  });
}

/* =========================
   Part4: サプリ / 体調 / 運動 / 自由入力
========================= */

/* -------------------------
   単語候補（その他）
------------------------- */
function getMiscHistory() {
  const names = logs
    .filter(l =>
      l.category &&
      !(
        l.category.includes("食") ||
        l.category === "飲料" ||
        l.category === "水" ||
        l.category === "コーヒー" ||
        l.category === "お茶" ||
        l.category === "炭酸水" ||
        l.category === "酒"
      )
    )
    .map(l => l.name)
    .filter(n => n && n.trim() !== "");

  return Array.from(new Set(names));
}

function showMiscSuggestions(text) {
  const box = document.getElementById("miscTextSuggestions");
  if (!text) {
    box.style.display = "none";
    return;
  }

  const list = getMiscHistory().filter(n => n.includes(text));
  if (list.length === 0) {
    box.style.display = "none";
    return;
  }

  box.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    div.addEventListener("click", () => {
      document.getElementById("miscText").value = item;
      box.style.display = "none";
    });
    box.appendChild(div);
  });

  box.style.display = "block";
}

document.getElementById("miscText").addEventListener("input", e => {
  showMiscSuggestions(e.target.value);
});

/* -------------------------
   その他ログ追加
------------------------- */
document.getElementById("addMiscLogBtn").addEventListener("click", () => {
  const text = document.getElementById("miscText").value.trim();
  if (!text) return;

  const category = window.selectedCategory || "その他";

  // 量抽出（例：徒歩20分 → name=徒歩, amount=20, unit=分）
  const match = text.match(/^(.+?)(\d+)([a-zA-Zぁ-んァ-ン一-龥]+)$/);

  if (match) {
    const name = match[1].trim();
    const amount = Number(match[2]);
    const unit = match[3].trim();
    addLog(category, name, amount, unit);
  } else {
    addLog(category, text, null, null);
  }

  document.getElementById("miscText").value = "";
});



/* =========================
   Part5: Dashboard / Report / Guide
========================= */

/* -------------------------
   Dashboard
------------------------- */
function renderDashboard() {
  const info = document.getElementById("dashboardDateInfo");
  const content = document.getElementById("dashboardContent");

  const today = todayStr();
  const range = getPast7Range();

  info.textContent = `今日（${today}） / 過去7日（${range.start}〜${range.end}）`;

  const todayLogs = logs.filter(l => l.time.slice(0, 10) === today);

  let waterTotal = 0;
  let coffeeCount = 0;
  let lateSnack = false;

todayLogs.forEach(l => {
  if (
    l.category === "水" ||
    (l.unit === "ml" && l.name && l.name.includes("水"))
  ) {
    waterTotal += Number(l.amount || 0);
  }

  if (
    l.category === "コーヒー" ||
    (l.name && l.name.includes("コーヒー"))
  ) {
    coffeeCount++;
  }

  if (l.category === "夜食") {
    const hour = new Date(l.time).getHours();
    if (hour >= 21) lateSnack = true;
  }
});

  content.innerHTML = `
    <div><strong>水分摂取：</strong> ${waterTotal} ml</div>
    <div><strong>コーヒー：</strong> ${coffeeCount} 杯</div>
    <div><strong>深夜食：</strong> ${lateSnack ? "あり" : "なし"}</div>
  `;
}

/* -------------------------
   Report
------------------------- */
function renderReport() {
  const info = document.getElementById("reportDateInfo");
  const content = document.getElementById("reportContent");

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;

  info.innerHTML = `
    <div>週間：${getPast7Range().start}〜${getPast7Range().end}</div>
    <div>月間：${y}年${m}月</div>
    <div>年間：${y}年</div>
  `;

  const summary = {};

  logs.forEach(l => {
    const key = l.name;
    if (!summary[key]) summary[key] = { count: 0, total: 0, unit: l.unit || "" };
    summary[key].count++;
    if (l.amount) summary[key].total += Number(l.amount);
  });

  let html = "";
  Object.keys(summary).forEach(k => {
    const s = summary[k];
    html += `
      <div style="margin-bottom:8px;">
        <strong>${k}</strong>：${s.count} 回  
        ${s.total ? ` / 合計 ${s.total}${s.unit}` : ""}
      </div>
    `;
  });

  content.innerHTML = html;
}

/* -------------------------
   Guide
------------------------- */
function renderGuide() {
  const box = document.getElementById("guideContent");
  box.innerHTML = `
    <h3>使い方ガイド</h3>
    <p>・食べ物と飲料はそれぞれ専用の入力欄があります。</p>
    <p>・まとめ入力は「、」または「,」で区切ると複数登録できます。</p>
    <p>・過去の入力は候補として表示されます。</p>
    <p>・Dashboard と Report で集計が確認できます。</p>
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
  const data = {
    logs,
    settings
  };

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
   アプリ初期化（ログ＋設定）
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
