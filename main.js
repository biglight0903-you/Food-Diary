// ===== タブ切り替え =====
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ===== ログ保存用ユーティリティ =====
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadLogs() {
  return JSON.parse(localStorage.getItem("logs") || "{}");
}

function saveLogs(logs) {
  localStorage.setItem("logs", JSON.stringify(logs));
}

// ===== 設定保存 =====
function loadSettings() {
  return JSON.parse(
    localStorage.getItem("settings") ||
      JSON.stringify({
        notify18: false,
        targetWater: 1500
      })
  );
}

function saveSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}

// ===== 初期ダミーデータ（UI確認用） =====
(function seedIfEmpty() {
  const logs = loadLogs();
  const today = getTodayKey();
  if (!logs[today]) {
    logs[today] = [
      { time: "08:10", text: "飲料 水 200ml" },
      { time: "09:30", text: "食事 オートミール" },
      { time: "10:00", text: "飲料 コーヒー" },
      { time: "12:40", text: "食事 パスタ" },
      { time: "18:00", text: "サプリ マグネシウム" },
      { time: "19:10", text: "徒歩 2.0km" },
      { time: "21:30", text: "体調 少し眠い" }
    ];
    saveLogs(logs);
  }
})();

// ===== ログ追加・削除 =====
function addLog(text) {
  const logs = loadLogs();
  const today = getTodayKey();
  if (!logs[today]) logs[today] = [];
  const now = new Date();
  const time = now.toTimeString().slice(0, 5);
  logs[today].push({ time, text });
  saveLogs(logs);
  renderLogList();
  renderDashboard();
  renderReports();
}

function deleteLog(index) {
  const logs = loadLogs();
  const today = getTodayKey();
  if (!logs[today]) return;
  logs[today].splice(index, 1);
  saveLogs(logs);
  renderLogList();
  renderDashboard();
  renderReports();
}

// ===== 入力UI（カテゴリ＋行動ログ） =====
let activityState = {
  watching: false,
  watchId: null,
  lastPos: null,
  distanceKm: 0
};

function renderLogInput() {
  const area = document.getElementById("logInputArea");
  area.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">入力</div>
      <div id="categoryButtons">
        <button class="catbtn" data-cat="飲料">飲料</button>
        <button class="catbtn" data-cat="薬">薬</button>
        <button class="catbtn" data-cat="食事">食事</button>
        <button class="catbtn" data-cat="サプリ">サプリ</button>
        <button class="catbtn" data-cat="菓子">菓子</button>
        <button class="catbtn" data-cat="運動">運動</button>
        <button class="catbtn" data-cat="体調">体調</button>
        <button class="catbtn" data-cat="例外">例外</button>
        <button class="catbtn" data-cat="徒歩">徒歩</button>
        <button class="catbtn" data-cat="ラン">ラン</button>
      </div>
      <textarea id="logText" placeholder="自由入力"></textarea>
      <button id="addLogBtn" class="primary-btn">＋ 追加</button>

      <div class="activity-block">
        <div class="activity-label">行動ログ（GPS距離計測・徒歩/ラン用）</div>
        <div class="activity-row">
          <button id="activityStartBtn" class="primary-btn">距離計測開始</button>
          <button id="activityStopBtn" class="primary-btn" disabled>停止してログに追加</button>
        </div>
        <div class="activity-row">
          <span>距離：<span id="activityDistance">0.00</span> km</span>
          <span>推定歩数：<span id="activitySteps">0</span> 歩</span>
        </div>
      </div>
    </div>
  `;

  // カテゴリーボタン
  document.querySelectorAll(".catbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const text = document.getElementById("logText").value.trim();
      addLog(text ? `${cat} ${text}` : cat);
      document.getElementById("logText").value = "";
    });
  });

  // テキスト追加
  document.getElementById("addLogBtn").addEventListener("click", () => {
    const text = document.getElementById("logText").value.trim();
    if (text) addLog(text);
    document.getElementById("logText").value = "";
  });

  // 行動ログ（GPS）
  document
    .getElementById("activityStartBtn")
    .addEventListener("click", startActivityTracking);
  document
    .getElementById("activityStopBtn")
    .addEventListener("click", stopActivityTracking);
}

function renderLogList() {
  const list = document.getElementById("logList");
  const logs = loadLogs()[getTodayKey()] || [];
  list.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">今日のログ</div>
      ${
        logs.length
          ? logs
              .map(
                (l, i) => `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span>・${l.time} ${l.text}</span>
            <button class="delete-btn" onclick="deleteLog(${i})">×</button>
          </div>`
              )
              .join("")
          : "まだ入力がありません"
      }
    </div>
  `;
}

// ===== 行動ログ：GPS距離計測 =====
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateActivityDisplay() {
  const distEl = document.getElementById("activityDistance");
  const stepsEl = document.getElementById("activitySteps");
  const km = activityState.distanceKm;
  const steps = Math.round(km * 1300); // 仮の歩幅
  distEl.textContent = km.toFixed(2);
  stepsEl.textContent = steps;
}

function startActivityTracking() {
  if (!navigator.geolocation) {
    alert("このブラウザでは位置情報が使えません");
    return;
  }
  if (activityState.watching) return;

  activityState.watching = true;
  activityState.distanceKm = 0;
  activityState.lastPos = null;

  const startBtn = document.getElementById("activityStartBtn");
  const stopBtn = document.getElementById("activityStopBtn");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  activityState.watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (activityState.lastPos) {
        const d = haversineDistance(
          activityState.lastPos.lat,
          activityState.lastPos.lon,
          latitude,
          longitude
        );
        activityState.distanceKm += d;
      }
      activityState.lastPos = { lat: latitude, lon: longitude };
      updateActivityDisplay();
    },
    () => {
      alert("位置情報の取得に失敗しました");
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
}

function stopActivityTracking() {
  if (!activityState.watching) return;
  activityState.watching = false;

  const startBtn = document.getElementById("activityStartBtn");
  const stopBtn = document.getElementById("activityStopBtn");
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (activityState.watchId != null) {
    navigator.geolocation.clearWatch(activityState.watchId);
    activityState.watchId = null;
  }

  const km = activityState.distanceKm;
  if (km > 0.05) {
    const steps = Math.round(km * 1300);
    addLog(`徒歩 ${km.toFixed(2)}km（推定 ${steps}歩）`);
  }
  activityState.distanceKm = 0;
  activityState.lastPos = null;
  updateActivityDisplay();
}

// ===== ダッシュボード（AIっぽい簡易解析） =====
function analyzeToday() {
  const logs = loadLogs()[getTodayKey()] || [];
  let water = 0;
  let coffee = 0;
  let protein = 0;
  let lateMeal = false;
  let walkKm = 0;

  logs.forEach((l) => {
    const t = l.text;
    if (t.includes("水")) water += 200;
    if (t.includes("コーヒー")) coffee += 1;
    if (t.includes("プロテイン")) protein += 1;
    if (t.includes("食事") && l.time >= "22:00") lateMeal = true;
    if (t.includes("徒歩")) {
      const m = t.match(/([\d.]+)km/);
      if (m) walkKm += parseFloat(m[1]);
    }
  });

  return { water, coffee, protein, lateMeal, walkKm };
}

function renderDashboard() {
  const todayEl = document.getElementById("dashboardToday");
  const trendEl = document.getElementById("dashboardTrends");
  const { water, coffee, protein, lateMeal, walkKm } = analyzeToday();
  const settings = loadSettings();
  const targetWater = settings.targetWater || 1500;

  const improvements = [];
  if (water < targetWater)
    improvements.push(`水分が少なめです（目安 ${targetWater}ml）`);
  if (coffee > 3) improvements.push("カフェインが多めです（3杯まで推奨）");
  if (protein < 2) improvements.push("タンパク質が少なめです（1日2回が目安）");
  if (lateMeal) improvements.push("22時以降の食事があります（翌日の眠気リスク）");
  if (walkKm < 3) improvements.push("徒歩距離が少なめです（3km以上が目安）");

  // 明日の予測（ざっくり）
  let headacheRisk = "低";
  let sleepiness = "普通";
  let focus = "安定";

  if (water < targetWater * 0.7) {
    headacheRisk = "中";
  }
  if (lateMeal || coffee > 3) {
    sleepiness = "高";
    focus = "やや低下";
  }

  todayEl.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">今日のサマリー</div>
      <div>水分：${water} ml（目標 ${targetWater} ml）</div>
      <div>コーヒー：${coffee} 杯</div>
      <div>プロテイン：${protein} 回</div>
      <div>徒歩距離：${walkKm.toFixed(2)} km</div>
      <div>深夜食：${lateMeal ? "あり" : "なし"}</div>
      <div style="margin-top:8px; font-weight:600;">改善ポイント</div>
      <ul>
        ${
          improvements.length
            ? improvements.map((i) => `<li>${i}</li>`).join("")
            : "<li>特に大きな問題はありません</li>"
        }
      </ul>
      <div style="margin-top:8px; font-weight:600;">明日の予測</div>
      <ul>
        <li>頭痛リスク：${headacheRisk}</li>
        <li>眠気：${sleepiness}</li>
        <li>集中力：${focus}</li>
      </ul>
    </div>
  `;

  const trends = analyzeTrends();
  trendEl.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">簡易トレンド（過去7日）</div>
      <div>平均水分：${trends.avgWater.toFixed(0)} ml</div>
      <div>平均コーヒー：${trends.avgCoffee.toFixed(1)} 杯</div>
      <div>平均徒歩距離：${trends.avgWalkKm.toFixed(2)} km</div>
      <div>深夜食の頻度：${trends.lateMealCount} 日 / ${trends.days} 日</div>
    </div>
  `;
}

// ===== トレンド解析（過去7日） =====
function analyzeTrends() {
  const logs = loadLogs();
  const dates = Object.keys(logs).sort();
  const last7 = dates.slice(-7);
  let totalWater = 0;
  let totalCoffee = 0;
  let totalWalkKm = 0;
  let lateMealCount = 0;

  last7.forEach((d) => {
    const dayLogs = logs[d] || [];
    let water = 0;
    let coffee = 0;
    let walkKm = 0;
    let late = false;

    dayLogs.forEach((l) => {
      const t = l.text;
      if (t.includes("水")) water += 200;
      if (t.includes("コーヒー")) coffee += 1;
      if (t.includes("徒歩")) {
        const m = t.match(/([\d.]+)km/);
        if (m) walkKm += parseFloat(m[1]);
      }
      if (t.includes("食事") && l.time >= "22:00") late = true;
    });

    totalWater += water;
    totalCoffee += coffee;
    totalWalkKm += walkKm;
    if (late) lateMealCount += 1;
  });

  const days = last7.length || 1;
  return {
    days,
    avgWater: totalWater / days,
    avgCoffee: totalCoffee / days,
    avgWalkKm: totalWalkKm / days,
    lateMealCount
  };
}

// ===== レポート（週・月・年の簡易集計） =====
function getPeriodStats(period) {
  const logs = loadLogs();
  const now = new Date();
  let startDate;

  if (period === "week") {
    const day = now.getDay() || 7;
    startDate = new Date(now);
    startDate.setDate(now.getDate() - (day - 1));
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  let water = 0;
  let coffee = 0;
  let protein = 0;
  let walkKm = 0;
  let lateMealDays = 0;
  let daysCount = 0;

  Object.keys(logs).forEach((dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    if (d < startDate || d > now) return;
    daysCount += 1;
    const dayLogs = logs[dateStr];
    let dayLate = false;
    dayLogs.forEach((l) => {
      const t = l.text;
      if (t.includes("水")) water += 200;
      if (t.includes("コーヒー")) coffee += 1;
      if (t.includes("プロテイン")) protein += 1;
      if (t.includes("徒歩")) {
        const m = t.match(/([\d.]+)km/);
        if (m) walkKm += parseFloat(m[1]);
      }
      if (t.includes("食事") && l.time >= "22:00") dayLate = true;
    });
    if (dayLate) lateMealDays += 1;
  });

  daysCount = daysCount || 1;
  return {
    days: daysCount,
    avgWater: water / daysCount,
    avgCoffee: coffee / daysCount,
    avgProtein: protein / daysCount,
    avgWalkKm: walkKm / daysCount,
    lateMealDays
  };
}

function renderReports() {
  const week = getPeriodStats("week");
  const month = getPeriodStats("month");
  const year = getPeriodStats("year");

  document.getElementById("weeklyReport").innerHTML = `
    <div class="dash-block">
      <div class="dash-title">週間レポート</div>
      <div>対象日数：${week.days} 日</div>
      <div>平均水分：${week.avgWater.toFixed(0)} ml</div>
      <div>平均コーヒー：${week.avgCoffee.toFixed(1)} 杯</div>
      <div>平均プロテイン：${week.avgProtein.toFixed(1)} 回</div>
      <div>平均徒歩距離：${week.avgWalkKm.toFixed(2)} km</div>
      <div>深夜食のあった日：${week.lateMealDays} 日</div>
    </div>
  `;

  document.getElementById("monthlyReport").innerHTML = `
    <div class="dash-block">
      <div class="dash-title">月間レポート</div>
      <div>対象日数：${month.days} 日</div>
      <div>平均水分：${month.avgWater.toFixed(0)} ml</div>
      <div>平均コーヒー：${month.avgCoffee.toFixed(1)} 杯</div>
      <div>平均プロテイン：${month.avgProtein.toFixed(1)} 回</div>
      <div>平均徒歩距離：${month.avgWalkKm.toFixed(2)} km</div>
      <div>深夜食のあった日：${month.lateMealDays} 日</div>
    </div>
  `;

  document.getElementById("yearlyReport").innerHTML = `
    <div class="dash-block">
      <div class="dash-title">年間レポート</div>
      <div>対象日数：${year.days} 日</div>
      <div>平均水分：${year.avgWater.toFixed(0)} ml</div>
      <div>平均コーヒー：${year.avgCoffee.toFixed(1)} 杯</div>
      <div>平均プロテイン：${year.avgProtein.toFixed(1)} 回</div>
      <div>平均徒歩距離：${year.avgWalkKm.toFixed(2)} km</div>
      <div>深夜食のあった日：${year.lateMealDays} 日</div>
    </div>
  `;
}

// ===== Guide（v9.2ベース強化版） =====
function renderGuide() {
  const g = document.getElementById("guideContent");
  g.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">Guide（生活プロトコル）</div>

      <h2>1. 朝（Morning）</h2>
      <p>目的：代謝UP・水分補給・栄養の底上げ・集中力の立ち上げ。</p>
      <ul>
        <li>水 200ml</li>
        <li>マルチビタミン（朝食後）</li>
        <li>ビタミンD3（脂質と一緒）</li>
        <li>オメガ3（朝 or 昼）</li>
        <li>コーヒー 1杯</li>
        <li>必要な日だけプロテイン</li>
      </ul>
      <h3>プロテイン（朝）のメリット</h3>
      <ul>
        <li>血糖値が安定しやすい</li>
        <li>集中力が落ちにくい</li>
        <li>空腹感のコントロール</li>
      </ul>
      <h3>デメリット</h3>
      <ul>
        <li>胃が弱い日は重く感じる</li>
        <li>飲みすぎると昼の食欲が落ちる</li>
      </ul>

      <h2>2. 昼（Lunch）</h2>
      <p>目的：エネルギー補給・タンパク質確保・午後の集中力維持。</p>
      <ul>
        <li>タンパク質 1回</li>
        <li>水 200〜400ml</li>
        <li>オメガ3（朝に飲まなかった場合）</li>
        <li>サイリウム（食前）</li>
      </ul>

      <h2>3. 夜（Dinner）</h2>
      <p>目的：回復・睡眠の質UP・翌日の体調を整える。</p>
      <ul>
        <li>タンパク質 1回</li>
        <li>水 200ml</li>
        <li>サイリウム（必要な日）</li>
        <li>亜鉛（夕食後）</li>
      </ul>
      <p>22時以降は軽食（ヨーグルト・プロテイン）に寄せる。</p>

      <h2>4. 就寝前</h2>
      <ul>
        <li>マグネシウム（寝る1時間前）</li>
        <li>水 100ml</li>
      </ul>

      <h2>5. サプリメント（メリット・デメリット）</h2>
      <h3>マルチビタミン</h3>
      <ul>
        <li>朝食後</li>
        <li>栄養の底上げ・疲労軽減</li>
        <li>空腹時は胃が荒れやすい</li>
      </ul>
      <h3>ビタミンD3</h3>
      <ul>
        <li>朝食後（脂質と一緒）</li>
        <li>免疫力UP・メンタル安定</li>
        <li>過剰摂取はNG</li>
      </ul>
      <h3>オメガ3</h3>
      <ul>
        <li>朝 or 昼の食後</li>
        <li>炎症抑制・集中力UP・血流改善</li>
        <li>空腹時はムカつくことがある</li>
      </ul>
      <h3>マグネシウム</h3>
      <ul>
        <li>寝る1時間前</li>
        <li>睡眠の質UP・筋肉の緊張緩和</li>
        <li>多すぎるとお腹がゆるくなる</li>
      </ul>
      <h3>亜鉛</h3>
      <ul>
        <li>夕食後</li>
        <li>男性ホルモン維持・免疫力UP</li>
        <li>空腹時は吐き気が出やすい</li>
      </ul>
      <h3>サイリウム</h3>
      <ul>
        <li>食前（昼 or 夜）</li>
        <li>血糖値安定・腹持ちUP</li>
        <li>水分不足だと逆に便秘</li>
      </ul>

      <h2>6. プロテイン</h2>
      <ul>
        <li>朝 or 運動後</li>
        <li>筋肉維持・空腹感コントロール</li>
        <li>飲みすぎると胃が重い</li>
      </ul>

      <h2>7. 行動ルール</h2>
      <ul>
        <li>水分：1日 1200〜1800ml（18時に200ml）</li>
        <li>タンパク質：1日 2回</li>
        <li>23時以降の食事は翌日の眠気リスクUP</li>
        <li>01時以降は「深夜作業扱い」</li>
      </ul>

      <h2>8. 例外処理</h2>
      <h3>ジャンクフードを食べた翌日</h3>
      <ul>
        <li>水 2L</li>
        <li>サイリウム</li>
        <li>タンパク質多め</li>
        <li>10,000歩</li>
      </ul>
      <h3>飲み会の翌日</h3>
      <ul>
        <li>水 2L</li>
        <li>野菜多め</li>
        <li>プロテイン</li>
        <li>早めの就寝</li>
      </ul>
    </div>
  `;
}

// ===== 設定：通知・バックアップ・復元 =====
let notifyTimer = null;

function setupSettings() {
  const settings = loadSettings();
  const notify18 = document.getElementById("notify18");
  const targetWater = document.getElementById("targetWater");
  const backupBtn = document.getElementById("backupBtn");
  const restoreBtn = document.getElementById("restoreBtn");
  const restoreFile = document.getElementById("restoreFile");

  notify18.checked = settings.notify18;
  targetWater.value = settings.targetWater;

  notify18.addEventListener("change", () => {
    const s = loadSettings();
    s.notify18 = notify18.checked;
    saveSettings(s);
    setupNotifyTimer();
  });

  targetWater.addEventListener("change", () => {
    const s = loadSettings();
    s.targetWater = Number(targetWater.value) || 1500;
    saveSettings(s);
    renderDashboard();
  });

  backupBtn.addEventListener("click", () => {
    const data = {
      logs: loadLogs(),
      settings: loadSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-diary-backup-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  restoreBtn.addEventListener("click", () => {
    const file = restoreFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.logs) localStorage.setItem("logs", JSON.stringify(data.logs));
        if (data.settings) saveSettings(data.settings);
        renderLogList();
        renderDashboard();
        renderReports();
        setupSettings();
        setupNotifyTimer();
        alert("復元しました");
      } catch (err) {
        alert("復元に失敗しました");
      }
    };
    reader.readAsText(file);
  });
}

// 18:00 通知（簡易版）
function setupNotifyTimer() {
  if (notifyTimer) {
    clearInterval(notifyTimer);
    notifyTimer = null;
  }
  const settings = loadSettings();
  if (!settings.notify18) return;

  notifyTimer = setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h === 18 && m === 0) {
      alert("水 200ml を飲む時間です");
    }
  }, 60000);
}

// ===== 初期化 =====
function init() {
  renderLogInput();
  renderLogList();
  renderDashboard();
  renderReports();
  renderGuide();
  setupSettings();
  setupNotifyTimer();
}

function renderGuide() {
  const g = document.getElementById("guideContent");

  g.innerHTML = `
    ${/* ここに前回作った「Guide 完全統合版 HTML」をそのまま入れる */""}
  `;

  // ハイライト処理
  const words = ["ビタミンD3", "マルチビタミン", "オメガ3", "亜鉛", "マグネシウム", "サイリウム", "プロテイン"];
  g.innerHTML = g.innerHTML.replace(
    new RegExp(words.join("|"), "g"),
    (match) => `<span class="highlight">${match}</span>`
  );
}

init();
