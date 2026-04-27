document.addEventListener('DOMContentLoaded', () => {
    // Availability Toggle
    const toggle = document.getElementById('availability-toggle');
    const statusText = document.querySelector('.status-text');
    const liveBadge = document.querySelector('.live-badge');

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            statusText.textContent = 'LIVE';
            statusText.style.color = 'var(--accent-green)';
            liveBadge.style.opacity = '1';
        } else {
            statusText.textContent = 'OFFLINE';
            statusText.style.color = 'var(--text-secondary)';
            liveBadge.style.opacity = '0.5';
        }
    });

    // Button Hover Effects and Click Ripple (Simple)
    const buttons = document.querySelectorAll('.btn, .emergency-sos-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            this.style.transform = 'scale(0.98)';
        });
        btn.addEventListener('mouseup', function(e) {
            this.style.transform = 'scale(1)';
        });
    });

    // Simulate some real-time data updates (e.g., heart rate)
    const heartRateElement = document.querySelector('.vital-item:nth-child(1) .vital-value');
    if (heartRateElement) {
        setInterval(() => {
            if (toggle.checked) {
                const baseRate = 112;
                const variance = Math.floor(Math.random() * 5) - 2;
                heartRateElement.textContent = baseRate + variance;
                
                // Add a small pulse effect on change
                heartRateElement.style.transition = 'transform 0.2s';
                heartRateElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    heartRateElement.style.transform = 'scale(1)';
                }, 200);
            }
        }, 3000);
    }

    // Scroll reveal for cards
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .stat-card').forEach(card => {
        observer.observe(card);
    });

    // Navigation Tab Switching
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');
    const headerTitle = document.querySelector('.main-header h1');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all nav items
            navItems.forEach(nav => {
                nav.classList.remove('active');
                const dot = nav.querySelector('.active-dot');
                if (dot) dot.style.display = 'none';
            });

            // Add active to clicked item
            item.classList.add('active');
            const dot = item.querySelector('.active-dot');
            if (dot) dot.style.display = 'block';

            // Hide all views
            viewSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = 'block';
                // Small delay to allow display:block to apply before adding class for animations
                setTimeout(() => {
                    targetView.classList.add('active');
                }, 10);
            }

            // Update Header Title
            if (targetId === 'profile-view') {
                headerTitle.textContent = 'Driver Profile';
            } else {
                headerTitle.textContent = 'Dashboard';
            }
        });
    });
});
