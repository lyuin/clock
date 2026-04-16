const $ = (id) => document.getElementById(id);

const canvas = $("clock");
const ctx = canvas.getContext("2d");

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

// --- 描画 ---
function resize() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  const now = new Date();
  const w = parseFloat(canvas.style.width);
  const cx = w / 2;
  const cy = w / 2;
  const r = w * 0.45;

  ctx.clearRect(0, 0, w, w);

  // 文字盤の目盛り
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isHour = i % 5 === 0;
    const len = isHour ? r * 0.12 : r * 0.05;
    const lw = isHour ? 2.5 : 1;
    const color = isHour ? "#eee" : "#555";
    const x1 = cx + Math.cos(angle) * (r - len);
    const y1 = cy + Math.sin(angle) * (r - len);
    const x2 = cx + Math.cos(angle) * r;
    const y2 = cy + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  // 時針
  drawHand(cx, cy, (h + m / 60) * 30 - 90, r * 0.55, 4, "#eee");
  // 分針
  drawHand(cx, cy, (m + s / 60) * 6 - 90, r * 0.78, 2.5, "#eee");
  // 秒針
  drawHand(cx, cy, (s + ms / 1000) * 6 - 90, r * 0.85, 1, "#e57373");

  // 中心の丸
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#e57373";
  ctx.fill();

  requestAnimationFrame(draw);
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

// --- 初期化 ---
window.addEventListener("resize", () => { resize(); });
resize();
$("wakelock").addEventListener("click", toggleWakeLock);
draw();

// Service Worker 登録
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
