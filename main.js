/* =========================================================
   Food Diary v10.0
   main.js（前半：タブ構造＋UI基盤）
   ========================================================= */

/* ダミー宣言（後で上書きされる） */
function renderTodaySummary() {}
function renderImprovementBlock() {}
function renderTomorrowPrediction() {}
function renderWeeklySummary() {}
function renderMonthlySummary() {}
function renderYearlySummary() {}
function renderTrendSummary() {}
function renderAnnualPlan() {}

function renderTodayChart() {}
function renderWeeklyChart() {}
function renderMonthlyChart() {}
function renderYearlyChart() {}
function renderTrendChart() {}

function initLogPage() {}

/* 1. タブ切り替え */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const target = tab.dataset.target;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

/* 2. ダッシュボード描画 */
function renderDashboard() {
  renderTodaySummary();
  renderImprovementBlock();
  renderTomorrowPrediction();
  renderWeeklySummary();
  renderMonthlySummary();
  renderYearlySummary();
  renderTrendSummary();
  renderAnnualPlan();

  renderTodayChart();
  renderWeeklyChart();
  renderMonthlyChart();
  renderYearlyChart();
  renderTrendChart();
}

/* 3. 通知ボタン */
document.getElementById("enableNotify").addEventListener("click", () => {
  Notification.requestPermission().then(() => {
    new Notification("通知が有効になりました", {
      body: "生活ルールに基づいて通知します。"
    });
  });
});

/* 4. バックアップ（エクスポート） */
document.getElementById("exportBtn").addEventListener("click", () => {
  const data = {
    logs: localStorage.getItem("logs"),
    weekly: localStorage.getItem("weekly"),
    monthly: localStorage.getItem("monthly"),
    yearly: localStorage.getItem("yearly"),
    trend: localStorage.getItem("trend"),
    rules: localStorage.getItem("rules"),
    ruleEffects: localStorage.getItem("ruleEffects"),
    longTerm: localStorage.getItem("longTerm"),
    annualPlan: localStorage.getItem("annualPlan")
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "food_diary_backup.json";
  a.click();
});

/* 5. バックアップ（インポート） */
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);

    Object.keys(data).forEach(key => {
      localStorage.setItem(key, data[key]);
    });

    alert("復元が完了しました。");
    location.reload();
  };
  reader.readAsText(file);
});

/* 6. 初期化 */
window.addEventListener("load", () => {
  renderDashboard();
  initLogPage();
});

/* =========================================================
   ③ Process表（入力UI）
   ========================================================= */

function renderLogInput() {
  const area = document.getElementById("logInputArea");

  area.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">入力</div>

      <div id="quickButtons">
        <button class="qbtn" data-text="水 200ml">水</button>
        <button class="qbtn" data-text="コーヒー">コーヒー</button>
        <button class="qbtn" data-text="タンパク質">タンパク質</button>
        <button class="qbtn" data-text="サプリ">サプリ</button>
        <button class="qbtn" data-text="頭痛">頭痛</button>
        <button class="qbtn" data-text="眠気">眠気</button>
      </div>

      <textarea id="logText" placeholder="自由入力"></textarea>
      <button id="addLogBtn">追加</button>
    </div>
  `;

  document.querySelectorAll(".qbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      addLog(btn.dataset.text);
    });
  });

  document.getElementById("addLogBtn").addEventListener("click", () => {
    const text = document.getElementById("logText").value.trim();
    if (text) addLog(text);
    document.getElementById("logText").value = "";
  });
}

function addLog(text) {
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0,5);

  const logs = JSON.parse(localStorage.getItem("logs") || "{}");
  if (!logs[dateKey]) logs[dateKey] = [];

  logs[dateKey].push({ text, time });

  localStorage.setItem("logs", JSON.stringify(logs));

  renderLogList();
  renderDashboard();
}

function renderLogList() {
  const list = document.getElementById("logList");
  const today = new Date().toISOString().split("T")[0];
  const logs = JSON.parse(localStorage.getItem("logs") || "{}")[today] || [];

  list.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">今日のログ</div>
      ${
        logs.length
          ? logs.map(l => `<div>・${l.time} ${l.text}</div>`).join("")
          : "まだ入力がありません"
      }
    </div>
  `;
}

function initLogPage() {
  renderLogInput();
  renderLogList();
}

/* =========================================================
   ④ 管理表（記録・AI解析・保存）
   ========================================================= */

/* A. 日次メトリクス抽出 */
function extractDailyMetrics(entries) {
  const metrics = {
    water: 0,
    protein: 0,
    caffeine: 0,
    supp: 0,
    lateMeal: false,
    lateWork: false,
    condition: {}
  };

  entries.forEach(e => {
    const t = e.text;

    if (t.includes("水")) metrics.water += 200;
    if (t.includes("タンパク") || t.includes("鶏") || t.includes("卵")) {
      metrics.protein++;
    }
    if (t.includes("コーヒー")) metrics.caffeine++;
    if (t.includes("サプリ")) metrics.supp++;

    if (e.time >= "23:00") metrics.lateMeal = true;
    if (e.time >= "01:00") metrics.lateWork = true;

    if (t.includes("頭痛")) {
      metrics.condition.headache = (metrics.condition.headache || 0) + 1;
    }
    if (t.includes("眠気")) {
      metrics.condition.sleepy = (metrics.condition.sleepy || 0) + 1;
    }
  });

  return metrics;
}

/* B. 日次AI解析（ダミー） */
async function callAI(prompt) {
  console.log("AI呼び出し:", prompt);
  return "【今日の総合評価】\nAI解析ダミー結果\n";
}

function buildDailyAIPrompt(metrics, logsText) {
  return `
あなたは祐一の専属生活コーチです。

【今日の記録】
${logsText}

【今日のメトリクス】
水分：${metrics.water}ml
タンパク質：${metrics.protein}回
カフェイン：${metrics.caffeine}杯
深夜食：${metrics.lateMeal}
深夜作業：${metrics.lateWork}
体調：${JSON.stringify(metrics.condition)}

【出力フォーマット】
1. 今日の総合評価
2. 良かった点
3. 改善ポイント
4. 次の一歩
`;
}

async function runDailyAI() {
  const today = new Date().toISOString().split("T")[0];
  const logs = JSON.parse(localStorage.getItem("logs") || "{}")[today] || [];

  const metrics = extractDailyMetrics(logs);
  const logsText = logs.map(l => `${l.time} ${l.text}`).join("\n");

  const prompt = buildDailyAIPrompt(metrics, logsText);
  const ai = await callAI(prompt);

  saveDailyAI(today, ai);
  return ai;
}

function saveDailyAI(dateKey, text) {
  const daily = JSON.parse(localStorage.getItem("dailyAI") || "{}");
  daily[dateKey] = text;
  localStorage.setItem("dailyAI", JSON.stringify(daily));
}

function getDailyAI(dateKey) {
  const daily = JSON.parse(localStorage.getItem("dailyAI") || "{}");
  return daily[dateKey] || null;
}

/* C. 週次・月次・年次AI保存 */
function saveWeeklyAI(weekKey, text) {
  const weekly = JSON.parse(localStorage.getItem("weekly") || "{}");
  weekly[weekKey] = text;
  localStorage.setItem("weekly", JSON.stringify(weekly));
}
function getWeeklyAI(weekKey) {
  const weekly = JSON.parse(localStorage.getItem("weekly") || "{}");
  return weekly[weekKey] || null;
}

function saveMonthlyAI(monthKey, text) {
  const monthly = JSON.parse(localStorage.getItem("monthly") || "{}");
  monthly[monthKey] = text;
  localStorage.setItem("monthly", JSON.stringify(monthly));
}
function getMonthlyAI(monthKey) {
  const monthly = JSON.parse(localStorage.getItem("monthly") || "{}");
  return monthly[monthKey] || null;
}

function saveYearlyAI(yearKey, text) {
  const yearly = JSON.parse(localStorage.getItem("yearly") || "{}");
  yearly[yearKey] = text;
  localStorage.setItem("yearly", JSON.stringify(yearly));
}
function getYearlyAI(yearKey) {
  const yearly = JSON.parse(localStorage.getItem("yearly") || "{}");
  return yearly[yearKey] || null;
}

/* D. 日付キー */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentWeekKey() {
  const d = new Date();
  const year = d.getFullYear();
  const week = Math.ceil((((d - new Date(year,0,1)) / 86400000) + new Date(year,0,1).getDay()+1) / 7);
  return `${year}-W${week}`;
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function getCurrentYearKey() {
  return String(new Date().getFullYear());
}


/* =========================================================
   A. 継続学習（短期傾向）
   ========================================================= */

function updateTrend(metrics) {
  const trend = JSON.parse(localStorage.getItem("trend") || "{}");

  trend.waterAvg = (trend.waterAvg || 0) * 0.9 + metrics.water * 0.1;
  trend.proteinAvg = (trend.proteinAvg || 0) * 0.9 + metrics.protein * 0.1;

  trend.lateWorkRate = (trend.lateWorkRate || 0) * 0.95 + (metrics.lateWork ? 0.05 : 0);
  trend.lateMealRate = (trend.lateMealRate || 0) * 0.95 + (metrics.lateMeal ? 0.05 : 0);

  trend.condition = trend.condition || {};
  Object.keys(metrics.condition).forEach(k => {
    trend.condition[k] = (trend.condition[k] || 0) + metrics.condition[k];
  });

  localStorage.setItem("trend", JSON.stringify(trend));
}

/* =========================================================
   B. 長期記憶（季節性）
   ========================================================= */

function updateLongTermMemory(metrics, dateKey) {
  const mem = JSON.parse(localStorage.getItem("longTerm") || "{}");

  const month = Number(dateKey.split("-")[1]);
  const season = Math.floor((month % 12) / 3); // 0=冬,1=春,2=夏,3=秋

  if (!mem[season]) {
    mem[season] = {
      water: [],
      protein: [],
      lateWork: [],
      lateMeal: [],
      condition: {}
    };
  }

  mem[season].water.push(metrics.water);
  mem[season].protein.push(metrics.protein);
  mem[season].lateWork.push(metrics.lateWork ? 1 : 0);
  mem[season].lateMeal.push(metrics.lateMeal ? 1 : 0);

  Object.keys(metrics.condition).forEach(k => {
    mem[season].condition[k] = (mem[season].condition[k] || 0) + metrics.condition[k];
  });

  localStorage.setItem("longTerm", JSON.stringify(mem));
}

function analyzeLongTermMemory() {
  const mem = JSON.parse(localStorage.getItem("longTerm") || "{}");
  const result = [];

  Object.keys(mem).forEach(season => {
    const s = mem[season];
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;

    result.push({
      season,
      avgWater: avg(s.water),
      avgProtein: avg(s.protein),
      lateWorkRate: avg(s.lateWork) * 100,
      lateMealRate: avg(s.lateMeal) * 100,
      condition: s.condition
    });
  });

  return result;
}

/* =========================================================
   C. 自動改善エンジン
   ========================================================= */

function scoreDailyMetrics(m) {
  let score = [];

  if (m.water < 1200) score.push({ key: "water", value: 3 });
  if (m.protein < 2) score.push({ key: "protein", value: 2 });
  if (m.lateMeal) score.push({ key: "lateMeal", value: 2 });
  if (m.condition.headache > 0) score.push({ key: "headache", value: 3 });
  if (m.caffeine > 4) score.push({ key: "caffeine", value: 1 });

  return score.sort((a, b) => b.value - a.value);
}

function generateImprovementPoints(scores) {
  const points = [];

  scores.forEach(s => {
    if (s.key === "water") points.push("水分が少なめ。18時に200ml追加すると安定します。");
    if (s.key === "protein") points.push("タンパク質が不足気味。昼か夜に1回追加すると良いです。");
    if (s.key === "lateMeal") points.push("深夜の軽食は控えめにすると翌朝が軽くなります。");
    if (s.key === "headache") points.push("頭痛が出ているので、水分かカフェインの調整が有効です。");
    if (s.key === "caffeine") points.push("カフェインが多め。夕方以降は控えめにすると睡眠が整います。");
  });

  return points.slice(0, 2);
}

function runImprovementEngine(entries) {
  const m = extractDailyMetrics(entries);
  const scores = scoreDailyMetrics(m);
  return generateImprovementPoints(scores);
}

/* =========================================================
   D. 自動ルール化
   ========================================================= */

function updateRules(metricsToday, metricsTomorrow) {
  const rules = JSON.parse(localStorage.getItem("rules") || "{}");

  if (metricsToday.water < 1200 && metricsTomorrow.condition.headache > 0) {
    rules.lowWater_headache = (rules.lowWater_headache || 0) + 1;
  }

  if (metricsToday.lateMeal && metricsTomorrow.condition.sleepy > 0) {
    rules.lateMeal_sleepy = (rules.lateMeal_sleepy || 0) + 1;
  }

  if (metricsToday.protein >= 2 && Object.keys(metricsTomorrow.condition).length === 0) {
    rules.protein_good = (rules.protein_good || 0) + 1;
  }

  localStorage.setItem("rules", JSON.stringify(rules));
}

function evaluateRules() {
  const rules = JSON.parse(localStorage.getItem("rules") || "{}");
  const result = [];

  if ((rules.lowWater_headache || 0) >= 3) {
    result.push("水分が少ない日は頭痛が出やすい傾向があります。18時に200ml飲むルールが有効です。");
  }

  if ((rules.lateMeal_sleepy || 0) >= 3) {
    result.push("深夜食の翌日は眠気が増える傾向があります。深夜食は軽めにするのが良いです。");
  }

  if ((rules.protein_good || 0) >= 3) {
    result.push("タンパク質を2回摂った日は体調が安定しやすいです。1日2回を目標にしましょう。");
  }

  return result;
}

/* =========================================================
   E. 行動予測AI
   ========================================================= */

function predictTomorrow(metrics) {
  const result = {};

  result.headacheRisk = metrics.water < 1200 ? "やや高い" : "低い";
  result.sleepyRisk = metrics.lateMeal ? "高い" : "普通";
  result.focus = metrics.lateWork ? "やや低下" : "安定";
  result.stability = metrics.protein >= 2 ? "安定" : "やや不安定";
  result.sleepQuality = metrics.caffeine > 4 ? "低下" : "普通";

  return result;
}

/* =========================================================
   F. 年間改善プラン
   ========================================================= */

function saveAnnualPlan(year, plan) {
  const annual = JSON.parse(localStorage.getItem("annualPlan") || "{}");
  annual[year] = plan;
  localStorage.setItem("annualPlan", JSON.stringify(annual));
}

function getAnnualPlan(year) {
  const annual = JSON.parse(localStorage.getItem("annualPlan") || "{}");
  return annual[year] || null;
}

/* =========================================================
   G. グラフ描画（最低限：今日のグラフ）
   ========================================================= */

function renderTodayChart() {
  const today = getTodayKey();
  const logs = JSON.parse(localStorage.getItem("logs") || "{}")[today] || [];
  const m = extractDailyMetrics(logs);

  new Chart(document.getElementById("todayChart"), {
    type: "bar",
    data: {
      labels: ["水分", "タンパク質", "カフェイン", "深夜作業", "深夜食"],
      datasets: [{
        data: [
          m.water,
          m.protein,
          m.caffeine,
          m.lateWork ? 1 : 0,
          m.lateMeal ? 1 : 0
        ],
        backgroundColor: ["#4a90e2", "#7ed321", "#f5a623", "#d0021b", "#9013fe"]
      }]
    }
  });
}

/* =========================================================
   H. 通知
   ========================================================= */

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function scheduleDailyReminders() {
  const now = new Date();
  const target = new Date();
  target.setHours(18, 0, 0, 0);

  if (now > target) target.setDate(target.getDate() + 1);

  const delay = target - now;

  setTimeout(() => {
    sendNotification("水分リマインダー", "18時です。200ml飲んでおきましょう。");
    scheduleDailyReminders();
  }, delay);
}


