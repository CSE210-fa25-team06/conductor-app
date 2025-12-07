// scripts/attendance.js
export async function renderAttendance(containerEl) {
  containerEl.innerHTML = `<div class="attendance-loading">Loading attendance...</div>`;

  try {
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    if (!sessionRes.ok) {
      window.location.href = "/index.html";
      return;
    }
    const sessionData = await sessionRes.json();
    if (!sessionData.success || !sessionData.user) {
      window.location.href = "/index.html";
      return;
    }

    const canManage = hasAttendancePermission(sessionData.user.permissions || []);
    containerEl.innerHTML = buildAttendanceLayout(canManage);

    if (canManage) {
      const startBtn = document.getElementById("startSessionBtn");
      startBtn?.addEventListener("click", createQRAndStartMeeting);
      document
        .getElementById("closeRosterBtn")
        ?.addEventListener("click", () =>
          document.getElementById("attendanceRoster").classList.add("hidden")
        );
    }

    await loadAttendanceSummary(canManage);
  } catch (err) {
    containerEl.innerHTML = `<p class="attendance-error">${err.message || "Failed to load attendance"}</p>`;
  }
}

function buildAttendanceLayout(canManage) {
  return `
    <section class="attendance-page">
      <div class="attendance-kpis">
        <div class="kpi-card">
          <p class="kpi-label">Events Attended</p>
          <p id="kpi-attended" class="kpi-value">--</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Events Missed</p>
          <p id="kpi-missed" class="kpi-value">--</p>
        </div>
      </div>
      <div class="attendance-week">
        <div class="attendance-week-header">
          <h3>Upcoming Week</h3>
          ${
            canManage
              ? `<button id="startSessionBtn" class="btn-primary">Start Attendance Session</button>`
              : ""
          }
        </div>
        <div id="attendanceEventList" class="attendance-event-list">
          <p class="attendance-loading">Loading events...</p>
        </div>
      </div>
      ${
        canManage
          ? `<div id="attendanceRoster" class="attendance-roster hidden">
              <div class="roster-header">
                <div>
                  <h3 id="rosterTitle">Event Details</h3>
                  <p id="rosterTime" class="roster-time"></p>
                  <p id="rosterLocation" class="roster-location"></p>
                </div>
                <button id="closeRosterBtn" aria-label="Close roster">×</button>
              </div>
              <div id="rosterAttendees" class="roster-list"></div>
            </div>`
          : ""
      }
    </section>

	<template id="QRModal">
        <div class="modal-overlay" id="modalRoot">
            <article class="modal-content">
                <section class="modal-header">
                    <h2 class="modal-title">Scan for Attendance</h2>
                    <button type="button" class="modal-close" id="closeModal">&times;</button>
                </section>

                <!-- using image to display the QR code, will update when I know what the endpoint returns -->
                <section class="centered-modal-body">
                    <!-- placeholder image to appease htmlhint -->
                    <img id="qr-image" src="https://icon-library.com/images/no-connection-icon/no-connection-icon-16.jpg" alt="QR code for meeting">

                    <button type="button" class="button" id="endMeeting">End Meeting</button>
                </section>
            </article>
        </div>
    </template>
  `;
}

function hasAttendancePermission(perms = []) {
  const allowed = [
    "MANAGE_ALL_ATTENDANCE",
    "GROUP_MANAGE_ATTENDANCE",
    "MANAGE_MEETING_MANAGER",
    "GROUP_MANAGE_METADATA"
  ];
  return perms.some(p => allowed.includes(p));
}

async function loadAttendanceSummary(canManage) {
  const listEl = document.getElementById("attendanceEventList");
  try {
    const res = await fetch("/api/events/summary/week");
    if (!res.ok) throw new Error("Unable to load events");
    const data = await res.json();
    updateKpis(data.stats || {});
    renderUpcomingEvents(data.upcoming || [], canManage);
  } catch (err) {
    listEl.innerHTML = `<p class="attendance-error">${err.message}</p>`;
  }
}

function updateKpis(stats) {
  const attendedEl = document.getElementById("kpi-attended");
  const missedEl = document.getElementById("kpi-missed");
  if (attendedEl) attendedEl.textContent = Number(stats.attended || 0);
  if (missedEl) missedEl.textContent = Number(stats.missed || 0);
}

function renderUpcomingEvents(events, canManage) {
  const listEl = document.getElementById("attendanceEventList");
  if (!listEl) return;

  if (!events.length) {
    listEl.innerHTML = `<p class="attendance-empty">No events scheduled for the upcoming week.</p>`;
    return;
  }

  listEl.innerHTML = events
    .map(
      event => `
        <article class="event-row">
          <div>
            <h4>${event.title}</h4>
            <p class="event-time">${formatRange(event.start_time, event.end_time)}</p>
            <p class="event-location">${event.location || "Location TBD"}</p>
          </div>
          ${
            canManage
              ? `<button class="event-manage-btn" data-event="${event.id}">View Roster</button>`
              : ""
          }
        </article>
      `
    )
    .join("");

  if (canManage) {
    listEl.querySelectorAll(".event-manage-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const eventId = Number(btn.dataset.event);
        if (Number.isFinite(eventId)) {
          openRoster(eventId);
        }
      });
    });
  }
}

async function openRoster(eventId) {
  const roster = document.getElementById("attendanceRoster");
  const rosterList = document.getElementById("rosterAttendees");
  if (!roster || !rosterList) return;

  rosterList.innerHTML = `<p class="attendance-loading">Loading roster...</p>`;
  roster.classList.remove("hidden");

  try {
    const res = await fetch(`/api/events/${eventId}`);
    if (!res.ok) throw new Error("Failed to load event");
    const data = await res.json();

    document.getElementById("rosterTitle").textContent = data.event.title;
    document.getElementById("rosterTime").textContent = formatRange(
      data.event.start_time,
      data.event.end_time
    );
    document.getElementById("rosterLocation").textContent =
      data.event.location || "Location TBD";

    if (!data.attendees.length) {
      rosterList.innerHTML = `<p class="attendance-empty">No attendees have been added for this event.</p>`;
      return;
    }

    rosterList.innerHTML = data.attendees
      .map(att => {
        const status = formatStatus(att.status || "Invited");
        return `
          <div class="roster-row">
            <div>
              <p class="roster-name">${att.name || att.email}</p>
              <p class="roster-email">${att.email || ""}</p>
            </div>
            <span class="status-pill status-${status.toLowerCase()}">${status}</span>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    rosterList.innerHTML = `<p class="attendance-error">${err.message}</p>`;
  }
}

function formatRange(start, end) {
  return `${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`;
}

function formatStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function createQRAndStartMeeting() {
	//get session info (from dashboard page - should redirect if not logged in)
	const resp = await fetch('/api/auth/session', {
		cache: 'no-store'
	})

	if (!resp.ok) {
		window.location.href = '/index.html';
		return;
	}

	const data = await resp.json();
	//successful login
	if (data.success && data.user) {
		//create modal QR
		const qrModal = createQRModal();
		//start meeting
		const meetingData = await startMeeting(data.user.id);
		//log link for testing
		console.log(meetingData.qrPayload)
		if (meetingData == null) {
			//temp fix - maybe we should have a placeholder img to display when
			//network failure?
			qrModal.classList.remove('active');
			setTimeout(() => {qrModal.remove()}, 300);
			alert("Error starting attendance session. Please try again.");
			return;
		}
		//initialize QR modal
		initQRModal(qrModal, meetingData.session_id, meetingData.qrImageDataUrl);
	}
}

function createQRModal() {
	//find QR code template
	const qrTemplate = document.getElementById("QRModal");
	const qrModalContent = qrTemplate.content;
	//have to make a deep copy of the content
	const qrModal = document.importNode(qrModalContent, true)

	//add element to DOM
	document.body.appendChild(qrModal);

	//return reference to modal
	const modalRoot = document.getElementById("modalRoot");
	modalRoot.classList.add("active");

	//TODO: Re-open modal if closed but session is not ended
	//this will need to be done once I can work with Isheta's changes (right now just a button)
	const removeModal = () => {
		modalRoot.classList.remove('active');
	}
	//setup modal close functionality here
	const closeBtn = document.getElementById("closeModal");
	closeBtn.addEventListener("click", removeModal);

	return modalRoot;
}

async function startMeeting(uid) {
	try {
		const payload = {user_id: uid};
		const resp = await fetch('attendance/start', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!resp.ok) {
			throw new Error(`Fetch error. Status: ${resp.status}`)
		}

		const data = await resp.json();

		return data;
	}
	catch (error) {
    	console.error('Error starting attendance session:', error);
		return null;
  	}
}

function initQRModal(qrModal, session_id, qr_code_img) {
	//initialize content of qrModal. needs to:
	//1. update QR code image to relevant meeting QR
	//2. create end meeting button listener to end current meeting

	//1. update QR image
	const img = qrModal.querySelector("#qr-image");
	img.src = qr_code_img;

	//2. end meeting event listener
	const endMeetingBtn = qrModal.querySelector("#endMeeting");
	endMeetingBtn.addEventListener("click", () => endMeeting(session_id, qrModal));
}

async function endMeeting(meetingID, qrModal) {
	//end meeting - need to ensure user is authorized to end
	//the meeting they are trying to end
	try {
		const payload = {session_id: meetingID};
		const resp = await fetch("attendance/end", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})

		if (!resp.ok) {
			throw new Error(`Fetch error. Status: ${resp.status}`);
		}

		const data = await resp.json();

		if (data.success && !data.is_active) {
			//success ending session, can safely destroy modal
			qrModal.classList.remove('active');
			setTimeout(() => {qrModal.remove()}, 300);
			alert(`Session ${meetingID} successfully ended.`)
		} else {
			throw new Error(`Session ${meetingID} still active.`)
		}
	} catch (error) {
		console.error(`Failed to end session: ${error}`);
	}
}

function initAttendanceLogic() {
	// Toggle student selection
	const studentRows = document.querySelectorAll('.student-row')
	studentRows.forEach((row) => {
		row.addEventListener('click', () => {
			row.classList.toggle('selected')
		})
	})

	// Start meeting button
	const meetingBtn = document.getElementById("start-meeting-btn"); 
	meetingBtn.addEventListener("click", createQRAndStartMeeting)

	// Date input formatting
	const dateInput = document.getElementById('meetingDate')
	dateInput.addEventListener('input', (e) => {
		let value = e.target.value.replace(/\D/g, '')
		if (value.length >= 4) value = value.slice(0, 4) + '/' + value.slice(4)
		if (value.length >= 7)
			value = value.slice(0, 7) + '/' + value.slice(7, 11)
		e.target.value = value
	})

	// Submit button
	document.querySelector('.submit-btn').addEventListener('click', () => {
		const selectedStudents = document.querySelectorAll(
			'.student-row.selected'
		)
		const date = document.getElementById('meetingDate').value
		const lecture = document.getElementById('lecture').checked
		const informal = document.getElementById('informal').checked

		console.log('Attendance submission:', {
			date,
			meetingType: { lecture, informal },
			attendees: selectedStudents.length,
		})

		alert(`Attendance recorded for ${selectedStudents.length} student(s)`)
	})

	// Sort button
	document.querySelector('.sort-btn').addEventListener('click', () => {
		alert('Sort options would appear here')
	})
}
