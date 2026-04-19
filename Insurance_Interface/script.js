document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            } else {
                themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sun-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
            }
        });
    }

    // Modern Modal Logic for adding Government Schemes
    const modal = document.getElementById('add-scheme-modal');
    const form = document.getElementById('add-scheme-form');
    const typeInput = document.getElementById('scheme-type');
    let currentContainer = null;
    let currentPill = null;
    let currentAccordion = null;

    if (modal && form) {
        // We hook for all plans as per updated requirement
        const stateAccordion = document.querySelector('.icon-state').closest('.accordion-item');
        const centralAccordion = document.querySelector('.icon-central').closest('.accordion-item');
        const mediclaimAccordion = document.querySelector('.icon-mediclaim').closest('.accordion-item');
        const privateAccordion = document.querySelector('.icon-private').closest('.accordion-item');

        const accordionsArray = [
            { id: 'State', el: stateAccordion },
            { id: 'Central', el: centralAccordion },
            { id: 'Mediclaim', el: mediclaimAccordion },
            { id: 'Private', el: privateAccordion }
        ];

        accordionsArray.forEach(acc => {
            if (acc.el) {
                const addBtn = acc.el.querySelector('.add-scheme-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        openModal(acc.id, acc.el.querySelector('.scheme-list'), acc.el.querySelector('.count-pill'), acc.el);
                    });
                }
            }
        });

        const globalAddBtn = document.getElementById('global-add-btn');
        if (globalAddBtn) {
            globalAddBtn.addEventListener('click', () => {
                openModal('Global', null, null, null);
            });
        }

        function openModal(type, listContainer, pillElement, accordionItem) {
            const headerText = modal.querySelector('.modal-header h3');
            const typeGroup = document.getElementById('scheme-type-group');
            
            if (type === 'Global') {
                typeInput.value = 'Global';
                if(headerText) headerText.textContent = `Add New Insurance`;
                if(typeGroup) typeGroup.style.display = 'flex';
                currentContainer = null;
                currentPill = null;
                currentAccordion = null;
            } else {
                typeInput.value = type;
                if(headerText) headerText.textContent = `Add ${type} Insurance Scheme`;
                if(typeGroup) typeGroup.style.display = 'none';
                currentContainer = listContainer;
                currentPill = pillElement;
                currentAccordion = accordionItem;
            }
            
            modal.classList.add('active');
        }

        const closeBtn = document.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                form.reset();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                form.reset();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let targetType = typeInput.value;
            let targetContainer = currentContainer;
            let targetPill = currentPill;
            let targetAccordion = currentAccordion;

            if (targetType === 'Global') {
                const selected = document.getElementById('scheme-category-select').value;
                const accordionsObj = {
                    'State': document.querySelector('.icon-state').closest('.accordion-item'),
                    'Central': document.querySelector('.icon-central').closest('.accordion-item'),
                    'Mediclaim': document.querySelector('.icon-mediclaim').closest('.accordion-item'),
                    'Private': document.querySelector('.icon-private').closest('.accordion-item')
                };
                targetAccordion = accordionsObj[selected];
                targetContainer = targetAccordion.querySelector('.scheme-list');
                targetPill = targetAccordion.querySelector('.count-pill');
            }

            const name = document.getElementById('scheme-name').value;
            const desc = document.getElementById('scheme-desc').value;
            const link = document.getElementById('scheme-link').value;

            const newCard = document.createElement('div');
            newCard.className = 'scheme-card';
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(10px)';
            newCard.style.transition = 'all 0.3s ease';

            newCard.innerHTML = `
                <div class="scheme-header">
                    <div class="scheme-title">
                        <h4>${name}</h4>
                        <p>${desc}</p>
                    </div>
                    <span class="badge active">Linked</span>
                </div>
                <div class="scheme-actions">
                    <button class="btn btn-primary btn-sm">Raise Claim</button>
                    <a href="${link}" target="_blank" class="btn btn-outline btn-sm">View Portal</a>
                </div>
            `;

            const divider = targetContainer.querySelector('.section-divider');
            if (divider) {
                targetContainer.insertBefore(newCard, divider);
            } else {
                targetContainer.appendChild(newCard);
            }

            requestAnimationFrame(() => {
                newCard.style.opacity = '1';
                newCard.style.transform = 'none';
            });

            let currentCount = parseInt(targetPill.textContent);
            if (!isNaN(currentCount)) {
                targetPill.textContent = (currentCount + 1) + " Linked";
            }

            if (targetAccordion.classList.contains('active')) {
                const content = targetAccordion.querySelector('.accordion-content');
                setTimeout(() => {
                    content.style.maxHeight = content.scrollHeight + "px";
                }, 50);
            }

            modal.classList.remove('active');
            form.reset();
        });
    }

    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            // Toggle active class on item
            item.classList.toggle('active');

            if (item.classList.contains('active')) {
                // Expanding
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                // Collapsing
                content.style.maxHeight = null;
            }
            
            // Recalculate max-heights for all currently open accordions after animation
            // This is useful if nested content changes size, but valid overall
            setTimeout(() => {
                if (item.classList.contains('active')) {
                    content.style.maxHeight = "none"; 
                    // Set to none after transition so it can grow if content changes
                    // Wait, setting to none removes the animation if closing again?
                    // Better to keep it as scrollHeight for smooth toggle both ways.
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }, 300);
        });
    });

    // Handle recalculating height on resize
    window.addEventListener('resize', () => {
        document.querySelectorAll('.accordion-item.active .accordion-content').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });
});
