/**
 * @file profile.js
 * @description Renders the user profile page with enriched metadata.
 */

export function renderProfilePage(contentElement) {
    fetch('/api/auth/session', { cache: 'no-store' })
        .then(res => res.json())
        .then(sessionData => {
            if (!sessionData.user) return;
            const user = sessionData.user;
            
            // Format Data
            const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const lastActive = user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : 'Never';
            const lastJournal = user.last_journal_date ? new Date(user.last_journal_date).toLocaleDateString() : 'No submissions';
            
            const rawDesc = user.roles && user.roles.length > 0 ? user.roles[0].description : null;
            const roleDesc = rawDesc || 'No description available.';

            let providerLabel = 'Local';
            if (user.provider) {
                providerLabel = user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
            }

            renderProfileContent(contentElement, user, joinedDate, lastActive, lastJournal, roleDesc, providerLabel);
        })
        .catch(error => {
            console.error('Error loading session data:', error);
            contentElement.innerHTML = '<p>Error loading profile data. Please try again.</p>';
        });
}

function renderProfileContent(contentElement, user, joinedDate, lastActive, lastJournal, roleDesc, providerLabel) {
    const formattedAvailability = formatAvailability(user.availability);
    
const repoBtn = user.repo_link ? `<a href="${user.repo_link}" target="_blank" class="resource-btn repo">GitHub Repo</a>` : '';
    const slackBtn = user.slack_link ? `<a href="${user.slack_link}" target="_blank" class="resource-btn slack">Slack Channel</a>` : '';
    
    const resourcesSection = (repoBtn || slackBtn) ? `
        <div class="detail-group">
            <h3>Team Resources</h3>
            <div class="resources-wrapper">
                ${repoBtn}
                ${slackBtn}
            </div>
        </div>
    ` : '';

    let photoSrc = user.photo_url || 'https://via.placeholder.com/250';
    if (photoSrc.includes('googleusercontent.com')) {
        photoSrc = photoSrc.replace(/=s\d+(-c)?/i, '=s400-c');
    }

    contentElement.innerHTML = `
        <h2 class="profile-title">Profile</h2>

        <section class="profile-wrapper">
            <section class="profile-photo-section">
<<<<<<< HEAD
                <img src="${user.photo_url || '/assets/images/avatar.png'}" alt="Profile Photo" class="profile-photo">
=======
                <img 
                    src="${photoSrc}" 
                    alt="Profile Photo" 
                    class="profile-photo"
                    referrerpolicy="no-referrer"
                    onerror="this.onerror=null; this.src='https://via.placeholder.com/250';"
                >
>>>>>>> 40c4ffa (feat(profile): Profile page now displays Google profile picture)
                <div class="profile-meta-badges">
                    <span class="meta-badge">${providerLabel} Account</span>
                    <span class="meta-badge">Joined ${joinedDate}</span>
                </div>
            </section>

            <section class="profile-info">
                <div class="profile-header">
                    <h2>${user.name}</h2>
                    <div class="role-container">
                        <span class="current-role">${user.effectiveRoleName}</span>
                        <span class="role-desc">${roleDesc}</span>
                    </div>
                </div>
                
                <div class="profile-details">
                    <div class="detail-group">
                        <h3>Contact & Availability</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Contact:</strong> ${user.contact_info || 'Not provided'}</p>
                        <p><strong>Availability:</strong> ${formattedAvailability}</p>
                    </div>

                    <div class="detail-group">
                        <h3>Group Assignment</h3>
                        <div class="group-info">
                            <span class="group-name">${user.groupName}</span>
                        </div>
                        ${resourcesSection}
                    </div>

                    <div class="detail-group">
                        <h3>Activity Stats</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Last Active</span>
                                <span class="stat-value">${lastActive}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Last Journal</span>
                                <span class="stat-value">${lastJournal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    `;
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