/**
 * RapidCare Theme Manager
 * Handles Light/Dark mode transitions, persistence, and system preferences.
 */

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || this.getSystemPreference();
        this.init();
    }

    init() {
        // Apply initial theme
        this.applyTheme(this.theme);

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Setup toggles when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupToggles());
        } else {
            this.setupToggles();
        }
    }

    getSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        this.updateIcons(theme);
        
        // Dispatch custom event for components like Leaflet maps
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        this.applyTheme(newTheme);
    }

    setupToggles() {
        const toggles = document.querySelectorAll('.theme-toggle, #theme-toggle');
        toggles.forEach(toggle => {
            // Remove old listeners to avoid duplicates
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            newToggle.addEventListener('click', () => this.toggleTheme());
        });
        this.updateIcons(this.theme);
    }

    updateIcons(theme) {
        const toggles = document.querySelectorAll('.theme-toggle, #theme-toggle');
        const sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        const moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

        toggles.forEach(toggle => {
            toggle.innerHTML = theme === 'light' ? moonIcon : sunIcon;
            toggle.title = `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`;
        });
    }
}

// Initialize theme manager immediately to prevent flash
window.rapidCareTheme = new ThemeManager();
