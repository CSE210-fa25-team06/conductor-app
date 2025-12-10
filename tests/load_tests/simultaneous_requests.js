import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 1000, // simultaneous users session
  duration: "30s", // test during 30 seconds
  thresholds: {
    http_req_duration: ["p(95)<300"],  // at least 95% of attempts must have < 300ms response time
    http_req_failed: ["rate<0.01"],  // must have less than 1% of failed attempts
  },
};

const SESSION = "connect.sid=<TEST_USER_SESSION_ID>";

const BASE_URL = "http://localhost:3000";


function testGetJournals() {
  const res = http.get(`${BASE_URL}/journals`, {
    headers: { Cookie: SESSION }
  });

  check(res, {
    "GET journals 200": (r) => r.status === 200,
  });
}

function testGetUserSession() {
    const res = http.get(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: SESSION }
    });
  
    check(res, {
      "GET session 200": (r) => r.status === 200,
    });
  }

function testCreateJournal() {
  const payload = JSON.stringify({
    user_id:114,
    group_id:4,
    entry_date:"2025-12-09",
    did: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla",
    doing_next: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla",
    blockers: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla"
  });

  const headers = {
    "Content-Type": "application/json",
    Cookie: SESSION,
  };

  const res = http.post(`${BASE_URL}/journals/create`, payload, { headers });

  check(res, {
    "POST create journal OK": (r) => r.status === 201 || r.status === 200,
  });

  try {
    return JSON.parse(res.body).data.id;
  } catch {
    return null;
  }
}

function testUpdateJournal(id) {
  if (!id) return;

  const payload = JSON.stringify({
    user_id:114,
    group_id:4,
    entry_date:"2025-12-09",
    did: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla",
    doing_next: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla",
    blockers: "BlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlablaBlabla"
  });

  const headers = {
    "Content-Type": "application/json",
    Cookie: SESSION,
  };

  const res = http.put(`${BASE_URL}/journals/${id}`, payload, { headers });

  check(res, {
    "PUT update journal OK": (r) => r.status === 200,
  });
}

function testDeleteJournal(id) {
  if (!id) return;

  const res = http.del(`${BASE_URL}/journals/${id}`, null, {
    headers: { Cookie: SESSION },
  });

  check(res, {
    "DELETE journal OK": (r) => r.status === 200,
  });
}


function testGetUsers() {
    const res = http.get(`${BASE_URL}/users`, { headers: { Cookie: SESSION } });
    check(res, { "GET users 200": (r) => r.status === 200 });
}
  
function testGetGroups() {
    const res = http.get(`${BASE_URL}/groups`, { headers: { Cookie: SESSION } });
    check(res, { "GET groups 200": (r) => r.status === 200 });
}

export default function () {
    // Test user session
    testGetUserSession();

    // Journal actions
    testGetJournals();
    const id = testCreateJournal();
    testUpdateJournal(id);
    testDeleteJournal(id);

    // users and groups
    testGetUsers();
    testGetGroups();
    testGetUserSession();
}
