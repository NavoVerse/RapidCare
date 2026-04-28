document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    updateStepperVisuals(1);
});

/**
 * Non-linear navigation: Jump to any step directly
 */
function goToStep(stepNumber) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Activate target section
    const targetSection = document.getElementById(`step${stepNumber}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update stepper visual markers
    updateStepperVisuals(stepNumber);

    // Smooth scroll to container top
    const container = document.querySelector('.premium-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Validates current step before moving to next
 */
function nextStep(currentStep) {
    const forms = ['identityForm', 'complianceForm', 'contactForm', 'infraForm', 'adminForm'];
    const currentForm = document.getElementById(forms[currentStep - 1]);
    
    if (currentForm && currentForm.checkValidity()) {
        goToStep(currentStep + 1);
    } else if (currentForm) {
        currentForm.reportValidity();
    }
}

/**
 * Updates the visual state of the named stepper
 */
function updateStepperVisuals(activeStep) {
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((item, index) => {
        const stepNum = index + 1;
        item.classList.remove('active');
        
        if (stepNum === activeStep) {
            item.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.querySelector('.submit-full-btn');
            const origText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            try {
                // Gather departments
                const depts = Array.from(document.querySelectorAll('.check-item input'))
                    .filter(i => i.checked)
                    .map(i => i.parentNode.textContent.trim());

                // Gather Infra
                const infraInputs = document.querySelectorAll('.infra-item input');

                const payload = {
                    // Step 1
                    hospital_name: document.querySelector('input[placeholder="City General Hospital"]')?.value,
                    hospital_type: document.querySelector('#step1 select')?.value,
                    year_established: document.querySelector('input[placeholder="e.g. 2005"]')?.value,
                    total_beds: document.querySelector('input[placeholder="Total current beds"]')?.value,
                    address: document.querySelector('textarea')?.value,
                    district: document.querySelector('input[placeholder="District name"]')?.value,
                    state: document.querySelectorAll('#step1 select')[1]?.value,
                    pincode: document.querySelector('input[placeholder="6-digit PIN"]')?.value,
                    
                    // Step 2
                    state_health_license: document.querySelector('input[placeholder="License Number"]')?.value,
                    license_expiry: document.querySelector('#step2 input[type="date"]')?.value,
                    nabh_accreditation: document.querySelectorAll('input[placeholder="If applicable"]')[0]?.value,
                    nabl_accreditation: document.querySelectorAll('input[placeholder="If applicable"]')[1]?.value,
                    pharmacy_license: document.querySelector('input[placeholder="Drug License Number"]')?.value,
                    fire_noc: document.querySelector('input[placeholder="Fire Safety Ref"]')?.value,
                    pan_tan: document.querySelector('input[placeholder="AAAAA0000A"]')?.value,
                    gst: document.querySelector('input[placeholder="GSTIN (Optional)"]')?.value,

                    // Step 3
                    reception_number: document.querySelector('input[placeholder="Primary Contact"]')?.value,
                    emergency_casualty_number: document.querySelector('input[placeholder="Emergency Hotline"]')?.value,
                    ambulance_dispatch_number: document.querySelector('input[placeholder="Dispatch Contact"]')?.value,
                    icu_helpline: document.querySelector('input[placeholder="ICU Hotline"]')?.value,
                    admin_billing_number: document.querySelector('input[placeholder="Accounts/Billing"]')?.value,
                    website: document.querySelector('input[placeholder="https://yourhospital.in"]')?.value,

                    // Step 4
                    icu_beds: infraInputs[0]?.value,
                    nicu_beds: infraInputs[1]?.value,
                    picu_beds: infraInputs[2]?.value,
                    ccu_beds: infraInputs[3]?.value,
                    ventilators: infraInputs[4]?.value,
                    dialysis: infraInputs[5]?.value,
                    ot: infraInputs[6]?.value,
                    ambulances: infraInputs[7]?.value,
                    departments: depts,

                    // Step 5
                    ayushman_bharat: document.querySelectorAll('#step5 select')[0]?.value,
                    state_insurance: document.querySelectorAll('#step5 select')[1]?.value,
                    admin_name: document.querySelector('input[placeholder="Account Manager / Super"]')?.value,
                    designation: document.querySelector('input[placeholder="Official Role"]')?.value,
                    email: document.querySelector('input[placeholder="admin@hospital.com"]')?.value,
                    password: document.querySelector('input[placeholder="••••••••"]')?.value
                };

                const response = await fetch(RapidCareConfig.API_BASE + '/hospitals/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('rapidcare_token', data.token);
                    localStorage.setItem('rapidcare_user', JSON.stringify(data.user));
                    alert('Hospital Registration Submitted successfully!');
                    window.location.href = '../hospital_Dashboard/index.html';
                } else {
                    alert('Registration failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Server error, please try again later.');
            } finally {
                submitBtn.innerText = origText;
                submitBtn.disabled = false;
            }
        });
    }
});
