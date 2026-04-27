/**
 * Hospital Dashboard Logic
 * RapidCare - Medical Intelligence Platform
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClock();
    initBedMap();
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
 * Section Navigation
 */
function switchSection(sectionId) {
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
    
    // Re-initialize specific section components if needed
    if (sectionId === 'bed-management') {
        initDetailedBeds();
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
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

/**
 * Patient Request Actions
 */
function handleAction(requestId, action) {
    const row = document.querySelector(`.request-row[data-id="${requestId}"]`);
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
 * Bed Map Management
 */
const bedData = {
    general: { free: 12, occupied: 20, reserved: 5, maintenance: 3, total: 40 },
    icu: { free: 2, occupied: 4, reserved: 1, maintenance: 1, total: 8 },
    emergency: { free: 6, occupied: 4, reserved: 1, maintenance: 1, total: 12 }
};

function initBedMap() {
    generateBeds('general', 'bed-grid');
}

function switchTab(ward) {
    // Update tab UI
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(ward)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update summary text if it exists
    const stats = bedData[ward];
    const summaryEl = document.querySelector('.bed-stats-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `<span>${stats.free} free</span> • <span>${stats.occupied} occupied</span> • <span>${stats.reserved} reserved</span>`;
    }
    
    // Regenerate grid in active container
    const activeSection = document.querySelector('.content-section.active');
    const gridId = activeSection.id === 'dashboard-section' ? 'bed-grid' : 'bed-grid-main';
    generateBeds(ward, gridId);
}

function generateBeds(ward, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    const stats = bedData[ward];
    grid.innerHTML = '';
    
    // Populate with types based on stats
    const beds = [];
    for (let i = 0; i < stats.free; i++) beds.push('free');
    for (let i = 0; i < stats.occupied; i++) beds.push('occupied');
    for (let i = 0; i < stats.reserved; i++) beds.push('reserved');
    for (let i = 0; i < stats.maintenance; i++) beds.push('maintenance');
    
    // Shuffle for visual interest
    beds.sort(() => Math.random() - 0.5);
    
    beds.forEach((type, index) => {
        const bed = document.createElement('div');
        bed.className = `bed-item ${type}`;
        bed.textContent = `${ward[0].toUpperCase()}${index + 1}`;
        bed.title = `Bed ${index + 1}: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        bed.addEventListener('click', () => {
            showToast(`Bed ${ward[0].toUpperCase()}${index + 1} details opened`, 'info');
        });
        
        grid.appendChild(bed);
    });
}

/**
 * Feedback Toast
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
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

/**
 * Handle Patient Requests (Accept/Reject)
 */
function handleRequest(action, patientName) {
    if (action === 'accept') {
        showToast(`Patient ${patientName} request accepted. Ward assignment in progress.`, 'success');
    } else {
        showToast(`Patient ${patientName} request rejected.`, 'error');
    }
    
    // Simulate removing card from queue with animation
    const cards = document.querySelectorAll('.patient-card');
    cards.forEach(card => {
        if (card.querySelector('h3').textContent === patientName) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => {
                card.remove();
                // Check if queue is empty to show empty state (optional)
            }, 300);
        }
    });
}
