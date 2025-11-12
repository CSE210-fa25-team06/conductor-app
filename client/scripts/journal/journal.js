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
function initializeData() {
    if (!localStorage.getItem('journals')) {
    localStorage.setItem('journals', JSON.stringify(mockJournals));
    }
}

// Load and display journal entries
function loadJournals() {
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

// Load journals when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    loadJournals();
    
    // Add event listener for create journal button (on journal.html)
    const createJournalBtn = document.getElementById('createJournalBtn');
    if (createJournalBtn) {
        createJournalBtn.addEventListener('click', () => {
            window.location.href = 'journal/journal_submission.html';
        });
    }
});