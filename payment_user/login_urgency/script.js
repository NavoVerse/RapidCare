document.addEventListener('DOMContentLoaded', () => {

    // ========== THEME TOGGLE ==========
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') { body.classList.add('dark-mode'); updateToggleIcon(true); }

    themeToggle.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateToggleIcon(isDark);
    });

    function updateToggleIcon(isDark) {
        themeToggle.innerHTML = isDark
            ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
            : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }

    // ========== SLIDE MANAGEMENT ==========
    const slidesTrack = document.getElementById('slidesTrack');
    const stepDots = [document.getElementById('stepDot1'), document.getElementById('stepDot2'), document.getElementById('stepDot3')];
    const stepLines = [document.getElementById('stepLine1'), document.getElementById('stepLine2')];
    let currentSlide = 0;

    const allSlides = document.querySelectorAll('.slide');

    function goToSlide(index) {
        currentSlide = index;

        // Toggle slide visibility
        allSlides.forEach((slide, i) => {
            slide.classList.remove('active-slide', 'exit-left');
            if (i < index) slide.classList.add('exit-left');
            else if (i === index) slide.classList.add('active-slide');
        });

        // Update step indicators
        stepDots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < index) dot.classList.add('done');
            else if (i === index) dot.classList.add('active');
        });
        stepLines.forEach((line, i) => {
            line.classList.toggle('done-line', i < index);
        });

        // Auto-focus first OTP box when arriving at slide 2
        if (index === 1) {
            setTimeout(() => {
                const firstBox = document.querySelector('.otp-box[data-index="0"]');
                if (firstBox) firstBox.focus();
            }, 600);
        }
    }

    // ========== SLIDE 1: MOBILE / EMAIL ==========
    const toggleMobile = document.getElementById('toggleMobile');
    const toggleEmail = document.getElementById('toggleEmail');
    const mobileSection = document.getElementById('mobileSection');
    const emailSection = document.getElementById('emailSection');
    const phoneInput = document.getElementById('phoneInput');
    const emailInput = document.getElementById('emailInput');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    let contactMode = 'mobile';

    toggleMobile.addEventListener('click', () => {
        contactMode = 'mobile';
        toggleMobile.classList.add('active');
        toggleEmail.classList.remove('active');
        mobileSection.style.display = 'block';
        emailSection.style.display = 'none';
        phoneInput.focus();
        validateSlide1();
    });

    toggleEmail.addEventListener('click', () => {
        contactMode = 'email';
        toggleEmail.classList.add('active');
        toggleMobile.classList.remove('active');
        emailSection.style.display = 'block';
        mobileSection.style.display = 'none';
        emailInput.focus();
        validateSlide1();
    });

    // Phone input — only allow digits
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        validateSlide1();
    });

    emailInput.addEventListener('input', validateSlide1);

    function validateSlide1() {
        let valid = false;
        if (contactMode === 'mobile') {
            valid = phoneInput.value.length === 10;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            valid = emailRegex.test(emailInput.value);
        }
        sendCodeBtn.disabled = !valid;
    }

    sendCodeBtn.addEventListener('click', () => {
        if (sendCodeBtn.disabled) return;

        // Update the "Sent to" display on slide 2
        const sentToDisplay = document.getElementById('sentToDisplay');
        if (contactMode === 'mobile') {
            const phone = phoneInput.value;
            sentToDisplay.textContent = `+91 ${phone.substring(0, 2)}••••${phone.substring(phone.length - 2)}`;
        } else {
            const email = emailInput.value;
            const atIndex = email.indexOf('@');
            sentToDisplay.textContent = `${email.substring(0, 2)}••••@${email.substring(atIndex + 1)}`;
        }

        goToSlide(1);
        startResendTimer();
    });

    // ========== SLIDE 2: OTP VERIFICATION ==========
    const otpBoxes = document.querySelectorAll('.otp-box');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendBtn = document.getElementById('resendBtn');
    const resendTimer = document.getElementById('resendTimer');
    const backToSlide1 = document.getElementById('backToSlide1');
    let resendInterval = null;

    // OTP auto-advance logic
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;

            if (val && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
            if (val) box.classList.add('filled');
            else box.classList.remove('filled');

            checkOTPComplete();
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !box.value && index > 0) {
                otpBoxes[index - 1].focus();
                otpBoxes[index - 1].value = '';
                otpBoxes[index - 1].classList.remove('filled');
                checkOTPComplete();
            }
        });

        // Handle paste
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            for (let i = 0; i < Math.min(pasted.length, otpBoxes.length - index); i++) {
                otpBoxes[index + i].value = pasted[i];
                otpBoxes[index + i].classList.add('filled');
            }
            const nextIndex = Math.min(index + pasted.length, otpBoxes.length - 1);
            otpBoxes[nextIndex].focus();
            checkOTPComplete();
        });

        box.addEventListener('focus', () => { box.select(); });
    });

    function checkOTPComplete() {
        let allFilled = true;
        otpBoxes.forEach(b => { if (!b.value) allFilled = false; });
        verifyBtn.disabled = !allFilled;
    }

    function startResendTimer() {
        let seconds = 30;
        resendBtn.disabled = true;
        resendTimer.textContent = `(${seconds}s)`;

        if (resendInterval) clearInterval(resendInterval);
        resendInterval = setInterval(() => {
            seconds--;
            resendTimer.textContent = `(${seconds}s)`;
            if (seconds <= 0) {
                clearInterval(resendInterval);
                resendBtn.disabled = false;
                resendTimer.textContent = '';
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', () => {
        if (resendBtn.disabled) return;
        // Clear OTP boxes
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('filled', 'error'); });
        verifyBtn.disabled = true;
        otpBoxes[0].focus();
        startResendTimer();
    });

    backToSlide1.addEventListener('click', () => {
        // Clear OTP
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('filled', 'error'); });
        verifyBtn.disabled = true;
        if (resendInterval) clearInterval(resendInterval);
        goToSlide(0);
    });

    verifyBtn.addEventListener('click', () => {
        if (verifyBtn.disabled) return;
        // Simulate verification (accept any 6-digit code)
        goToSlide(2);
    });

    // ========== SLIDE 3: EMERGENCY CATEGORIZATION ==========

    const symptomData = {
        "Normal Symptoms": [
            "Chest pain or pressure",
            "Fever",
            "Fatigue/Weakness",
            "Abdominal pain",
            "Cough",
            "Dizziness or lightheadedness",
            "Nausea/Vomiting",
            "Diarrhea",
            "Confusion or altered mental state",
            "Swelling (Edema) in extremities",
            "Severe headache",
            "Uncontrolled bleeding",
            "Back pain",
            "Fainting (Syncope)"
        ],
        "Critical/Severe Conditions": [
            "Sepsis",
            "Heart attack (Myocardial infarction)",
            "Stroke",
            "Respiratory failure/ARDS",
            "Pneumonia",
            "Congestive heart failure",
            "Acute kidney injury/failure",
            "Pulmonary embolism",
            "Diabetic ketoacidosis",
            "Anaphylaxis (Severe allergic reaction)",
            "Traumatic brain injury",
            "Severe burns",
            "Aortic dissection",
            "Intestinal obstruction",
            "Alcohol withdrawal/delirium"
        ]
    };

    const vehicleData = [
        { name: "General (AC/Non-AC)", desc: "Standard ambulance for non-critical transfers", emoji: "🚑" },
        { name: "Oxygen Support", desc: "Equipped with supplemental oxygen delivery", emoji: "💨" },
        { name: "ICU", desc: "Mobile Intensive Care Unit with monitoring", emoji: "🏥" },
        { name: "Ventilation Support", desc: "Full ventilator & life-support equipment", emoji: "🫁" }
    ];

    let selectedSymptoms = [];
    let selectedVehicle = null;

    const symptomSearch = document.getElementById('symptomSearch');
    const symptomList = document.getElementById('symptomList');
    const symptomClear = document.getElementById('symptomClear');
    const selectedSymptomsContainer = document.getElementById('selectedSymptoms');
    const symptomDropdownWrapper = document.getElementById('symptomDropdownWrapper');

    const vehicleSearch = document.getElementById('vehicleSearch');
    const vehicleList = document.getElementById('vehicleList');
    const vehicleChevron = document.getElementById('vehicleChevron');
    const vehicleDropdownWrapper = document.getElementById('vehicleDropdownWrapper');

    const submitBtn = document.getElementById('submitBtn');

    // Symptoms dropdown
    function renderSymptomDropdown(filter = '') {
        symptomList.innerHTML = '';
        const lowerFilter = filter.toLowerCase().trim();
        let hasResults = false;

        for (const [section, items] of Object.entries(symptomData)) {
            const isCritical = section.includes('Critical');
            const filteredItems = items.filter(item => item.toLowerCase().includes(lowerFilter));
            if (filteredItems.length === 0) continue;
            hasResults = true;

            const header = document.createElement('div');
            header.className = `dropdown-section${isCritical ? ' critical' : ''}`;
            header.textContent = section;
            symptomList.appendChild(header);

            filteredItems.forEach(item => {
                const div = document.createElement('div');
                div.className = `dropdown-item${isCritical ? ' critical-item' : ''}${selectedSymptoms.includes(item) ? ' selected' : ''}`;
                div.setAttribute('role', 'option');
                div.innerHTML = `
                    <span class="item-dot"></span>
                    <span class="item-text">${highlightMatch(item, lowerFilter)}</span>
                    <svg class="check-mark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                `;
                div.addEventListener('click', () => toggleSymptom(item));
                symptomList.appendChild(div);
            });
        }

        if (!hasResults) {
            const noRes = document.createElement('div');
            noRes.className = 'no-results';
            noRes.textContent = 'No symptoms match your search';
            symptomList.appendChild(noRes);
        }
    }

    function highlightMatch(text, filter) {
        if (!filter) return text;
        const idx = text.toLowerCase().indexOf(filter);
        if (idx === -1) return text;
        return text.substring(0, idx) + `<strong>${text.substring(idx, idx + filter.length)}</strong>` + text.substring(idx + filter.length);
    }

    function toggleSymptom(symptom) {
        const idx = selectedSymptoms.indexOf(symptom);
        if (idx > -1) selectedSymptoms.splice(idx, 1);
        else selectedSymptoms.push(symptom);
        renderSymptomDropdown(symptomSearch.value);
        renderSelectedTags();
        updateSubmitState();
    }

    function renderSelectedTags() {
        selectedSymptomsContainer.innerHTML = '';
        selectedSymptoms.forEach(symptom => {
            const isCritical = symptomData["Critical/Severe Conditions"].includes(symptom);
            const tag = document.createElement('span');
            tag.className = `tag${isCritical ? ' critical-tag' : ''}`;
            tag.innerHTML = `${symptom}<span class="tag-remove" data-symptom="${symptom}">&times;</span>`;
            tag.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                selectedSymptoms = selectedSymptoms.filter(x => x !== e.target.getAttribute('data-symptom'));
                renderSelectedTags();
                renderSymptomDropdown(symptomSearch.value);
                updateSubmitState();
            });
            selectedSymptomsContainer.appendChild(tag);
        });
    }

    symptomSearch.addEventListener('focus', () => {
        renderSymptomDropdown(symptomSearch.value);
        symptomList.classList.add('open');
    });
    symptomSearch.addEventListener('input', () => {
        renderSymptomDropdown(symptomSearch.value);
        symptomClear.classList.toggle('visible', symptomSearch.value.length > 0);
        if (!symptomList.classList.contains('open')) symptomList.classList.add('open');
    });
    symptomClear.addEventListener('click', () => {
        symptomSearch.value = '';
        symptomClear.classList.remove('visible');
        renderSymptomDropdown('');
        symptomSearch.focus();
    });

    // Vehicle dropdown
    function renderVehicleDropdown() {
        vehicleList.innerHTML = '';
        vehicleData.forEach(v => {
            const div = document.createElement('div');
            div.className = `dropdown-item${selectedVehicle === v.name ? ' selected' : ''}`;
            div.innerHTML = `
                <span class="vehicle-emoji">${v.emoji}</span>
                <span class="vehicle-info">
                    <span class="vehicle-name">${v.name}</span>
                    <span class="vehicle-desc">${v.desc}</span>
                </span>
                <svg class="check-mark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            `;
            div.addEventListener('click', () => {
                selectedVehicle = v.name;
                vehicleSearch.value = v.name;
                vehicleList.classList.remove('open');
                vehicleChevron.classList.remove('open');
                renderVehicleDropdown();
                updateSubmitState();
            });
            vehicleList.appendChild(div);
        });
    }

    vehicleSearch.addEventListener('click', () => {
        const isOpen = vehicleList.classList.toggle('open');
        vehicleChevron.classList.toggle('open', isOpen);
        if (isOpen) renderVehicleDropdown();
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!symptomDropdownWrapper.contains(e.target)) symptomList.classList.remove('open');
        if (!vehicleDropdownWrapper.contains(e.target)) {
            vehicleList.classList.remove('open');
            vehicleChevron.classList.remove('open');
        }
    });

    function updateSubmitState() {
        submitBtn.disabled = !(selectedSymptoms.length > 0 && selectedVehicle !== null);
    }

    submitBtn.addEventListener('click', () => {
        if (submitBtn.disabled) return;

        const criticalSymptoms = selectedSymptoms.filter(s => symptomData["Critical/Severe Conditions"].includes(s));
        let alertMsg = '✅ Emergency Dispatch Confirmed!\n\n';
        alertMsg += `🚑 Vehicle: ${selectedVehicle}\n\n`;
        alertMsg += `📋 Symptoms (${selectedSymptoms.length}):\n`;
        selectedSymptoms.forEach(s => {
            const prefix = criticalSymptoms.includes(s) ? '🔴' : '🟢';
            alertMsg += `  ${prefix} ${s}\n`;
        });
        if (criticalSymptoms.length > 0) {
            alertMsg += `\n⚠️ ${criticalSymptoms.length} CRITICAL condition(s) — priority dispatch initiated.`;
        }

        setTimeout(() => {
            alert(alertMsg);
            window.location.href = '../index.html';
        }, 300);
    });

    // ========== INIT ==========
    renderSymptomDropdown();
    renderVehicleDropdown();
    updateSubmitState();
    goToSlide(0);
});
