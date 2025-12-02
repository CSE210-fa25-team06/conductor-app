/**
 * @file role-assignment.js
 * @description Handles the role assignment settings page
 * This page is only accessible to users with ASSIGN_ROLES permission
 */

// Available roles in the system with their details
const SYSTEM_ROLES = [
    {
        id: 0,
        name: "Guest",
        privilege_level: 0,
        description: "Unauthenticated or unassigned user. Has no system permissions."
    },
    {
        id: 1,
        name: "Student",
        privilege_level: 1,
        description: "Base role for all students."
    },
    {
        id: 2,
        name: "Group Leader",
        privilege_level: 1,
        description: "Can manage their group's metadata, attendance, and team dynamics."
    },
    {
        id: 3,
        name: "Tutor",
        privilege_level: 10,
        description: "Can view specific student journals and manage the lab assistance queue."
    },
    {
        id: 4,
        name: "TA",
        privilege_level: 50,
        description: "Can manage and grade all student groups and submissions."
    },
    {
        id: 5,
        name: "Professor",
        privilege_level: 100,
        description: "Full administrative access and system configuration."
    }
];

// Store users data
let usersData = [];
let filteredUsers = [];

/**
 * Initialize the role assignment page
 */
async function initializeRoleAssignment() {
    try {
        // Check if user has permission to access this page
        await checkPermission();
        
        // Load users data
        await loadUsers();
        
        // Setup UI components
        setupRoleFilter();
        setupSearchBox();
        setupModal();
        
        // Render the users table
        renderUsersTable(usersData);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error initializing role assignment page:', error);
        
        if (error.message.includes('Permission Denied')) {
            showError('Access Denied: You do not have permission to access this page.');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        } else {
            showError('Failed to load user data. Please try again.');
        }
        
        hideLoading();
    }
}

// Auto-initialize when module is loaded
initializeRoleAssignment();

/**
 * Check if current user has ASSIGN_ROLES permission
 */
async function checkPermission() {
    const response = await fetch('/api/auth/session', {
        cache: 'no-store'
    });
    
    if (!response.ok) {
        throw new Error('Not authenticated');
    }
    
    const data = await response.json();
    
    if (!data.success || !data.user) {
        throw new Error('Not authenticated');
    }
    
    // Check if user has ASSIGN_ROLES permission
    const permissions = data.user.permissions || [];
    if (!permissions.includes('ASSIGN_ROLES')) {
        throw new Error('Permission Denied: ASSIGN_ROLES required');
    }
    
    return true;
}

/**
 * Load users from the backend
 */
async function loadUsers() {
    console.log('Fetching users data...');
    const response = await fetch('/users');
    console.log('Users fetch response:', response);
    
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    usersData = data.users || [];
    filteredUsers = [...usersData];
}

/**
 * Setup the role filter dropdown
 */
function setupRoleFilter() {
    const roleFilter = document.getElementById('role-filter');
    
    // Populate role options
    SYSTEM_ROLES.forEach(role => {
        const option = document.createElement('option');
        option.value = role.name;
        option.textContent = role.name;
        roleFilter.appendChild(option);
    });
    
    // Add change event listener
    roleFilter.addEventListener('change', () => {
        filterUsers();
    });
}

/**
 * Setup the search box
 */
function setupSearchBox() {
    const searchBox = document.getElementById('user-search');
    
    searchBox.addEventListener('input', () => {
        filterUsers();
    });
}

/**
 * Filter users based on search and role filter
 */
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    
    filteredUsers = usersData.filter(user => {
        // Search filter
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        
        // Role filter
        const matchesRole = !roleFilter || 
            (user.role_name && user.role_name === roleFilter);
        
        return matchesSearch && matchesRole;
    });
    
    renderUsersTable(filteredUsers);
}

/**
 * Render the users table
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="user-name">${escapeHtml(user.name)}</td>
            <td class="user-email">${escapeHtml(user.email)}</td>
            <td class="user-role">
                <span class="role-badge role-${getRoleClass(user.role_name)}">
                    ${escapeHtml(user.role_name || 'No Role')}
                </span>
            </td>
            <td class="user-group">${escapeHtml(user.group_name || 'No Group')}</td>
            <td class="user-actions">
                <button class="button button-small" data-user-id="${user.id}" onclick="openRoleModal(${user.id})">
                    Change Role
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Get CSS class for role badge
 */
function getRoleClass(roleName) {
    if (!roleName) return 'none';
    return roleName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Setup modal functionality
 */
function setupModal() {
    const modal = document.getElementById('role-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const assignBtn = document.getElementById('modal-assign');
    const roleSelect = document.getElementById('role-select');
    
    // Populate role select options
    SYSTEM_ROLES.forEach(role => {
        const option = document.createElement('option');
        option.value = role.name;
        option.textContent = role.name;
        option.dataset.description = role.description;
        roleSelect.appendChild(option);
    });
    
    // Show role description on select change
    roleSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const description = selectedOption.dataset.description || '';
        document.getElementById('role-description-text').textContent = description;
    });
    
    // Close modal handlers
    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click', () => closeModal());
    
    // Assign role handler
    assignBtn.addEventListener('click', () => assignRole());
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * Open the role assignment modal
 */
window.openRoleModal = function(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    const modal = document.getElementById('role-modal');
    const userNameEl = document.getElementById('modal-user-name');
    const roleSelect = document.getElementById('role-select');
    
    // Set user information
    userNameEl.textContent = user.name;
    modal.dataset.userId = userId;
    
    // Set current role as selected
    if (user.role_name) {
        roleSelect.value = user.role_name;
        // Trigger change event to show description
        roleSelect.dispatchEvent(new Event('change'));
    } else {
        roleSelect.value = 'Guest';
        roleSelect.dispatchEvent(new Event('change'));
    }
    
    // Show modal
    modal.classList.remove('hidden');
};

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('role-modal');
    modal.classList.add('hidden');
    modal.dataset.userId = '';
}

/**
 * Assign role (frontend only - not persisted to backend)
 */
async function assignRole() {
    const modal = document.getElementById('role-modal');
    const userId = parseInt(modal.dataset.userId);
    const roleSelect = document.getElementById('role-select');
    const newRole = roleSelect.value;
    
    if (!userId || !newRole) {
        alert('Invalid role selection');
        return;
    }

    try {
        const saveButton = document.getElementById('modal-assign');
        saveButton.disabled = true;
        const role = SYSTEM_ROLES.find(r => r.name === newRole);
        if (!role) {
            throw new Error('Selected role not found');
        }

        const response = await fetch(`/api/admin/users/${userId}/roles`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roleIds: [role.id]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update role');
        }

        // Find the user and update their role locally
        const user = usersData.find(u => u.id === userId);
        if (user) {
            const oldRole = user.role_name;
            user.role_name = newRole;
            
            // Update the display
            filterUsers();
            
            // Show success message
            showSuccessMessage(`Role updated: ${user.name} changed from "${oldRole || 'No Role'}" to "${newRole}"`);
        }
        
        closeModal();
    } catch (error) {
        console.error('Error updating role:', error);
        showError(error.message || 'Failed to update role. Please try again.');
    } finally {
        const saveButton = document.getElementById('modal-assign');
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    // Create a temporary success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.querySelector('.settings-container').prepend(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    loadingDiv.classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
