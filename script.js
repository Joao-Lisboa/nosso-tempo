/* ====== EDITE AQUI ====== */
const CONFIG = {
  title: "João & Marielly",
  // 02/05/2025 às 19:44 (horário local; mês começa em 0 => 4 = maio)
  start: new Date(2025, 4, 2, 19, 44, 0),
  message: "Cada segundo ao seu lado vale a pena.",
  footer: "Eu te amo minha princesa ❤️",
  // Coloque as fotos na pasta "photos" e liste aqui:
  photos: [
    { src: "photos/04.jpg", caption: "Onde tudo começou · 19:44", fit: "contain" },
    { src: "photos/02.jpg", caption: "Nós dois" },
    { src: "photos/01.jpg", caption: "Um beijo no meio da multidão", pos: "50% 30%" },
    { src: "photos/03.jpg", caption: "Noite perfeita", pos: "50% 35%" },
  ]
};
/* ======================== */

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("pt-BR");
const pad = n => String(n).padStart(2, "0");

document.title = CONFIG.title;
$("title").textContent = CONFIG.title;
$("message").textContent = CONFIG.message;
$("footer").textContent = CONFIG.footer;
if (!CONFIG.photos.length) { $("more").hidden = true; $("gallery-block").hidden = true; }

const s = CONFIG.start;
$("since").textContent = "Desde " +
  `${pad(s.getDate())}/${pad(s.getMonth() + 1)}/${s.getFullYear()} às ${pad(s.getHours())}:${pad(s.getMinutes())}`;

function tick() {
  const now = new Date();
  const ms = Math.max(0, now - s);

  // diferença em calendário: anos, meses, depois dias/horas/min/seg
  let cursor = new Date(s);
  let years = 0, months = 0;
  while (new Date(cursor.getFullYear() + 1, cursor.getMonth(), cursor.getDate(),
                  cursor.getHours(), cursor.getMinutes(), cursor.getSeconds()) <= now) {
    cursor.setFullYear(cursor.getFullYear() + 1); years++;
  }
  while (new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate(),
                  cursor.getHours(), cursor.getMinutes(), cursor.getSeconds()) <= now) {
    cursor.setMonth(cursor.getMonth() + 1); months++;
  }
  let rest = Math.floor((now - cursor) / 1000);
  const days = Math.floor(rest / 86400); rest %= 86400;
  const hours = Math.floor(rest / 3600); rest %= 3600;
  const minutes = Math.floor(rest / 60);
  const seconds = rest % 60;

  $("u-years").textContent = years;
  $("u-months").textContent = months;
  $("u-days").textContent = days;
  $("u-hours").textContent = pad(hours);
  $("u-minutes").textContent = pad(minutes);
  $("u-seconds").textContent = pad(seconds);

  const totalSeconds = Math.floor(ms / 1000);
  $("t-days").textContent = fmt(Math.floor(totalSeconds / 86400));
  $("t-hours").textContent = fmt(Math.floor(totalSeconds / 3600));
  $("t-minutes").textContent = fmt(Math.floor(totalSeconds / 60));
  $("t-seconds").textContent = fmt(totalSeconds);
}
tick();
setInterval(tick, 1000);

/* galeria */
const lb = $("lightbox");
/* galeria em carrossel */
const gallery = $("gallery");
const items = CONFIG.photos.length
  ? CONFIG.photos
  : [{ src: "", caption: "Sua foto aqui" }];
let cur = 0, timer = null;

const slides = items.map(p => {
  const el = document.createElement("figure");
  el.className = "slide";
  const box = document.createElement("div");
  box.className = "img";
  if (p.src) {
    const img = document.createElement("img");
    img.src = p.src; img.alt = p.caption || ""; img.draggable = false;
    if (p.fit) img.style.objectFit = p.fit;
    if (p.pos) img.style.objectPosition = p.pos;
    img.onerror = () => img.remove();
    box.appendChild(img);
  }
  el.appendChild(box);
  gallery.appendChild(el);
  return el;
});

const capEl = document.createElement("p");
capEl.className = "carousel-cap";
const dotsEl = document.createElement("div");
dotsEl.className = "dots";
const dots = items.map((_, i) => {
  const b = document.createElement("button");
  b.setAttribute("aria-label", `Foto ${i + 1}`);
  b.onclick = () => { go(i); restart(); };
  dotsEl.appendChild(b);
  return b;
});
const prev = document.createElement("button");
prev.className = "nav prev"; prev.setAttribute("aria-label", "Anterior"); prev.textContent = "‹";
const next = document.createElement("button");
next.className = "nav next"; next.setAttribute("aria-label", "Próxima"); next.textContent = "›";
gallery.append(prev, next);
gallery.after(capEl, dotsEl);

const n = items.length;
function render() {
  slides.forEach((el, i) => {
    let d = i - cur;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    const a = Math.abs(d);
    el.style.setProperty("--d", d);
    el.style.opacity = a > 2 ? 0 : 1 - a * .38;
    el.style.zIndex = 10 - a;
    el.style.pointerEvents = a > 1 ? "none" : "auto";
    el.classList.toggle("active", d === 0);
    el.dataset.d = d;
  });
  dots.forEach((b, i) => b.classList.toggle("on", i === cur));
  capEl.textContent = items[cur].caption || "";
}
function go(i) { cur = (i + n) % n; render(); }
function restart() {
  clearInterval(timer);
  if (n > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    timer = setInterval(() => go(cur + 1), 5500);
}
prev.onclick = () => { go(cur - 1); restart(); };
next.onclick = () => { go(cur + 1); restart(); };
slides.forEach((el, i) => el.addEventListener("click", () => {
  if (moved) return;
  if (i === cur) { if (items[i].src) openLightbox(items[i]); }
  else { go(i); restart(); }
}));
gallery.addEventListener("mouseenter", () => clearInterval(timer));
gallery.addEventListener("mouseleave", restart);
document.addEventListener("keydown", e => {
  if (!lb.hidden) return;
  if (e.key === "ArrowLeft") { go(cur - 1); restart(); }
  if (e.key === "ArrowRight") { go(cur + 1); restart(); }
});

/* arrastar / deslizar */
let startX = null, moved = false;
gallery.addEventListener("pointerdown", e => { startX = e.clientX; moved = false; });
gallery.addEventListener("pointermove", e => {
  if (startX !== null && Math.abs(e.clientX - startX) > 8) moved = true;
});
const endDrag = e => {
  if (startX === null) return;
  const dx = e.clientX - startX;
  startX = null;
  if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
  setTimeout(() => { moved = false; }, 0);
};
gallery.addEventListener("pointerup", endDrag);
gallery.addEventListener("pointercancel", endDrag);
gallery.addEventListener("pointerleave", () => { startX = null; });

render();
restart();


function openLightbox(p) {
  $("lb-img").src = p.src; $("lb-img").alt = p.caption || "";
  $("lb-cap").textContent = p.caption || "";
  lb.hidden = false;
}
const closeLb = () => { lb.hidden = true; };
$("lb-close").onclick = closeLb;
lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });

