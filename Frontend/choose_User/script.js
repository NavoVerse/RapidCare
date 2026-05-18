/* Force page to load at the very top, ignoring browser's scroll restoration */
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    /* ─── PARTICLE SYSTEM ─── */
    (function () {
        const c = document.getElementById('particles');
        if (!c) return;
        const ctx = c.getContext('2d', { alpha: true });
        let W, H, pts = [];
        let isVisible = false;

        function resize() {
            W = c.width = window.innerWidth;
            H = c.height = window.innerHeight;
        }
        resize(); window.addEventListener('resize', resize);

        function mkPt() {
            return {
                x: Math.random() * W, y: Math.random() * H,
                vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12,
                r: Math.random() * 2.5 + 1.2, a: Math.random() * .15 + .05
            };
        }
        let numParticles = window.innerWidth < 768 ? 15 : 35;
        for (let i = 0; i < numParticles; i++) pts.push(mkPt());

        const baseDist = window.innerWidth < 768 ? 100 : 140;
        const dSqLimit = baseDist * baseDist;

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Draw particles
            pts.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(147,197,253,${p.a})`; ctx.fill();
            });

            /* Optimized Line System — single stroke for all lines */
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(147,197,253,0.06)';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                for (let j = i + 1; j < pts.length; j++) {
                    const b = pts[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < dSqLimit) {
                        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    }
                }
            }
            ctx.stroke();

            if (isVisible) requestAnimationFrame(draw);
        }

        const observer = new IntersectionObserver(entries => {
            const wasVisible = isVisible;
            isVisible = entries[0].isIntersecting;
            if (isVisible && !wasVisible) draw();
        }, { threshold: 0 });

        window.initParticles = function () {
            observer.observe(c);
            draw();
        };
    })();


    /* ─── FLASH SCREEN, LOADING SOUND & TITLE SCRAMBLE ─── */
    (function () {
        const flashScreen = document.getElementById('flashScreen');
        const flashSub = flashScreen?.querySelector('.flash-sub');

        if (!flashScreen) return;

        /* ── Web Audio: Synthesized loading chime ── */
        function playLoadingSound() {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                const ctx = new AC();

                /* Deep ambient pad — faded in softly */
                const padOsc = ctx.createOscillator();
                const padGain = ctx.createGain();
                const padFilter = ctx.createBiquadFilter();
                padOsc.type = 'sine';
                padOsc.frequency.setValueAtTime(110, ctx.currentTime);
                padOsc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2.5);
                padFilter.type = 'lowpass';
                padFilter.frequency.setValueAtTime(400, ctx.currentTime);
                padGain.gain.setValueAtTime(0, ctx.currentTime);
                padGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.8);
                padGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
                padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
                padOsc.connect(padFilter);
                padFilter.connect(padGain);
                padGain.connect(ctx.destination);
                padOsc.start(ctx.currentTime);
                padOsc.stop(ctx.currentTime + 3.2);

                /* Ascending chime notes — medical beep feel */
                const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0, ctx.currentTime + 0.5 + i * 0.4);
                    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.6 + i * 0.4);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2 + i * 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + 0.5 + i * 0.4);
                    osc.stop(ctx.currentTime + 1.4 + i * 0.4);
                });

                /* "Ready" confirmation tone at ~2.5s */
                const readyOsc = ctx.createOscillator();
                const readyGain = ctx.createGain();
                readyOsc.type = 'sine';
                readyOsc.frequency.setValueAtTime(880, ctx.currentTime);
                readyGain.gain.setValueAtTime(0, ctx.currentTime + 2.4);
                readyGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2.5);
                readyGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.2);
                readyOsc.connect(readyGain);
                readyGain.connect(ctx.destination);
                readyOsc.start(ctx.currentTime + 2.4);
                readyOsc.stop(ctx.currentTime + 3.4);
            } catch (e) { /* Audio not supported — silent fallback */ }
        }
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
                /* Fade text transition */
                flashSub.style.transition = 'opacity 0.15s ease';
                flashSub.style.opacity = '0';
                setTimeout(() => {
                    flashSub.textContent = messages[msgIdx];
                    flashSub.style.opacity = '1';
                }, 150);
            } else {
                clearInterval(msgInterval);
            }
        }, 280);

        /* ── Interactive Cursor Glow for Title ── */
        function initInteractiveTitleGlow() {
            const title = document.getElementById('splashTitle');
            if (!title) return;

            let rect = null;

            title.addEventListener('mouseenter', () => {
                rect = title.getBoundingClientRect();
            });

            title.addEventListener('mousemove', (e) => {
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                title.style.setProperty('--mouse-x', `${x}px`);
                title.style.setProperty('--mouse-y', `${y}px`);
            });
            
            window.addEventListener('resize', () => {
                rect = null; // Invalidate cache on resize
            }, { passive: true });
        }

        initInteractiveTitleGlow();

        const startSequence = () => {
            if (flashScreen.dataset.started) return;
            flashScreen.dataset.started = "true";

            /* Hide splash content behind flash initially */
            document.body.classList.add('flash-active');

            /* Play loading sound */
            if (typeof playLoadingSound === 'function') playLoadingSound();

            /* Stage 1 @ 0.65s: Fade out flash inner content (text floats up) */
            setTimeout(() => {
                flashScreen.classList.add('fade-content');
            }, 650);

            /* Stage 2 @ 1.15s: Dissolve background with blur + reveal splash */
            setTimeout(() => {
                flashScreen.classList.add('hidden');
                document.body.classList.remove('flash-active');
                document.body.classList.add('flash-revealed');

                /* Start heavy canvas animations ONLY after flash is gone */
                if (window.initParticles) window.initParticles();
                if (window.initGlobe) window.initGlobe();
            }, 1150);

            /* Cleanup: remove flash screen from DOM after transition completes */
            setTimeout(() => {
                flashScreen.remove();
                document.body.classList.remove('flash-revealed');
            }, 2000);
        };

        /* Run sequence when fonts are ready, or after a safety timeout */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startSequence).catch(startSequence);
        } else {
            setTimeout(startSequence, 500);
        }

        /* Absolute safety fallback: Start sequence after 600ms regardless of fonts */
        setTimeout(startSequence, 600);
    })();

    /* ─── GLOBE ─── */
    (function () {
        const c = document.getElementById('globe');
        if (!c) return;
        const ctx = c.getContext('2d', { alpha: true });
        const W = 380, H = 380, R = 162, cx = W / 2, cy = H / 2;
        let rot = 0, lastTime = 0;
        const ROT_SPEED = 0.20; // degrees per ms * 60fps ≈ 0.20°/frame equivalent

        const cities = [
            [51.5, -0.12], [40.7, -74], [35.6, 139.7], [28.6, 77.2],
            [48.8, 2.35], [-33.8, 151.2], [55.7, 37.6], [19.4, -99.1],
            [1.35, 103.8], [25.2, 55.3], [6.5, 3.4], [30.04, 31.2],
            [-23.5, -46.6], [37.7, -122.4], [41.0, 28.9], [22.5, 88.3],
            [3.1, 101.7], [13.0, 80.3], [59.9, 30.3], [34.0, -118.2]
        ];

        /* Pre-build sphere background gradient once */
        const sphereGrad = ctx.createRadialGradient(cx - 40, cy - 40, 0, cx, cy, R + 12);
        sphereGrad.addColorStop(0, '#1a3a8a');
        sphereGrad.addColorStop(0.45, '#0d2260');
        sphereGrad.addColorStop(0.8, '#07123a');
        sphereGrad.addColorStop(1, '#040c24');

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

            /* Latitude lines — Optimized 10° resolution for performance */
            for (let lat = -80; lat <= 80; lat += 20) {
                ctx.beginPath();
                let first = true;
                for (let lon = -180; lon <= 180; lon += 10) {
                    const p = ll2xy(lat, lon, R, rot);
                    if (!p.vis) { first = true; continue; }
                    first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y);
                }
                const alpha = lat === 0 ? 0.4 : 0.15;
                ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
                ctx.lineWidth = lat === 0 ? 1.0 : 0.6;
                ctx.stroke();
            }

            /* Longitude lines — Optimized 10° resolution */
            for (let lon = -180; lon < 180; lon += 20) {
                ctx.beginPath();
                let first = true;
                for (let lat = -80; lat <= 80; lat += 10) {
                    const p = ll2xy(lat, lon, R, rot);
                    if (!p.vis) { first = true; continue; }
                    first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(59,130,246,0.12)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            /* Restore clip for atmosphere glow */
            ctx.restore();

            /* Atmosphere glow ring */
            const atm = ctx.createRadialGradient(cx, cy, R - 8, cx, cy, R + 36);
            atm.addColorStop(0, 'rgba(59,130,246,0.0)');
            atm.addColorStop(0.5, 'rgba(96,165,250,0.22)');
            atm.addColorStop(1, 'rgba(59,130,246,0.0)');
            ctx.beginPath();
            ctx.arc(cx, cy, R + 36, 0, Math.PI * 2);
            ctx.fillStyle = atm;
            ctx.fill();

            /* Sphere edge specular highlight */
            const spec = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, R + 2);
            spec.addColorStop(0, 'rgba(147,197,253,0.18)');
            spec.addColorStop(0.3, 'rgba(147,197,253,0.04)');
            spec.addColorStop(1, 'rgba(0,0,0,0)');
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

            /* Draw nearest-city arcs — optimized single stroke */
            ctx.beginPath();
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = 'rgba(147,197,253,0.12)';
            mapped.forEach((a, i) => {
                mapped.slice(i + 1).forEach(b => {
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < 140 * 140) {
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                    }
                });
            });
            ctx.stroke();

            /* City pulse dots — optimized layer rendering */
            mapped.forEach(p => {
                const pulse = Math.sin(now * 0.0025 + p.x * 0.05) * 0.5 + 0.5;
                const depthFade = 0.65 + 0.35 * (p.z / R);

                /* Grouped fills for performance */
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${depthFade})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(254,202,202,${depthFade})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.9 * depthFade})`;
                ctx.fill();
            });

            if (lastTime) requestAnimationFrame(drawGlobe);
        }

        /* Encapsulate globe start */
        window.initGlobe = function () {
            const globeObserver = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    if (!lastTime) {
                        lastTime = performance.now();
                        requestAnimationFrame(drawGlobe);
                    }
                } else {
                    lastTime = 0; // Stop loop
                }
            }, { threshold: 0 });
            globeObserver.observe(c);
        };
    })();

    /* ─── SCROLL REVEAL ─── */
    const revObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis') } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal, .step').forEach(el => revObs.observe(el));

    /* ─── NAV DOTS ─── */
    const secs = ['splash', 'globe-sec', 'roles', 'how', 'features', 'faq', 'fcta'];
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

    /* ─── OPTIMIZED FAQ TOGGLE ─── */
    const faqList = document.querySelector('.faq-list');
    if (faqList) {
        faqList.addEventListener('click', (e) => {
            const item = e.target.closest('.faq-item');
            if (item) {
                // Use requestAnimationFrame for a "frame-perfect" toggle
                requestAnimationFrame(() => {
                    // Close other items for a cleaner experience (Optional, but helps performance)
                    faqList.querySelectorAll('.faq-item.active').forEach(activeItem => {
                        if (activeItem !== item) activeItem.classList.remove('active');
                    });
                    item.classList.toggle('active');
                });
            }
        });
    }

    /* ─── SCROLL PERFORMANCE ENHANCEMENT ─── */
    // Ensure fixed background doesn't trigger unnecessary repaints
    const globalBg = document.querySelector('.global-bg');
    if (globalBg) {
        // Force GPU layer
        globalBg.style.transform = 'translateZ(0)';
        globalBg.style.backfaceVisibility = 'hidden';
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
window.addEventListener('pageshow', function (event) {
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

        // Accelerated redirect for "lagless" feel
        setTimeout(() => {
            window.location.href = '/medicine-hub';
        }, 750);
    } else {
        window.location.href = '/medicine-hub';
    }
}

/* ─── TOP READING SCROLL PROGRESS BAR ─── */
window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + '%';
}, { passive: true });
