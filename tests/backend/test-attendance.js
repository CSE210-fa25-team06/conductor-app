/**
 * Comprehensive Attendance API Test Script
 * Base URL: http://localhost:3000
 * Handles expected failures as "passed"
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

const testAttendanceData = {
  user_id: 101,          // Alice
  group_id: 1,           // required
  date: "2025-11-09",
  status: "Present",
  meeting_type: "Lecture",
  recorded_by: 100,      // optional
  is_excused: false,     // optional
  reason: null           // optional
};

// Utility fetch helper
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// 1️⃣ Test: Mark attendance
async function testMarkAttendance() {
  console.log("\n📌 Test 1: Marking attendance...");
  const { response, data } = await request(API_BASE_URL + "/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testAttendanceData),
  });

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (response.ok) console.log("✅ Test PASSED: Attendance marked successfully");
  else console.log("❌ Test FAILED: Attendance marking failed");
}

// 2️⃣ Test: Missing required fields (expected failure)
async function testMissingFields() {
  console.log("\n📌 Test 2: Missing required fields (expected failure)...");

  const incompleteData = {
    user_id: 101 // missing group_id, date, status, meeting_type
  };

  const { response, data } = await request(API_BASE_URL + "/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(incompleteData),
  });

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (!response.ok) console.log("✅ Test PASSED: API correctly rejected incomplete data");
  else console.log("❌ Test FAILED: API should have rejected incomplete data");
}

// 3️⃣ Test: Optional fields
async function testOptionalFields() {
  console.log("\n📌 Test 3: Optional fields...");

  const optionalData = {
    user_id: 102,
    group_id: 2,
    date: "2025-11-10",
    status: "Absent",
    meeting_type: "Lab"
    // is_excused and reason omitted
  };

  const { response, data } = await request(API_BASE_URL + "/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(optionalData),
  });

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (response.ok) console.log("✅ Test PASSED: Optional fields handled correctly");
  else console.log("❌ Test FAILED: Optional fields test failed");
}

// 4️⃣ Test: Fetch attendance directory
async function testFetchDirectory() {
  console.log("\n📌 Test 4: Fetching attendance directory...");

  const { response, data } = await request(API_BASE_URL + "/attendance/directory");

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (response.ok) console.log("✅ Test PASSED: Directory fetched successfully");
  else console.log("❌ Test FAILED: Could not fetch directory");
}

// 5️⃣ Test: Fetch student history
async function testFetchStudentHistory() {
  console.log("\n📌 Test 5: Fetching student history for user_id=101...");

  const { response, data } = await request(API_BASE_URL + "/attendance/history/101");

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (response.ok) console.log("✅ Test PASSED: Student history fetched successfully");
  else console.log("❌ Test FAILED: Could not fetch student history");
}

// 6️⃣ Test: Fetch attendance by date
async function testFetchByDate() {
  console.log("\n📌 Test 6: Fetching attendance by date 2025-11-09...");

  const { response, data } = await request(API_BASE_URL + "/attendance/by-date/2025-11-09");

  console.log("Status:", response.status);
  console.log("Response:", data);

  if (response.ok) console.log("✅ Test PASSED: Attendance by date fetched successfully");
  else console.log("❌ Test FAILED: Could not fetch attendance by date");
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Attendance API Tests...");

  await testMarkAttendance();
  await testMissingFields();  // expected failure
  await testOptionalFields();
  await testFetchDirectory();
  await testFetchStudentHistory();
  await testFetchByDate();

  console.log("\n🏁 All tests completed!");
}

runAllTests();
