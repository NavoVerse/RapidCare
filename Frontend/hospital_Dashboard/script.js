/* ── RapidCare Hospital Dashboard Script ── */

// ── Custom Cursor ──
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  spawnTrail(mx, my);
});
(function animRing() {
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a,button,.stat-card,.amb-card,.tr-row').forEach(el => {
  el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
  el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
});

// ── Luna palette ──
const LUNA = ['#A7EBF2','#54ACBF','#26658C','#A7EBF2','#ffffff'];

// ── Cursor Trail ──
let lastTrail = 0;
function spawnTrail(x, y) {
  const now = Date.now();
  if (now - lastTrail < 35) return;
  lastTrail = now;
  const el = document.createElement('div');
  el.className = 'cursor-trail';
  const size = Math.random() * 6 + 4;
  el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${LUNA[Math.floor(Math.random()*LUNA.length)]};`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

// ── Click / Touch Splash ──
function spawnSplash(x, y) {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'splash-particle';
    const angle = (i / count) * Math.PI * 2;
    const dist  = Math.random() * 55 + 25;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const size = Math.random() * 7 + 3;
    const dur  = (Math.random() * 0.4 + 0.45).toFixed(2);
    const color = LUNA[Math.floor(Math.random() * LUNA.length)];
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size*2}px ${color};--tx:${tx}px;--ty:${ty}px;--dur:${dur}s;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 50);
  }
  // ring burst
  const rb = document.createElement('div');
  rb.style.cssText = `position:fixed;pointer-events:none;z-index:9996;left:${x}px;top:${y}px;width:6px;height:6px;border-radius:50%;border:1.5px solid #A7EBF2;transform:translate(-50%,-50%) scale(1);animation:splashRingOut .55s ease-out forwards;`;
  document.body.appendChild(rb);
  setTimeout(() => rb.remove(), 600);
}

// inject ring keyframe
const _ks = document.createElement('style');
_ks.textContent = `@keyframes splashRingOut{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(6)}}`;
document.head.appendChild(_ks);

document.addEventListener('click', e => spawnSplash(e.clientX, e.clientY));

// ── Touch Ripple ──
const ripple = document.getElementById('touchRipple');
document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  ripple.style.left = t.clientX + 'px';
  ripple.style.top  = t.clientY + 'px';
  ripple.classList.remove('active');
  void ripple.offsetWidth;
  ripple.classList.add('active');
}, { passive: true });

// ── Live Clock ──
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const el = document.getElementById('liveClock');
  if (el) el.textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

// ── Count-Up Animation ──
function countUp(el, target, duration = 1400) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start);
  }, 16);
}

// ── IntersectionObserver: stagger cards ──
const statCards = document.querySelectorAll('.stat-card');
const cardObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const cards = [...statCards];
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.classList.add('visible');
          const numEl = card.querySelector('.sc-num');
          const target = parseInt(numEl.dataset.count) || 0;
          countUp(numEl, target);
        }, i * 100);
      });
      cardObs.disconnect();
    }
  });
}, { threshold: 0.1 });
if (statCards[0]) cardObs.observe(statCards[0]);

// ── IntersectionObserver: slide-up ──
const slideEls = document.querySelectorAll('.slide-up, .amb-card, .alert-item');
const slideObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      slideObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
slideEls.forEach(el => slideObs.observe(el));

// ── Progress bars animate on view ──
const progFills = document.querySelectorAll('.prog-fill');
const progObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const w = e.target.dataset.width || '0';
      e.target.style.width = w + '%';
      progObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
progFills.forEach(el => progObs.observe(el));

// ── ETA Count-Up (ambulance numbers) ──
const etaNums = document.querySelectorAll('.amb-eta-num[data-live-eta]');
const etaObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.liveEta) || 0;
      countUp(e.target, target, 1000);
      etaObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
etaNums.forEach(el => etaObs.observe(el));

// ── Live ETA countdown ──
function startEtaCountdown() {
  const etaEls = document.querySelectorAll('.eta-count');
  setInterval(() => {
    etaEls.forEach(el => {
      let val = parseInt(el.textContent);
      if (val > 1) el.textContent = val - 1;
    });
  }, 60000);
}
startEtaCountdown();

// ── Sidebar mobile toggle ──
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const overlay = document.getElementById('sbOverlay');

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.style.display = 'none';
});

// ── Nav active state ──
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    this.classList.add('active');
    if (window.innerWidth < 768) {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
    }
  });
});

// ── Emergency Modal ──
const emergencyBtn = document.getElementById('emergencyBtn');
const emergencyModal = document.getElementById('emergencyModal');
const modalClose = document.getElementById('modalClose');

emergencyBtn.addEventListener('click', () => {
  emergencyModal.classList.add('open');
});
modalClose.addEventListener('click', () => {
  emergencyModal.classList.remove('open');
});
emergencyModal.addEventListener('click', e => {
  if (e.target === emergencyModal) emergencyModal.classList.remove('open');
});

// ── Toast ──
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .4s';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Handle Patient Accept / Reject ──
function handleReq(id, action) {
  const row = document.querySelector(`.tr-row[data-id="${id}"]`);
  if (!row) return;
  if (action === 'accept') {
    row.style.transition = 'opacity .5s, transform .5s';
    row.style.opacity = '0';
    row.style.transform = 'translateX(30px)';
    showToast(`Patient accepted & bed assigned.`, 'success');
    setTimeout(() => row.remove(), 500);
    // update badge
    const badge = document.querySelector('.panel-badge');
    if (badge) {
      const cur = parseInt(badge.textContent) || 1;
      badge.textContent = `${Math.max(0, cur - 1)} pending`;
    }
  } else {
    row.style.transition = 'opacity .5s, transform .5s';
    row.style.opacity = '0';
    row.style.transform = 'translateX(-30px)';
    showToast(`Request rejected & logged.`, 'error');
    setTimeout(() => row.remove(), 500);
  }
}

// ── 3D Tilt on stat cards (desktop) ──
document.querySelectorAll('.stat-card,.panel,.amb-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── Search filter ──
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.tr-row').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

// ── Simulated live alert feed ──
const liveAlerts = [
  { msg: 'Blood pressure critical — ICU Bed 2', type: 'critical' },
  { msg: 'Ambulance RC-12 en route — 7 min ETA', type: 'info' },
  { msg: 'OR-1 now available for emergency use', type: 'info' },
  { msg: 'Low oxygen supply — stock replenishment needed', type: 'warning' },
];
let alertIndex = 0;
setInterval(() => {
  const a = liveAlerts[alertIndex % liveAlerts.length];
  showToast(`🔔 ${a.msg}`, a.type === 'critical' ? 'error' : 'info');
  alertIndex++;
}, 25000);

// ── Mouse glow effect on ocean bg ──
document.addEventListener('mousemove', e => {
  const orb = document.querySelector('.orb1');
  if (!orb) return;
  const xPct = e.clientX / window.innerWidth;
  const yPct = e.clientY / window.innerHeight;
  orb.style.transform = `translate(${xPct * 40}px, ${yPct * 40}px)`;
});

console.log('%c RapidCare Hospital Hub ', 'background:#023859;color:#A7EBF2;font-size:14px;padding:6px 12px;border-radius:6px;font-weight:bold');
