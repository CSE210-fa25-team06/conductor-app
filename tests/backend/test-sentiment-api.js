/**
 * Test script for Sentiment API endpoints
 * Tests both POST /sentiments/create and GET /sentiments/user
 */

import fetch from 'node-fetch';

const BASE_URL = "http://localhost:3000";

// Test sentiment entries
const testSentiments = [
  {
    user_id: 101,
    group_id: 1,
    sentiment: "happy",
    comment: "Had a productive day working on the project!"
  },
  {
    user_id: 101,
    group_id: 1,
    sentiment: "neutral",
    comment: "Regular day, nothing special"
  },
  {
    user_id: 101,
    group_id: 1,
    sentiment: "sad",
    comment: "Feeling a bit overwhelmed with deadlines"
  },
  {
    user_id: 102, // Different user
    group_id: 1,
    sentiment: "happy",
    comment: null // Test without comment
  }
];

/**
 * Test 1: Create sentiment entry with all fields
 */
async function testCreateSentimentComplete() {
  try {
    console.log("Test 1: POST /sentiments/create (complete data)");
    console.log("Test data:", testSentiments[0]);
    console.log();
    
    const response = await fetch(`${BASE_URL}/sentiments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testSentiments[0])
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 201 && result.success) {
      console.log("\n✅ TEST PASSED: Sentiment created successfully");
      console.log(`   Created sentiment ID: ${result.data.id}`);
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
 * Test 2: Create sentiment without optional comment
 */
async function testCreateSentimentNoComment() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 2: POST /sentiments/create (without comment)");
    
    const dataWithoutComment = {
      user_id: 101,
      group_id: 1,
      sentiment: "happy"
      // comment is omitted
    };
    
    console.log("Test data:", dataWithoutComment);
    console.log();
    
    const response = await fetch(`${BASE_URL}/sentiments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataWithoutComment)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 201 && result.success && result.data.comment === null) {
      console.log("\n✅ TEST PASSED: Sentiment created without comment");
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
 * Test 3: Create sentiment with missing required fields
 */
async function testCreateSentimentMissingFields() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 3: POST /sentiments/create (missing required fields)");
    console.log("Expected: Should return 400 error\n");
    
    const incompleteData = {
      user_id: 101,
      // Missing group_id and sentiment
    };
    
    const response = await fetch(`${BASE_URL}/sentiments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incompleteData)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 400 && !result.success) {
      console.log("\n✅ TEST PASSED: Correctly rejected incomplete data");
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
 * Test 4: Create sentiment with invalid sentiment value
 */
async function testCreateSentimentInvalidValue() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 4: POST /sentiments/create (invalid sentiment value)");
    console.log("Expected: Should return 400 error\n");
    
    const invalidData = {
      user_id: 101,
      group_id: 1,
      sentiment: "excited" // Invalid - must be happy/neutral/sad
    };
    
    const response = await fetch(`${BASE_URL}/sentiments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.status === 400 && !result.success) {
      console.log("\n✅ TEST PASSED: Correctly rejected invalid sentiment value");
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
 * Test 5: Create all three sentiment types
 */
async function testCreateAllSentimentTypes() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 5: Create all three sentiment types (happy, neutral, sad)");
    console.log();
    
    const results = [];
    
    for (const sentimentData of testSentiments) {
      const response = await fetch(`${BASE_URL}/sentiments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sentimentData)
      });
      
      await response.json();
      results.push(response.ok);
      
      if (response.ok) {
        console.log(`✅ Created ${sentimentData.sentiment} sentiment for user ${sentimentData.user_id}`);
      } else {
        console.log(`❌ Failed to create ${sentimentData.sentiment} sentiment`);
      }
    }
    
    const allSuccess = results.every(r => r === true);
    
    if (allSuccess) {
      console.log("\n✅ TEST PASSED: All sentiment types created successfully");
      return true;
    } else {
      console.log("\n❌ TEST FAILED: Some sentiments failed to create");
      return false;
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

/**
 * Test 6: Get sentiments for user 101
 */
async function testGetUserSentiments() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 6: GET /sentiments/user?user_id=101");
    console.log("Expected: Should return all sentiments for user 101\n");
    
    const response = await fetch(`${BASE_URL}/sentiments/user?user_id=101`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log(`\n✅ TEST PASSED: Retrieved ${result.count} sentiment(s) for user 101`);
      
      // Verify sentiments are sorted by date (newest first)
      if (result.data.length > 1) {
        const dates = result.data.map(s => new Date(s.created_at));
        const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
        
        if (isSorted) {
          console.log("✅ Sentiments are correctly sorted (newest first)");
        } else {
          console.log("⚠️  Sentiments are not properly sorted");
        }
      }
      
      // Verify all sentiments belong to user 101
      const allBelongToUser = result.data.every(s => s.user_id === 101);
      if (allBelongToUser) {
        console.log("✅ All sentiments belong to user 101");
      } else {
        console.log("❌ Some sentiments don't belong to user 101");
      }
      
      // Verify sentiment values are valid
      const validSentiments = ['happy', 'neutral', 'sad'];
      const allValid = result.data.every(s => validSentiments.includes(s.sentiment));
      if (allValid) {
        console.log("✅ All sentiment values are valid");
      } else {
        console.log("❌ Some sentiment values are invalid");
      }
      
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
 * Test 7: Get sentiments for different user
 */
async function testGetDifferentUserSentiments() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 7: GET /sentiments/user?user_id=102");
    console.log("Expected: Should return sentiments for user 102 only\n");
    
    const response = await fetch(`${BASE_URL}/sentiments/user?user_id=102`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      const correctUser = result.data.every(s => s.user_id === 102);
      if (correctUser && result.count >= 1) {
        console.log(`\n✅ TEST PASSED: Retrieved ${result.count} sentiment(s) for user 102`);
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
 * Test 8: Get sentiments for non-existent user
 */
async function testGetNonExistentUserSentiments() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 8: GET /sentiments/user?user_id=999");
    console.log("Expected: Should return empty array\n");
    
    const response = await fetch(`${BASE_URL}/sentiments/user?user_id=999`);
    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.success && result.count === 0) {
      console.log("\n✅ TEST PASSED: Correctly returned empty array");
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
 * Test 9: Get sentiments without user_id (should fail if no session)
 */
async function testGetSentimentsNoUserId() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 9: GET /sentiments/user (no user_id parameter)");
    console.log("Expected: Should return 401 if no session\n");
    
    const response = await fetch(`${BASE_URL}/sentiments/user`);
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
 * Test 10: Verify response data structure
 */
async function testResponseStructure() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Test 10: Verify response data structure");
    console.log("Expected: Response should have correct fields\n");
    
    const response = await fetch(`${BASE_URL}/sentiments/user?user_id=101`);
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
    
    // Check first sentiment entry structure
    if (result.data.length > 0) {
      const sentiment = result.data[0];
      const sentimentFields = [
        'id', 'user_id', 'group_id', 'sentiment', 'created_at'
      ];
      
      const hasAllFields = sentimentFields.every(field => Object.hasOwn(sentiment, field));
      
      if (hasAllFields) {
        console.log("✅ Response structure is correct");
        console.log("✅ Sentiment entry has all required fields");
        
        // Verify sentiment value is valid
        const validSentiments = ['happy', 'neutral', 'sad'];
        if (validSentiments.includes(sentiment.sentiment)) {
          console.log("✅ Sentiment value is valid");
        } else {
          console.log("❌ Sentiment value is invalid");
        }
        
        console.log("\n✅ TEST PASSED");
        return true;
      } else {
        console.log("❌ Sentiment entry is missing some fields");
        console.log("Expected fields:", sentimentFields);
        console.log("Actual fields:", Object.keys(sentiment));
        return false;
      }
    } else {
      console.log("✅ Response structure is correct");
      console.log("⚠️  No sentiment entries to validate structure");
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
  console.log("🚀 Starting Sentiment API Tests");
  console.log("=".repeat(60) + "\n");
  
  const results = [];
  
  // Run all test cases
  results.push(await testCreateSentimentComplete());
  results.push(await testCreateSentimentNoComment());
  results.push(await testCreateSentimentMissingFields());
  results.push(await testCreateSentimentInvalidValue());
  results.push(await testCreateAllSentimentTypes());
  results.push(await testGetUserSentiments());
  results.push(await testGetDifferentUserSentiments());
  results.push(await testGetNonExistentUserSentiments());
  results.push(await testGetSentimentsNoUserId());
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
