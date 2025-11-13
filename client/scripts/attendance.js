// scripts/attendance.js
export function renderAttendance(containerEl) {
	containerEl.innerHTML = `
    <main class="attendance-container">
      <div class="controls">
        <div class="controls-row">
          <div class="controls-left">
            <div class="form-group">
              <label for="meetingDate">Meeting date:</label>
              <input type="text" id="meetingDate" class="date-input" placeholder="____/__/____">
            </div>
            <div class="form-group">
              <label>Meeting type:</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="lecture" name="meetingType">
                  <span>Lecture</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="informal" name="meetingType">
                  <span>Informal</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-row">
          <button type="button" class="sort-btn">Sort ⋯</button>
          <button type="button" class="submit-btn">Submit</button>
        </div>
      </div>

      <div class="student-list">
        <div class="student-row">
          <div class="student-avatar"></div>
          <div class="student-info">
            <div class="student-name">FName LName</div>
            <div class="student-group">Group N</div>
          </div>
        </div>
        <div class="student-row selected">
          <div class="student-avatar"></div>
          <div class="student-info">
            <div class="student-name">FName LName</div>
            <div class="student-group">Group N</div>
          </div>
        </div>
        <div class="student-row">
          <div class="student-avatar"></div>
          <div class="student-info">
            <div class="student-name">FName LName</div>
            <div class="student-group">Group N</div>
          </div>
        </div>
      </div>
    </main>
  `

	initAttendanceLogic()
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
