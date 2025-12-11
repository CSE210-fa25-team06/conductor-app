// scripts/attendance.js

// Load attendance.html into container and initialize logic
export function renderAttendance(containerEl) {
  fetch("../attendance.html")
    .then((resp) => {
      if (!resp.ok) throw new Error(resp.statusText || "Network error");
      return resp.text();
    })
    .then((html) => {
      containerEl.innerHTML = html;
      initAttendanceLogic();
    })
    .catch((err) => {
      containerEl.innerHTML = `<p>Failed to load attendance: ${err.message}</p>`;
    });
}

/* -----------------------------
   MEETING START LOGIC
----------------------------- */

async function initAttendanceLogic() {
  startClock();
  const startBtn = document.getElementById("start-meeting-btn");
  const resp = await fetch('/api/auth/session', { cache: 'no-store' });
  const userRole = (await resp.json()).user.effectiveRoleName

  if (startBtn && ["Professor", "TA"].includes(userRole)) {
    startBtn.addEventListener("click", createQRAndStartMeeting);
  } else {
    startBtn.disabled = true;
  }
}

async function createQRAndStartMeeting() {
  // Validate session
  const resp = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!resp.ok) return (window.location.href = "/index.html");

  const data = await resp.json();
  if (!data.success || !data.user) return;

  // Create modal in DOM
  const qrModal = createQRModal();

  // Request backend to start meeting
  const meetingData = await startMeeting(data.user.id);

  if (!meetingData) {
    qrModal.remove();
    alert("Error starting meeting. Try again.");
    return;
  }

  // Populate modal with QR image + bind End button
  initQRModal(qrModal, meetingData.session_id, meetingData.qrImageDataUrl);
}

function startClock() {
  const clockEl = document.getElementById("giant-clock");
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* -----------------------------
   QR MODAL CREATION / CONTROL
----------------------------- */

function createQRModal() {
  const template = document.getElementById("QRModal");
  const qrModal = document.importNode(template.content, true);

  document.body.appendChild(qrModal);

  const modalRoot = document.getElementById("modalRoot");
  modalRoot.classList.add("active");

  // Close modal button
  const closeBtn = document.getElementById("closeModal");
  if (closeBtn) closeBtn.addEventListener("click", () => modalRoot.remove());

  return modalRoot;
}

function initQRModal(qrModal, sessionId, qrImg) {
  const img = qrModal.querySelector("#qr-image");
  if (img) img.src = qrImg;

  const endBtn = qrModal.querySelector("#endMeeting");
  if (endBtn) {
    endBtn.addEventListener("click", () => endMeeting(sessionId, qrModal));
  }
}

/* -----------------------------
   START / END MEETING API CALLS
----------------------------- */

async function startMeeting(uid) {
  try {
    const resp = await fetch("attendance/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid }),
    });

    if (!resp.ok) throw new Error(resp.status);

    return await resp.json();
  } catch (err) {
    console.error("Start meeting failed:", err);
    return null;
  }
}

async function endMeeting(sessionId, qrModal) {
  try {
    const resp = await fetch("attendance/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!resp.ok) throw new Error(resp.status);

    const data = await resp.json();

    if (data.success && !data.is_active) {
      qrModal.classList.remove("active");
      setTimeout(() => qrModal.remove(), 200);
      alert(`Meeting ${sessionId} ended.`);
    }
  } catch (err) {
    console.error("End meeting failed:", err);
  }
}
