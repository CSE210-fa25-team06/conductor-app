/**
 * Direct API Test - Journal Creation
 * Simple test without server connection check
 */

import fetch from 'node-fetch';

// Test configuration
const API_BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  user_id: 101,
  group_id: 1,
  entry_date: '2025-01-15',
  did: 'Completed database schema design and user authentication',
  doing_next: 'Working on frontend integration and API development',
  blockers: 'Need clarification on group management requirements'
};

// Simple test function
async function testJournalAPI() {
  console.log('🧪 Testing Journal API...\n');
  
  try {
    console.log('Test: Creating journal entry with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(API_BASE_URL + '/journal/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ SUCCESS: Journal entry created successfully!');
      console.log('📋 Journal ID:', data.data.id);
    } else {
      console.log('\n❌ FAILED: Journal creation failed');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

// Run test
console.log('🚀 Starting Journal API Test...\n');
testJournalAPI();