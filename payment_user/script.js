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
    let platformCharge = 40; // Default before discount
    let donationAmount = 10;
    
    // Active discount states
    let isPlatformFree = false;
    let isHighValueApplied = false;
    let selectedBankOffer = 'none';

    // Cash Loyalty Reward System
    let cashRideCount = parseInt(localStorage.getItem('rapidcare_cash_rides') || '0');
    let isCashRewardActive = (cashRideCount >= 5); // 6th ride is free

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

    const addDiscountBtn = document.getElementById('addDiscountBtn');
    const firstRideLabel = document.getElementById('firstRideLabel');
    const platformChargeDisplay = document.getElementById('platformChargeDisplay');

    const discountModal = document.getElementById('discountModal');
    const closeModal = document.getElementById('closeModal');
    const applyDiscountsBtn = document.getElementById('applyDiscountsBtn');
    const cbPlatformFree = document.getElementById('cbPlatformFree');
    const cbHighValue = document.getElementById('cbHighValue');
    const bankRadios = document.getElementsByName('bankOffer');

    const cardRadio = document.getElementById('cardRadio');
    const upiRadio = document.getElementById('upiRadio');
    const cashRadio = document.getElementById('cashRadio');
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardDetailsForm = document.getElementById('cardDetailsForm');
    const upiDetailsForm = document.getElementById('upiDetailsForm');
    const cashDetailsForm = document.getElementById('cashDetailsForm');
    const upiApps = document.querySelectorAll('.upi-app');

    // Cash reward elements
    const cashProgressFill = document.getElementById('cashProgressFill');
    const cashRidesDots = document.getElementById('cashRidesDots');
    const cashRidesRemaining = document.getElementById('cashRidesRemaining');
    const cashStatus = document.getElementById('cashStatus');
    const cashStatusText = document.getElementById('cashStatusText');
    const cashRewardUnlocked = document.getElementById('cashRewardUnlocked');
    const cashRewardRow = document.getElementById('cashRewardRow');

    // Toggle Details Panel
    detailsBtn.addEventListener('click', () => {
        detailsPanel.classList.toggle('active');
    });

    // Modal Logic
    if (addDiscountBtn) {
        addDiscountBtn.addEventListener('click', () => {
            if (discountModal) discountModal.classList.add('active');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (discountModal) discountModal.classList.remove('active');
        });
    }

    if (applyDiscountsBtn) {
        applyDiscountsBtn.addEventListener('click', () => {
            isPlatformFree = cbPlatformFree && cbPlatformFree.checked;
            isHighValueApplied = cbHighValue && cbHighValue.checked;
            
            if (bankRadios) {
                for (let radio of bankRadios) {
                    if (radio.checked) {
                        selectedBankOffer = radio.value;
                        break;
                    }
                }
            }

            platformCharge = isPlatformFree ? 0 : 40;

            // Update button UI
            addDiscountBtn.textContent = 'DISCOUNTS APPLIED';
            addDiscountBtn.style.backgroundColor = 'var(--primary-color)';
            addDiscountBtn.style.color = 'white';
            addDiscountBtn.style.borderColor = 'var(--primary-color)';
            
            updateTotal();
            if (discountModal) discountModal.classList.remove('active');
        });
    }

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
        // If paying with cash, increment the ride counter
        if (cashRadio && cashRadio.checked) {
            if (isCashRewardActive) {
                // Reward was used on this ride — reset counter
                cashRideCount = 0;
                isCashRewardActive = false;
            } else {
                cashRideCount++;
            }
            localStorage.setItem('rapidcare_cash_rides', cashRideCount.toString());
        }

        alert('PAYMENT SUCCESSFUL!\n\nTransaction ID: RC' + Math.floor(Math.random() * 1000000) + '\nThank you for choosing RapidCare.');
        window.location.href = '../patient_Dashboard/index.html';
    });

    // Handle Payment Method Toggle
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Hide all panels first
            cardDetailsForm.classList.remove('active');
            upiDetailsForm.classList.remove('active');
            if (cashDetailsForm) cashDetailsForm.classList.remove('active');

            if (cardRadio.checked) {
                cardDetailsForm.classList.add('active');
            } else if (upiRadio.checked) {
                upiDetailsForm.classList.add('active');
            } else if (cashRadio.checked) {
                if (cashDetailsForm) cashDetailsForm.classList.add('active');
            }
            updateTotal();
        });
    });

    // Handle UPI App Selection
    upiApps.forEach(app => {
        app.addEventListener('click', () => {
            upiApps.forEach(a => a.classList.remove('selected'));
            app.classList.add('selected');
        });
    });

    // ===== Cash Loyalty Reward Functions =====
    function updateCashRewardUI() {
        const ridesCompleted = Math.min(cashRideCount, 5);
        isCashRewardActive = (cashRideCount >= 5);

        // Update progress bar
        if (cashProgressFill) {
            const progress = isCashRewardActive ? 100 : (ridesCompleted / 5) * 100;
            cashProgressFill.style.width = progress + '%';
        }

        // Update ride dots
        if (cashRidesDots) {
            const dots = cashRidesDots.querySelectorAll('.ride-dot');
            dots.forEach(dot => {
                const rideNum = parseInt(dot.getAttribute('data-ride'));
                if (rideNum <= ridesCompleted) {
                    dot.classList.add('completed');
                } else if (rideNum === 6 && isCashRewardActive) {
                    dot.classList.add('completed');
                } else {
                    dot.classList.remove('completed');
                }
            });
        }

        // Update status text
        if (isCashRewardActive) {
            if (cashStatus) cashStatus.style.display = 'none';
            if (cashRewardUnlocked) cashRewardUnlocked.style.display = 'block';
        } else {
            if (cashStatus) cashStatus.style.display = 'block';
            if (cashRewardUnlocked) cashRewardUnlocked.style.display = 'none';
            const remaining = 5 - ridesCompleted;
            if (cashRidesRemaining) cashRidesRemaining.textContent = remaining;
            if (cashStatusText) {
                cashStatusText.innerHTML = `Complete <strong id="cashRidesRemaining">${remaining}</strong> more cash ride${remaining !== 1 ? 's' : ''} to unlock free platform fee (₹40 saved!)`;
            }
        }
    }

    // Update Total Calculation
    function updateTotal() {
        // Determine if cash reward applies the platform fee waiver
        let cashRewardDiscount = 0;
        if (cashRadio && cashRadio.checked && isCashRewardActive) {
            cashRewardDiscount = 40; // waive the platform fee
        }

        let effectivePlatformCharge = platformCharge;
        if (cashRewardDiscount > 0) {
            effectivePlatformCharge = 0;
        }

        let subtotal = baseFare + equipmentCharge + effectivePlatformCharge;
        
        let rideDiscount = 0;
        if (isHighValueApplied && (baseFare + equipmentCharge + platformCharge) > 600) {
            rideDiscount = 10;
            if (rideDiscountRow) rideDiscountRow.style.display = 'flex';
        } else {
            if (rideDiscountRow) rideDiscountRow.style.display = 'none';
        }

        let bankDiscount = 0;
        let bankName = "";
        
        if (cardRadio.checked && selectedBankOffer !== 'none') {
            if (selectedBankOffer === 'hdfc') {
                bankDiscount = Math.round((subtotal - rideDiscount) * 0.05);
                bankName = "HDFC Bank (5% Off)";
            } else if (selectedBankOffer === 'sbi') {
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

        // Cash reward row in details
        if (cashRewardRow) {
            if (cashRewardDiscount > 0) {
                cashRewardRow.style.display = 'flex';
            } else {
                cashRewardRow.style.display = 'none';
            }
        }

        // Update platform charge display based on discount status
        if (platformChargeDisplay) {
            if (isPlatformFree || cashRewardDiscount > 0) {
                platformChargeDisplay.innerHTML = '<del>40 RS</del> 0 RS';
                if (firstRideLabel && isPlatformFree) firstRideLabel.style.display = 'inline';
            } else {
                platformChargeDisplay.textContent = '40 RS';
                if (firstRideLabel) firstRideLabel.style.display = 'none';
            }
        }

        const total = subtotal - rideDiscount - bankDiscount + donationAmount;
        
        if (donationDisplay) donationDisplay.textContent = `${donationAmount} RS`;
        if (totalDisplay) totalDisplay.textContent = `${total} RS`;
        if (payableAmountDisplay) payableAmountDisplay.textContent = `payable amount-${total} RS`;
        if (payBtnAmount) payBtnAmount.textContent = total;
    }

    // Initialize
    updateCashRewardUI();
    updateTotal();
});
