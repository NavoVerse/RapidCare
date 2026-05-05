document.addEventListener('DOMContentLoaded', () => {

    /* ─── PARTICLE SYSTEM ─── */
    /* Start on next frame so browser can paint the HTML first */
    requestAnimationFrame(() => {
        (function() {
            const c = document.getElementById('particles');
            if (!c) return;
            const ctx = c.getContext('2d');
            let W, H, pts = [];
            function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
            resize(); window.addEventListener('resize', resize);
            function mkPt() {
                return { x: Math.random() * W, y: Math.random() * H,
                         vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45,
                         r: Math.random() * 1.8 + .6, a: Math.random() * .7 + .35 };
            }
            for (let i = 0; i < 80; i++) pts.push(mkPt());
            const dSq120 = 120 * 120;
            function draw() {
                ctx.clearRect(0, 0, W, H);
                pts.forEach(p => {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > W) p.vx *= -1;
                    if (p.y < 0 || p.y > H) p.vy *= -1;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(147,197,253,${p.a})`; ctx.fill();
                });
                /* Connection lines — squared distance fast-path */
                for (let i = 0; i < pts.length; i++) {
                    const a = pts[i];
                    for (let j = i + 1; j < pts.length; j++) {
                        const b = pts[j];
                        const dx = a.x - b.x, dy = a.y - b.y;
                        const dSq = dx * dx + dy * dy;
                        if (dSq < dSq120) {
                            const alpha = .28 * (1 - dSq / dSq120);
                            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                            ctx.strokeStyle = `rgba(147,197,253,${alpha})`;
                            ctx.lineWidth = .6; ctx.stroke();
                        }
                    }
                }
                requestAnimationFrame(draw);
            }
            draw();
        })();
    });

    /* ─── FLASH SCREEN & TITLE SCRAMBLE ─── */
    (function() {
        const splashTitle = document.getElementById('splashTitle');
        const flashScreen = document.getElementById('flashScreen');
        const flashSub = flashScreen?.querySelector('.flash-sub');
        
        if (!flashScreen) return;

        /* Dynamic status messages cycling during initialization */
        const messages = [
            "SYSTEM INITIALIZATION",
            "ESTABLISHING SECURE PROTOCOLS",
            "LOADING BIOMETRIC DATA",
            "RAPIDCARE ENGINE READY"
        ];
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            if (flashSub && msgIdx < messages.length - 1) {
                msgIdx++;
                flashSub.textContent = messages[msgIdx];
            } else {
                clearInterval(msgInterval);
            }
        }, 600);

        /* ── Title Scramble Logic ── */
        const targetText = 'RAPID CARE';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
        const TICK_MS = 30;
        const SCRAMBLES_PER = 13;
        const REVEAL_EVERY = 3;

        const letters = targetText.split('').map(l => ({ char: l, done: false, scrambles: 0 }));
        let tick = 0, revealed = 0;
        let scrambleInterval = null;

        function runScrambleTick() {
            if (!splashTitle) return;
            let out = '';
            letters.forEach((l, i) => {
                if (l.char === ' ') { out += '\u00a0'; return; }
                if (l.done) { out += l.char; return; }
                if (i <= revealed) {
                    l.scrambles++;
                    if (l.scrambles >= SCRAMBLES_PER) {
                        l.done = true; out += l.char;
                    } else {
                        out += chars[Math.floor(Math.random() * chars.length)];
                    }
                } else {
                    out += chars[Math.floor(Math.random() * chars.length)];
                }
            });
            splashTitle.textContent = out;
            tick++;
            if (tick % REVEAL_EVERY === 0 && revealed < letters.length) revealed++;
            if (letters.every(l => l.done || l.char === ' ')) {
                clearInterval(scrambleInterval);
                splashTitle.textContent = targetText;
            }
        }

        const startSequence = () => {
            if (splashTitle) splashTitle.textContent = '\u00a0';
            
            /* Remove Flash Screen after 3s */
            setTimeout(() => {
                flashScreen.classList.add('hidden');
                /* Start title scramble after flash screen starts to fade */
                setTimeout(() => {
                    if (splashTitle) {
                        scrambleInterval = setInterval(runScrambleTick, TICK_MS);
                    }
                }, 600);
            }, 3000);
        };

        /* Run sequence regardless of font loading for robustness */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startSequence).catch(startSequence);
        } else {
            setTimeout(startSequence, 500);
        }
    })();

    /* ─── GLOBE ─── */
    (function() {
        const c = document.getElementById('globe');
        if (!c) return;
        const ctx = c.getContext('2d', { alpha: true });
        const W = 380, H = 380, R = 162, cx = W / 2, cy = H / 2;
        let rot = 0, lastTime = 0;
        const ROT_SPEED = 0.20; // degrees per ms * 60fps ≈ 0.20°/frame equivalent

        const cities = [
            [51.5,-0.12],[40.7,-74],[35.6,139.7],[28.6,77.2],
            [48.8,2.35],[-33.8,151.2],[55.7,37.6],[19.4,-99.1],
            [1.35,103.8],[25.2,55.3],[6.5,3.4],[30.04,31.2],
            [-23.5,-46.6],[37.7,-122.4],[41.0,28.9],[22.5,88.3],
            [3.1,101.7],[13.0,80.3],[59.9,30.3],[34.0,-118.2]
        ];

        /* Pre-build sphere background gradient once */
        const sphereGrad = ctx.createRadialGradient(cx - 40, cy - 40, 0, cx, cy, R + 12);
        sphereGrad.addColorStop(0,  '#1a3a8a');
        sphereGrad.addColorStop(0.45,'#0d2260');
        sphereGrad.addColorStop(0.8, '#07123a');
        sphereGrad.addColorStop(1,   '#040c24');

        function ll2xy(lat, lon, r, rotDeg) {
            const phi = lat * Math.PI / 180;
            const lam = (lon + rotDeg) * Math.PI / 180;
            const sinLam = Math.sin(lam), cosLam = Math.cos(lam);
            const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
            const x = r * cosPhi * sinLam;
            const y = r * sinPhi;
            const z = r * cosPhi * cosLam;
            return { x: cx + x, y: cy - y, z, vis: z > -R * 0.05 };
        }


        function drawGlobe(ts) {
            const dt = lastTime ? Math.min(ts - lastTime, 50) : 16.67;
            lastTime = ts;
            rot += ROT_SPEED * (dt / 16.67);

            ctx.clearRect(0, 0, W, H);

            /* Clip everything to the sphere circle */
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
            ctx.clip();

            /* Sphere fill */
            ctx.beginPath();
            ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
            ctx.fillStyle = sphereGrad;
            ctx.fill();

            /* Latitude lines — 20° step, 2° resolution for smooth curves */
            for (let lat = -80; lat <= 80; lat += 20) {
                ctx.beginPath();
                let first = true;
                for (let lon = -180; lon <= 180; lon += 2) {
                    const p = ll2xy(lat, lon, R, rot);
                    if (!p.vis) { first = true; continue; }
                    first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y);
                }
                const alpha = lat === 0 ? 0.45 : 0.22;
                ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
                ctx.lineWidth = lat === 0 ? 1.0 : 0.7;
                ctx.stroke();
            }

            /* Longitude lines — 20° step, 2° resolution */
            for (let lon = -180; lon < 180; lon += 20) {
                ctx.beginPath();
                let first = true;
                for (let lat = -85; lat <= 85; lat += 2) {
                    const p = ll2xy(lat, lon, R, rot);
                    if (!p.vis) { first = true; continue; }
                    first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(59,130,246,0.18)';
                ctx.lineWidth = 0.6;
                ctx.stroke();
            }

            /* Restore clip for atmosphere glow */
            ctx.restore();

            /* Atmosphere glow ring */
            const atm = ctx.createRadialGradient(cx, cy, R - 8, cx, cy, R + 36);
            atm.addColorStop(0,   'rgba(59,130,246,0.0)');
            atm.addColorStop(0.5, 'rgba(96,165,250,0.22)');
            atm.addColorStop(1,   'rgba(59,130,246,0.0)');
            ctx.beginPath();
            ctx.arc(cx, cy, R + 36, 0, Math.PI * 2);
            ctx.fillStyle = atm;
            ctx.fill();

            /* Sphere edge specular highlight */
            const spec = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, R + 2);
            spec.addColorStop(0,   'rgba(147,197,253,0.18)');
            spec.addColorStop(0.3, 'rgba(147,197,253,0.04)');
            spec.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
            ctx.fillStyle = spec;
            ctx.fill();
            ctx.restore();

            /* City dots + connections */
            const now = ts;
            const mapped = cities.map(([lat, lon]) => ll2xy(lat, lon, R, rot)).filter(p => p.vis);

            /* Draw nearest-city arcs first */
            mapped.forEach((a, i) => {
                const dSq160 = 160 * 160;
                mapped.slice(i + 1).forEach(b => {
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < dSq160) {
                        const d = Math.sqrt(dSq);
                        const alpha = 0.45 * (1 - d / 160) * Math.min((a.z + b.z) / (R * 1.5), 1);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(147,197,253,${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                });
            });

            /* City pulse dots — prominent beacon style */
            mapped.forEach(p => {
                const pulse  = Math.sin(now * 0.0025 + p.x * 0.05) * 0.5 + 0.5;
                const pulse2 = Math.sin(now * 0.002  + p.x * 0.05 + 1.5) * 0.5 + 0.5;
                const depthFade = 0.65 + 0.35 * (p.z / R); // min 0.65 so back-side still vivid

                /* === Layer 1: far outer expanding halo === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10 + pulse * 9, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${0.12 * (1 - pulse) * depthFade})`;
                ctx.fill();

                /* === Layer 2: mid pulsing ring === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6 + pulse2 * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(248,113,113,${0.28 * (1 - pulse2) * depthFade})`;
                ctx.fill();

                /* === Layer 3: solid red core === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${depthFade})`;
                ctx.fill();

                /* === Layer 4: bright orange-red inner === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(254,202,202,${depthFade})`;
                ctx.fill();

                /* === Layer 5: white hot center === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.9 * depthFade})`;
                ctx.fill();

                /* === Stroke ring for crispness === */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(252,165,165,${0.7 * depthFade})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });

            requestAnimationFrame(drawGlobe);
        }

        /* Defer globe start until after splash animations settle */
        const startGlobe = () => requestAnimationFrame(drawGlobe);
        if ('requestIdleCallback' in window) {
            requestIdleCallback(startGlobe, { timeout: 800 });
        } else {
            setTimeout(startGlobe, 600);
        }
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
    const medSplash = document.getElementById('medHubSplash');
    if (medSplash) {
        medSplash.classList.remove('active');
    }
    if (event.persisted) {
        window.location.reload();
    }
});

/* ─── MEDICINE HUB REDIRECT ─── */
function openMedicineHub() {
    const splash = document.getElementById('medHubSplash');
    if (splash) {
        splash.classList.add('active');
        
        // Wait for splash animation then redirect
        setTimeout(() => {
            window.location.href = '../../medicine_hub/index.html';
        }, 1500);
    } else {
        window.location.href = '../../medicine_hub/index.html';
    }
}
