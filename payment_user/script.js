document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateToggleIcon(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcon(isDark);
        });
    }

    function updateToggleIcon(isDark) {
        if (!themeToggle) return;
        themeToggle.innerHTML = isDark 
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }

    // Requirements:
    // 1 km is 100rs. 5km = 500rs. Discounted to 70rs/km -> 5km = 350rs.
    // Base fare (discounted) = 350
    // Emergency equipment = 100
    // Platform charge = 40
    let baseFare = 350; 
    let equipmentCharge = 100;
    let platformCharge = 0; // First ride free
    let donationAmount = 10;

    // Elements
    const detailsBtn = document.getElementById('detailsBtn');
    const detailsPanel = document.getElementById('detailsPanel');
    const donateBtns = document.querySelectorAll('.donate-btn');
    const customDonationInput = document.getElementById('customDonation');
    
    const payableAmountDisplay = document.getElementById('payableAmountDisplay');
    const donationDisplay = document.getElementById('donationDisplay');
    const totalDisplay = document.getElementById('totalDisplay');
    const payBtnAmount = document.getElementById('payBtnAmount');

    const rideDiscountRow = document.getElementById('rideDiscountRow');
    const bankDiscountRow = document.getElementById('bankDiscountRow');
    const bankDiscountName = document.getElementById('bankDiscountName');
    const bankDiscountAmount = document.getElementById('bankDiscountAmount');
    const bankSelect = document.getElementById('bankSelect');

    const cardRadio = document.getElementById('cardRadio');
    const upiRadio = document.getElementById('upiRadio');
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardDetailsForm = document.getElementById('cardDetailsForm');
    const upiDetailsForm = document.getElementById('upiDetailsForm');
    const upiApps = document.querySelectorAll('.upi-app');

    // Toggle Details Panel
    detailsBtn.addEventListener('click', () => {
        detailsPanel.classList.toggle('active');
    });

    // Handle Donation Buttons
    donateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            donateBtns.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            customDonationInput.value = '';
            
            donationAmount = parseInt(e.target.getAttribute('data-amount'));
            updateTotal();
        });
    });

    // Handle Custom Donation
    customDonationInput.addEventListener('input', (e) => {
        donateBtns.forEach(b => b.classList.remove('selected'));
        donationAmount = parseInt(e.target.value) || 0;
        updateTotal();
    });

    // Handle Pay Now Button
    const payNowBtn = document.querySelector('.pay-now-btn');
    payNowBtn.addEventListener('click', () => {
        alert('PAYMENT SUCCESSFUL!\n\nTransaction ID: RC' + Math.floor(Math.random() * 1000000) + '\nThank you for choosing RapidCare.');
        window.location.href = '../patient_Dashboard/index.html';
    });

    // Handle Payment Method Toggle
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (cardRadio.checked) {
                cardDetailsForm.classList.add('active');
                upiDetailsForm.classList.remove('active');
            } else if (upiRadio.checked) {
                cardDetailsForm.classList.remove('active');
                upiDetailsForm.classList.add('active');
            } else {
                cardDetailsForm.classList.remove('active');
                upiDetailsForm.classList.remove('active');
            }
            updateTotal();
        });
    });

    if (bankSelect) {
        bankSelect.addEventListener('change', updateTotal);
    }

    // Handle UPI App Selection
    upiApps.forEach(app => {
        app.addEventListener('click', () => {
            upiApps.forEach(a => a.classList.remove('selected'));
            app.classList.add('selected');
        });
    });

    // Update Total Calculation
    function updateTotal() {
        let subtotal = baseFare + equipmentCharge + platformCharge;
        
        let rideDiscount = 0;
        if (subtotal > 600) {
            rideDiscount = 10;
            if (rideDiscountRow) rideDiscountRow.style.display = 'flex';
        } else {
            if (rideDiscountRow) rideDiscountRow.style.display = 'none';
        }

        let bankDiscount = 0;
        let bankName = "";
        
        if (cardRadio.checked && bankSelect && bankSelect.value !== 'none' && bankSelect.value !== 'other') {
            const bank = bankSelect.value;
            if (bank === 'hdfc') {
                bankDiscount = Math.round((subtotal - rideDiscount) * 0.05);
                bankName = "HDFC Bank (5% Off)";
            } else if (bank === 'sbi') {
                bankDiscount = Math.round((subtotal - rideDiscount) * 0.06);
                bankName = "SBI Bank (6% Off)";
            }
        }

        if (bankDiscount > 0) {
            if (bankDiscountName) bankDiscountName.textContent = bankName;
            if (bankDiscountAmount) bankDiscountAmount.textContent = `-${bankDiscount} RS`;
            if (bankDiscountRow) bankDiscountRow.style.display = 'flex';
        } else {
            if (bankDiscountRow) bankDiscountRow.style.display = 'none';
        }

        const total = subtotal - rideDiscount - bankDiscount + donationAmount;
        
        if (donationDisplay) donationDisplay.textContent = `${donationAmount} RS`;
        if (totalDisplay) totalDisplay.textContent = `${total} RS`;
        if (payableAmountDisplay) payableAmountDisplay.textContent = `payable amount-${total} RS`;
        if (payBtnAmount) payBtnAmount.textContent = total;
    }

    // Initialize
    updateTotal();
});
