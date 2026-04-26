let currentSheet = 'hospitals';
let realData = null;

/**
 * Switch between different data sheets
 */
function switchSheet(sheet, element) {
    currentSheet = sheet;
    
    // Update UI
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    // Update Title
    const titleMap = {
        'hospitals': 'Hospital Records',
        'drivers': 'Driver Fleet Data',
        'patients': 'Patient Intake Records'
    };
    const sheetTitle = document.getElementById('sheet-title');
    if (sheetTitle) sheetTitle.innerText = titleMap[sheet];
    
    // Clear search and render
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    renderTable();
}

/**
 * Fetch live data from the backend API
 */
async function fetchLiveData() {
    const token = localStorage.getItem('rapidcare_token');
    const userStr = localStorage.getItem('rapidcare_user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Optional: Redirect to login if not admin (implementation depends on route structure)
    // if (!token || (user && user.role !== 'admin')) {
    //     window.location.href = '../login_urgency/index.html';
    //     return;
    // }

    try {
        const response = await fetch(RapidCareConfig.API_BASE + '/admin/export', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            realData = await response.json();
            console.log("[RapidCare] Live data loaded from API.");
        } else {
            console.warn("[RapidCare] API request failed. Falling back to mock data.");
            realData = typeof mockData !== 'undefined' ? mockData : null;
        }
    } catch (err) {
        console.error("[RapidCare] Connection error:", err);
        realData = typeof mockData !== 'undefined' ? mockData : null;
    }
}

/**
 * Render the table based on current sheet and search query
 */
function renderTable(filterQuery = '') {
    const data = (realData && realData[currentSheet]) ? realData[currentSheet] : (typeof mockData !== 'undefined' ? mockData[currentSheet] : []);
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    if (!tableHead || !tableBody) return;
    if (!data || data.length === 0) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '<tr><td style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }

    // Filter data
    const filteredData = data.filter(row => {
        return Object.values(row).some(val => 
            String(val || '').toLowerCase().includes(filterQuery.toLowerCase())
        );
    });

    // Clear previous
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Create Headers
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.innerText = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // Create Rows
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.innerText = row[header] || '-';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" style="text-align: center; padding: 40px; color: #999;">No matching records found</td></tr>`;
    }
}

/**
 * Handle live search
 */
function handleSearch() {
    const query = document.getElementById('searchInput').value;
    renderTable(query);
}

/**
 * Export current data to Excel (.xlsx)
 */
function exportToExcel() {
    const data = (realData && realData[currentSheet]) ? realData[currentSheet] : (typeof mockData !== 'undefined' ? mockData[currentSheet] : []);
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert JSON data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, currentSheet.charAt(0).toUpperCase() + currentSheet.slice(1));
    
    // Generate filename
    const filename = `RapidCare_${currentSheet}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await fetchLiveData();
    renderTable();
});
