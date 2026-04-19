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
