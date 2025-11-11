/**
 * Mock Journal Model for API Testing
 * This version bypasses database connection issues for testing purposes
 */

// Mock database - in-memory storage
const mockJournals = [];
let nextId = 1;

/**
 * Creates a new journal entry (mock version)
 * @param {Object} journalData - The journal entry data
 * @returns {Promise<Object>} The created journal entry with ID
 */
export async function createJournalEntry(journalData) {
  try {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Validate required fields
    const requiredFields = ['user_id', 'group_id', 'entry_date', 'did', 'doing_next'];
    const missingFields = requiredFields.filter(field => !journalData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Create mock journal entry
    const newJournal = {
      id: nextId++,
      ...journalData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store in mock database
    mockJournals.push(newJournal);
    
    console.log('Mock journal created:', newJournal);
    return { id: newJournal.id };
  } catch (error) {
    console.error('Mock journal creation error:', error.message);
    throw error;
  }
}

/**
 * Get all journals (for testing)
 * @returns {Array} All mock journals
 */
export function getAllJournals() {
  return mockJournals;
}

/**
 * Clear all journals (for testing)
 */
export function clearJournals() {
  mockJournals.length = 0;
  nextId = 1;
}