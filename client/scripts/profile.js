export function renderProfilePage(contentElement) {
    fetch('/api/auth/session', { cache: 'no-store' })
        .then(res => res.json())
        .then(sessionData => {
            if (!sessionData.user) return;

            const sessionUser = sessionData.user;
            const currentUserId = sessionUser.id;
            
            fetch('/users')
                .then(res => res.json())
                .then(directoryData => {
                    const directoryUser = directoryData.users?.find(user => user.id === currentUserId);
                    
                    const role = sessionUser.effectiveRoleName || "No role assigned";
                    const photoUrl = sessionUser.photo_url || directoryUser?.photo_url || 'No image available';
                    const contactInfo = sessionUser.contact_info || directoryUser?.contact_info || 'Not provided';
                    const availability = sessionUser.availability || directoryUser?.availability;
                    const formattedAvailability = availability ? formatAvailability(availability) : 'Not set';
                    const groupName = sessionUser.groupName || directoryUser?.group_name || 'No group assigned';

                    renderProfileContent(contentElement, sessionUser, role, photoUrl, contactInfo, formattedAvailability, groupName);
                })
                .catch(error => {
                    console.error('Error loading directory data:', error);
                    const role = sessionUser.effectiveRoleName || "No role assigned";
                    const photoUrl = sessionUser.photo_url || 'No image available';
                    const contactInfo = sessionUser.contact_info || 'Not provided';
                    const formattedAvailability = sessionUser.availability ? formatAvailability(sessionUser.availability) : 'Not set';
                    const groupName = sessionUser.groupName || 'No group assigned';
                    
                    renderProfileContent(contentElement, sessionUser, role, photoUrl, contactInfo, formattedAvailability, groupName);
                });
        })
        .catch(error => {
            console.error('Error loading session data:', error);
            contentElement.innerHTML = '<p>Error loading profile data. Please try again.</p>';
        });
}

function renderProfileContent(contentElement, user, role, photoUrl, contactInfo, availability, groupName) {
    contentElement.innerHTML = `
        <h2 class="profile-title">Profile</h2>

        <section class="profile-wrapper">
            <section class="profile-photo-section">
                <img src="${photoUrl}" alt="Profile Photo" class="profile-photo">
            </section>

            <section class="profile-info">
                <div class="profile-header">
                    <h2>${user.name}</h2>
                </div>
                
                <div class="profile-details">
                    <div class="detail-group">
                        <h3>Account Information</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Role:</strong> ${role}</p>
                        <p><strong>Group:</strong> ${groupName}</p>
                        <p><strong>User ID:</strong> ${user.id}</p>
                    </div>

                    <div class="detail-group">
                        <h3>Contact Information</h3>
                        <p><strong>Contact:</strong> ${contactInfo}</p>
                        <p><strong>Availability:</strong> ${availability}</p>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="permissions-btn" id="view-permissions-btn">View Permissions</button>
                </div>
            </section>
        </section>
    `;

    document.getElementById('view-permissions-btn').addEventListener('click', () => {
        renderPermissionsTable(contentElement, user, role);
    });
}

function formatAvailability(availability) {
    if (!availability) return 'Not set';
    try {
        const obj = typeof availability === 'string' ? JSON.parse(availability) : availability;
        return Object.entries(obj)
            .map(([day, time]) => `${day}: ${time}`)
            .join(', ');
    } catch {
        return availability;
    }
}

function renderPermissionsTable(contentElement, user, userRole) {
    fetch('/api/auth/session', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load user session');
            return res.json();
        })
        .then(sessionData => {
            const userData = sessionData.user;
            
            const allPermissions = new Set();
            
            userData.permissions?.forEach(perm => allPermissions.add(perm));
            
            userData.roles?.forEach(role => {
                role.permissions?.forEach(perm => allPermissions.add(perm.name));
            });

            const sortedPermissions = Array.from(allPermissions).sort();
            
            contentElement.innerHTML = `
                <h2 class="profile-title">Permissions</h2>
                
                <section class="permissions-section">
                    <section class="permissions-header">
                        <div class="permissions-header-content">
                            <h3>Your role - ${userRole}</h3>
                            <p class="permissions-count">You have ${userData.permissions?.length || 0} active permissions</p>
                        </div>
                        <button class="back-to-profile-btn" id="back-to-profile">← Back to Profile</button>
                    </section>
                    
                    <table class="permissions-table">
                        <thead>
                            <tr>
                                <th>Permission</th>
                                <th>Access</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedPermissions.map(permission => `
                                <tr>
                                    <td class="permission-name">${permission}</td>
                                    <td class="permission-access">
                                        <span class="access-badge ${userData.permissions?.includes(permission) ? 'has-access' : 'no-access'}">
                                            ${userData.permissions?.includes(permission) ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>
            `;

            document.getElementById('back-to-profile').addEventListener('click', () => {
                renderProfilePage(contentElement);
            });

        }).catch(error => {
            console.error('Error loading permissions:', error);
            contentElement.innerHTML = `
                <p>Error loading permissions data: ${error.message}</p>
                <p>Check browser console for details.</p>
                <button class="back-to-profile-btn" onclick="renderProfilePage(this.parentElement)">← Back to Profile</button>
            `;
        });
}