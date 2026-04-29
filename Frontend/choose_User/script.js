/* Choose User Script - Premium RapidCare Interface */

document.addEventListener('DOMContentLoaded', () => {
    /* ─── CURSOR ─── */
    const cur = document.getElementById('cur'), curR = document.getElementById('curR');
    let mx = 0, my = 0, rx = 0, ry = 0;
    
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cur.style.left = mx + 'px'; cur.style.top = my + 'px';
        const mGlow = document.getElementById('mGlow');
        if (mGlow) {
            mGlow.style.left = mx + 'px';
            mGlow.style.top = my + 'px';
        }
    });

    function animRing() {
        rx += (mx - rx) * .12; ry += (my - ry) * .12;
        curR.style.left = rx + 'px'; curR.style.top = ry + 'px';
        requestAnimationFrame(animRing);
    }
    animRing();

    /* ─── PARTICLE SYSTEM ─── */
    (function() {
        const c = document.getElementById('particles');
        if (!c) return;
        const ctx = c.getContext('2d');
        let W, H, pts = [];
        function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
        resize(); window.addEventListener('resize', resize);
        function mkPt() { return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.5 + .5, a: Math.random() * .6 + .2 } }
        for (let i = 0; i < 80; i++) pts.push(mkPt());
        function draw() {
            ctx.clearRect(0, 0, W, H);
            pts.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(96,165,250,${p.a})`; ctx.fill();
            });
            pts.forEach((a, i) => {
                pts.slice(i + 1).forEach(b => {
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 120) {
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(96,165,250,${.15 * (1 - d / 120)})`;
                        ctx.lineWidth = .5; ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(draw);
        }
        draw();
    })();

    /* ─── LETTER SCRAMBLE TITLE ─── */
    (function() {
        const el = document.getElementById('splashTitle');
        if (!el) return;
        const target = 'RAPID CARE';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
        let frame = 0, revealed = 0;
        el.textContent = '';
        const letters = target.split('').map(l => ({ char: l, done: false, scrambles: 0 }));
        function tick() {
            let out = '';
            letters.forEach((l, i) => {
                if (l.char === ' ') { out += ' '; return }
                if (l.done) { out += l.char; return }
                if (i <= revealed) {
                    l.scrambles++;
                    if (l.scrambles > 14) { l.done = true; out += l.char }
                    else out += chars[Math.floor(Math.random() * chars.length)];
                } else {
                    out += chars[Math.floor(Math.random() * chars.length)];
                }
            });
            el.textContent = out;
            frame++;
            if (frame % 5 === 0 && revealed < letters.length) revealed++;
            if (!letters.every(l => l.done || l.char === ' ')) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        setTimeout(tick, 600);
    })();

    /* ─── GLOBE ─── */
    (function() {
        const c = document.getElementById('globe');
        if (!c) return;
        const ctx = c.getContext('2d');
        const W = 380, H = 380, R = 160, cx = W / 2, cy = H / 2;
        let rot = 0;
        const cities = [
            [51.5, -0.12], [40.7, -74], [35.6, 139.7], [28.6, 77.2],
            [48.8, 2.35], [-33.8, 151.2], [55.7, 37.6], [19.4, -99.1],
            [1.35, 103.8], [25.2, 55.3], [6.5, 3.4], [30.04, 31.2],
            [-23.5, -46.6], [37.7, -122.4], [41.0, 28.9], [22.5, 88.3],
            [3.1, 101.7], [13.0, 80.3]
        ];
        function latLonToXY(lat, lon, r, rot) {
            const phi = lat * Math.PI / 180;
            const lam = (lon + rot) * Math.PI / 180;
            const x = r * Math.cos(phi) * Math.sin(lam);
            const y = r * Math.sin(phi);
            const z = r * Math.cos(phi) * Math.cos(lam);
            return { x: cx + x, y: cy - y, z, vis: z > 0 };
        }
        function drawGlobe() {
            ctx.clearRect(0, 0, W, H);
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R + 10);
            grad.addColorStop(0, '#0d1f5c'); grad.addColorStop(.7, '#060d2a'); grad.addColorStop(1, '#030818');
            ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
            for (let lat = -60; lat <= 60; lat += 30) {
                ctx.beginPath(); let first = true;
                for (let lon = -180; lon <= 180; lon += 4) {
                    const p = latLonToXY(lat, lon, R, rot);
                    if (p.vis) { p.x < W && p.y < H ? first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y) : void 0 }
                    else first = true;
                }
                ctx.strokeStyle = 'rgba(37,99,235,.15)'; ctx.lineWidth = .7; ctx.stroke();
            }
            for (let lon = -180; lon < 180; lon += 30) {
                ctx.beginPath(); let first = true;
                for (let lat = -80; lat <= 80; lat += 4) {
                    const p = latLonToXY(lat, lon, R, rot);
                    if (p.vis) { p.x < W && p.y < H ? first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y) : void 0 }
                    else first = true;
                }
                ctx.strokeStyle = 'rgba(37,99,235,.1)'; ctx.lineWidth = .5; ctx.stroke();
            }
            const atm = ctx.createRadialGradient(cx, cy, R - 10, cx, cy, R + 30);
            atm.addColorStop(0, 'rgba(37,99,235,.0)'); atm.addColorStop(.6, 'rgba(37,99,235,.08)'); atm.addColorStop(1, 'rgba(37,99,235,.0)');
            ctx.beginPath(); ctx.arc(cx, cy, R + 30, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();
            const mapped = cities.map(([lat, lon]) => latLonToXY(lat, lon, R, rot)).filter(p => p.vis);
            for (let i = 0; i < mapped.length; i++) {
                const a = mapped[i];
                const nearest = mapped.filter((_, j) => j !== i).sort((x, y) => Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y)).slice(0, 2);
                nearest.forEach(b => {
                    const d = Math.hypot(b.x - a.x, b.y - a.y);
                    if (d < 160) {
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(96,165,250,${.25 * (1 - d / 160)})`; ctx.lineWidth = .6; ctx.stroke();
                    }
                });
            }
            mapped.forEach(p => {
                const pulse = (Math.sin(Date.now() * .003 + p.x) * .5 + .5);
                ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${.7 + pulse * .3})`; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, 5 + pulse * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${.15 * (1 - pulse)})`; ctx.fill();
            });
            rot += .12;
            requestAnimationFrame(drawGlobe);
        }
        drawGlobe();
    })();

    /* ─── SCROLL REVEAL ─── */
    const revObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis') } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal, .step').forEach(el => revObs.observe(el));

    /* ─── NAV DOTS ─── */
    const secs = ['splash', 'globe-sec', 'roles', 'how', 'features', 'fcta'];
    const dots = document.querySelectorAll('.ndot');
    const secObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const idx = secs.indexOf(e.target.id);
                dots.forEach((d, i) => d.classList.toggle('act', i === idx));
            }
        });
    }, { threshold: .35 });
    secs.forEach(id => { const el = document.getElementById(id); if (el) secObs.observe(el) });
    dots.forEach((d, i) => d.addEventListener('click', () => {
        document.getElementById(secs[i])?.scrollIntoView({ behavior: 'smooth' });
    }));

    /* ─── WATCH THE DEMO ─── */
    const demoBtn = document.querySelector('.btn-out');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            window.open('https://youtu.be/ubltmM3TzX0?si=ukI79E1Bv98i2vAi', '_blank');
        });
    }
});

/* ─── ROLE SELECT ─── */
function chooseRole(card, target) {
    // Navigate immediately on first click with transition
    navigateWithTransition(target);
}

function navigateWithTransition(target) {
    if (!target) return;
    const trans = document.getElementById('pgTrans');
    if (trans) {
        trans.classList.add('active');
        setTimeout(() => {
            window.location.href = target;
        }, 600);
    } else {
        window.location.href = target;
    }
}

/* ─── BACK BUTTON FIX ─── */
window.addEventListener('pageshow', function(event) {
    const trans = document.getElementById('pgTrans');
    if (trans) {
        trans.classList.remove('active');
    }
    if (event.persisted) {
        window.location.reload();
    }
});
