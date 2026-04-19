document.addEventListener('DOMContentLoaded', () => {
    const personalForm = document.getElementById('personalForm');
    const commercialForm = document.getElementById('commercialForm');
    const vehicleDocsForm = document.getElementById('vehicleDocsForm');
    const vehiclePhotosForm = document.getElementById('vehiclePhotosForm');
    const trainingForm = document.getElementById('trainingForm');

    // Add submit event listener for validation visualization
    personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        nextStep(1);
    });

    commercialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        nextStep(2);
    });

    if (vehicleDocsForm) {
        vehicleDocsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            nextStep(3);
        });
    }

    if (vehiclePhotosForm) {
        vehiclePhotosForm.addEventListener('submit', (e) => {
            e.preventDefault();
            nextStep(4);
        });
    }

    if (trainingForm) {
        trainingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Registration Submitted successfully!');
            // Final submission logic
        });
    }
});

function nextStep(currentStep) {
    let form;
    if (currentStep === 1) form = document.getElementById('personalForm');
    else if (currentStep === 2) form = document.getElementById('commercialForm');
    else if (currentStep === 3) form = document.getElementById('vehicleDocsForm');
    else if (currentStep === 4) form = document.getElementById('vehiclePhotosForm');
    
    // Check HTML5 validation before proceeding
    if (form && form.checkValidity()) {
        goToStep(currentStep + 1);
    } else if (form) {
        // Trigger native HTML5 validation UI
        form.reportValidity();
    }
}

function goToStep(targetStep) {
    // Hide all steps
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all stepper items
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetSection = document.getElementById(`step${targetStep}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to target stepper item
    const steps = document.querySelectorAll('.step');
    if (steps[targetStep - 1]) {
        steps[targetStep - 1].classList.add('active');
    }

    // Auto focus logic
    if (targetStep === 2) { 
        setTimeout(() => {
            const aadhaarInput = document.getElementById('aadhaarNum');
            if (aadhaarInput) aadhaarInput.focus();
        }, 100);
    }
}
