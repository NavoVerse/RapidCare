/**
 * Hospital Dashboard Logic
 * RapidCare - Medical Intelligence Platform
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClock();
    initMobileSidebar();
});

/**
 * Theme Management
 */
function initTheme() {
    const savedTheme = localStorage.getItem('hospital-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hospital-theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Switched to ${newTheme} mode`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    
    if (theme === 'light') {
        icon.setAttribute('data-lucide', 'sun');
    } else {
        icon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
}

/**
 * Section Navigation (Simplified for Dashboard Only)
 */
function switchSection(sectionId) {
    // Current layout only supports dashboard
    if (sectionId !== 'dashboard') return;

    // Update nav links
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const target = document.getElementById(`${sectionId}-section`);
    if (target) {
        target.classList.add('active');
    }
}

/**
 * Real-time Clock
 */
function initClock() {
    const clockEl = document.getElementById('live-clock');
    
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

/**
 * Mobile Sidebar Toggle
 */
function initMobileSidebar() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            toggleBtn && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

/**
 * Patient Request Actions
 */
function handleAction(requestId, action) {
    const row = document.querySelector(`.request-row[data-id="${requestId}"]`);
    if (!row) return;

    const patientName = row.querySelector('.patient-info strong').textContent;
    
    if (action === 'accept') {
        showToast(`Request accepted for ${patientName}`, 'success');
        row.style.transition = 'all 0.5s ease';
        row.style.opacity = '0.5';
        row.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        
        // Simulate processing then removal
        setTimeout(() => {
            row.style.transform = 'translateX(50px)';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 500);
        }, 1000);
        
    } else {
        if (confirm(`Are you sure you want to REJECT ${patientName}'s request?`)) {
            showToast(`Request rejected for ${patientName}`, 'error');
            row.style.transition = 'all 0.5s ease';
            row.style.transform = 'translateX(-20px)';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 500);
        }
    }
}

/**
 * Feedback Toast
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-octagon';
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

