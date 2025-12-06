/**
 * @file js/services/admin-api.js
 * @description Centralized service for all Admin Control Panel API calls.
 */

const API = {
    async fetch(url, options = {}) {
        const response = await fetch(url, options);
        
        // 1. Check if response is OK before parsing
        // If it's a 404 or 500, it might be HTML, so we handle it carefully.
        if (!response.ok) {
            // Try to parse error as JSON, fallback to text/status if that fails
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                // If parsing fails, it's likely HTML. We stick to the status text.
                console.err(e)
                console.warn("Non-JSON response received:", response.status);
            }
            throw new Error(errorMessage);
        }

        // 2. Parse successful response
        try {
            return await response.json();
        } catch (err) {
            console.error(err)
            throw new Error("Received invalid JSON from server.");
        }
    },

    // Session & User Data
    async getSession() { return this.fetch('/api/auth/session', { cache: 'no-store' }); },
    async getUsers() { return this.fetch('/users'); },
    
    // Roles & Permissions
    async getRoles() { return this.fetch('/api/admin/roles'); },
    async getAllPermissions() { return this.fetch('/api/admin/permissions'); },
    async getRolePermissions(roleId) { return this.fetch(`/api/admin/roles/${roleId}/permissions`); },
    
    // Groups
    async getGroups() { return this.fetch('/api/admin/groups'); },

    // Write Operations
    async updateUserRole(userId, roleIds) {
        return this.fetch(`/api/admin/users/${userId}/roles`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleIds })
        });
    },

    async updateUserGroup(userId, groupId) {
        return this.fetch(`/api/admin/users/${userId}/group`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId })
        });
    },

    async updateRolePermissions(roleId, permissionNames, privilegeLevel) {
        return this.fetch(`/api/admin/roles/${roleId}/permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                permissionNames, 
                privilegeLevel
            })
        });
    },

    async createGroup(name) {
        return this.fetch('/api/admin/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
    },

    async createRole(name, privilegeLevel, description) {
        return this.fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                privilege_level: parseInt(privilegeLevel),
                description // Send to backend
            })
        });
    },

    // NEW: System Defaults
    async setSystemDefaults(roleId, groupId) {
        return this.fetch('/api/admin/defaults', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                default_role_id: parseInt(roleId),
                default_group_id: groupId === "null" ? null : parseInt(groupId)
            })
        });
    }
};

export default API;