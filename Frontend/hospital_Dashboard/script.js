/* ── RapidCare Hospital Dashboard Script ── */


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
