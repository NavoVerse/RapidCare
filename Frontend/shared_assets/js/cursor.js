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
  
  // ── State ──
  let mx = 0, my = 0, rx = 0, ry = 0;
  let lastTrail = 0;
  let effectsEnabled = localStorage.getItem('rapidcare_mouse_effects') !== 'false';
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  
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
  
  // Toggle Button
  const toggle = document.createElement('div');
  toggle.className = 'effects-toggle';
  toggle.title = 'Toggle Mouse Effects';
  toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M13.151,12l6.599-6.6a1,1,0,0,0-1.414-1.414L11.737,10.586,5.138,3.987A1,1,0,0,0,3.724,5.4L10.323,12l-6.6,6.6a1,1,0,1,0,1.414,1.414l6.6-6.6,6.6,6.6a1,1,0,0,0,1.414-1.414Z"/></svg>`;
  // Use a cursor icon or something similar. Let's use a pointer icon.
  toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M13.64,21.94c-0.34,0-0.65-0.19-0.82-0.51L9.33,14.6L5.35,18.58c-0.31,0.31-0.78,0.4-1.18,0.22 c-0.4-0.18-0.66-0.58-0.66-1.02V3.79c0-0.44,0.26-0.84,0.66-1.02c0.4-0.18,0.87-0.09,1.18,0.22l15,15c0.31,0.31,0.4,0.78,0.22,1.18 c-0.18,0.4-0.58,0.66-1.02,0.66h-5.46l3.49,6.79c0.17,0.32,0.1,0.72-0.17,0.96l-2.48,1.24C14.07,21.9,13.86,21.94,13.64,21.94z M6.5,5.91 v10.59l2.83-2.83c0.19-0.19,0.45-0.29,0.71-0.29c0.26,0,0.52,0.1,0.71,0.29l4.07,7.91l1.06-0.53l-4.07-7.91 c-0.19-0.19-0.29-0.45-0.29-0.71c0-0.26,0.1-0.52,0.29-0.71l2.83-2.83H6.5z"/></svg>`;
  
  if (!isTouch) {
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.appendChild(toggle);
  }
  document.body.appendChild(ripple);

  // Initialize State
  if (!effectsEnabled) {
    document.body.classList.add('disable-mouse-effects');
  }

  toggle.addEventListener('click', () => {
    effectsEnabled = !effectsEnabled;
    localStorage.setItem('rapidcare_mouse_effects', effectsEnabled);
    document.body.classList.toggle('disable-mouse-effects', !effectsEnabled);
    
    // Dispatch custom event for other scripts to listen
    window.dispatchEvent(new CustomEvent('mouseEffectsToggled', { detail: { enabled: effectsEnabled } }));
  });
  
  // ── Movement ──
  if (!isTouch) {
    document.addEventListener('mousemove', e => {
      if (!effectsEnabled) return;
      mx = e.clientX; 
      my = e.clientY;
      dot.style.left = mx + 'px'; 
      dot.style.top = my + 'px';
      spawnTrail(mx, my);
    });

    (function animRing() {
      if (effectsEnabled) {
        rx += (mx - rx) * 0.12; 
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px'; 
        ring.style.top = ry + 'px';
      }
      requestAnimationFrame(animRing);
    })();
  }
  
  // ── Hover Effects ──
  function updateHoverListeners() {
    if (isTouch) return;
    document.querySelectorAll('a, button, .stat-card, .amb-card, .tr-row, input, select, textarea, [role="button"]').forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      el.addEventListener('mouseenter', () => { 
        if (!effectsEnabled) return;
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
  if (!isTouch) setInterval(updateHoverListeners, 2000);
  
  // ── Cursor Trail ──
  function spawnTrail(x, y) {
    if (!effectsEnabled) return;
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
    if (!effectsEnabled) return;
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
  
  if (!isTouch) {
    document.addEventListener('click', e => spawnSplash(e.clientX, e.clientY));
  }
  
  // ── Touch Ripple ──
  document.addEventListener('touchstart', e => {
    // Touch ripples are always enabled as they are functional feedback
    const t = e.touches[0];
    ripple.style.left = t.clientX + 'px';
    ripple.style.top = t.clientY + 'px';
    ripple.classList.remove('active');
    void ripple.offsetWidth;
    ripple.classList.add('active');
  }, { passive: true });

})();
