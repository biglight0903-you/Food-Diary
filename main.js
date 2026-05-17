/* =========================
   タブ切り替え
========================= */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* =========================
   ログ保存ユーティリティ
========================= */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadLogs() {
  return JSON.parse(localStorage.getItem("logs") || "{}");
}

function saveLogs(logs) {
  localStorage.setItem("logs", JSON.stringify(logs));
}

/* =========================
   設定保存
========================= */
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

/* =========================
   初期ダミーデータ
========================= */
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

/* =========================
   ログ追加・削除
========================= */
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

/* =========================
   入力UI（カテゴリ＋行動ログ）
========================= */
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
        <div class="activity-label">行動ログ（GPS距離計測）</div>
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

  /* カテゴリーボタン */
  document.querySelectorAll(".catbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const text = document.getElementById("logText").value.trim();
      addLog(text ? `${cat} ${text}` : cat);
      document.getElementById("logText").value = "";
    });
  });

  /* テキスト追加 */
  document.getElementById("addLogBtn").addEventListener("click", () => {
    const text = document.getElementById("logText").value.trim();
    if (text) addLog(text);
    document.getElementById("logText").value = "";
  });

  /* 行動ログ（GPS） */
  document.getElementById("activityStartBtn").addEventListener("click", startActivityTracking);
  document.getElementById("activityStopBtn").addEventListener("click", stopActivityTracking);
}

/* =========================
   ログ一覧
========================= */
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

/* =========================
   GPS距離計測
========================= */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateActivityDisplay() {
  const km = activityState.distanceKm;
  const steps = Math.round(km * 1300);
  document.getElementById("activityDistance").textContent = km.toFixed(2);
  document.getElementById("activitySteps").textContent = steps;
}

function startActivityTracking() {
  if (!navigator.geolocation) {
    alert("位置情報が使えません");
    return;
  }
  if (activityState.watching) return;

  activityState.watching = true;
  activityState.distanceKm = 0;
  activityState.lastPos = null;

  document.getElementById("activityStartBtn").disabled = true;
  document.getElementById("activityStopBtn").disabled = false;

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
    () => alert("位置情報の取得に失敗しました"),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
}

function stopActivityTracking() {
  if (!activityState.watching) return;

  activityState.watching = false;
  document.getElementById("activityStartBtn").disabled = false;
  document.getElementById("activityStopBtn").disabled = true;

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

/* =========================
   今日の解析（AIっぽいロジック）
========================= */
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

/* =========================
   Dashboard 表示
========================= */
function renderDashboard() {
  const todayEl = document.getElementById("dashboardToday");
  const trendEl = document.getElementById("dashboardTrends");
  const { water, coffee, protein, lateMeal, walkKm } = analyzeToday();
  const settings = loadSettings();
  const targetWater = settings.targetWater || 1500;

  const improvements = [];
  if (water < targetWater) improvements.push(`水分が少なめです（目安 ${targetWater}ml）`);
  if (coffee > 3) improvements.push("カフェインが多めです（3杯まで推奨）");
  if (protein < 2) improvements.push("タンパク質が少なめです（1日2回が目安）");
  if (lateMeal) improvements.push("22時以降の食事があります（翌日の眠気リスク）");
  if (walkKm < 3) improvements.push("徒歩距離が少なめです（3km以上が目安）");

  let headacheRisk = "低";
  let sleepiness = "普通";
  let focus = "安定";

  if (water < targetWater * 0.7) headacheRisk = "中";
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

/* =========================
   トレンド解析（過去7日）
========================= */
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

/* =========================
   期間別集計（週・月・年）
========================= */
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

/* =========================
   レポート描画
========================= */
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

/* =========================
   Guide（完全統合版 v10.0）
========================= */
function renderGuide() {
  const g = document.getElementById("guideContent");

  g.innerHTML = `
    <div class="dash-block">
      <div class="dash-title">Guide（完全統合版 v10.0）</div>

      <h2>1. コア思想（SYSTEM PHILOSOPHY）</h2>
      <div class="box box-info">
        <div>・迷ったらプロテインを選択する。</div>
        <div>・夜は糖質を入れず、睡眠中の脂肪燃焼を妨げない。</div>
        <div>・炎症を抑えることで、減量スピードと体調を両立させる。</div>
        <div>・睡眠の質が、翌日の食欲・代謝・意思決定を左右する。</div>
        <div>・例外処理（外食・酒・食べすぎ）をあらかじめ設計しておく。</div>
      </div>

      <h2>2. サプリメント運用（タイミング＋メリット/デメリット）</h2>

      <div class="grid-2">

        <div class="card">
          <div class="card-header">
            <span class="card-title">朝（朝食後）</span>
            <span class="tag">代謝スイッチ</span>
          </div>
          <ul class="param-list">
            <li><strong>ビタミンD3</strong>：免疫・メンタル安定／脂溶性なので食後</li>
            <li><strong>マルチビタミン</strong>：栄養の底上げ／空腹時は胃が荒れる</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">昼（昼食後）</span>
            <span class="tag">炎症コントロール 前半</span>
          </div>
          <ul class="param-list">
            <li><strong>オメガ3</strong>：炎症抑制・集中力UP／空腹時はムカつく</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">夜（夕食後）</span>
            <span class="tag">回復 × 炎症コントロール 後半</span>
          </div>
          <ul class="param-list">
            <li><strong>オメガ3</strong>：昼と分割で血中濃度安定</li>
            <li><strong>亜鉛</strong>：男性ホルモン維持／空腹時は吐き気</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">就寝90分前</span>
            <span class="tag">睡眠プロトコル</span>
          </div>
          <ul class="param-list">
            <li><strong>マグネシウム</strong>：睡眠の質UP／多いとお腹がゆるい</li>
          </ul>
        </div>

      </div>

      <h3>プロテイン（メリット/デメリット）</h3>
      <ul class="param-list">
        <li>血糖値が安定し、集中力が落ちにくい</li>
        <li>空腹感のコントロールに最適</li>
        <li>飲みすぎると胃が重い</li>
      </ul>

      <h2>3. 1日の運用スケジュール（バッチ処理）</h2>

      <table>
        <tr><th>タイミング</th><th>実行内容</th><th>ポイント</th></tr>

        <tr>
          <td class="time-col">Morning</td>
          <td>卵2個＋納豆＋味噌汁＋プロテイン半スクープ<br>＋ D3＋マルチ（食後）</td>
          <td>代謝スイッチ＋血糖値安定</td>
        </tr>

        <tr>
          <td class="time-col">Lunch</td>
          <td>鶏むね肉＋野菜＋白米100〜150g＋オメガ3</td>
          <td>集中力維持・炎症コントロール</td>
        </tr>

        <tr>
          <td class="time-col">Night</td>
          <td>プロテイン＋サイリウム＋オメガ3＋亜鉛</td>
          <td>夜は糖質禁止／睡眠の質を最優先</td>
        </tr>

        <tr>
          <td class="time-col">Sleep 90min Before</td>
          <td>スマホOFF・ぬるめのシャワー・Mg</td>
          <td>翌日の食欲・代謝・メンタルが安定</td>
        </tr>
      </table>

      <h2>4. 許可食品リスト（優先度付き）</h2>

      <div class="grid-3">

        <div class="card">
          <div class="card-title">最優先：タンパク質</div>
          <p class="desc">卵／納豆／豆腐／鶏むね肉／ヨーグルト</p>
        </div>

        <div class="card">
          <div class="card-title">補助：整える食品</div>
          <p class="desc">味噌汁／野菜／海藻／きのこ／キムチ</p>
        </div>

        <div class="card">
          <div class="card-title">制限付き：タイミング限定</div>
          <p class="desc">白米（昼のみ）／フルーツ（朝のみ）／夜の糖質は禁止</p>
        </div>

      </div>

      <h2>5. 食事テンプレート</h2>

      <table>
        <tr><th>タイミング</th><th>メニュー構成</th></tr>
        <tr><td class="time-col">朝</td><td>卵＋納豆＋味噌汁＋プロテイン</td></tr>
        <tr><td class="time-col">昼</td><td>鶏むね肉＋野菜＋白米</td></tr>
        <tr><td class="time-col">夜</td><td>プロテイン＋サイリウム</td></tr>
        <tr><td class="time-col">間食</td><td>ゆで卵 or ヨーグルト</td></tr>
      </table>

      <h2>6. 例外処理プロトコル</h2>

      <div class="box box-warning">
        <strong>食べすぎた場合</strong><br>
        ・翌日で調整（断食はしない）<br>
        ・タンパク質と水を優先
      </div>

      <div class="box box-warning">
        <strong>外食・酒</strong><br>
        ・酒は蒸留酒＋水同量<br>
        ・翌日：納豆2P＋水3L
      </div>

      <div class="box box-warning">
        <strong>歩けない日</strong><br>
        ・階段優先／1駅手前で降りる<br>
        ・無理なら 1分HIIT
      </div>
  `;

  const words = ["ビタミンD3", "マルチビタミン", "オメガ3", "亜鉛", "マグネシウム", "サイリウム", "プロテイン"];
  g.innerHTML = g.innerHTML.replace(
    new RegExp(words.join("|"), "g"),
    (match) => `<span class="highlight">${match}</span>`
  );
}

g.innerHTML += `
      <h2>7. 期待される変化（KPI）</h2>

      <table>
        <tr><th>期間</th><th>変化</th></tr>
        <tr><td class="time-col">3日</td><td>間食欲求が減る</td></tr>
        <tr><td class="time-col">1週間</td><td>暴食が減る</td></tr>
        <tr><td class="time-col">2週間</td><td>体重・体脂肪が減り始める</td></tr>
        <tr><td class="time-col">1ヶ月</td><td>ルーチンが自動化</td></tr>
      </table>

      <h2>8. 摂取量パラメータ</h2>

      <div class="grid-2">

        <div class="card">
          <div class="card-title">プロテイン</div>
          <ul class="param-list">
            <li>1回：30g</li>
            <li>夜置換：1〜2回</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title">サイリウム</div>
          <ul class="param-list">
            <li>3〜5g</li>
            <li>水300〜400ml</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title">食品パラメータ</div>
          <ul class="param-list">
            <li>卵：2〜4個</li>
            <li>納豆：1P</li>
            <li>豆腐：150〜300g</li>
            <li>白米：昼のみ100〜150g</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title">サプリ規定量</div>
          <ul class="param-list">
            <li>D3：5000IU</li>
            <li>マルチ：1〜2粒</li>
            <li>オメガ3：1〜2粒 × 2回</li>
            <li>亜鉛：15〜30mg</li>
            <li>Mg：200〜400mg</li>
          </ul>
        </div>

      </div>

      <h2>9. クリティカルルール</h2>

      <div class="box box-danger">
        <div>・夜の糖質は禁止</div>
        <div>・空腹は水 or タンパク質で処理</div>
        <div>・迷ったらプロテイン</div>
        <div>・完璧より継続</div>
      </div>

      <h2>10. 可変プロトコル（A/Bパターン）</h2>

      <div class="grid-2">

        <div class="card">
          <div class="card-header">
            <span class="card-title">A：前夜しっかり食べた翌日</span>
            <span class="tag">朝は軽く</span>
          </div>
          <ul class="param-list">
            <li>プロテイン10〜15g</li>
            <li>D3＋マルチ</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">B：前夜が軽かった翌日</span>
            <span class="tag">朝はしっかり</span>
          </div>
          <ul class="param-list">
            <li>卵2＋納豆＋味噌汁＋プロテイン</li>
            <li>D3＋マルチ</li>
          </ul>
        </div>

      </div>

      <h2>11. 昼〜夜の共通ルール</h2>

      <table>
        <tr><th>タイミング</th><th>食事</th><th>サプリ</th><th>ポイント</th></tr>

        <tr>
          <td class="time-col">昼</td>
          <td>鶏むね肉＋野菜＋白米100g</td>
          <td>オメガ3</td>
          <td>遅い昼は軽く</td>
        </tr>

        <tr>
          <td class="time-col">夜10時前後</td>
          <td>ヨーグルト／卵／豆腐／プロテイン</td>
          <td>オメガ3＋亜鉛</td>
          <td>糖質禁止</td>
        </tr>

        <tr>
          <td class="time-col">就寝90分前</td>
          <td>スマホOFF・シャワー</td>
          <td>Mg</td>
          <td>睡眠の深さを確保</td>
        </tr>

      </table>
    </div>
  `;

  const words = ["ビタミンD3", "マルチビタミン", "オメガ3", "亜鉛", "マグネシウム", "サイリウム", "プロテイン"];
  g.innerHTML = g.innerHTML.replace(
    new RegExp(words.join("|"), "g"),
    (match) => `<span class="highlight">${match}</span>`
  );
}

/* =========================
   設定（通知・水分目標）
========================= */
function renderSettings() {
  const settings = loadSettings();

  document.getElementById("notify18").checked = settings.notify18;
  document.getElementById("targetWater").value = settings.targetWater;

  document.getElementById("notify18").addEventListener("change", (e) => {
    settings.notify18 = e.target.checked;
    saveSettings(settings);
  });

  document.getElementById("targetWater").addEventListener("input", (e) => {
    settings.targetWater = Number(e.target.value);
    saveSettings(settings);
    renderDashboard();
  });

  document.getElementById("backupBtn").addEventListener("click", () => {
    const data = {
      logs: loadLogs(),
      settings: loadSettings()
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "food_diary_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("restoreBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("restoreFile");
    if (!fileInput.files.length) {
      alert("ファイルを選択してください");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.logs) localStorage.setItem("logs", JSON.stringify(data.logs));
        if (data.settings) localStorage.setItem("settings", JSON.stringify(data.settings));

        alert("復元が完了しました");
        renderAll();
      } catch {
        alert("復元に失敗しました（ファイル形式エラー）");
      }
    };
    reader.readAsText(file);
  });
}

/* =========================
   全体レンダリング
========================= */
function renderAll() {
  renderLogInput();
  renderLogList();
  renderDashboard();
  renderReports();
  renderGuide();
  renderSettings();
}

/* =========================
   初期化
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});
