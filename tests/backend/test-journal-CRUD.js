/**
 * Journal API Tests
 * Tests: Create → Update → Delete
 */

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const BASE = "http://localhost:3000/journals";

// ------------------------------
// Test Data
// ------------------------------
const testCreateData = {
  user_id: 101,
  group_id: 1,
  entry_date: "2025-02-01",
  did: "Initial test entry",
  doing_next: "Continue testing",
  blockers: "None"
};

let createdJournalId = null;

// ------------------------------
// CREATE JOURNAL
// ------------------------------
async function testCreateJournal() {
  console.log("\nTesting: CREATE Journal");

  const response = await fetch(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testCreateData)
  });

  const result = await response.json();
  console.log("Status:", response.status);
  console.log("Result:", result);

  if (!response.ok) return console.log("Create FAILED");

  createdJournalId = result.data.id;
  console.log("Create PASSED — new ID:", createdJournalId);
}

// ------------------------------
// UPDATE JOURNAL
// ------------------------------
async function testUpdateJournal() {
  console.log("\nTesting: UPDATE Journal");

  if (!createdJournalId)
    return console.log("Cannot update — no journal ID was created");

  const updateData = {
    did: "Updated entry content",
    doing_next: "Continue writing tests",
    blockers: "Time constraints"
  };

  const response = await fetch(`${BASE}/${createdJournalId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  });

  const result = await response.json();
  console.log("Status:", response.status);
  console.log("Result:", result);

  if (!response.ok) return console.log("Update FAILED");

  console.log("Update PASSED");
}

// ------------------------------
// DELETE JOURNAL
// ------------------------------
async function testDeleteJournal() {
  console.log("\nTesting: DELETE Journal");

  if (!createdJournalId)
    return console.log("Cannot delete — no journal ID was created");

  const response = await fetch(`${BASE}/${createdJournalId}`, {
    method: "DELETE"
  });

  const result = await response.json();
  console.log("Status:", response.status);
  console.log("Result:", result);

  if (!response.ok) return console.log("Delete FAILED");

  console.log("Delete PASSED");
}

// ------------------------------
// RUN ALL TESTS
// ------------------------------
async function runAllTests() {
  console.log("\n Starting Journal API Tests...");

  await testCreateJournal();
  await testUpdateJournal();
  await testDeleteJournal();

  console.log("\nAll tests finished\n");
}

runAllTests();
