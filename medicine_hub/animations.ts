// animations.ts

// 1. Custom Trailing Cursor
const cursorDot = document.createElement("div");
const cursorOutline = document.createElement("div");

cursorDot.style.width = "8px";
cursorDot.style.height = "8px";
cursorDot.style.backgroundColor = "var(--amber)";
cursorDot.style.borderRadius = "50%";
cursorDot.style.position = "fixed";
cursorDot.style.pointerEvents = "none";
cursorDot.style.zIndex = "9999";
cursorDot.style.transform = "translate(-50%, -50%)";
cursorDot.style.transition = "transform 0.1s ease-out";

cursorOutline.style.width = "30px";
cursorOutline.style.height = "30px";
cursorOutline.style.border = "2px solid var(--amber)";
cursorOutline.style.borderRadius = "50%";
cursorOutline.style.position = "fixed";
cursorOutline.style.pointerEvents = "none";
cursorOutline.style.zIndex = "9998";
cursorOutline.style.transform = "translate(-50%, -50%)";
cursorOutline.style.transition = "transform 0.15s ease-out, width 0.2s, height 0.2s";

document.body.appendChild(cursorDot);
document.body.appendChild(cursorOutline);

let mouseX = 0;
let mouseY = 0;

let outlineX = 0;
let outlineY = 0;

window.addEventListener("mousemove", (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
});

// Smooth follow for outline
function animateCursor() {
    outlineX += (mouseX - outlineX) * 0.2;
    outlineY += (mouseY - outlineY) * 0.2;
    
    cursorOutline.style.left = `${outlineX}px`;
    cursorOutline.style.top = `${outlineY}px`;
    
    requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover effect for interactive elements
const interactables = document.querySelectorAll<HTMLElement>("button, .prod-card, .cat-pill, .sb-item, .cart-btn, .topbar-nav");

interactables.forEach((el) => {
    el.addEventListener("mouseenter", () => {
        cursorOutline.style.width = "50px";
        cursorOutline.style.height = "50px";
        cursorOutline.style.backgroundColor = "rgba(245, 166, 35, 0.1)"; // faint amber
    });
    
    el.addEventListener("mouseleave", () => {
        cursorOutline.style.width = "30px";
        cursorOutline.style.height = "30px";
        cursorOutline.style.backgroundColor = "transparent";
    });
});

// 2. Click Splash Particle Effect
window.addEventListener("click", (e: MouseEvent) => {
    createSplash(e.clientX, e.clientY);
});

function createSplash(x: number, y: number) {
    const numParticles = 8;
    const colors = ["#F5A623", "#004643", "#185FA5"];
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        
        particle.style.position = "fixed";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = "6px";
        particle.style.height = "6px";
        particle.style.borderRadius = "50%";
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "9999";
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / numParticles;
        const velocity = 40 + Math.random() * 40;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        const animation = particle.animate([
            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: "cubic-bezier(0, .9, .57, 1)",
            fill: "forwards"
        });
        
        animation.onfinish = () => {
            particle.remove();
        };
    }
}

// 3. Parallax Effect for Hero Left Content
const heroLeft = document.querySelector<HTMLElement>('.hero-left');
window.addEventListener('mousemove', (e: MouseEvent) => {
    if(!heroLeft) return;
    const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
    heroLeft.style.transform = `translate(${xAxis}px, ${yAxis}px)`;
});
