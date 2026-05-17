/* ------------------------------
   タブ切り替え
------------------------------ */
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "guide") renderGuide();
  });
});

/* ------------------------------
   ログ管理
------------------------------ */
let logs = JSON.parse(localStorage.getItem("dailyLogs") || "[]");
let historyList = JSON.parse(localStorage.getItem("historyList") || "[]");
let selectedCategories = [];

/* ------------------------------
   固有名詞ボタン（即時記録）
------------------------------ */
function quickAdd(text) {
  const now = new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });

  logs.push({ time: now, text });
  localStorage.setItem("dailyLogs", JSON.stringify(logs));
  renderLogs();
}

/* ------------------------------
   カテゴリ選択（複数選択）
------------------------------ */
function toggleCategory(btn, cat) {
  btn.classList.toggle("selected");

  if (selectedCategories.includes(cat)) {
    selectedCategories = selectedCategories.filter(c => c !== cat);
  } else {
    selectedCategories.push(cat);
  }
}

/* ------------------------------
   記録追加（カテゴリ＋テキスト）
------------------------------ */
function addLog() {
  const text = document.getElementById("textInput").value.trim();
  if (!text) return;

  const now = new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const fullText = `${selectedCategories.join(" / ")}：${text}`;

  logs.push({ time: now, text: fullText });
  localStorage.setItem("dailyLogs", JSON.stringify(logs));

  if (!historyList.includes(text)) {
    historyList.push(text);
    localStorage.setItem("historyList", JSON.stringify(historyList));
  }

  document.getElementById("textInput").value = "";
  selectedCategories = [];
  document.querySelectorAll("#categoryButtons .btn").forEach(btn =>
    btn.classList.remove("selected")
  );

  renderLogs();
}

/* ------------------------------
   履歴候補
------------------------------ */
function showSuggestions() {
  const box = document.getElementById("suggestionBox");
  box.innerHTML = historyList
    .map(item => `<div class="suggestion-item" onclick="selectSuggestion('${item}')">${item}</div>`)
    .join("");
  box.style.display = "block";
}

function filterSuggestions() {
  const input = document.getElementById("textInput").value;
  const box = document.getElementById("suggestionBox");

  box.innerHTML = historyList
    .filter(item => item.includes(input))
    .map(item => `<div class="suggestion-item" onclick="selectSuggestion('${item}')">${item}</div>`)
    .join("");
}

function selectSuggestion(text) {
  document.getElementById("textInput").value = text;
  document.getElementById("suggestionBox").style.display = "none";
}

/* ------------------------------
   記録表示（削除ボタン付き）
------------------------------ */
function renderLogs() {
  const list = document.getElementById("logList");
  list.innerHTML = logs
    .map(
      (l, index) => `
      <li class="log-item">
        <span class="log-text">${l.time}：${l.text}</span>
        <button class="log-delete-btn" onclick="deleteLog(${index})">削除</button>
      </li>
    `
    )
    .join("");
}
renderLogs();

function deleteLog(index) {
  logs.splice(index, 1);
  localStorage.setItem("dailyLogs", JSON.stringify(logs));
  renderLogs();
}

/* ------------------------------
   全削除
------------------------------ */
function clearAllLogs() {
  if (!confirm("本当に削除しますか？")) return;

  logs = [];
  localStorage.setItem("dailyLogs", JSON.stringify(logs));
  renderLogs();
}

/* ------------------------------
   AI解析（元の簡易版）
------------------------------ */
function analyzeLogs() {
  let text = logs.map(l => l.text).join(" / ");
  let advice = "";

  if (!text.includes("マルチ")) advice += "・マルチビタミンが未記録です。<br>";
  if (!text.includes("D3")) advice += "・ビタミンD3が未記録です。<br>";
  if (!text.includes("オメガ3")) advice += "・オメガ3が不足気味です。<br>";
  if (!text.includes("マグネ")) advice += "・マグネシウムがない日 → 睡眠の質が落ちやすいです。<br>";

  if (text.includes("ジャンク")) advice += "・ジャンクを食べた日は翌朝軽め＋水多めが最適です。<br>";

  if (advice === "") advice = "今日の運用はとても良いバランスです。";

  const box = document.getElementById("analysisResult");
  box.innerHTML = advice;
  box.style.display = "block";
}

/* ------------------------------
   Guide（元のまま）
------------------------------ */
function renderGuide() {
  document.getElementById("guideContent").innerHTML = `
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
  `;
}
renderGuide();
