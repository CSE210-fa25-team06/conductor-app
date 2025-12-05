/**
 * @file js/utils/ui-utils.js
 * @description Shared UI utilities like Toasts and Sanitization.
 */

export const Notifications = {
    show(message, isError = false) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = isError ? 'toast error' : 'toast';
        toast.style.cssText = `
            background: ${isError ? '#ffebee' : '#e8f5e9'};
            color: ${isError ? '#c62828' : '#2e7d32'};
            padding: 1rem 1.5rem;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border-left: 4px solid ${isError ? '#c62828' : '#2e7d32'};
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
            min-width: 250px;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    success(msg) { this.show(msg, false); },
    error(msg) { this.show(msg, true); }
};

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}