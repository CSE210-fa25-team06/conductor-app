// Import the permissions directly from your server route
import { PERMISSIONS } from '/api/config/js/permissions.js';

let cachedSession = null;

async function getSession() {
    if (cachedSession) return cachedSession;
    try {
        const res = await fetch('/api/auth/session');
        cachedSession = await res.json();
        return cachedSession;
    } catch (err) {
        console.error("AuthGuard: Session fetch failed", err);
        return { success: false };
    }
}

/**
 * Higher-Order Function to protect a UI component.
 * @param {HTMLElement} containerEl - The DOM element to render into.
 * @param {string} requiredPermission - The PERMISSIONS constant (e.g., PERMISSIONS.VIEW_CLASS_DIRECTORY).
 * @param {Function} renderCallback - The function to run if authorized.
 */
export async function protectComponent(containerEl, requiredPermission, renderCallback) {
    // 1. Loading State
    containerEl.innerHTML = '<div class="loading">Verifying access...</div>';

    // 2. Fetch Session
    const session = await getSession();

    // 3. Security Check
    // We check if the user's permissions array includes the required string
    const isAuthorized = 
        session.success && 
        session.user && 
        session.user.permissions && 
        session.user.permissions.includes(requiredPermission);

    if (!isAuthorized) {
        console.warn(`[AuthGuard] Blocked access. Missing: ${requiredPermission}`);
        containerEl.innerHTML = `
            <div class="error-container">
                <h2>Access Denied</h2>
                <p>You do not have permission to view this content.</p>
            </div>
        `;
        return;
    }

    // 4. Access Granted
    containerEl.innerHTML = ''; // Clear loading/error
    await renderCallback();
}

// Re-export PERMISSIONS so other components can access them easily
export { PERMISSIONS };