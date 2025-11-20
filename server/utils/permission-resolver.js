/**
 * @file utils/permission-resolver.js
 * @description Implements the custom logic for calculating a user's effective permissions.
 * 
 * Implements strict Least-Privileged Precedence: the lowest privilege level
 * assigned to a user overrides all others. Permissions only stack if roles are at
 * the same (lowest) privilege level.
 */


// Define the threshold where a role is considered "Unprivileged" (e.g., Student).
// Any level <= this number is considered "Privileged" (e.g., Admin, Professor).
const UNPRIVILEGED_THRESHOLD = 1; 

/**
 * Resolves the user's effective permissions based on their roles.
 * @param {Array<object>} roles - List of role objects, each containing { name, privilege_level, permissions }
 * @returns {object} { effectiveRoleName: string, permissions: Set<string> }
 */
function resolveUserPermissions(roles) {
    if (!roles || roles.length === 0) {
        return { effectiveRoleName: 'Guest', permissions: new Set() };
    }

    // 1. Find the absolute lowest privilege level among all assigned roles.
    const lowestLevel = roles.reduce((minLevel, role) => {
        return Math.min(minLevel, role.privilege_level);
    }, Infinity);

    // 2. Filter for roles that ONLY match the lowest level.
    // This implements the override: all roles with a higher level are ignored.
    const effectiveRoles = roles.filter(r => r.privilege_level === lowestLevel);

    // 3. Stack permissions from all effective roles (which are guaranteed to be at the same lowest level).
    const allPermissions = new Set();
    let effectiveRoleNames = [];

    effectiveRoles.forEach(role => {
        effectiveRoleNames.push(role.name);
        if (role.permissions) {
            // The 'permissions' field is assumed to be an Array<string> of permission names.
            role.permissions.forEach(perm => allPermissions.add(perm.name));
        }
    });

    const effectiveRoleName = effectiveRoleNames.join(', ') || 'Guest';
    
    // Log the resulting logic for debugging
    console.log(`[PERM-RESOLVER] Resolved: Level ${lowestLevel}. Roles: ${effectiveRoleName}. Permissions Count: ${allPermissions.size}`);

    return {
        effectiveRoleName: effectiveRoleName,
        permissions: allPermissions
    };
}

module.exports = {
    resolveUserPermissions,
    UNPRIVILEGED_THRESHOLD
};