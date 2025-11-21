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

// Create HTML for a sentiment entry
function createSentimentEntryHTML(entry) {
    const sentimentEmojis = {
        'happy': '😊',
        'neutral': '😐',
        'sad': '😔'
    };
    
    const sentimentLabels = {
        'happy': 'happy',
        'neutral': 'neutral',
        'sad': 'sad'
    };
    
    const emoji = sentimentEmojis[entry.sentiment] || '😐';
    const label = sentimentLabels[entry.sentiment] || entry.sentiment;
    
    const commentHTML = entry.comment
        ? `<div class="journal-section">
                <div class="journal-label">Comment</div>
                <div class="journal-text">${escapeHtml(entry.comment)}</div>
            </div>`
        : '';
    
    return `
    <div class="journal-entry sentiment-entry">
        <div class="journal-header">
            <div class="sentiment-entry-header">
                <span class="sentiment-badge">
                    <span class="sentiment-emoji">${emoji}</span>
                    <span class="sentiment-text">Emotional Tracker: ${label}</span>
                </span>
                <div class="journal-timestamp">${formatTimestamp(entry.timestamp)}</div>
            </div>
        </div>
        ${commentHTML ? `<div class="journal-content">${commentHTML}</div>` : ''}
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
    
    // Load sentiment entries
    const storedSentiments = localStorage.getItem('sentiments');
    const sentiments = storedSentiments ? JSON.parse(storedSentiments) : [];
    
    // Combine journals and sentiments with type tags
    const allEntries = [
        ...journals.map(j => ({ ...j, type: 'journal' })),
        ...sentiments.map(s => ({ ...s, type: 'sentiment' }))
    ];
    
    // Sort by timestamp (newest first)
    allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Check if there are any entries
    if (allEntries.length === 0) {
        journalList.innerHTML = `
        <div class="empty-state">
            <h3>No Journal Entries Yet</h3>
            <p>Be the first to submit a stand-up update or emotional tracker!</p>
        </div>
        `;
        return;
    }
    
    // Generate HTML for all entries based on type
    const entriesHTML = allEntries.map(entry => {
        if (entry.type === 'sentiment') {
            return createSentimentEntryHTML(entry);
        } else {
            return createJournalEntryHTML(entry);
        }
    }).join('');
    journalList.innerHTML = entriesHTML;
    
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

// Show modal for emotional tracker
async function showSentimentModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'sentimentModal';
    
    try {
        // Fetch the sentiment form HTML
        const response = await fetch('journal/sentiment.html');
        if (!response.ok) throw new Error('Failed to load sentiment form');
        const html = await response.text();
        
        // Extract the form content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formElement = doc.querySelector('#sentimentForm');
        const formHTML = formElement ? formElement.outerHTML : html;
        
        // Create modal content
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Emotional Tracker</h2>
                    <button type="button" class="modal-close" id="closeSentimentModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="page-description">Track your emotional state and share any thoughts.</p>
                    ${formHTML}
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.appendChild(modalOverlay);
        
        // Show modal with animation
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        
        // Initialize sentiment modal event handlers
        initSentimentModalHandlers(modalOverlay);
        
    } catch (error) {
        console.error('Error loading sentiment form:', error);
        alert('Failed to load emotional tracker form. Please try again.');
    }
}

// Initialize sentiment modal event handlers
function initSentimentModalHandlers(modalOverlay) {
    // Close modal button
    const closeBtn = modalOverlay.querySelector('#closeSentimentModal');
    const backBtn = modalOverlay.querySelector('#sentimentBackBtn');
    
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
    const sentimentForm = modalOverlay.querySelector('#sentimentForm');
    if (sentimentForm) {
        sentimentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const sentimentRadio = modalOverlay.querySelector('input[name="sentiment"]:checked');
            const sentiment = sentimentRadio ? sentimentRadio.value : null;
            const comment = modalOverlay.querySelector('#sentimentComment').value.trim();
            
            // Validate required field
            if (!sentiment) {
                alert('Please select how you are feeling.');
                return;
            }
            
            // Create sentiment entry object
            const sentimentData = {
                sentiment: sentiment,
                comment: comment || null,
                timestamp: new Date().toISOString()
            };
            
            try {
                // TODO: Send to API endpoint when available
                // For now, just save to localStorage
                const storedSentiments = localStorage.getItem('sentiments');
                const sentiments = storedSentiments ? JSON.parse(storedSentiments) : [];
                
                sentimentData.id = Date.now();
                sentiments.push(sentimentData);
                localStorage.setItem('sentiments', JSON.stringify(sentiments));
                
                console.log('Sentiment Entry Saved:', sentimentData);
                
                // Close modal
                closeModal();
                
                // Reload journals to show new sentiment entry
                loadJournals();
                
                // Show success message
                alert('Emotional tracker submitted successfully!');
                
            } catch (error) {
                console.error('Error saving sentiment:', error);
                alert('Failed to submit emotional tracker. Please try again.');
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
    
    // Add event listener for emotional tracker button
    const createEmotionalTrackerBtn = document.getElementById('createEmotionalTrackerBtn');
    if (createEmotionalTrackerBtn) {
        createEmotionalTrackerBtn.addEventListener('click', showSentimentModal);
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