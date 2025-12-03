// scripts/attendance.js
export function renderAttendance(containerEl) {
  //same code as in dashboard.js
  fetch("../attendance.html")
    .then((resp) => {
      if (!resp.ok) throw new Error(resp.statusText || "Network error");
      return resp.text();
    })
    .then((html) => {
      containerEl.innerHTML = html;
      initAttendanceLogic()
    })
    .catch((err) => {
      containerEl.innerHTML = `<p>Failed to load attendance: ${err.message}</p>`;
      containerEl.style.opacity = 1;
    });
}

async function startMeeting() {
	//get session info (from dashboard page - should redirect if not logged in)
	const resp = await fetch('/api/auth/session', {
		cache: 'no-store'
	})

	if (!resp.ok) {
		window.location.href = '/index.html';
		return;
	}

	const data = await response.json();
	//successful login
	if (data.success && data.user) {
		//start meeting
		const meetingData = startMeeting(data.user.id);
		//create modal QR
		const qrModal = createQRModal();
		//initialize QR modal
		initQRModal(qrModal, meetingData.session_id, meetingData.qrImageDataUrl)
	}

	const qrModal = createQRModal();
	initQRModal(qrModal);
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
			body: JSON.stringify({payload})
		});

		if (!resp.ok) {
			throw new Error(`Fetch error. Status: ${resp.status}`)
		}

		const data = await resp.json();

		return data;
	}
	catch (error) {
    	console.error('Error starting attendance session:', error);
  	}
	
}

function initQRModal(qrModal, session_id, qr_code_img) {
	//initialize content of qrModal. needs to:
	//1. update QR code image to relevant meeting QR
	//2. create end meeting button listener to end current meeting
	//3. set up close button functionality to remove element from the DOM

	//1. update QR image
	const img = document.getElementById("qrImage");
	img.src = qr_code_img;

	//2. end meeting event listener
	const endMeetingBtn = document.getElementById("endMeeting");
	endMeetingBtn.addEventListener("click", () => endMeeting(session_id, qrModal));

	//3. close button event listener
	//TODO: Re-open modal if closed but session is not ended
	//this will need to be done once I can work with Isheta's changes (right now just a button)
	const removeModal = () => {
		qrModal.classList.remove('active');
		setTimeout(() => {qrModal.remove()}, 300);
	}
	const closeBtn = document.getElementById("closeModal");
	closeBtn.addEventListener("click", removeModal);
}

function endMeeting(meetingID, qrModal) {
	//end meeting - need to ensure user is authorized to end
	//the meeting they are trying to end
	try {
		const payload = {session_id: meetingID};
		const resp = fetch("attendance/end", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({payload})
		})

		if (!resp.ok) {
			throw new Error(`Fetch error. Status: ${resp.status}`);
		}

		const data = resp.json();

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
	const meetingBtn = document.getElementById("startMeetingBtn");
	meetingBtn.addEventListener("click", startMeeting)

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
