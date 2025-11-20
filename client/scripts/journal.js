import { mockJournals } from "./mock_journal.js";

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

// Create HTML for a single journal entry
function createJournalEntryHTML(entry) {
    const blockersHTML = entry.blockers 
    ? `<div class="journal-blockers">
            <div class="journal-label">Blockers</div>
            <div class="journal-text">${escapeHtml(entry.blockers)}</div>
        </div>`
    : `<div class="journal-section">
            <div class="journal-label">Blockers</div>
            <div class="journal-text no-blockers">No blockers reported</div>
        </div>`;

    const timestamp = entry.timestamp || entry.created_at || new Date().toISOString();

    return `
        <div class="journal-entry" data-journal-id="${entry.id}">
        <div class="journal-header">
            <div class="journal-timestamp">${formatTimestamp(timestamp)}</div>
            <button type="button" class="journal-edit-btn" data-journal-id="${entry.id}" aria-label="Edit journal entry">
            ✏️
            </button>
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// Initialize localStorage with mock data if empty
export function initializeData() {
    if (!localStorage.getItem('journals')) {
    localStorage.setItem('journals', JSON.stringify(mockJournals));
    }
}

// Load and display journal entries
export function loadJournals() {
    const journalList = document.getElementById('journalList');
    
    try {
    // Load from localStorage (or use mock data as fallback)
    const storedJournals = localStorage.getItem('journals');
    const journals = storedJournals ? JSON.parse(storedJournals) : [...mockJournals];
    
    // Sort by timestamp (newest first)
    journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Check if there are any journals
    if (journals.length === 0) {
        journalList.innerHTML = `
        <div class="empty-state">
            <h3>No Journal Entries Yet</h3>
            <p>Be the first to submit a stand-up update!</p>
        </div>
        `;
        return;
    }
    
    // Generate HTML for all journal entries
    const journalsHTML = journals.map(entry => createJournalEntryHTML(entry)).join('');
    journalList.innerHTML = journalsHTML;
    attachEditHandlers(journals);
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

// Show modal for creating new journal
async function showJournalModal(entryToEdit = null) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'journalModal';
    
    try {
        // Fetch the journal submission form HTML
        const response = await fetch('journal/journal_submission.html');
        if (!response.ok) throw new Error('Failed to load form');
        const html = await response.text();
        
        // Extract only the form content (not the title/description from the HTML)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formElement = doc.querySelector('#journalForm');
        const formHTML = formElement ? formElement.outerHTML : html;


        // Edit stand up content
        const titleText = entryToEdit
        ? "Edit your stand up update"
        : "Submit your stand up update";

        const modalButtonText = entryToEdit ? "Save changes" : "Submit journal";

        // Create modal content
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">{titleText}</h2>
                    <button type="button" class="modal-close" id="closeModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="page-description">Share your progress and any challenges you're facing with your team.</p>
                    ${formHTML}
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.appendChild(modalOverlay);

        // Update submit button label
        const submitBtn = modalOverlay.querySelector("#journalForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = modalButtonText;

        // Prefill form when editing
        if (entryToEdit) {
            const didField = modalOverlay.querySelector("#whatIDid");
            const doingField = modalOverlay.querySelector("#whatIWillDo");
            const blockersField = modalOverlay.querySelector("#blockers");

            if (didField) didField.value = entryToEdit.whatIDid || entryToEdit.did || "";
            if (doingField) doingField.value = entryToEdit.whatIWillDo || entryToEdit.doing_next || "";
            if (blockersField) blockersField.value = entryToEdit.blockers || "";
        }
 
        // Show modal with animation
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        
        // Initialize modal event handlers
        initModalHandlers(modalOverlay, entryToEdit);
        
    } catch (error) {
        console.error('Error loading journal form:', error);
        alert('Failed to load journal form. Please try again.');
    }
}

// Initialize modal event handlers
function initModalHandlers(modalOverlay, entryToEdit = null) {
    // Close modal button
    const closeBtn = modalOverlay.querySelector('#closeModal');
    const backBtn = modalOverlay.querySelector('#backBtn');
    
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.remove(), 300);
    };
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', closeModal);
    }
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Handle form submission
    const journalForm = modalOverlay.querySelector('#journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const whatIDid = modalOverlay.querySelector('#whatIDid').value.trim();
            const whatIWillDo = modalOverlay.querySelector('#whatIWillDo').value.trim();
            const blockers = modalOverlay.querySelector('#blockers').value.trim();
            
            // Validate required fields
            if (!whatIDid || !whatIWillDo) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // TODO: Replace with actual user_id and group_id from authentication
            // For now, using test values matching test-journal-api.js
            const user_id = 101;
            const group_id = 1;
            
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const entry_date = today.toISOString().split('T')[0];
            const isEdit = Boolean(entryToEdit);

            let url;
            let method;
            let body;

            if (isEdit) {
                url = `/journals/${entryToEdit.id}`;
                method = "PUT";
                body = JSON.stringify({
                did: whatIDid,
                doing_next: whatIWillDo,
                blockers: blockers || null,
                });
            } else {
                url = "/journals/create";
                method = "POST";
                body = JSON.stringify({
                user_id,
                group_id,
                entry_date,
                did: whatIDid,
                doing_next: whatIWillDo,
                blockers: blockers || null,
                });
            }

            // Create journal entry object matching API format
            const journalData = {
                user_id: user_id,
                group_id: group_id,
                entry_date: entry_date,
                did: whatIDid,
                doing_next: whatIWillDo,
                blockers: blockers || null
            };
            
            try {
                const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body,
                });

                const result = await response.json();

                if (response.ok) {
                const apiJournal = result.data;

                // Keep localStorage in sync
                const stored = JSON.parse(localStorage.getItem("journals") || "[]");

                if (isEdit) {
                    const idx = stored.findIndex((j) => String(j.id) === String(entryToEdit.id));
                    if (idx !== -1) {
                    stored[idx] = {
                        ...stored[idx],
                        whatIDid,
                        whatIWillDo,
                        blockers,
                    };
                    }
                    localStorage.setItem("journals", JSON.stringify(stored));
                    closeModal();
                    loadJournals();
                    alert("Journal updated successfully");
                }   
                else {
                    const journalEntry = {
                        id: result.data.id,
                        whatIDid: whatIDid,
                        whatIWillDo: whatIWillDo,
                        blockers: blockers,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Add new entry to journals array
                    journals.push(journalEntry);
                    
                    // Save back to localStorage
                    localStorage.setItem('journals', JSON.stringify(journals));
                    
                    // Close modal
                    closeModal();
                    
                    // Reload journals to show new entry
                    loadJournals();
                    
                    // Show success message
                    alert('Journal submitted successfully!');
                    }
                } else {
                    // Handle API error
                    console.error('API Error:', result);
                    alert(`Failed to submit journal: ${result.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Network Error:', error);
                alert('Failed to submit journal. Please check if the server is running.');
            }
        });
    }
}

export function initJournals(){
    initializeData();
    loadJournals();
    
    // Add event listener for create journal button (on journal.html)
    const createJournalBtn = document.getElementById('createJournalBtn');
    if (createJournalBtn) {
        createJournalBtn.addEventListener('click', showJournalModal);
    }
}

// Edit Functionality
function attachEditHandlers(journals) {
  const buttons = document.querySelectorAll(".journal-edit-btn");
  buttons.forEach((btn) => {
    const id = btn.dataset.journalId;
    const entry = journals.find((j) => String(j.id) === String(id));
    if (!entry) return;

    btn.addEventListener("click", () => {
      showJournalModal(entry);
    });
  });
}


// Load journals when page loads
// document.addEventListener('DOMContentLoaded', () => {
//     initializeData();
//     loadJournals();
    
//     // Add event listener for create journal button (on journal.html)
//     const createJournalBtn = document.getElementById('createJournalBtn');
//     if (createJournalBtn) {
//         createJournalBtn.addEventListener('click', showJournalModal);
//     }
// });