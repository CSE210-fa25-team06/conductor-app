/**
 * @file js/services/admin-api.js
 * @description Centralized service for all Admin Control Panel API calls.
 */

const API = {
    async fetch(url, options = {}) {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                console.warn("Non-JSON response received:", response.status);
                console.log(e);
            }
            throw new Error(errorMessage);
        }

        try {
            return await response.json();
        } catch (err) {
            console.log(err);
            throw new Error("Received invalid JSON from server.");
        }
    },

    // Session & User Data
    async getSession() { return this.fetch('/api/auth/session', { cache: 'no-store' }); },
    
    // UPDATED: Now accepts query and role for server-side filtering
    async getUsers(query = '', role = '') { 
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (role) params.append('role', role);
        
        const queryString = params.toString();
        const url = queryString ? `/users?${queryString}` : '/users';
        
        return this.fetch(url); 
    },

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
            body: JSON.stringify({ permissionNames, privilegeLevel })
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
                description 
            })
        });
    },

    async setSystemDefaults(roleId, groupId) {
        return this.fetch('/api/admin/defaults', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                default_role_id: parseInt(roleId),
                default_group_id: groupId === "null" ? null : parseInt(groupId)
            })
        });
    },

    // Send parsed CSV data to backend
    async bulkImportUsers(userArray) {
        return this.fetch('/api/admin/users/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: userArray })
        });
    },

    async deleteUser(userId) {
        return this.fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }
};

export default API;