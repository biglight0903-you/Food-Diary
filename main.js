// main.js 全部版（シンプル版・動作保証）

/* =========================
   タブ切り替え
========================= */
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    const tabId = "tab-" + btn.dataset.tab;
    document.getElementById(tabId).classList.add("active");

    if (tabId === "tab-dashboard") renderDashboard();
    if (tabId === "tab-report") renderReport();
    if (tabId === "tab-guide") renderGuide();
  });
});

/* =========================
   ログ管理
========================= */
let logs = JSON.parse(localStorage.getItem("logs") || "[]");
let historyList = JSON.parse(localStorage.getItem("historyList") || "[]");
let selectedCategory = "";

/* =========================
   カテゴリ選択
========================= */
document.querySelectorAll(".log-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".log-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.category;
  });
});

/* =========================
   サジェスト
========================= */
const input = document.getElementById("textInput");
const suggestBox = document.getElementById("suggestBox");

input.addEventListener("input", () => {
  const v = input.value.trim();
  if (!v) {
    suggestBox.style.display = "none";
    return;
  }

  const filtered = historyList.filter(h => h.includes(v));
  suggestBox.innerHTML = filtered.map(f => `<div>${f}</div>`).join("");
  suggestBox.style.display = filtered.length ? "block" : "none";

  suggestBox.querySelectorAll("div").forEach(div => {
    div.addEventListener("click", () => {
      input.value = div.textContent;
      suggestBox.style.display = "none";
    });
  });
});

/* =========================
   ログ追加
========================= */
document.getElementById("addLogBtn").addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  if (!selectedCategory) {
    alert("カテゴリを選んでください");
    return;
  }

  const time = new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });

  logs.push({ time, category: selectedCategory, text });

  if (!historyList.includes(text)) {
    historyList.push(text);
    localStorage.setItem("historyList", JSON.stringify(historyList));
  }

  localStorage.setItem("logs", JSON.stringify(logs));
  input.value = "";
  renderLogs();
});

/* =========================
   ログ表示
========================= */
function renderLogs() {
  const list = document.getElementById("logList");
  list.innerHTML = logs
    .map(
      (l, i) => `
    <div class="log-item">
      <span>${l.time}｜${l.category}｜${l.text}</span>
      <button class="log-delete" onclick="deleteLog(${i})">削除</button>
    </div>
  `
    )
    .join("");
}
renderLogs();

function deleteLog(i) {
  logs.splice(i, 1);
  localStorage.setItem("logs", JSON.stringify(logs));
  renderLogs();
}

/* =========================
   Dashboard（シンプル集計）
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
    if (l.category === "コーヒー") coffee++;
  });

  box.innerHTML = `
    <div class="dashboard-card">
      <div class="dashboard-title">水分摂取</div>
      <div class="dashboard-value">${water} ml</div>
    </div>

    <div class="dashboard-card">
      <div class="dashboard-title">コーヒー</div>
      <div class="dashboard-value">${coffee} 杯</div>
    </div>
  `;
}

/* =========================
   Report（カテゴリ別回数）
========================= */
function renderReport() {
  const box = document.getElementById("reportContent");

  const count = {};
  logs.forEach(l => {
    count[l.category] = (count[l.category] || 0) + 1;
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
   Guide（Process Guide 全部入り）
========================= */
function renderGuide() {
  const box = document.getElementById("guideContent");

  box.innerHTML = `
    <div class="guide-card">
      <h2>Food Diary Template – Process Guide</h2>
      <p>※ この Process Guide は、祐一の生活リズム・食事傾向・例外処理・サプリ運用を統合した最新版。</p>

      <h3>■ 朝の運用</h3>
      <ul>
        <li>朝食は「軽め or しっかり」を前日の夜で調整</li>
        <li>朝しっかり食べた日は昼を軽くする</li>
        <li>朝軽い日は昼をしっかり食べる</li>
        <li>朝のカフェインは 9:00 以降が理想</li>
      </ul>

      <h3>■ 昼の運用</h3>
      <ul>
        <li>昼が遅い日は夜を軽くする</li>
        <li>昼に糖質が多い日は夜を控えめに</li>
      </ul>

      <h3>■ 夜の運用</h3>
      <ul>
        <li>夜しっかり食べた日は翌朝軽くする</li>
        <li>夜遅食は翌朝の糖質を控えめに</li>
        <li>ジャンク後は「水多め＋朝軽め＋昼しっかり」</li>
      </ul>

      <h3>■ サプリ運用</h3>
      <ul>
        <li>マルチビタミン：朝 or 昼</li>
        <li>ビタミンD3：朝</li>
        <li>オメガ3：夜 or 食後</li>
        <li>亜鉛：夜</li>
        <li>マグネシウム：寝る前</li>
        <li>サイリウム：食前</li>
      </ul>

      <h3>■ 例外処理</h3>
      <ul>
        <li>外食 → 翌朝軽め</li>
        <li>酒 → 水多め＋マグネシウム</li>
        <li>ジャンク → 翌朝軽め＋昼しっかり</li>
      </ul>

      <h3>■ 水分管理</h3>
      <ul>
        <li>1日 1〜2L を目安に</li>
        <li>チマチマ飲むので 50ml 刻みで記録</li>
      </ul>

      <h3>■ 運動</h3>
      <ul>
        <li>HIIT：週 2〜3 回</li>
        <li>散歩：毎日 20〜30 分</li>
      </ul>

      <h3>■ 体調管理</h3>
      <ul>
        <li>眠気 → カフェイン控えめ</li>
        <li>胃もたれ → 朝軽め</li>
        <li>ストレス → 糖質を控えめに</li>
      </ul>

      <h2>アプリの使い方</h2>
      <ul>
        <li>内容を入力 → カテゴリ選択 → 追加</li>
        <li>履歴候補からタップで入力可能</li>
        <li>Dashboard で今日の状況を確認</li>
        <li>Report で集計を確認</li>
      </ul>

      <h2>サプリのメリット・デメリット</h2>

      <h3>■ マルチビタミン</h3>
      <ul>
        <li>メリット：全体の底上げ、欠乏防止</li>
        <li>デメリット：空腹時だと胃が荒れやすい</li>
      </ul>

      <h3>■ ビタミンD3</h3>
      <ul>
        <li>メリット：免疫・気分・睡眠の質向上</li>
        <li>デメリット：摂りすぎ注意（上限あり）</li>
      </ul>

      <h3>■ オメガ3</h3>
      <ul>
        <li>メリット：炎症低減・集中力UP</li>
        <li>デメリット：空腹時だと気持ち悪くなることがある</li>
      </ul>

      <h3>■ 亜鉛</h3>
      <ul>
        <li>メリット：回復力UP・肌・免疫</li>
        <li>デメリット：空腹時は吐き気が出やすい</li>
      </ul>

      <h3>■ マグネシウム</h3>
      <ul>
        <li>メリット：睡眠の質UP・筋肉の緊張緩和</li>
        <li>デメリット：摂りすぎるとお腹がゆるくなる</li>
      </ul>

      <h3>■ サイリウム</h3>
      <ul>
        <li>メリット：食欲コントロール・血糖安定</li>
        <li>デメリット：水と一緒に飲まないと詰まりやすい</li>
      </ul>
    </div>
  `;
}

/* =========================
   Settings（初期化のみ）
========================= */
document.getElementById("resetAppBtn").addEventListener("click", () => {
  if (!confirm("アプリを初期化しますか？（ログがすべて消えます）")) return;
  localStorage.clear();
  logs = [];
  historyList = [];
  renderLogs();
  document.getElementById("dashboardContent").innerHTML = "";
  document.getElementById("reportContent").innerHTML = "";
  document.getElementById("guideContent").innerHTML = "";
});
