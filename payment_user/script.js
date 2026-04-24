document.addEventListener('DOMContentLoaded', () => {
    // --- Data ---
    const indianBanks = [
        "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
        "Punjab National Bank", "Canara Bank", "Bank of Baroda", "Union Bank of India",
        "IDFC FIRST Bank", "IndusInd Bank", "Yes Bank", "Federal Bank", "RBL Bank",
        "Indian Bank", "UCO Bank", "Bank of India", "Central Bank of India",
        "South Indian Bank", "Karnataka Bank", "City Union Bank", "Saraswat Bank"
    ];

    const popularBanks = [
        { name: "SBI", icon: "assets/logos/sbi_logo.png" },
        { name: "HDFC", icon: "assets/logos/hdfc_logo.png" },
        { name: "ICICI", icon: "assets/logos/icici_logo.png" },
        { name: "Axis", icon: "assets/logos/axis_logo.png" }
    ];

    const pricingConfig = {
        normal: { original: 100, discounted: 70 },
        oxygen: { original: 150, discounted: 130 },
        icu: { original: 200, discounted: 180 },
        ventilator: { original: 300, discounted: 280 }
    };

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const cardBankSearch = document.getElementById('card-bank-search');
    const cardBankList = document.getElementById('card-bank-list');
    const netBankSearch = document.getElementById('net-bank-search');
    const netBankList = document.getElementById('net-bank-list');
    const popularBanksGrid = document.getElementById('popular-banks');
    const applyCouponBtn = document.getElementById('apply-coupon');
    const couponInput = document.getElementById('coupon-code');
    const couponMsg = document.getElementById('coupon-msg');
    const totalAmountDisplay = document.getElementById('total-amount');
    const distanceInput = document.getElementById('distance-input');
    const ambulanceOptions = document.querySelectorAll('input[name="ambulance-type"]');
    const payBtn = document.querySelector('.pay-btn');

    // --- Initialize ---
    populateBankLists();
    recalculatePricing();
    
    // --- Pricing Logic ---
    function recalculatePricing() {
        const selectedType = document.querySelector('input[name="ambulance-type"]:checked').value;
        const distance = parseFloat(distanceInput.value) || 0;
        
        if (distance <= 0) {
            payBtn.disabled = true;
            payBtn.style.opacity = '0.5';
            payBtn.style.cursor = 'not-allowed';
        } else {
            payBtn.disabled = false;
            payBtn.style.opacity = '1';
            payBtn.style.cursor = 'pointer';
        }

        const rates = pricingConfig[selectedType];
        const originalTotal = Math.round(distance * rates.original);
        const discountedTotal = Math.round(distance * rates.discounted);
        const savings = originalTotal - discountedTotal;

        // Update Summary
        const distanceRow = document.getElementById('distance-charge-row');
        distanceRow.querySelector('.original').textContent = `₹${originalTotal.toLocaleString()}`;
        distanceRow.querySelector('.discounted').textContent = `₹${discountedTotal.toLocaleString()}`;

        const savingsRow = document.getElementById('savings-row');
        savingsRow.querySelector('.save-amount').textContent = `Saved ₹${savings.toLocaleString()}`;

        // Fixed charges
        const hospitalReservation = 500;
        const platformCharge = 40;
        
        let finalTotal = discountedTotal + hospitalReservation + platformCharge;
        
        // Handle applied coupons
        const couponCode = couponInput.value.toUpperCase();
        if (couponMsg.classList.contains('success')) {
            if (couponCode === 'RAPID20') {
                finalTotal = Math.round(finalTotal * 0.8);
            } else if (couponCode === 'FIRSTCARE') {
                finalTotal -= 100;
            }
        }

        totalAmountDisplay.textContent = `₹${finalTotal.toLocaleString()}`;
    }

    ambulanceOptions.forEach(opt => opt.addEventListener('change', recalculatePricing));
    distanceInput.addEventListener('input', recalculatePricing);

    // --- Tab Switching Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active classes
            btn.classList.add('active');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // --- Bank Logic ---
    function populateBankLists() {
        indianBanks.sort().forEach(bank => {
            // Populate Cards search list
            const cardItem = createBankItem(bank, cardBankSearch, cardBankList);
            cardBankList.appendChild(cardItem);
            
            // Populate Net Banking search list
            const netItem = createBankItem(bank, netBankSearch, netBankList);
            netBankList.appendChild(netItem);
        });

        // Popular banks grid
        popularBanks.forEach(bank => {
            const card = document.createElement('div');
            card.className = 'upi-card'; 
            card.innerHTML = `<img src="${bank.icon}" alt="${bank.name}" style="filter: none;"><span>${bank.name}</span>`;
            card.onclick = () => {
                const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
                if (activeTab === 'card') {
                    selectBank(bank.name, cardBankSearch, cardBankList);
                } else if (activeTab === 'netbanking') {
                    selectBank(bank.name, netBankSearch, netBankList);
                }
            };
            popularBanksGrid.appendChild(card);
        });
    }

    function createBankItem(bankName, input, list) {
        const item = document.createElement('div');
        item.className = 'bank-item';
        item.textContent = bankName;
        item.onclick = () => selectBank(bankName, input, list);
        return item;
    }

    function selectBank(bankName, input, list) {
        input.value = bankName;
        list.style.display = 'none';
    }

    const bankAcronyms = {
        "SBI": "State Bank of India",
        "HDFC": "HDFC Bank",
        "ICICI": "ICICI Bank",
        "PNB": "Punjab National Bank",
        "BOB": "Bank of Baroda",
        "KOTAK": "Kotak Mahindra Bank",
        "IDFC": "IDFC FIRST Bank",
    };

    function setupSearch(input, list) {
        if (!input || !list) return;
        
        input.addEventListener('focus', () => {
            list.style.display = 'block';
        });

        input.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            const items = list.querySelectorAll('.bank-item:not(.no-results)');
            let hasResults = false;
            
            items.forEach(item => {
                const bankName = item.textContent;
                const acronymMatch = Object.entries(bankAcronyms).some(([acr, full]) => 
                    acr.toLowerCase().includes(term) && full === bankName
                );

                if (bankName.toLowerCase().includes(term) || acronymMatch) {
                    item.style.display = 'block';
                    hasResults = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // Show "Not Available" if no results
            const existingNoRes = list.querySelector('.no-results');
            if (!hasResults && term.length > 0) {
                list.style.display = 'block'; // Ensure list is visible
                if (!existingNoRes) {
                    const noRes = document.createElement('div');
                    noRes.className = 'bank-item no-results';
                    noRes.style.color = 'var(--accent-color)';
                    noRes.style.fontWeight = '600';
                    noRes.style.textAlign = 'center';
                    noRes.innerHTML = '<i data-lucide="alert-circle" style="width:16px; vertical-align:middle; margin-right:5px;"></i> Bank not available';
                    list.appendChild(noRes);
                    lucide.createIcons();
                }
            } else if (existingNoRes) {
                existingNoRes.remove();
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !list.contains(e.target)) {
                list.style.display = 'none';
            }
        });
    }

    setupSearch(cardBankSearch, cardBankList);
    setupSearch(netBankSearch, netBankList);

    // --- Coupon Logic ---
    applyCouponBtn.addEventListener('click', () => {
        const code = couponInput.value.toUpperCase();
        if (code === 'RAPID20') {
            couponMsg.textContent = 'Coupon applied! 20% off';
            couponMsg.className = 'coupon-status success';
        } else if (code === 'FIRSTCARE') {
            couponMsg.textContent = 'Coupon applied! ₹100 off';
            couponMsg.className = 'coupon-status success';
        } else {
            couponMsg.textContent = 'Invalid coupon code';
            couponMsg.className = 'coupon-status error';
        }
        recalculatePricing();
    });

    // --- Payment Feedback ---
    document.querySelector('.pay-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        let method = activeTab.toUpperCase();
        
        const btn = document.querySelector('.pay-btn');
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Processing...';
        lucide.createIcons();
        
        setTimeout(() => {
            alert(`Payment of ${totalAmountDisplay.textContent} via ${method} was successful!`);
            window.location.href = '../patient_Dashboard/index.html';
        }, 2000);
    });
});
