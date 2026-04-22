const $ = (id) => document.getElementById(id);

const canvas = $("clock");
const ctx = canvas.getContext("2d");

// --- テーマ切り替え ---
const THEMES = ["standard"];
// const THEMES = ["standard", "horizon", "legacy"]; // TODO: デザイン調整後に有効化
let currentTheme = localStorage.getItem("clock-theme") || THEMES[0];
if (!THEMES.includes(currentTheme)) currentTheme = THEMES[0];

function applyThemeBg() {
  document.body.style.background = currentTheme === "legacy" ? "#333" : "#111";
}

function cycleTheme() {
  const i = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  currentTheme = THEMES[i];
  localStorage.setItem("clock-theme", currentTheme);
  applyThemeBg();
}

// --- Wake Lock (ボタン操作) ---
let wakeLock = null;

async function toggleWakeLock() {
  const btn = $("wakelock");
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    btn.classList.remove("active");
    btn.textContent = "lock off";
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
      btn.classList.remove("active");
      btn.textContent = "lock off";
    });
    btn.classList.add("active");
    btn.textContent = "lock on";
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if ($("wakelock").classList.contains("active")) toggleWakeLock();
  }
});

// --- 描画パーツ ---
function resize() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.85;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawTicks(cx, cy, r) {
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isHour = i % 5 === 0;
    const len = isHour ? r * 0.12 : r * 0.05;
    const lw = isHour ? 2.5 : 1;
    const color = isHour ? "#eee" : "#555";
    if (isHour && i === 0) {
      // 12時位置: 二本線
      const gap = r * 0.025;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const nx = -sin, ny = cos; // 法線方向
      for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + cos * (r - len) + nx * gap * sign, cy + sin * (r - len) + ny * gap * sign);
        ctx.lineTo(cx + cos * r + nx * gap * sign, cy + sin * r + ny * gap * sign);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (r - len), cy + Math.sin(angle) * (r - len));
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function drawRomanNumerals(cx, cy, r) {
  ctx.fillStyle = "#ccc";
  ctx.font = `${r * 0.15}px "Palatino Linotype", "Book Antiqua", Palatino, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const dist = r * 1.18;
    ctx.fillText(ROMAN[i], cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
  }
}

function drawHands(cx, cy, r, now) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();
  const secAngle = (s + ms / 1000) * 6 - 90;
  drawHand(cx, cy, (h + m / 60) * 30 - 90, r * 0.55, 4, "#eee");
  drawHand(cx, cy, (m + s / 60) * 6 - 90, r * 0.78, 2.5, "#eee");
  // 秒針: カウンターウェイト（反対側）
  drawHand(cx, cy, secAngle + 180, r * 0.85 * 0.25, 2.5, "#e57373");
  // 秒針: メイン
  drawHand(cx, cy, secAngle, r * 0.85, 1, "#e57373");
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#e57373";
  ctx.fill();
}

function drawHand(cx, cy, angleDeg, length, width, color) {
  const angle = angleDeg * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

// --- Legacy サブダイヤル ---
const DAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

function drawSubDial(cx, cy, sr, label, value, max, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, sr, 0, Math.PI * 2);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = "#aaa";
  ctx.font = `${sr * 0.35}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy - sr * 0.45);
  const angle = (value / max) * 360 - 90;
  drawHand(cx, cy, angle, sr * 0.7, 1.2, color);
}

function drawMoonPhase(cx, cy, sr, now) {
  ctx.beginPath();
  ctx.arc(cx, cy, sr, 0, Math.PI * 2);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // 月齢計算（簡易）
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const jd = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5;
  const age = ((jd - 2451550.1) % 29.53 + 29.53) % 29.53;
  const mr = sr * 0.55;
  // 月の円
  ctx.beginPath();
  ctx.arc(cx, cy + sr * 0.05, mr, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
  // 明るい部分
  const phase = age / 29.53;
  ctx.beginPath();
  ctx.arc(cx, cy + sr * 0.05, mr, -Math.PI / 2, Math.PI / 2, false);
  const k = Math.cos(phase * 2 * Math.PI);
  ctx.ellipse(cx, cy + sr * 0.05, Math.abs(k) * mr, mr, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  ctx.fillStyle = "#e8e0c8";
  ctx.fill();
}

function drawDateWindow(cx, cy, sr, now) {
  const size = sr * 1.2;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - size, cy - size * 0.5, size * 2, size);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(cx - size, cy - size * 0.5, size * 2, size);
  ctx.fillStyle = "#eee";
  ctx.font = `bold ${size * 0.8}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(now.getDate()), cx, cy);
}

function drawLegacy(cx, cy, r, now) {
  // Legacy用の目盛り（暗めの色調）
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isHour = i % 5 === 0;
    const len = isHour ? r * 0.12 : r * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (r - len), cy + Math.sin(angle) * (r - len));
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = isHour ? "#ccc" : "#666";
    ctx.lineWidth = isHour ? 2.5 : 1;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  const sr = r * 0.18;
  // 12時: パワーリザーブ（バッテリー）
  drawSubDial(cx, cy - r * 0.45, sr, "PWR", (batteryLevel ?? 0.5) * 100, 100, "#8bc34a");
  // 3時: オーバーサイズデイト
  drawDateWindow(cx + r * 0.45, cy, sr, now);
  // 6時: ムーンフェイズ
  drawMoonPhase(cx, cy + r * 0.45, sr, now);
  // 9時: 曜日
  drawSubDial(cx - r * 0.45, cy, sr, DAYS_JA[now.getDay()], now.getDay(), 7, "#ccc");
  // 針（Legacy色調）
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
  drawHand(cx, cy, (h + m / 60) * 30 - 90, r * 0.55, 4, "#ddd");
  drawHand(cx, cy, (m + s / 60) * 6 - 90, r * 0.78, 2.5, "#ddd");
  drawHand(cx, cy, (s + ms / 1000) * 6 - 90, r * 0.85, 1, "#c0a050");
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#c0a050";
  ctx.fill();
}

// --- バッテリー監視 ---
let batteryLevel = null;
if (navigator.getBattery) {
  navigator.getBattery().then((b) => {
    batteryLevel = b.level;
    b.addEventListener("levelchange", () => { batteryLevel = b.level; });
  });
}

// --- テーマ別描画 ---
function draw() {
  const now = new Date();
  const w = parseFloat(canvas.style.width);
  const cx = w / 2;
  const cy = w / 2;
  const r = w * 0.45;

  ctx.clearRect(0, 0, w, w);

  if (currentTheme === "legacy") {
    drawLegacy(cx, cy, r, now);
  } else {
    if (currentTheme === "horizon") {
      drawTicks(cx, cy, r);
      drawRomanNumerals(cx, cy, r);
    } else {
      drawTicks(cx, cy, r);
    }
    drawHands(cx, cy, r, now);
  }

  requestAnimationFrame(draw);
}

// --- 初期化 ---
window.addEventListener("resize", () => { resize(); });
canvas.addEventListener("click", cycleTheme);
applyThemeBg();
resize();
$("wakelock").addEventListener("click", toggleWakeLock);
draw();

// Service Worker 登録
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
