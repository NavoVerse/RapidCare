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
