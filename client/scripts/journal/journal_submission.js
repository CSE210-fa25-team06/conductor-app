import { mockJournals } from './mock_journal.js';

// Initialize localStorage with mock data if empty
function initializeData() {
    if (!localStorage.getItem('journals')) {
        localStorage.setItem('journals', JSON.stringify(mockJournals));
    }
}

// Handle journal form submission
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    
    // Handle form submission
    const journalForm = document.getElementById('journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const whatIDid = document.getElementById('whatIDid').value.trim();
            const whatIWillDo = document.getElementById('whatIWillDo').value.trim();
            const blockers = document.getElementById('blockers').value.trim();
            
            // Validate required fields
            if (!whatIDid || !whatIWillDo) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Load existing journals from localStorage
            const storedJournals = localStorage.getItem('journals');
            const journals = storedJournals ? JSON.parse(storedJournals) : [];
            
            // Generate new ID (find max ID and add 1)
            const maxId = journals.length > 0 ? Math.max(...journals.map(j => j.id)) : 0;
            
            // Create journal entry object
            const journalEntry = {
                id: maxId + 1,
                whatIDid: whatIDid,
                whatIWillDo: whatIWillDo,
                blockers: blockers,
                timestamp: new Date().toISOString()
            };
            
            // Add new entry to journals array
            journals.push(journalEntry);
            
            // Save back to localStorage
            localStorage.setItem('journals', JSON.stringify(journals));
            
            // Log to console
            console.log('Journal Entry Saved:', journalEntry);
            
            // Show success message
            alert('Journal submitted successfully!');
            
            // Redirect back to overview page
            window.location.href = '../journal.html';
            
            // TODO: Later this will send data to server using API
            // This would typically use fetch() to POST to your backend
        });
    }
    
    // Handle back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../journal.html';
        });
    }
});
