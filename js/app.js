/**
 * THEDAL — Public Project Showcase JavaScript
 * Minimal, dependency-free interactive logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Snippet copy button handlers
    const copyButtons = document.querySelectorAll('[data-copy-target]');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-copy-target');
            const targetElem = document.getElementById(targetId);
            if (!targetElem) return;

            const textToCopy = targetElem.textContent.trim();
            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHtml = btn.innerHTML;
                btn.innerHTML = `<svg class="icon icon-sm" aria-hidden="true" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> <span style="font-size:0.75rem;">Copied!</span>`;
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        });
    });

    // Simple Tab Switcher for Installation Paths
    const tabButtons = document.querySelectorAll('.install-tab-btn');
    const tabPanes = document.querySelectorAll('.install-tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.style.borderBottomColor = 'transparent';
                b.style.color = 'var(--text-secondary)';
            });

            tabPanes.forEach(pane => {
                pane.style.display = 'none';
            });

            btn.classList.add('active');
            btn.style.borderBottomColor = 'var(--color-primary)';
            btn.style.color = 'var(--text-primary)';

            const activePane = document.getElementById(`tab-${targetTab}`);
            if (activePane) {
                activePane.style.display = 'block';
            }
        });
    });
});
