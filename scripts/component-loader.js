(function () {
    async function injectComponent(node) {
        const src = node.getAttribute('data-component');
        if (!src) return;

        try {
            const response = await fetch(src, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error('Failed to load component: ' + src + ' (' + response.status + ')');
            }

            const html = await response.text();
            const template = document.createElement('template');
            template.innerHTML = html.trim();
            node.replaceWith(template.content);
        } catch (error) {
            console.error(error);
            node.innerHTML = '<p style="padding: 1rem; color: #ef4444;">Failed to load section.</p>';
        }
    }

    async function loadAllComponents() {
        const placeholders = Array.from(document.querySelectorAll('[data-component]'));
        await Promise.all(placeholders.map(injectComponent));
        document.dispatchEvent(new CustomEvent('components:loaded', {
            detail: { count: placeholders.length }
        }));
    }

    window.componentLoader = {
        loadAllComponents
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllComponents, { once: true });
    } else {
        loadAllComponents();
    }
})();
