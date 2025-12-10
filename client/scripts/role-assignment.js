/**
 * @file role-assignment.js
 * @description Controller for the Admin Control Panel.
 */

import API from './services/admin-api.js';
import { Notifications, escapeHtml } from './utils/ui-utils.js';
import { protectComponent, PERMISSIONS } from './utils/auth-guard.js'; 

let state = {
    roles: [],
    groups: [],
    users: [],
    permissions: [], 
    currentUserPermissions: [],
    currentUserId: null
};

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initializeRoleAssignment() {
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

            // Bind Help Button
            const helpBtn = document.getElementById('btn-admin-help');
            if (helpBtn) {
                helpBtn.onclick = () => toggleModal('help-modal', true);
            }

            const loader = document.getElementById('loading-indicator');
            if(loader) loader.classList.add('hidden');
        }
    );
}

async function loadData() {
    try {
        const session = await API.getSession();
        state.currentUserPermissions = session.user.permissions || [];
        state.currentUserId = session.user.id;

        const promises = [API.getRoles(), API.getUsers('', '')];
        
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
// SEARCH & FILTERING
// =============================================================================

function setupRoleFilter() {
    const filter = document.getElementById('role-filter');
    if (!filter) return;
    filter.innerHTML = '<option value="">All Roles</option>';
    state.roles.forEach(role => {
        filter.add(new Option(role.name, role.name));
    });
    filter.addEventListener('change', performSearch);
}

function setupSearchBox() {
    const input = document.getElementById('user-search');
    if (input) {
        input.addEventListener('input', debounce(performSearch, 100));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
}

async function performSearch() {
    const query = document.getElementById('user-search').value.trim();
    const role = document.getElementById('role-filter').value;
    
    try {
        const data = await API.getUsers(query, role);
        state.users = data.users || [];
        renderUsersTable(state.users);
    } catch (err) {
        console.error('Search failed:', err);
        Notifications.error('Failed to search users.');
    }
}

// =============================================================================
// RENDERING
// =============================================================================

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No users found</td></tr>`;
        return;
    }

    const canAssignGroup = state.currentUserPermissions.includes(PERMISSIONS.ASSIGN_GROUPS);
    const canDeleteUsers = state.currentUserPermissions.includes(PERMISSIONS.PROVISION_USERS);

    users.forEach(user => {
        const row = document.createElement('tr');
        
        let roleNames = [];
        if (Array.isArray(user.roles)) {
            roleNames = user.roles;
        } else if (user.role_name) {
            roleNames = user.role_name.split(',').map(r => r.trim());
        }

        const roleBadges = roleNames.length > 0 
            ? roleNames.map(r => `<span class="role-badge role-${r.toLowerCase().replace(/\s+/g, '-') || 'none'}">${escapeHtml(r)}</span>`).join(' ')
            : `<span class="role-badge role-none">No Role</span>`;

        let actions = `
            <button class="button button-small" style="background-color: #06c; color: white;" onclick="window.openRoleModal(${user.id})">
                Assign Role
            </button>`;
        
        if (canAssignGroup) {
            actions += `
                <button class="button button-small" style="margin-left: 5px; background-color: #06c; color: white;" onclick="window.openGroupModal(${user.id})">
                    Assign Group
                </button>`;
        }

        if (canDeleteUsers) {
            const isSelf = user.id === state.currentUserId;
            
            if (isSelf) {
                actions += `
                    <button class="button button-small button-danger" disabled style="margin-left: 5px; opacity: 0.5; cursor: not-allowed;" title="You cannot delete yourself">
                        Delete
                    </button>`;
            } else {
                actions += `
                    <button class="button button-small button-danger" style="margin-left: 5px;"
                        onclick="window.openRemoveUserModal(${user.id}, '${escapeHtml(user.name)}')">
                        Delete
                    </button>`;
            }
        }

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

    // 1. Bulk Import (Now works because openImportModal is hoisted)
    if (state.currentUserPermissions.includes(PERMISSIONS.PROVISION_USERS)) {
        subtitle.appendChild(createBtn('Import Users', 'btn-import-csv', openImportModal, 'margin-right: 5px; background-color: #28a745;'));
    }

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
    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            if (targetId) toggleModal(targetId, false);
        });
    });

    // We manually bind these specific IDs for saving
    const handlers = {
        'modal-assign': saveRoles,
        'group-save': saveGroup,
        'perm-save': savePermissions,
        'create-group-save': createNewGroup,
        'create-role-save': createNewRole,
        'btn-process-import': processImport
    };

    for (const [id, fn] of Object.entries(handlers)) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    }

    const permSelect = document.getElementById('perm-role-select');
    if(permSelect) permSelect.addEventListener('change', (e) => loadRolePermissions(e.target.value));
}

// --- 1. Assign Role ---
// Exposed to window for HTML onclick
window.openRoleModal = function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('modal-user-name').textContent = user.name;
    document.getElementById('role-modal').dataset.userId = userId;
    
    const container = document.getElementById('role-checkbox-container');
    if(!container) return;
    container.innerHTML = '';
    
    let currentRoles = [];
    if (Array.isArray(user.roles)) currentRoles = user.roles;
    else if (user.role_name) currentRoles = user.role_name.split(',').map(r => r.trim());

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
        await performSearch(); 
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
        await performSearch();
        Notifications.success(`Group updated for ${user.name}`);
        toggleModal('group-modal', false);
    } catch (err) { Notifications.error(err.message); }
}

// --- 3. Permissions ---
// Changed to function declaration for hoisting
async function openPermissionsModal() {
    const select = document.getElementById('perm-role-select');
    select.innerHTML = '<option value="" disabled selected>-- Choose a Role --</option>';
    document.getElementById('perm-role-level').value = '';

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
    } catch(err) { Notifications.error(err.message || "Failed to fetch permissions"); }
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
function openCreateGroupModal() {
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
function openCreateRoleModal() {
    document.getElementById('new-role-name').value = '';
    document.getElementById('new-role-desc').value = ''; 
    document.getElementById('new-role-level').value = '';
    toggleModal('create-role-modal', true);
    setTimeout(() => document.getElementById('new-role-name').focus(), 100);
}

async function createNewRole() {
    const name = document.getElementById('new-role-name').value.trim();
    const desc = document.getElementById('new-role-desc').value.trim();
    const level = document.getElementById('new-role-level').value;

    if (!name) return Notifications.error('Role name required');
    if (level === '' || level < 0 || level > 100) return Notifications.error('Level must be 0-100');

    try {
        await API.createRole(name, level, desc);
        Notifications.success(`Role "${name}" created.`);
        const data = await API.getRoles();
        state.roles = data.roles || [];
        setupRoleFilter();
        toggleModal('create-role-modal', false);
    } catch(err) { Notifications.error(err.message); }
}

// --- 6. Defaults ---
function setupDefaultsModal() {
    const btn = document.getElementById('save-defaults-btn');
    if (btn) btn.onclick = saveSystemDefaults;
}

function openDefaultsModal() {
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

    const selectedRole = state.roles.find(r => r.id == roleId);
    if (selectedRole && selectedRole.privilege_level > 1) {
        return Notifications.error(`Role "${selectedRole.name}" is too privileged to be default.`);
    }

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

// --- 7. Bulk Import (Standard function, Hoisted) ---
function openImportModal() {
    document.getElementById('csv-file-input').value = '';
    toggleModal('import-modal', true);
}

async function processImport() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];

    if (!file) return Notifications.error("Please select a CSV file.");

    const btn = document.getElementById('btn-process-import');
    btn.disabled = true;
    btn.textContent = "Processing...";

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const text = e.target.result;
        try {
            const users = parseCSV(text);
            
            if (users.length === 0) throw new Error("CSV appears empty or invalid format.");

            const response = await API.bulkImportUsers(users);
            
            Notifications.success(response.message);
            if (response.summary.failed > 0) {
                console.warn("Import Warnings:", response.summary.errors);
                alert(`Import complete with warnings.\nSuccess: ${response.summary.success}\nFailed: ${response.summary.failed}\nCheck console for details.`);
            }

            await performSearch(); // Refresh table
            toggleModal('import-modal', false);

        } catch (err) {
            console.error("Import Error:", err);
            Notifications.error(err.message || "Failed to process import.");
        } finally {
            btn.disabled = false;
            btn.textContent = "Upload & Process";
        }
    };

    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const required = ['email', 'name'];
    
    if (!required.every(r => headers.includes(r))) {
        throw new Error("CSV missing required columns: email, name");
    }

    const users = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue; 

        const userObj = {};
        headers.forEach((header, index) => {
            userObj[header] = values[index] ? values[index].trim() : '';
        });
        users.push(userObj);
    }
    return users;
}

// --- 8. Delete User ---
window.deleteUser = async function(userId) {
    try {
        await API.deleteUser(userId);
        await performSearch(); 
    } catch (err) {
        Notifications.error(err.message || 'Failed to delete user.');
    }
};

// --- Helpers ---
function toggleModal(id, show) {
    const el = document.getElementById(id);
    if(el) {
        if(show) { el.classList.remove('hidden'); el.classList.add('active'); }
        else { el.classList.add('hidden'); el.classList.remove('active'); }
    }
}
window.closeModal = (id) => toggleModal(id, false);

window.openRemoveUserModal = function (userId, userName) {
    const modal = document.getElementById("remove-user-modal");
    const nameField = document.getElementById("remove-user-name");
    const confirmBtn = document.getElementById("remove-user-confirm");

    nameField.textContent = userName;

    // Clicking confirm should call deleteUser
    confirmBtn.onclick = () => window.confirmRemoveUser(userId, userName);

    modal.classList.remove("hidden");
    modal.classList.add("active");
};

window.confirmRemoveUser = async function (userId, userName) {
    const modal = document.getElementById("remove-user-modal");

    try {
        await window.deleteUser(userId);
        Notifications.success(`User ${userName} deleted successfully.`);
    } catch (err) {
        Notifications.error("Failed to remove user.");
    }

    modal.classList.add("hidden");
    modal.classList.remove("active");
};


function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}