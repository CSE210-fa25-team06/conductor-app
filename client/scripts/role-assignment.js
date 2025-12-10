/**
 * @file role-assignment.js
 * @description Controller for the Admin Control Panel.
 * Synchronized with settings.html.
 */
/* global openDefaultsModal, openCreateGroupModal, openCreateRoleModal */

import API from './services/admin-api.js';
import { Notifications, escapeHtml } from './utils/ui-utils.js';
import { protectComponent, PERMISSIONS } from './utils/auth-guard.js'; 

let state = {
    roles: [],
    groups: [],
    users: [],
    permissions: [], 
    currentUserPermissions: []
};

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initializeRoleAssignment() {
    // 1. Target the WRAPPER, not the whole container.
    // This preserves the Header and Modals (which are outside this wrapper)
    const wrapper = document.getElementById('admin-content-wrapper');
    if (!wrapper) return console.error('Admin content wrapper not found');

    const initialHTML = wrapper.innerHTML;

    await protectComponent(
        wrapper, 
        PERMISSIONS.ASSIGN_ROLES, 
        async () => {
            wrapper.innerHTML = initialHTML;

            await loadData();
            
            setupRoleFilter();
            setupSearchBox();
            renderUsersTable(state.users);
            renderAdminButtons();
            
            bindModalEvents();
            setupDefaultsModal();

            const loader = document.getElementById('loading-indicator');
            if(loader) loader.classList.add('hidden');
        }
    );
}

async function loadData() {
    try {
        const session = await API.getSession();
        state.currentUserPermissions = session.user.permissions || [];

        const promises = [API.getRoles(), API.getUsers()];
        
        if (state.currentUserPermissions.includes(PERMISSIONS.ASSIGN_GROUPS) || 
            state.currentUserPermissions.includes(PERMISSIONS.CREATE_GROUPS)) {
            promises.push(API.getGroups());
        }

        const [rolesData, usersData, groupsData] = await Promise.all(promises);
        
        state.roles = rolesData.roles || [];
        state.users = usersData.users || [];
        state.groups = groupsData ? (groupsData.groups || []) : [];

    } catch (err) {
        console.error("Data Load Error", err);
        Notifications.error("Failed to load system data.");
    }
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function setupRoleFilter() {
    const filter = document.getElementById('role-filter');
    if (!filter) return;
    filter.innerHTML = '<option value="">All Roles</option>';
    state.roles.forEach(role => {
        filter.add(new Option(role.name, role.name));
    });
    filter.addEventListener('change', filterUsers);
}

function setupSearchBox() {
    const input = document.getElementById('user-search');
    if (input) input.addEventListener('input', filterUsers);
}

function filterUsers() {
    const term = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;

    const filtered = state.users.filter(user => {
        const matchesSearch = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
        const matchesRole = !roleFilter || (user.role_name && user.role_name.includes(roleFilter));
        return matchesSearch && matchesRole;
    });
    renderUsersTable(filtered);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No users found</td></tr>`;
        return;
    }

    const canAssignGroup = state.currentUserPermissions.includes(PERMISSIONS.ASSIGN_GROUPS);

    users.forEach(user => {
        const row = document.createElement('tr');
        
        const roleNames = user.role_name ? user.role_name.split(',').map(r => r.trim()) : [];
        const roleBadges = roleNames.length > 0 
            ? roleNames.map(r => `<span class="role-badge role-${r.toLowerCase().replace(/\s+/g, '-') || 'none'}">${escapeHtml(r)}</span>`).join(' ')
            : `<span class="role-badge role-none">No Role</span>`;

        let actions = `<button class="button button-small" style="background-color: #06c; color: white;" onclick="window.openRoleModal(${user.id})">Assign Role</button>`;
        if (canAssignGroup) {
            actions += `<button class="button button-small" style="margin-left: 0.2rem; background-color: #06c; color: white;" onclick="window.openGroupModal(${user.id})">Assign Group</button>`;
        }

        actions += `
            <button class="button button-small" 
                style="margin-left: 0.2rem; background-color: #d9534f; color: white;" 
                onclick="window.openRemoveUserModal(${user.id})">
                Remove User
            </button>`;

        row.innerHTML = `
            <td data-label="Name" class="user-name">${escapeHtml(user.name)}</td>
            <td data-label="Email" class="user-email">${escapeHtml(user.email)}</td>
            <td data-label="Current Role" class="user-role">${roleBadges}</td>
            <td data-label="Group" class="user-group">${escapeHtml(user.group_name || 'Unassigned')}</td>
            <td data-label="Actions" class="user-actions">${actions}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderAdminButtons() {
    const subtitle = document.querySelector('.settings-subtitle');
    if (!subtitle) return;
    subtitle.innerHTML = ''; 

    const createBtn = (text, id, handler, extraStyle = '') => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.textContent = text;
        btn.className = 'btn-admin-action'; 
        if (extraStyle) btn.style.cssText += extraStyle;
        btn.onclick = handler;
        return btn;
    };

    if (state.currentUserPermissions.includes(PERMISSIONS.CREATE_ROLES)) {
        subtitle.appendChild(createBtn('System Defaults', 'btn-sys-defaults', openDefaultsModal));
    }

    if (state.currentUserPermissions.includes(PERMISSIONS.MANAGE_PERMISSIONS)) {
        subtitle.appendChild(createBtn('Manage Role Permissions', 'btn-manage-permissions', openPermissionsModal));
    }

    if (state.currentUserPermissions.includes(PERMISSIONS.CREATE_GROUPS)) {
        subtitle.appendChild(createBtn('+ Create New Group', 'btn-create-group', openCreateGroupModal));
    }

    if (state.currentUserPermissions.includes(PERMISSIONS.CREATE_ROLES)) {
        subtitle.appendChild(createBtn('+ Create New Role', 'btn-create-role', openCreateRoleModal));
    }
}

// =============================================================================
// MODAL LOGIC
// =============================================================================

function bindModalEvents() {
    document.querySelectorAll('.modal-close, .button-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            if (targetId) toggleModal(targetId, false);
        });
    });

    const handlers = {
        'modal-assign': saveRoles,
        'group-save': saveGroup,
        'perm-save': savePermissions,
        'create-group-save': createNewGroup,
        'create-role-save': createNewRole,
        'remove-user-confirm': confirmRemoveUser
    };

    for (const [id, fn] of Object.entries(handlers)) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    }

    const permSelect = document.getElementById('perm-role-select');
    if(permSelect) permSelect.addEventListener('change', (e) => loadRolePermissions(e.target.value));
}

// --- 1. Assign Role ---
window.openRoleModal = function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('modal-user-name').textContent = user.name;
    document.getElementById('role-modal').dataset.userId = userId;
    
    const container = document.getElementById('role-checkbox-container');
    if(!container) return;
    container.innerHTML = '';
    const currentRoles = user.role_name ? user.role_name.split(',').map(r => r.trim()) : [];

    state.roles.forEach(role => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:8px;';
        div.innerHTML = `
            <input type="checkbox" id="chk-${role.id}" value="${role.id}" ${currentRoles.includes(role.name) ? 'checked' : ''}>
            <label for="chk-${role.id}" style="margin:0; font-weight:500; cursor:pointer;">${role.name}</label>
        `;
        container.appendChild(div);
    });
    toggleModal('role-modal', true);
}

async function saveRoles() {
    const modal = document.getElementById('role-modal');
    const userId = parseInt(modal.dataset.userId);
    const checked = modal.querySelectorAll('input:checked');
    const roleIds = Array.from(checked).map(cb => parseInt(cb.value));

    if (!userId || roleIds.length === 0) return alert('Select at least one role.');

    try {
        await API.updateUserRole(userId, roleIds);
        const user = state.users.find(u => u.id === userId);
        user.role_name = roleIds.map(id => state.roles.find(r => r.id === id).name).join(', ');
        filterUsers();
        Notifications.success(`Roles updated for ${user.name}`);
        toggleModal('role-modal', false);
    } catch (err) { Notifications.error(err.message); }
}

// --- 2. Assign Group ---
window.openGroupModal = function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('group-user-name').textContent = user.name;
    document.getElementById('group-modal').dataset.userId = userId;
    
    const select = document.getElementById('group-select');
    select.innerHTML = ''; 
    
    if (state.groups.length === 0) {
        select.add(new Option("No groups available", "", true, true));
        select.disabled = true;
    } else {
        select.disabled = false;
        state.groups.forEach(g => select.add(new Option(g.name, g.id)));
        
        if (user.group_id) select.value = user.group_id;
        else if (user.group_name && user.group_name !== 'Unassigned') {
            const g = state.groups.find(x => x.name === user.group_name);
            select.value = g ? g.id : state.groups[0].id;
        } else {
            select.value = state.groups[0].id;
        }
    }
    toggleModal('group-modal', true);
}

async function saveGroup() {
    const modal = document.getElementById('group-modal');
    const userId = parseInt(modal.dataset.userId);
    const select = document.getElementById('group-select');
    const groupId = parseInt(select.value);

    try {
        await API.updateUserGroup(userId, groupId);
        const user = state.users.find(u => u.id === userId);
        const grp = state.groups.find(g => g.id === groupId);
        user.group_id = groupId;
        user.group_name = grp ? grp.name : 'Unassigned';
        filterUsers();
        Notifications.success(`Group updated for ${user.name}`);
        toggleModal('group-modal', false);
    } catch (err) { Notifications.error(err.message); }
}

// --- 3. Manage Permissions ---
async function openPermissionsModal() {
    const select = document.getElementById('perm-role-select');
    // Clear selections and inputs on open
    select.innerHTML = '<option value="" disabled selected>-- Choose a Role --</option>';
    document.getElementById('perm-role-level').value = ''; // RESET LEVEL INPUT

    state.roles.forEach(r => select.add(new Option(r.name, r.id)));

    if (state.permissions.length === 0) {
        const data = await API.getAllPermissions();
        state.permissions = data.permissions || [];
    }

    const tbody = document.getElementById('perm-table-body');
    tbody.innerHTML = '';
    state.permissions.forEach(perm => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #eee';
        row.innerHTML = `
            <td style="text-align:center;"><input type="checkbox" class="perm-checkbox" value="${perm.name}" disabled></td>
            <td style="font-family:monospace; font-weight:bold;">${perm.name}</td>
            <td style="color:#666;">${perm.description || ''}</td>
        `;
        row.addEventListener('click', e => {
            if(e.target.type !== 'checkbox') {
                const cb = row.querySelector('input');
                if(!cb.disabled) cb.checked = !cb.checked;
            }
        });
        tbody.appendChild(row);
    });

    toggleModal('permissions-modal', true);
}

async function loadRolePermissions(roleId) {
    const inputs = document.querySelectorAll('.perm-checkbox');
    const levelInput = document.getElementById('perm-role-level');
    const btn = document.getElementById('perm-save');
    
    btn.disabled = true;
    
    // Pre-fill level from local state
    const role = state.roles.find(r => r.id == roleId);
    if(role) levelInput.value = role.privilege_level;

    try {
        const data = await API.getRolePermissions(roleId);
        const active = new Set(data.permissionNames || []);
        
        inputs.forEach(i => {
            i.checked = active.has(i.value);
            i.disabled = false;
        });
        btn.disabled = false;
    } catch(err) { 
        console.error(err)
        Notifications.error("Failed to fetch permissions"); 
    }
}

async function savePermissions() {
    const roleId = document.getElementById('perm-role-select').value;
    const levelVal = document.getElementById('perm-role-level').value;
    const checked = Array.from(document.querySelectorAll('.perm-checkbox:checked')).map(cb => cb.value);
    
    if (levelVal === '' || levelVal < 0 || levelVal > 100) {
        return Notifications.error("Privilege level must be 0-100.");
    }

    try {
        await API.updateRolePermissions(roleId, checked, parseInt(levelVal));
        Notifications.success('Role configuration saved.');
        await loadData();
        toggleModal('permissions-modal', false);
    } catch (err) { Notifications.error(err.message); }
}

// --- 4. Create Group ---
window.openCreateGroupModal = function() {
    document.getElementById('new-group-name').value = '';
    toggleModal('create-group-modal', true);
    setTimeout(() => document.getElementById('new-group-name').focus(), 100);
}

async function createNewGroup() {
    const name = document.getElementById('new-group-name').value.trim();
    if(!name) return Notifications.error('Name required');
    try {
        await API.createGroup(name);
        Notifications.success(`Group "${name}" created.`);
        const data = await API.getGroups();
        state.groups = data.groups || [];
        toggleModal('create-group-modal', false);
    } catch(err) { Notifications.error(err.message); }
}

// --- 5. Create Role ---
window.openCreateRoleModal = function() {
    document.getElementById('new-role-name').value = '';
    document.getElementById('new-role-desc').value = ''; // Reset description
    document.getElementById('new-role-level').value = '';
    toggleModal('create-role-modal', true);
    setTimeout(() => document.getElementById('new-role-name').focus(), 100);
}

async function createNewRole() {
    const name = document.getElementById('new-role-name').value.trim();
    const desc = document.getElementById('new-role-desc').value.trim(); // Get Value
    const level = document.getElementById('new-role-level').value;

    if (!name) return Notifications.error('Role name required');
    if (level === '' || level < 0 || level > 100) return Notifications.error('Level must be 0-100');

    try {
        // Pass desc to API
        await API.createRole(name, level, desc);
        Notifications.success(`Role "${name}" created.`);
        const data = await API.getRoles();
        state.roles = data.roles || [];
        setupRoleFilter();
        toggleModal('create-role-modal', false);
    } catch(err) { Notifications.error(err.message); }
}

// --- 6. System Defaults ---
function setupDefaultsModal() {
    const btn = document.getElementById('save-defaults-btn');
    if (btn) btn.onclick = saveSystemDefaults;
}

window.openDefaultsModal = function() {
    const roleSelect = document.getElementById('default-role-select');
    const groupSelect = document.getElementById('default-group-select');
    
    roleSelect.innerHTML = '';
    state.roles.forEach(role => {
        const opt = document.createElement('option');
        opt.value = role.id;
        opt.textContent = role.name;
        if (role.is_default) opt.selected = true; 
        roleSelect.appendChild(opt);
    });

    groupSelect.innerHTML = '';
    if (state.groups.length > 0) {
        state.groups.forEach(group => {
            const opt = document.createElement('option');
            opt.value = group.id;
            opt.textContent = group.name;
            groupSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.text = "No groups available";
        opt.disabled = true;
        groupSelect.appendChild(opt);
    }

    toggleModal('defaults-modal', true);
}

async function saveSystemDefaults() {
    const roleId = document.getElementById('default-role-select').value;
    const groupVal = document.getElementById('default-group-select').value;
    const groupId = groupVal ? parseInt(groupVal) : null;
    const btn = document.getElementById('save-defaults-btn');

    try {
        btn.disabled = true;
        btn.textContent = "Saving...";
        await API.setSystemDefaults(roleId, groupId);
        Notifications.success("System defaults updated.");
        await loadData();
        toggleModal('defaults-modal', false);
    } catch (err) {
        Notifications.error(err.message || "Failed to save defaults.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Defaults";
    }
}

// Remove Users Functionality
window.openRemoveUserModal = function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    // Put user's name inside modal
    document.getElementById('remove-user-name').textContent = user.name;

    // Store userId in modal dataset
    const modal = document.getElementById('remove-user-modal');
    modal.dataset.userId = userId;

    toggleModal('remove-user-modal', true);
};

// Remove User Functionality
async function confirmRemoveUser() {
    const modal = document.getElementById('remove-user-modal');
    const userId = parseInt(modal.dataset.userId);
    // Find the user object so we can show their name
    const user = state.users.find(u => u.id === userId);
    try {
        await API.deleteUser(userId);
        // Remove user from local state
        state.users = state.users.filter(u => u.id !== userId);
        // Refresh table
        filterUsers();
        // Success notification
        Notifications.success(`Successfully removed ${user?.name || 'user'}.`);
    } catch (err) {
        Notifications.error(err.message || 'Failed to remove user.');
    }
    toggleModal('remove-user-modal', false);
}


// --- Helpers ---
function toggleModal(id, show) {
    const el = document.getElementById(id);
    if(el) {
        if(show) { el.classList.remove('hidden'); el.classList.add('active'); }
        else { el.classList.add('hidden'); el.classList.remove('active'); }
    }
}
window.closeModal = (id) => toggleModal(id, false);