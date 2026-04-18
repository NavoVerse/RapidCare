document.addEventListener('DOMContentLoaded', () => {
    // Nav menu interaction
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Search bar pulse effect on focus
    const searchInput = document.querySelector('.search-bar input');
    const searchBar = document.querySelector('.search-bar');
    
    searchInput.addEventListener('focus', () => {
        searchBar.style.boxShadow = '0 0 0 2px #3b82f644';
        searchBar.style.backgroundColor = '#ffffff';
    });
    
    searchInput.addEventListener('blur', () => {
        searchBar.style.boxShadow = 'none';
        searchBar.style.backgroundColor = '#f1f5f9';
    });

    // SOS Button action
    const sosBtn = document.querySelector('.sos-floating');
    sosBtn.addEventListener('click', () => {
        const confirmed = confirm('ARE YOU SURE YOU WANT TO TRIGGER AN EMERGENCY SOS?\n\nThis will alert nearby medical centers and emergency services immediately.');
        if (confirmed) {
            alert('SOS ACTIVATED. HELP IS ON THE WAY.');
            sosBtn.style.background = '#000';
            sosBtn.textContent = 'SOS SENT';
        }
    });

    console.log('RapidCare Dashboard Initialized');
});
