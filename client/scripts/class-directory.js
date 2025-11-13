export function renderClassDirectory(containerEl) {
  containerEl.innerHTML = `
    <main class="directory">
      <h1>Class Directory</h1>
      <form aria-label="Search class directory" id="search-form">
        <label for="search">Search by Name:</label>
        <input type="text" id="search" name="search" placeholder="Search by first name">
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

  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    await loadDirectory(query);
  });

  // load all students by default (empty query)
  loadDirectory('');
}

async function loadDirectory(query) {
  try {
    const url = query
      ? `/users?query=${encodeURIComponent(query)}`
      : `/users?query=`; // backend expects 'query' param, even if empty

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch users');
      return;
    }

    const data = await response.json();
    const tbody = document.getElementById('directory-table-body');
    tbody.innerHTML = '';

    // Defensive: handle missing data.users
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No results found</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${user.photo_url || 'https://via.placeholder.com/40'}" alt="Photo of ${user.name}" width="40" height="40"></td>
        <td>${user.name}</td>
        <td>${Array.isArray(user.roles) ? user.roles.join(', ') : '—'}</td>
        <td>${user.group_name || '—'}</td>
        <td><a href="mailto:${user.email}">${user.contact_info || user.email}</a></td>
        <td>${formatAvailability(user.availability)}</td>
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
