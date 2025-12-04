/**
 * Comprehensive Attendance API Test Script
 * Base URL: http://localhost:3000
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
console.log("Current Directory = ", __dirname)

const {API_BASE_URL} = require('../../../server/config/config.js');

let sessionCookie = "";

// Generic request wrapper WITH COOKIE PERSISTENCE
async function request(url, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    Cookie: sessionCookie,               // <<— Send session cookie
  };

  const res = await fetch(url, options);

  // Capture Set-Cookie header on login
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];  // save "connect.sid=abcd"
  }

  const data = await res.json().catch(() => ({}));
  return { response: res, data };
}

/* -----------------------------
   LOGIN BEFORE ANY TESTS  
------------------------------*/
async function loginMockUser() {
  console.log("\n Logging in using mock strategy...");

  const { response } = await request(API_BASE_URL + "/api/auth/login", {
    method: "GET",
    redirect: "manual",
  });

  console.log("Login status:", response.status);
  console.log("Captured cookie:", sessionCookie);

  if (response.status === 302 && sessionCookie) {
    console.log(" PASSED: Logged in successfully\n");
    return true;
  } else {
    console.log(" FAILED: Mock login did not work");
    return false;
  }
}


/*// Utility fetch helper
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}*/
// Testing Start Session
async function testStartSession() {
    console.log("\n Test QR-1: Start attendance session...");
  
    const payload = { user_id: 6 }; // Professor ID
  
    const { response, data } = await request(API_BASE_URL + "/attendance/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    console.log("Status:", response.status);
    console.log("Response:", data);
  
    if (response.ok && data.session_id) {
      console.log("PASSED: Session started");
      return {
        session_id: data.session_id,
        user_id: data.user_id
      };
    } else {
      console.log("FAILED: Could not start session");
      return null;
    }
  }
  // Test Scan QR
async function testScan(user_id, session_id) {
    console.log("\n Test QR-2: Scan attendance...");
  
    const testAttendanceData = {
        user_id: 2,          // Alice
        group_id: 1,           // required
        session_id: session_id,
        date: "2025-11-09",
        meeting_type: "Lecture",
        recorded_by: user_id,      // optional
        is_excused: false,     // optional
        reason: null           // optional
      };
  
    const { response, data } = await request(API_BASE_URL + "/attendance/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testAttendanceData),
    });
  
    console.log("Status:", response.status);
    console.log("Response:", data);
  
    if (response.ok) console.log(" PASSED: QR scan recorded attendance");
    else console.log(" FAILED: QR scan did not record attendance");
  }
// Test End Session
async function testEndSession(session_id) {
    console.log("\n Test QR-3: End attendance session...");
  
    const { response, data } = await request(API_BASE_URL + "/attendance/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id }),
    });
  
    console.log("Status:", response.status);
    console.log("Response:", data);
  
    if (response.ok && data.is_active == false)
      console.log(" PASSED: Session ended successfully");
    else
      console.log(" FAILED: Could not end session");
  }

  // 5️⃣ Test: Fetch student history
async function testFetchStudentHistory() {
    console.log("\n Test 5: Fetching student history for user_id=2...");
  
    const { response, data } = await request(API_BASE_URL + "/attendance/history/2");
  
    console.log("Status:", response.status);
    console.log("Response:", data);
  
    if (response.ok) console.log(" Test PASSED: Student history fetched successfully");
    else console.log(" Test FAILED: Could not fetch student history");

}

// Run all tests
async function runAllTests() {
  console.log(" Starting Attendance API Tests...");

  const loggedIn = await loginMockUser();
  if (!loggedIn) return;

  const { session_id, user_id } = await testStartSession();

  if (!session_id || !user_id) return;

  await testScan(user_id, session_id);
  await testEndSession(session_id);
  await testFetchStudentHistory();

  console.log("\n All tests completed!");
}

runAllTests();
