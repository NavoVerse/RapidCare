document.addEventListener('DOMContentLoaded', () => {
    // Requirements:
    // 1 km is 100rs. 5km = 500rs. Discounted to 70rs/km -> 5km = 350rs.
    // Base fare (discounted) = 350
    // Emergency equipment = 100
    // Platform charge = 40
    let baseFare = 350; 
    let equipmentCharge = 100;
    let platformCharge = 40;
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
        window.location.href = '../main_Interface_Patient/index.html';
    });

    // Handle Payment Method Toggle
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (cardRadio.checked) {
                cardDetailsForm.classList.add('active');
            } else {
                cardDetailsForm.classList.remove('active');
            }
        });
    });

    // Update Total Calculation
    function updateTotal() {
        const total = baseFare + equipmentCharge + platformCharge + donationAmount;
        
        donationDisplay.textContent = `${donationAmount} RS`;
        totalDisplay.textContent = `${total} RS`;
        payableAmountDisplay.textContent = `payable amount-${total} RS`;
        payBtnAmount.textContent = total;
    }

    // Initialize
    updateTotal();
});
