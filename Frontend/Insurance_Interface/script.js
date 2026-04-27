async function fetchInsuranceData() {
    const token = localStorage.getItem('rapidcare_token');
    const user = JSON.parse(localStorage.getItem('rapidcare_user'));
    
    if (!token || !user) return;

    // Update user info in header
    const patientNameEl = document.querySelector('.patient-info h1');
    if (patientNameEl) patientNameEl.textContent = user.name;
    
    const sidebarProfileName = document.querySelector('.user-info h4');
    if (sidebarProfileName) sidebarProfileName.textContent = user.name;
    
    const sidebarProfileRole = document.querySelector('.user-info p');
    if (sidebarProfileRole) sidebarProfileRole.textContent = 'Patient';

    try {
        // Fetch Policies
        const policiesRes = await fetch(RapidCareConfig.API_BASE + '/insurance/policies', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const policies = await policiesRes.json();
        renderPolicies(policies);

        // Fetch Claims
        const claimsRes = await fetch(RapidCareConfig.API_BASE + '/insurance/claims', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const claims = await claimsRes.json();
        renderClaims(claims);
        
        // Update Metrics
        updateMetrics(policies, claims);

    } catch (err) {
        console.error('Error fetching insurance data:', err);
    }
}

function renderPolicies(policies) {
    const containers = {
        'State': document.querySelector('.icon-state').closest('.accordion-item').querySelector('.scheme-list'),
        'Central': document.querySelector('.icon-central').closest('.accordion-item').querySelector('.scheme-list'),
        'Mediclaim': document.querySelector('.icon-mediclaim').closest('.accordion-item').querySelector('.scheme-list'),
        'Private': document.querySelector('.icon-private').closest('.accordion-item').querySelector('.scheme-list')
    };

    // Clear existing (except titles/dividers if any)
    Object.values(containers).forEach(c => {
        const divider = c.querySelector('.section-divider');
        c.innerHTML = divider ? divider.outerHTML : '';
    });

    policies.forEach(p => {
        const container = containers[p.category];
        if (!container) return;

        const card = document.createElement('div');
        card.className = 'scheme-card';
        card.innerHTML = `
            <div class="scheme-header">
                <div class="scheme-title">
                    <h4>${p.provider_name}</h4>
                    <p>Policy: ${p.policy_number}</p>
                </div>
                <span class="badge active">${p.status}</span>
            </div>
            <div class="scheme-details">
                <div class="detail-item">
                    <span class="detail-label">Annual Limit</span>
                    <span class="detail-value">₹${p.coverage_amount.toLocaleString()}</span>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>₹${p.used_amount.toLocaleString()} Used</span>
                            <span>₹${(p.coverage_amount - p.used_amount).toLocaleString()} Remaining</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(p.used_amount / p.coverage_amount * 100) || 0}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="scheme-actions">
                <button class="btn btn-primary btn-sm raise-claim-btn" data-policy-id="${p.id}" data-policy-name="${p.provider_name}">Raise Claim</button>
                <a href="${p.portal_link || '#'}" target="_blank" class="btn btn-outline btn-sm">View Portal</a>
            </div>
        `;
        
        const divider = container.querySelector('.section-divider');
        if (divider) container.insertBefore(card, divider);
        else container.appendChild(card);
    });

    // Update count pills
    Object.entries(containers).forEach(([cat, c]) => {
        const pill = c.closest('.accordion-item').querySelector('.count-pill');
        const count = policies.filter(p => p.category === cat).length;
        if (pill) pill.textContent = `${count} Linked`;
    });
}

function renderClaims(claims) {
    const tbody = document.querySelector('.claim-history tbody');
    if (!tbody) return;

    tbody.innerHTML = claims.map(c => `
        <tr>
            <td>${new Date(c.claim_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td>${c.scheme_name}</td>
            <td>${c.claim_type}</td>
            <td class="amt">₹${c.amount.toLocaleString()}</td>
            <td><span class="badge ${c.status}">${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
            <td>${c.reference_number}</td>
        </tr>
    `).join('');
}

function updateMetrics(policies, claims) {
    const totalCoverage = policies.reduce((sum, p) => sum + p.coverage_amount, 0);
    const totalUsed = policies.reduce((sum, p) => sum + p.used_amount, 0);
    const pendingClaims = claims.filter(c => c.status === 'pending').length;

    const values = document.querySelectorAll('.metric-card .value');
    if (values[0]) values[0].textContent = `₹${totalCoverage.toLocaleString()}`;
    if (values[1]) values[1].textContent = `₹${totalUsed.toLocaleString()}`;
    if (values[2]) values[2].textContent = pendingClaims.toString();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchInsuranceData();

    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            // ... (keep icon logic if needed)
        });
    }

    // Modal Logic
    const modal = document.getElementById('add-scheme-modal');
    const form = document.getElementById('add-scheme-form');
    
    if (modal && form) {
        const globalAddBtn = document.getElementById('global-add-btn');
        if (globalAddBtn) {
            globalAddBtn.addEventListener('click', () => {
                document.getElementById('scheme-type-group').style.display = 'flex';
                modal.classList.add('active');
            });
        }

        document.querySelectorAll('.add-scheme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.closest('.accordion-item').querySelector('h3').textContent.split(' ')[0];
                document.getElementById('scheme-category-select').value = category;
                document.getElementById('scheme-type-group').style.display = 'none';
                modal.classList.add('active');
            });
        });

        document.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('rapidcare_token');
            const data = {
                provider_name: document.getElementById('scheme-name').value,
                policy_number: document.getElementById('scheme-desc').value,
                portal_link: document.getElementById('scheme-link').value,
                category: document.getElementById('scheme-category-select').value,
                coverage_amount: 500000 // Default for demo
            };

            try {
                const res = await fetch(RapidCareConfig.API_BASE + '/insurance/policies', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    modal.classList.remove('active');
                    form.reset();
                    fetchInsuranceData();
                }
            } catch (err) {
                console.error('Error adding policy:', err);
            }
        });
    }

    // Handle Raise Claim (Event Delegation)
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('raise-claim-btn')) {
            const policyId = e.target.dataset.policyId;
            const amount = prompt('Enter claim amount:');
            if (!amount) return;

            const token = localStorage.getItem('rapidcare_token');
            try {
                const res = await fetch(RapidCareConfig.API_BASE + '/insurance/claims', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        policy_id: policyId,
                        amount: parseFloat(amount),
                        claim_type: 'OPD' // Simplified
                    })
                });
                if (res.ok) {
                    alert('Claim submitted successfully!');
                    fetchInsuranceData();
                }
            } catch (err) {
                console.error('Error raising claim:', err);
            }
        }
    });

    // Accordion Logic (Simplified)
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
            const content = header.nextElementSibling;
            content.style.maxHeight = item.classList.contains('active') ? content.scrollHeight + "px" : null;
        });
    });
});

