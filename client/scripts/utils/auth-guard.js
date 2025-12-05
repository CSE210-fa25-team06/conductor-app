// Import the permissions directly from your server route
import { PERMISSIONS } from '/api/config/js/permissions.js';

async function getSession() {
    try {
        const res = await fetch('/api/auth/session');
        return await res.json();
    } catch (err) {
        console.error("AuthGuard: Session fetch failed", err);
        return { success: false };
    }
}

/**
 * Higher-Order Function to protect a UI component.
 * @param {HTMLElement} containerEl - The DOM element to render into.
 * @param {string|string[]} requiredPermissions - Single string or Array of strings (OR logic).
 * @param {Function} renderCallback - The function to run if authorized.
 * @param {Function} [onDeny] - Optional callback to run if access is denied.
 */
export async function protectComponent(containerEl, requiredPermissions, renderCallback, onDeny = null) {
    // 1. Loading State
    containerEl.innerHTML = '<div class="loading">Verifying access...</div>';

    // 2. Fetch Session
    const session = await getSession();

    // 3. Normalize Input (Ensure it's always an array)
    const permissionsToCheck = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

    // 4. Security Check (OR Logic)
    // We check if the user has AT LEAST ONE of the required permissions.
    const hasAccess = 
        session.success && 
        session.user && 
        session.user.permissions && 
        permissionsToCheck.some(perm => session.user.permissions.includes(perm));

    if (!hasAccess) {
        // Run the deny callback (e.g., hiding the page header)
        if (onDeny) onDeny();

        console.warn(`[AuthGuard] Blocked access. Missing one of: ${permissionsToCheck.join(', ')}`);
        
        // FIX: Changed class from "error-container" to "error" to match your CSS
        containerEl.innerHTML = `
            <div class="error">
                <h2>Access Denied</h2>
                <p>You do not have permission to view this content.</p>
            </div>
        `;
        return;
    }

    // 5. Access Granted
    containerEl.innerHTML = ''; 
    await renderCallback();
}

// Re-export PERMISSIONS so other components can access them easily
export { PERMISSIONS };