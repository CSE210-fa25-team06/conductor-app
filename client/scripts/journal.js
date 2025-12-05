import { PERMISSIONS, protectComponent } from './utils/auth-guard.js';

// --- HELPERS ---

async function getUserSession() {
    try {
        const res = await fetch('/api/auth/session');
        return await res.json();
    } catch (err) {
        console.error("Journal: Session fetch failed", err);
        return { success: false };
    }
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// FIX: Added missing escapeHtml helper
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- RENDERING ---

// FIX: Added 'user' parameter so we can check permissions
function createJournalEntryHTML(entry, user) {
    // FIX: Defined variables that were missing
    const authorName = entry.author_name || "Unknown User";
    const groupName = entry.group_name || "Unassigned";
    const roleName = entry.author_roles || "Member";

    const blockersHTML = entry.blockers 
    ? `<div class="journal-blockers"><div class="journal-label">Blockers</div><div class="journal-text">${escapeHtml(entry.blockers)}</div></div>`
    : `<div class="journal-section"><div class="journal-label">Blockers</div><div class="journal-text no-blockers">No blockers reported</div></div>`;

    const timestamp = entry.timestamp || entry.created_at || new Date().toISOString();
    
    // Authorization Check
    const isOwner = user && user.id === entry.user_id;
    const canEditAll = user && user.permissions && user.permissions.includes(PERMISSIONS.EDIT_ALL_JOURNALS);
    const canModify = isOwner || canEditAll;

    const actionsHTML = canModify 
        ? `<div class="journal-actions">
                <button type="button" class="journal-edit-btn" data-journal-id="${entry.id}">Edit</button>
                <button type="button" class="journal-delete-btn" data-journal-id="${entry.id}">Delete</button>
           </div>` : ``;

    return `
        <div class="journal-entry" data-journal-id="${entry.id}">
        <div class="journal-header">
            <div class="journal-meta">
                <span class="author-name">${escapeHtml(authorName)}</span>
                <span class="meta-separator">•</span>
                <span class="author-role">${escapeHtml(roleName)}</span>
                <span class="meta-separator">•</span>
                <span class="author-group">${escapeHtml(groupName)}</span>
                <div class="journal-timestamp-small">${formatTimestamp(timestamp)}</div>
            </div>
            ${actionsHTML}
        </div>
        <div class="journal-content">
            <div class="journal-section">
                <div class="journal-label">What I Did Since Last Meeting</div>
                <div class="journal-text">${escapeHtml(entry.whatIDid || entry.did || "")}</div>
            </div>
            <div class="journal-section">
                <div class="journal-label">What I Will Do Next</div>
                <div class="journal-text">${escapeHtml(entry.whatIWillDo || entry.doing_next || "")}</div>
            </div>
            ${blockersHTML}
        </div>
        </div>
    `;
}

// --- DATA LOADING ---

// FIX: Added 'currentUser' parameter
async function loadJournals(currentUser) {
    const journalList = document.getElementById('journal-list');
    
    try {
        const res = await fetch("/journals");
        
        if (res.status === 403 || res.status === 401) {
            throw new Error("You are not authorized to view these journals.");
        }

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch journals");

        const journals = data.data || [];

        if (journals.length === 0) {
            journalList.innerHTML = `
                <div class="empty-state">
                    <h3>No Journal Entries Yet</h3>
                    <p>Be the first to submit a stand-up update!</p>
                </div>
            `;
            return;
        }
    
        journals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        journalList.innerHTML = journals
            // FIX: Passed currentUser to the HTML generator
            .map(entry => createJournalEntryHTML(entry, currentUser))
            .join("");
        
        attachEditHandlers(journals, currentUser);
        attachDeleteHandlers(); 
    } catch (error) {
        console.error('Error loading journals:', error);
        journalList.innerHTML = `
            <div class="error">
            <strong>Error loading journal entries</strong><br>
            ${error.message}
            </div>
        `;
    }
}

// --- INITIALIZATION ---

export async function initJournals() {
    const journalListEl = document.getElementById('journal-list');
    const createJournalBtn = document.getElementById('createJournalBtn');
    
    const pageHeader = document.querySelector('.page-header');

    // 1. Fetch Session
    const session = await getUserSession();
    const currentUser = (session && session.success) ? session.user : null;

    const hasPermission = (perm) => 
        currentUser && currentUser.permissions && currentUser.permissions.includes(perm);

    // 2. Button Logic (Create)
    if (createJournalBtn) {
        if (hasPermission(PERMISSIONS.USER_SUBMIT_JOURNAL)) {
            createJournalBtn.style.display = ''; 
        } else {
            createJournalBtn.style.display = 'none'; 
        }
        createJournalBtn.addEventListener('click', () => showJournalModal(null, currentUser));
    }

    // 3. List Logic (View)
    const allowedPermissions = [
        PERMISSIONS.VIEW_OWN_GROUP_JOURNALS, 
        PERMISSIONS.VIEW_ALL_JOURNALS
    ];

    protectComponent(
        journalListEl, 
        allowedPermissions, 
        async () => {
            if (pageHeader) pageHeader.style.display = '';
            // FIX: Passing currentUser to loadJournals
            await loadJournals(currentUser);
        },
        () => {
            if (pageHeader) pageHeader.style.display = 'none';
        }
    );
}

// --- MODAL & HANDLERS ---

// FIX: Added currentUser parameter so we can use it in submission
async function showJournalModal(entryToEdit = null, currentUser = null) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'journal-modal';
    
    try {
        const response = await fetch('journal_submission.html');
        if (!response.ok) throw new Error('Failed to load form');
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formElement = doc.querySelector('#journalForm');
        const formHTML = formElement ? formElement.outerHTML : html;

        const titleText = entryToEdit ? "Edit your stand up update" : "Submit your stand up update";
        const modalButtonText = entryToEdit ? "Save changes" : "Submit journal";

        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${titleText}</h2>
                    <button type="button" class="modal-close" id="closeModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="page-description">Share your progress and any challenges you're facing with your team.</p>
                    ${formHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);

        const submitBtn = modalOverlay.querySelector("#journalForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = modalButtonText;

        if (entryToEdit) {
            const didField = modalOverlay.querySelector("#whatIDid");
            const doingField = modalOverlay.querySelector("#whatIWillDo");
            const blockersField = modalOverlay.querySelector("#blockers");

            if (didField) didField.value = entryToEdit.whatIDid || entryToEdit.did || "";
            if (doingField) doingField.value = entryToEdit.whatIWillDo || entryToEdit.doing_next || "";
            if (blockersField) blockersField.value = entryToEdit.blockers || "";
        }
 
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        // FIX: Passing currentUser
        initModalHandlers(modalOverlay, entryToEdit, currentUser);
        
    } catch (error) {
        console.error('Error loading journal form:', error);
        alert('Failed to load journal form. Please try again.');
    }
}

function initModalHandlers(modalOverlay, entryToEdit = null, currentUser) {
    const closeBtn = modalOverlay.querySelector('#closeModal');
    const backBtn = modalOverlay.querySelector('#backBtn');
    
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.remove(), 300);
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backBtn) backBtn.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    const journalForm = modalOverlay.querySelector('#journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const whatIDid = modalOverlay.querySelector('#whatIDid').value.trim();
            const whatIWillDo = modalOverlay.querySelector('#whatIWillDo').value.trim();
            const blockers = modalOverlay.querySelector('#blockers').value.trim();
            
            if (!whatIDid || !whatIWillDo) {
                alert('Please fill in all required fields.');
                return;
            }
            
            if (!currentUser || !currentUser.id) {
                alert("User session not found. Please log in again.");
                return;
            }

            const user_id = currentUser.id;
            const group_id = currentUser.group_id || 1; 
            const today = new Date();
            const entry_date = today.toISOString().split('T')[0];
            const isEdit = Boolean(entryToEdit);

            let url = "/journals/create";
            let method = "POST";
            let body = JSON.stringify({
                user_id, group_id, entry_date, did: whatIDid, doing_next: whatIWillDo, blockers: blockers || null
            });

            if (isEdit) {
                url = `/journals/${entryToEdit.id}`;
                method = "PUT";
                body = JSON.stringify({ did: whatIDid, doing_next: whatIWillDo, blockers: blockers || null });
            } 

            try {
                const response = await fetch(url, {
                    method, headers: { "Content-Type": "application/json" }, body,
                });
                const result = await response.json();

                if (!response.ok) {
                    alert(result.message || "Error saving journal");
                    return;
                }
                closeModal();
                // FIX: Passing currentUser on reload
                loadJournals(currentUser);
                alert(isEdit ? "Journal updated successfully!" : "Journal submitted successfully!");
            } catch (error) {
                console.error('Network Error:', error);
                alert('Failed to submit journal. Please check if the server is running.');
            }
        });
    }
}

function attachEditHandlers(journals, currentUser) {
  const buttons = document.querySelectorAll(".journal-edit-btn");
  buttons.forEach((btn) => {
    const id = btn.dataset.journalId;
    const entry = journals.find((j) => String(j.id) === String(id));
    if (!entry) return;
    btn.addEventListener("click", () => showJournalModal(entry, currentUser));
  });
}

// Delete Functionality
function attachDeleteHandlers() {
    const deleteButtons = document.querySelectorAll(".journal-delete-btn");
    deleteButtons.forEach(btn => {
        const id = btn.dataset.journalId;
        btn.addEventListener("click", () => showDeleteConfirmation(id));
    });
}

function showDeleteConfirmation(id) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-content">
        <div class="modal-header"><h2 class="modal-title">Delete Journal Entry</h2></div>
        <div class="modal-body">
            <p>Are you sure you want to delete this journal entry?</p>
            <div class="modal-buttons">
                <button id="confirmDelete" class="danger">Yes, delete</button>
                <button id="cancel-delete">No</button>
            </div>
        </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add("active");

    const closeModal = () => {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    };

    document.getElementById("cancel-delete").onclick = closeModal;
    document.getElementById("confirmDelete").onclick = async () => {
        try {
            const res = await fetch(`/journals/${id}`, { method: "DELETE" });
            if (res.status === 403 || res.status === 401) {
                alert("You are not authorized to delete this entry.");
                closeModal();
                return;
            }
            const result = await res.json();
            if (!res.ok) {
                alert(result.message || "Delete failed");
                return;
            }
            closeModal();
            // FIX: Re-fetch session to get user context again for reload
            const session = await getUserSession();
            loadJournals(session.user); 
        } catch (e) {
            console.error("Delete error:", e);
        }
    };
}