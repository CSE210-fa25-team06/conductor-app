/**
 * Test script for Journal API
 * This script tests the journal creation functionality
 */

import fetch from 'node-fetch';

const testJournalData = {
  user_id: 101,
  group_id: 1,
  entry_date: "2025-01-15",
  did: "Completed the database schema design and implemented user authentication",
  doing_next: "Plan to work on frontend interface and API integration",
  blockers: "Need clarification on group management requirements"
};

async function testCreateJournal() {
  try {
    console.log("Testing journal creation...");
    console.log("Test data:", testJournalData);
    
    const response = await fetch("http://localhost:3000/journal/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testJournalData)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", result);
    
    if (response.ok) {
      console.log("✅ Journal creation test PASSED");
    } else {
      console.log("❌ Journal creation test FAILED");
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

// Test with missing required fields
async function testMissingFields() {
  try {
    console.log("\nTesting with missing required fields...");
    
    const incompleteData = {
      user_id: 101,
      // Missing group_id, entry_date, did, doing_next
    };
    
    const response = await fetch("http://localhost:3000/journal/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incompleteData)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", result);
    
    if (response.status === 400) {
      console.log("✅ Missing fields validation test PASSED");
    } else {
      console.log("❌ Missing fields validation test FAILED");
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

// Test with optional blockers field
async function testWithoutBlockers() {
  try {
    console.log("\nTesting without optional blockers field...");
    
    const dataWithoutBlockers = {
      user_id: 102,
      group_id: 1,
      entry_date: "2025-01-16",
      did: "Worked on frontend components",
      doing_next: "Will integrate with backend API"
      // blockers field is optional
    };
    
    const response = await fetch("http://localhost:3000/journal/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataWithoutBlockers)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", result);
    
    if (response.ok) {
      console.log("✅ Optional blockers test PASSED");
    } else {
      console.log("❌ Optional blockers test FAILED");
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Journal API Tests...\n");
  
  await testCreateJournal();
  await testMissingFields();
  await testWithoutBlockers();
  
  console.log("\n🏁 All tests completed!");
}

// Execute tests
runAllTests();