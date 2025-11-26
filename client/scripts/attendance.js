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

function initAttendanceLogic() {
	// Toggle student selection
	const studentRows = document.querySelectorAll('.student-row')
	studentRows.forEach((row) => {
		row.addEventListener('click', () => {
			row.classList.toggle('selected')
		})
	})

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
