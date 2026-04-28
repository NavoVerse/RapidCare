/**
 * Hospital Dashboard Logic
 * RapidCare - Medical Intelligence Platform
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClock();
    initMobileSidebar();
    checkAuth();
    loadHospitalData();
    loadIncomingRequests();
    
    // Logout logic
    const logoutBtn = document.querySelector('.nav-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rapidcare_token');
            localStorage.removeItem('rapidcare_user');
            window.location.href = '../hospital_registration/index.html';
        });
    }
});

/**
 * Authentication Check
 */
function checkAuth() {
    const token = localStorage.getItem('rapidcare_token');
    if (!token) {
        alert('Please login or register first.');
        window.location.href = '../hospital_registration/index.html';
    }
}

/**
 * Load Hospital Data
 */
async function loadHospitalData() {
    const token = localStorage.getItem('rapidcare_token');
    try {
        const response = await fetch(RapidCareConfig.API_BASE + '/hospital/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            updateDashboardUI(data);
        } else {
            console.error('Failed to fetch hospital data');
        }
    } catch (err) {
        console.error('Error loading hospital data:', err);
    }
}

/**
 * Update UI with Hospital Data
 */
function updateDashboardUI(hospital) {
    const nameEl = document.querySelector('.hospital-info h2');
    if (nameEl) nameEl.textContent = hospital.name || hospital.hospital_name;

    const freeBedsVal = document.querySelector('.stat-card.primary .stat-value');
    const freeBedsSub = document.querySelector('.stat-card.primary .stat-sub');
    if (freeBedsVal) freeBedsVal.textContent = hospital.available_beds || 0;
    if (freeBedsSub) freeBedsSub.textContent = `of ${hospital.total_beds || 0} total`;

    const icuVal = document.querySelector('.stat-card.warning .stat-value');
    if (icuVal) icuVal.textContent = hospital.icu_beds || 0;

    const ventVal = document.querySelector('.stat-card.info .stat-value');
    const ventSub = document.querySelector('.stat-card.info .stat-sub');
    if (ventVal) ventVal.textContent = hospital.ventilators || 0;
    if (ventSub) ventSub.textContent = `of ${hospital.ventilators || 0} total`;
    
    const resourceItems = document.querySelectorAll('.resource-item');
    if (resourceItems.length >= 2) {
        const icuCount = resourceItems[0].querySelector('.res-count');
        if (icuCount) icuCount.textContent = `${hospital.icu_beds || 0} / ${hospital.icu_beds || 0}`;
        
        const ventCount = resourceItems[1].querySelector('.res-count');
        if (ventCount) ventCount.textContent = `${hospital.ventilators || 0} / ${hospital.ventilators || 0}`;
    }
}

/**
 * Load Incoming Requests
 */
async function loadIncomingRequests() {
    const token = localStorage.getItem('rapidcare_token');
    try {
        const response = await fetch(RapidCareConfig.API_BASE + '/hospital/incoming', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            populateIncomingRequests(data);
        }
    } catch (err) {
        console.error('Error loading incoming requests:', err);
    }
}

/**
 * Populate Incoming Requests Table
 */
function populateIncomingRequests(requests) {
    const tbody = document.getElementById('incoming-requests');
    if (!tbody) return;

    if (!requests || requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-secondary);">No active incoming patient requests.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.className = 'request-row';
        tr.setAttribute('data-id', req.id);
        
        let severityClass = 'moderate';
        if (req.severity && req.severity.toLowerCase() === 'critical') severityClass = 'critical';
        
        const patientInitial = req.patient_name ? req.patient_name.substring(0, 2).toUpperCase() : 'EM';

        tr.innerHTML = `
            <td>
                <div class="patient-cell">
                    <div class="avatar bg-red">${patientInitial}</div>
                    <div class="patient-info">
                        <strong>${req.patient_name || 'Emergency Patient'}</strong>
                        <span>Trip #${req.id}</span>
                    </div>
                </div>
            </td>
            <td>Ambulance: ${req.driver_name || 'Assigned'}</td>
            <td><span class="badge ${severityClass}">${req.status.toUpperCase()}</span></td>
            <td>-- min</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-accept" onclick="handleAction(${req.id}, 'accept')">Accept</button>
                    <button class="btn btn-reject" onclick="handleAction(${req.id}, 'reject')">Reject</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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
    if (sectionId !== 'dashboard') return;

    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
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
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
