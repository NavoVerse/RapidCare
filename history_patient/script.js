const medicalRecords = [
    {
        id: 1,
        date: "2024-03-15",
        type: "cardiology",
        title: "Heart Rhythm Consultation",
        doctor: "Dr. Sarah Mitchell",
        hospital: "City General Hospital",
        status: "completed",
        vitals: { bp: "120/80", hr: "72 bpm", temp: "98.6 F", weight: "75 kg" },
        diagnosis: "Normal Sinus Rhythm, mild tachycardia during exercise.",
        prescriptions: [
            { name: "Metoprolol", dosage: "25mg", frequency: "Once daily", purpose: "Heart rate control" },
            { name: "Aspirin", dosage: "81mg", frequency: "Once daily", purpose: "Blood thinner" }
        ],
        notes: "Patient reported occasional palpitations. EKG showed no significant abnormalities. Recommended maintaining current exercise routine but monitoring heart rate."
    },
    {
        id: 2,
        date: "2024-02-10",
        type: "general",
        title: "Annual Physical Examination",
        doctor: "Dr. Robert Wilson",
        hospital: "RapidCare Clinic",
        status: "completed",
        vitals: { bp: "118/75", hr: "68 bpm", temp: "98.4 F", weight: "76 kg" },
        diagnosis: "Healthy adult, all vitals within normal range.",
        prescriptions: [
            { name: "Vitamin D3", dosage: "2000 IU", frequency: "Once daily", purpose: "Supplements" }
        ],
        notes: "Overall health is excellent. Blood work looks good. Slight deficiency in Vitamin D, hence the supplement."
    },
    {
        id: 3,
        date: "2024-01-22",
        type: "lab",
        title: "Comprehensive Metabolic Panel",
        doctor: "Lab Services",
        hospital: "Diagnostic Labs Inc.",
        status: "completed",
        vitals: null,
        diagnosis: "Lab results within reference ranges.",
        prescriptions: [],
        notes: "Glucose levels: 92 mg/dL. Cholesterol: 185 mg/dL. Kidney function tests (BUN/Creatinine) are normal."
    },
    {
        id: 4,
        date: "2023-12-05",
        type: "cardiology",
        title: "Follow-up Echo-cardiogram",
        doctor: "Dr. Sarah Mitchell",
        hospital: "City General Hospital",
        status: "completed",
        vitals: { bp: "122/82", hr: "75 bpm", temp: "98.2 F", weight: "77 kg" },
        diagnosis: "Normal cardiac structure and function.",
        prescriptions: [],
        notes: "Echo shows no signs of valve disease or cardiomyopathy. Next follow-up in 12 months."
    }
];

const doctorBookings = [
    {
        id: 101,
        doctor: "Dr. Sarah Mitchell",
        specialty: "Cardiology",
        date: "2024-04-25",
        time: "10:30 AM",
        hospital: "City General Hospital",
        type: "Checkup"
    },
    {
        id: 102,
        doctor: "Dr. Emily Chen",
        specialty: "Dermatology",
        date: "2024-05-02",
        time: "02:15 PM",
        hospital: "Skin & Care Clinic",
        type: "Consultation"
    }
];

// DOM Elements
const historyList = document.getElementById('history-list');
const detailPane = document.getElementById('detail-pane');
const noSelection = document.getElementById('no-selection');
const detailContent = document.getElementById('detail-content');
const searchInput = document.getElementById('history-search');
const filterChips = document.querySelectorAll('.filter-chip');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('theme-toggle');

let currentFilter = 'all';
let searchQuery = '';
let selectedRecordId = null; // Track current record for re-rendering

// Initialize
function init() {
    renderHistory();
    setupEventListeners();
}

// Render History List
function renderHistory() {
    const filtered = medicalRecords.filter(record => {
        const matchesFilter = currentFilter === 'all' || record.type === currentFilter;
        const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              record.hospital.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    historyList.innerHTML = filtered.map(record => {
        const dateObj = new Date(record.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('default', { month: 'short' });
        
        return `
            <div class="history-item" onclick="selectRecord(${record.id})">
                <div class="date-box">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="history-info">
                    <h4>${record.title}</h4>
                    <p>${record.doctor} • ${record.hospital}</p>
                    <span class="status-tag status-${record.status}">${record.status}</span>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('record-count').innerText = `${filtered.length} Records`;
}

// Helper for trends
function getTrend(currentValue, previousValue, type) {
    if (!previousValue) return { icon: '•', class: 'trend-stable', text: 'First reading' };
    
    const curr = parseFloat(currentValue);
    const prev = parseFloat(previousValue);
    
    if (curr > prev) {
        return { icon: '▲', class: type === 'weight' ? 'trend-up' : 'trend-up', text: 'Higher than last' };
    } else if (curr < prev) {
        return { icon: '▼', class: type === 'weight' ? 'trend-down' : 'trend-down', text: 'Lower than last' };
    }
    return { icon: '▬', class: 'trend-stable', text: 'Stable' };
}

// Select Record and Update Detail Pane
function selectRecord(id) {
    selectedRecordId = id;
    const recordIndex = medicalRecords.findIndex(r => r.id === id);
    const record = medicalRecords[recordIndex];
    const prevRecord = medicalRecords[recordIndex + 1]; // Previous in time is next in array since it's sorted desc

    if (!record) return;

    // Update active state in list
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));
    
    // Using a more robust way to find the item in the DOM
    const listItems = historyList.querySelectorAll('.history-item');
    const filteredList = medicalRecords.filter(r => {
        const matchesFilter = currentFilter === 'all' || r.type === currentFilter;
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.hospital.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    const itemIndex = filteredList.findIndex(r => r.id === id);
    if (listItems[itemIndex]) listItems[itemIndex].classList.add('selected');

    noSelection.style.display = 'none';
    detailContent.style.display = 'block';
    
    // Mobile handling
    if (window.innerWidth <= 768) {
        detailPane.classList.add('mobile-active');
    }

    detailContent.innerHTML = `
        <div class="mobile-back-btn" onclick="closeMobileDetail()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Records</span>
        </div>
        <div class="detail-header">
            <div class="detail-title">
                <h2>${record.title}</h2>
                <div class="detail-meta">
                    <span>📅 ${new Date(record.date).toLocaleDateString()}</span>
                    <span>🏥 ${record.hospital}</span>
                    <span>👨‍⚕️ ${record.doctor}</span>
                </div>
            </div>
            <div class="action-group">
                <button class="secondary-btn" onclick="window.print()">Print Report</button>
                <button class="primary-btn">Download PDF</button>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-card" style="grid-column: span 2;">
                <h3>Current Vitals & Trends</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                    ${record.vitals ? Object.entries(record.vitals).map(([key, val]) => {
                        const prevVal = prevRecord && prevRecord.vitals ? prevRecord.vitals[key] : null;
                        const trend = getTrend(val, prevVal, key);
                        const label = key.replace('bp', 'Blood Pressure').replace('hr', 'Heart Rate').replace('temp', 'Temp').replace('weight', 'Weight');
                        return `
                            <div class="vital-card">
                                <span class="vital-label">${label}</span>
                                <span class="vital-value">${val}</span>
                                <span class="vital-trend ${trend.class}">${trend.icon} ${trend.text}</span>
                            </div>
                        `;
                    }).join('') : '<p>No vitals recorded.</p>'}
                </div>
            </div>

            <div class="detail-card">
                <h3>Prescribed Medicines</h3>
                <div class="medicine-list">
                    ${record.prescriptions.length > 0 ? record.prescriptions.map(p => `
                        <div class="prescription-item" style="border-left: 3px solid var(--primary-green);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <strong>${p.name}</strong>
                                <span style="font-size: 11px; background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">${p.dosage}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                🕒 ${p.frequency} • <small>${p.purpose}</small>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--text-muted); font-size: 14px;">No medications prescribed.</p>'}
                </div>
            </div>

            <div class="detail-card">
                <h3>Doctor's Analysis</h3>
                <p style="font-size: 14px; margin-bottom: 12px;"><strong>Diagnosis:</strong> ${record.diagnosis}</p>
                <div style="font-size: 14px; color: var(--text-main); background: var(--white); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                    ${record.notes}
                </div>
            </div>

            <div class="bookings-section" style="grid-column: span 2;">
                <h3>Upcoming Doctor Bookings</h3>
                <div class="bookings-grid">
                    ${doctorBookings.map(booking => `
                        <div class="booking-card">
                            <div class="booking-header">
                                <span class="booking-status status-upcoming">Upcoming</span>
                                <span style="font-size: 11px; color: var(--text-muted);">${booking.type}</span>
                            </div>
                            <div class="booking-info">
                                <h4>${booking.doctor}</h4>
                                <p>${booking.specialty}</p>
                                <p style="font-size: 11px; margin-top: 4px;">📍 ${booking.hospital}</p>
                            </div>
                            <div class="booking-footer">
                                <span class="booking-time">📅 ${booking.date}</span>
                                <span class="booking-time">⏰ ${booking.time}</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="booking-card" onclick="openBookingModal()" style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-style: dashed; cursor: pointer; background: transparent;">
                        <span style="font-size: 24px; color: var(--primary-green);">+</span>
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">New Booking</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderHistory();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderHistory();
        });
    });

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        ` : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    });
}

function closeMobileDetail() {
    detailPane.classList.remove('mobile-active');
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));
    selectedRecordId = null;
}

// Modal Functions
function openBookingModal() {
    document.getElementById('booking-modal').classList.add('active');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
    document.getElementById('booking-form').reset();
}

function handleBookingSubmit(event) {
    event.preventDefault();
    
    const newBooking = {
        id: Date.now(),
        doctor: document.getElementById('book-doctor').value,
        specialty: document.getElementById('book-specialty').value,
        date: document.getElementById('book-date').value,
        time: document.getElementById('book-time').value,
        hospital: document.getElementById('book-hospital').value,
        type: document.getElementById('book-type').value
    };

    doctorBookings.unshift(newBooking); // Add to beginning of list
    closeBookingModal();
    
    // Re-render the detail pane if a record is still selected
    if (selectedRecordId) {
        selectRecord(selectedRecordId);
    }
    
    // Optional: Show success feedback
    console.log('Booking confirmed:', newBooking);
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        detailPane.classList.remove('mobile-active');
    }
});

init();
