const API_BASE = RapidCareConfig.API_BASE + '/auth';

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
    // Theme Toggle is now handled by shared_assets/js/theme-manager.js


    // Toggle between Signup and Login
    const signupView = document.getElementById('signup-view');
    const loginView = document.getElementById('login-view');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');

    const forgotPasswordView = document.getElementById('forgot-password-view');
    const showForgotPasswordLink = document.getElementById('show-forgot-password');
    const backToLoginLink = document.getElementById('back-to-login');

    if (showLoginLink && signupView && loginView && forgotPasswordView) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupView.style.display = 'none';
            forgotPasswordView.style.display = 'none';
            loginView.style.display = 'block';
        });

        // "Create an account" → redirect straight to Driver Registration
        if (showSignupLink) {
            showSignupLink.href = '/driver-register';
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/driver-register';
            });
        }

        showForgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.style.display = 'none';
            signupView.style.display = 'none';
            forgotPasswordView.style.display = 'block';
        });

        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordView.style.display = 'none';
            signupView.style.display = 'none';
            loginView.style.display = 'block';
        });
    }

    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideCount = slides.length;

    if (slideCount > 0) {
        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');

            currentSlide = (currentSlide + 1) % slideCount;

            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        // Auto scroll every 5 seconds
        setInterval(nextSlide, 5000);
    }

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
                localStorage.setItem('rapidcare_token', data.token);
                localStorage.setItem('rapidcare_user', JSON.stringify(data.user));
                showToast(`Welcome back, ${data.user.name}!`, 'success');
                
                // For driver-login, we ALWAYS redirect to driver dashboard if it's a driver
                // If a patient logs in here, we might want to redirect them to patient dashboard too
                // but usually this page is only for drivers.
                setTimeout(() => {
                    if (data.user.role === 'driver') {
                        window.location.href = '/driver';
                    } else {
                        window.location.href = '/dashboard';
                    }
                }, 1500);
            } else {
                showToast(data.error || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            console.error('Login error:', err);
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

    // --- FORGOT PASSWORD LOGIC ---
    const forgotStep1 = document.getElementById('forgot-step-1');
    const forgotStep2 = document.getElementById('forgot-step-2');
    let resetEmailOrPhone = '';

    if (forgotStep1 && forgotStep2) {
        // Step 1: Request OTP
        forgotStep1.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgot-email').value.trim();
            if (!emailInput) return showToast('Please enter your email or phone', 'error');

            const btn = forgotStep1.querySelector('.create-btn');
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/request-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput })
                });
                const data = await res.json();

                if (res.ok) {
                    showToast('OTP sent successfully', 'success');
                    resetEmailOrPhone = emailInput;
                    forgotStep1.style.display = 'none';
                    forgotStep2.style.display = 'block';
                } else {
                    showToast(data.error || 'Failed to send OTP', 'error');
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
                console.error('OTP Request error:', err);
            } finally {
                btn.textContent = 'Send OTP';
                btn.disabled = false;
            }
        });

        // Step 2: Verify OTP & Reset Password
        forgotStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('forgot-otp').value.trim();
            const newPassword = document.getElementById('forgot-new-password').value;

            if (!otp || !newPassword) return showToast('Please fill all fields', 'error');

            const btn = forgotStep2.querySelector('.create-btn');
            btn.textContent = 'Resetting...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmailOrPhone, otp, newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    showToast('Password reset successfully!', 'success');
                    // Reset forms and go back to login
                    forgotStep2.reset();
                    forgotStep1.reset();
                    forgotStep2.style.display = 'none';
                    forgotStep1.style.display = 'block';
                    document.getElementById('back-to-login').click();
                } else {
                    showToast(data.error || 'Failed to reset password', 'error');
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
                console.error('Password Reset error:', err);
            } finally {
                btn.textContent = 'Reset Password';
                btn.disabled = false;
            }
        });
    }

    // SOS Button Redirection
    const sosButton = document.querySelector('.sos-button');
    if (sosButton) {
        sosButton.addEventListener('click', () => {
            window.location.href = '/urgency';
        });
    }
});
