document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Simulation Data Elements
    const elements = {
        hr: document.getElementById('val-hr'),
        bp: document.getElementById('val-bp'),
        safety: document.getElementById('val-safety'),
        barHr: document.getElementById('bar-hr'),
        barBp: document.getElementById('bar-bp'),
        barO2: document.getElementById('bar-o2')
    };

    // 1. Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // 2. Theme Toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>` : 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>`;
    });

    // 3. Simulation Modal Handlers
    window.openSimModal = () => {
        document.getElementById('simModal').classList.add('active');
    };

    window.closeSimModal = () => {
        document.getElementById('simModal').classList.remove('active');
    };

    window.applySimulation = () => {
        const HR = document.getElementById('input-hr').value;
        const BP = document.getElementById('input-bp').value;
        const Safety = document.getElementById('input-safety').value;

        // Update Values with animation
        animateValue(elements.hr, HR);
        animateValue(elements.safety, Safety);
        elements.bp.innerText = `${BP}/76`;

        // Update Bars
        elements.barHr.style.width = `${(HR / 150) * 100}%`;
        elements.barBp.style.width = `${(BP / 200) * 100}%`;
        
        // Update Safety card progress
        document.querySelector('.metric-card .progress-bar-fill').style.width = `${Safety}%`;

        // Update circular progress (Service quality simulation)
        // Just for visual effect when they edit
        const fgCircle = document.querySelector('.circular-progress circle.fg');
        const offset = 282.7 - (282.7 * (Safety / 100));
        fgCircle.style.strokeDashoffset = offset;
        document.querySelector('.progress-val span').innerText = `${Math.round(Safety * 1.07)}%`;

        closeSimModal();
        
        // Visual feedback
        showNotification('Analytics profile updated successfully');
    };

    function animateValue(obj, end) {
        let start = parseInt(obj.innerText);
        let duration = 800;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerText = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function showNotification(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--primary-green);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s forwards;
            z-index: 9999;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Add keyframe for toast
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
