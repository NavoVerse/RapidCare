/**
 * RapidCare Shared Cursor Script
 * Provides custom dot, ring, trail, and splash effects.
 */
(function() {
  // ── Configuration ──
  const PALETTES = {
    dark: ['#A7EBF2', '#54ACBF', '#26658C', '#A7EBF2', '#ffffff'],
    light: ['#191970', '#2563EB', '#3B82F6', '#1E40AF', '#000000']
  };

  function getPalette() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    return PALETTES[theme] || PALETTES.dark;
  }
  
  // ── Create Elements ──
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.id = 'cursorDot';
  
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.id = 'cursorRing';
  
  const ripple = document.createElement('div');
  ripple.className = 'touch-ripple';
  ripple.id = 'touchRipple';
  
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.body.appendChild(ripple);
  
  // ── State ──
  let mx = 0, my = 0, rx = 0, ry = 0;
  let lastTrail = 0;
  
  // ── Movement ──
  document.addEventListener('mousemove', e => {
    mx = e.clientX; 
    my = e.clientY;
    dot.style.left = mx + 'px'; 
    dot.style.top = my + 'px';
    spawnTrail(mx, my);
  });
  
  (function animRing() {
    rx += (mx - rx) * 0.12; 
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; 
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();
  
  // ── Hover Effects ──
  function updateHoverListeners() {
    document.querySelectorAll('a, button, .stat-card, .amb-card, .tr-row, input, select, textarea, [role="button"]').forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      el.addEventListener('mouseenter', () => { 
        dot.classList.add('hover'); 
        ring.classList.add('hover'); 
      });
      el.addEventListener('mouseleave', () => { 
        dot.classList.remove('hover'); 
        ring.classList.remove('hover'); 
      });
    });
  }
  updateHoverListeners();
  // Re-run periodically for dynamic content
  setInterval(updateHoverListeners, 2000);
  
  // ── Cursor Trail ──
  function spawnTrail(x, y) {
    const now = Date.now();
    if (now - lastTrail < 35) return;
    lastTrail = now;
    const el = document.createElement('div');
    el.className = 'cursor-trail';
    const size = Math.random() * 6 + 4;
    const palette = getPalette();
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${palette[Math.floor(Math.random() * palette.length)]};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 500);
  }
  
  // ── Click Splash ──
  function spawnSplash(x, y) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'splash-particle';
      const angle = (i / count) * Math.PI * 2;
      const dist = Math.random() * 55 + 25;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const size = Math.random() * 7 + 3;
      const dur = (Math.random() * 0.4 + 0.45).toFixed(2);
      const palette = getPalette();
      const color = palette[Math.floor(Math.random() * palette.length)];
      el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size * 2}px ${color};--tx:${tx}px;--ty:${ty}px;--dur:${dur}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 50);
    }
    
    // Ring burst
    const rb = document.createElement('div');
    rb.className = 'splash-ring';
    rb.style.cssText = `left:${x}px;top:${y}px;`;
    document.body.appendChild(rb);
    setTimeout(() => rb.remove(), 600);
  }
  
  document.addEventListener('click', e => spawnSplash(e.clientX, e.clientY));
  
  // ── Touch Ripple ──
  document.addEventListener('touchstart', e => {
    const t = e.touches[0];
    ripple.style.left = t.clientX + 'px';
    ripple.style.top = t.clientY + 'px';
    ripple.classList.remove('active');
    void ripple.offsetWidth;
    ripple.classList.add('active');
  }, { passive: true });

})();
