export function renderClassDirectory(containerEl) {
  containerEl.innerHTML = `
    <main class="directory">
      <h1>Class Directory</h1>
      <form aria-label="Search class directory">
        <label for="search">Search by Name or Role:</label>
        <input type="text" id="search" name="search" placeholder="Search by Name or Role">
      </form>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th scope="col">Photo</th>
            <th scope="col">Name</th>
            <th scope="col">Role</th>
            <th scope="col">Group</th>
            <th scope="col">Contact</th>
            <th scope="col">Availability</th>
          </tr>
        </thead>
        <tbody id="directory-table-body"></tbody>
      </table>
    </main>
  `;

  loadDirectory();
}

async function loadDirectory() {
    try {
        const response = await fetch('mock-class-directory.json');
        if (!response.ok) {
            return; // If mock not found, do nothing
        }

        const data = await response.json();
        const tbody = document.getElementById('directory-table-body');
        tbody.innerHTML = '';

        data.forEach(person => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td><img src="${person.photo_url || 'https://via.placeholder.com/40'}" alt="Photo of ${person.user_name}" width="40" height="40"></td>
            <td>${person.user_name}</td>
            <td>${person.role_name || '—'}</td>
            <td>${person.group_name || '—'}</td>
            <td><a href="mailto:${person.contact}">${person.contact}</a></td>
            <td>${formatAvailability(person.availability)}</td>
        `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Helper: Convert JSON availability to readable string
function formatAvailability(availability) {
    if (!availability) return '—';
    try {
        const obj = typeof availability === 'string' ? JSON.parse(availability) : availability;
        return Object.entries(obj)
            .map(([day, time]) => `${day}: ${time}`)
            .join(', ');
    } catch {
        return availability;
    }
}

