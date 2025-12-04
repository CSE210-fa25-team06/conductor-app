import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3000';

const testData = {
    user_id: 101,          // Alice
    group_id: 1,           // required
    date: "2025-11-09",
    status: "Present",
    meeting_type: "Lecture",
    recorded_by: 100,      // optional
    is_excused: false,     // optional
    reason: null           // optional
  };
  
  // Function
  // Utility helper
async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }
  
  async function testAttendanceAPI() {
    console.log("🧪 Testing Attendance API...\n");
  
    // 1️⃣ Test: Mark attendance
    console.log("📌 Test 1: Marking attendance...");
    let { response, data } = await request(API_BASE_URL + "/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
  
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) console.log("✅ Attendance marked successfully!\n");
    else console.log("❌ Failed to mark attendance\n");
  
    // 2️⃣ Test: Fetch all attendance records
    console.log("📌 Test 2: Fetching all attendance records...");
    ({ response, data } = await request(API_BASE_URL + "/attendance/directory"));
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) console.log("✅ Successfully fetched directory\n");
    else console.log("❌ Failed to fetch directory\n");
  
    // 3️⃣ Test: Fetch student history
    console.log("📌 Test 3: Fetching attendance history for student 1...");
    ({ response, data } = await request(API_BASE_URL + "/attendance/history/101"));
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) console.log("✅ Successfully fetched student history\n");
    else console.log("❌ Failed to fetch student history\n");
  
    // 4️⃣ Test: Fetch attendance by date
    console.log("📌 Test 4: Fetching attendance by date...");
    ({ response, data } = await request(API_BASE_URL + "/attendance/by-date/2025-11-09"));
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) console.log("✅ Successfully fetched attendance by date\n");
    else console.log("❌ Failed to fetch attendance by date\n");
  
    console.log("🎯 All tests completed.\n");
  }
  
  // Run test
  console.log("🚀 Starting Attendance API Test...\n");
  testAttendanceAPI();


