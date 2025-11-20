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

    return `
    <div class="journal-entry">
        <div class="journal-header">
        <div class="journal-timestamp">${formatTimestamp(entry.timestamp)}</div>
        </div>
        <div class="journal-content">
        <div class="journal-section">
            <div class="journal-label">What I Did Since Last Meeting</div>
            <div class="journal-text">${escapeHtml(entry.whatIDid)}</div>
        </div>
        <div class="journal-section">
            <div class="journal-label">What I Will Do Next</div>
            <div class="journal-text">${escapeHtml(entry.whatIWillDo)}</div>
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
async function showJournalModal() {
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
        
        // Create modal content
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Submit Your Stand-up Update</h2>
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
        
        // Show modal with animation
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        
        // Initialize modal event handlers
        initModalHandlers(modalOverlay);
        
    } catch (error) {
        console.error('Error loading journal form:', error);
        alert('Failed to load journal form. Please try again.');
    }
}

// Initialize modal event handlers
function initModalHandlers(modalOverlay) {
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
                // Send POST request to API endpoint
                const response = await fetch("/journals/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(journalData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    console.log('Journal Entry Saved:', result);
                    
                    // Also save to localStorage for offline viewing
                    const storedJournals = localStorage.getItem('journals');
                    const journals = storedJournals ? JSON.parse(storedJournals) : [];
                    
                    // Create journal entry object for localStorage (using original field names)
                    const journalEntry = {
                        id: result.journal?.id || Date.now(), // Use API returned ID or timestamp
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