const API_BASE = 'http://localhost:5000/api/auth';

// --- Toast Notification System ---
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateToggleIcons(true);
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcons(isDark);
        });
    });

    function updateToggleIcons(isDark) {
        themeToggles.forEach(toggle => {
            toggle.innerHTML = isDark 
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        });
    }

    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideCount = slides.length;

    if (slideCount === 0) return;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        currentSlide = (currentSlide + 1) % slideCount;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    // Auto scroll every 5 seconds
    setInterval(nextSlide, 5000);

    // Toggle between Signup and Login
    const signupView = document.getElementById('signup-view');
    const loginView = document.getElementById('login-view');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.style.display = 'none';
        loginView.style.display = 'block';
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    });

    // --- SIGNUP FORM ---
    const signupForm = signupView.querySelector('.login-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!firstName || !email || !password) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        const btn = signupForm.querySelector('.create-btn');
        btn.textContent = 'Creating...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email: email,
                    password: password,
                    role: 'patient',
                    phone: ''
                })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`Account created! Welcome, ${firstName}`, 'success');
                // Switch to login view after a short delay
                setTimeout(() => {
                    signupView.style.display = 'none';
                    loginView.style.display = 'block';
                    document.getElementById('login-email').value = email;
                }, 1500);
            } else {
                showToast(data.error || 'Registration failed', 'error');
            }
        } catch (err) {
            showToast('Server unreachable. Is the backend running?', 'error');
        } finally {
            btn.textContent = 'Create account';
            btn.disabled = false;
        }
    });

    // --- LOGIN FORM ---
    const loginForm = loginView.querySelector('.login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }

        const btn = loginForm.querySelector('.create-btn');
        btn.textContent = 'Logging in...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast(`Welcome back, ${data.user.name}!`, 'success');
                // Redirect to patient dashboard
                setTimeout(() => {
                    window.location.href = '../patient_Dashboard/index.html';
                }, 1500);
            } else {
                showToast(data.error || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Server unreachable. Is the backend running?', 'error');
        } finally {
            btn.textContent = 'Log in';
            btn.disabled = false;
        }
    });

    // Password Visibility Toggle
    const eyeIcons = document.querySelectorAll('.eye-icon');
    eyeIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                input.type = 'password';
                icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    });

    // SOS Button Redirection
    const sosButton = document.querySelector('.sos-button');
    if (sosButton) {
        sosButton.addEventListener('click', () => {
            window.location.href = '../login_urgency/index.html';
        });
    }
});
