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
        { name: "SBI", icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/state-bank-of-india-sbi-icon.png" },
        { name: "HDFC", icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/hdfc-bank-icon.png" },
        { name: "ICICI", icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/icici-bank-icon.png" },
        { name: "Axis", icon: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/axis-bank-icon.png" }
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
    const bankSearch = document.getElementById('bank-search');
    const bankList = document.getElementById('bank-list');
    const allBanksSelect = document.getElementById('all-banks-select');
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
        // All banks dropdown
        indianBanks.sort().forEach(bank => {
            const option = document.createElement('option');
            option.value = bank;
            option.textContent = bank;
            allBanksSelect.appendChild(option);
            
            const bankItem = document.createElement('div');
            bankItem.className = 'bank-item';
            bankItem.textContent = bank;
            bankItem.onclick = () => selectBank(bank);
            bankList.appendChild(bankItem);
        });

        // Popular banks grid
        popularBanks.forEach(bank => {
            const card = document.createElement('div');
            card.className = 'upi-card'; // Reusing style
            card.innerHTML = `<img src="${bank.icon}" alt="${bank.name}" style="filter: none;"><span>${bank.name}</span>`;
            card.onclick = () => selectBank(bank.name);
            popularBanksGrid.appendChild(card);
        });
    }

    function selectBank(bankName) {
        bankSearch.value = bankName;
        bankList.style.display = 'none';
    }

    bankSearch.addEventListener('focus', () => {
        bankList.style.display = 'block';
    });

    bankSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = bankList.querySelectorAll('.bank-item');
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!bankSearch.contains(e.target) && !bankList.contains(e.target)) {
            bankList.style.display = 'none';
        }
    });

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
