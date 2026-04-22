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
});
