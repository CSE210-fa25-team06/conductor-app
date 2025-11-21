/**
 * Test script for GET /journals/user API endpoint
 * This script tests fetching journal entries for a specific user
 */

import fetch from 'node-fetch';

const BASE_URL = "http://localhost:3000";

// First, create some test journal entries
const testJournals = [
  {
    user_id: 101,
    group_id: 1,
    entry_date: "2024-11-20",
    did: "Implemented emotional tracker feature",
    doing_next: "Will test the journal API endpoints",
    blockers: null
  },
  {
    user_id: 101,
    group_id: 1,
    entry_date: "2024-11-19",
    did: "Fixed frontend layout issues",
    doing_next: "Plan to add more styling",
    blockers: "Need design approval"
  },
  {
    user_id: 101,
    group_id: 1,
    entry_date: "2024-11-18",
    did: "Set up database schema",
    doing_next: "Will implement backend routes",
    blockers: null
  },
  {
    user_id: 102, // Different user
    group_id: 1,
    entry_date: "2024-11-20",
    did: "Worked on authentication",
    doing_next: "Will add session management",
    blockers: null
  }
];

/**
 * Helper function to create test journal entries
 */
async function setupTestData() {
  console.log("📝 Setting up test data...\n");
  
  for (const journal of testJournals) {
    try {
      const response = await fetch(`${BASE_URL}/journals/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(journal)
      });
      
      if (response.ok) {
        await response.json();
        console.log(`✅ Created journal entry for user ${journal.user_id} on ${journal.entry_date}`);
      } else {
        console.log(`⚠️  Failed to create journal entry: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error creating journal: ${error.message}`);
    }
  }
  
  console.log("\n✅ Test data setup completed!\n");
}

/**
 * Test 1: Get journals for user 101 using query parameter
 */
async function testGetUserJournalsWithParam() {
  try {
    console.log("Test 1: GET /journals/user?user_id=101");
    console.log("Expected: Should return all journals for user 101\n");
    
    const response = await fetch(`${BASE_URL}/journals/user?user_id=101`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log(`\n✅ TEST PASSED: Retrieved ${result.count} journal(s) for user 101`);
      
      // Verify journals are sorted by date (newest first)
      if (result.data.length > 1) {
        const dates = result.data.map(j => new Date(j.entry_date));
        const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
        
        if (isSorted) {
          console.log("✅ Journals are correctly sorted (newest first)");
        } else {
          console.log("⚠️  Journals are not properly sorted");
        }
      }
      
      // Verify all journals belong to user 101
      const allBelongToUser = result.data.every(j => j.user_id === 101);
      if (allBelongToUser) {
        console.log("✅ All journals belong to user 101");
      } else {
        console.log("❌ Some journals don't belong to user 101");
      }
      
      return true;
    } else {
      console.log("❌ TEST FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 2: Get journals for user 102
 */
async function testGetDifferentUser() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 2: GET /journals/user?user_id=102");
    console.log("Expected: Should return journal(s) for user 102 only\n");
    
    const response = await fetch(`${BASE_URL}/journals/user?user_id=102`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      const correctUser = result.data.every(j => j.user_id === 102);
      if (correctUser && result.count >= 1) {
        console.log(`\n✅ TEST PASSED: Retrieved ${result.count} journal(s) for user 102`);
        return true;
      } else {
        console.log("\n❌ TEST FAILED: Data validation failed");
        return false;
      }
    } else {
      console.log("\n❌ TEST FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 3: Get journals for non-existent user
 */
async function testNonExistentUser() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 3: GET /journals/user?user_id=999");
    console.log("Expected: Should return empty array\n");
    
    const response = await fetch(`${BASE_URL}/journals/user?user_id=999`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success && result.count === 0) {
      console.log("\n✅ TEST PASSED: Correctly returned empty array for non-existent user");
      return true;
    } else {
      console.log("\n❌ TEST FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 4: Get journals without user_id parameter (should fail if no session)
 */
async function testWithoutUserId() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 4: GET /journals/user (no user_id parameter)");
    console.log("Expected: Should return 401 if no session\n");
    
    const response = await fetch(`${BASE_URL}/journals/user`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 401 && !result.success) {
      console.log("\n✅ TEST PASSED: Correctly returned 401 for unauthenticated request");
      return true;
    } else if (response.ok && result.success) {
      console.log("\n✅ TEST PASSED: User is authenticated via session");
      return true;
    } else {
      console.log("\n❌ TEST FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 5: Get journals with invalid user_id
 */
async function testInvalidUserId() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 5: GET /journals/user?user_id=invalid");
    console.log("Expected: Should return 400 for invalid user_id\n");
    
    const response = await fetch(`${BASE_URL}/journals/user?user_id=invalid`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 400 && !result.success) {
      console.log("\n✅ TEST PASSED: Correctly rejected invalid user_id");
      return true;
    } else {
      console.log("\n❌ TEST FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 6: Verify response data structure
 */
async function testResponseStructure() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 6: Verify response data structure");
    console.log("Expected: Response should have correct fields\n");
    
    const response = await fetch(`${BASE_URL}/journals/user?user_id=101`);
    const result = await response.json();
    
    const hasRequiredFields = 
      Object.hasOwn(result, 'success') &&
      Object.hasOwn(result, 'count') &&
      Object.hasOwn(result, 'data') &&
      Array.isArray(result.data);
    
    if (!hasRequiredFields) {
      console.log("❌ TEST FAILED: Missing required fields in response");
      return false;
    }
    
    // Check first journal entry structure
    if (result.data.length > 0) {
      const journal = result.data[0];
      const journalFields = [
        'id', 'user_id', 'group_id', 'entry_date', 
        'did', 'doing_next', 'created_at'
      ];
      
      const hasAllFields = journalFields.every(field => Object.hasOwn(journal, field));
      
      if (hasAllFields) {
        console.log("✅ Response structure is correct");
        console.log("✅ Journal entry has all required fields");
        console.log("\n✅ TEST PASSED");
        return true;
      } else {
        console.log("❌ Journal entry is missing some fields");
        console.log("Expected fields:", journalFields);
        console.log("Actual fields:", Object.keys(journal));
        return false;
      }
    } else {
      console.log("✅ Response structure is correct");
      console.log("⚠️  No journal entries to validate structure");
      return true;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("=".repeat(60));
  console.log("🚀 Starting GET /journals/user API Tests");
  console.log("=".repeat(60) + "\n");
  
  // Setup test data
  await setupTestData();
  
  const results = [];
  
  // Run all test cases
  results.push(await testGetUserJournalsWithParam());
  results.push(await testGetDifferentUser());
  results.push(await testNonExistentUser());
  results.push(await testWithoutUserId());
  results.push(await testInvalidUserId());
  results.push(await testResponseStructure());
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED! 🎉");
  } else {
    console.log("\n⚠️  SOME TESTS FAILED");
  }
  
  console.log("=".repeat(60));
}

// Execute tests
runAllTests();
