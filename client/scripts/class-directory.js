// Import the Security Guard and the Permission Constants
import { protectComponent, PERMISSIONS } from './utils/auth-guard.js';

/**
 * Renders the Class Directory into the provided container.
 * Wraps the entire UI in the protectComponent guard.
 * @param {HTMLElement} containerEl - The DOM element to render into.
 */
export function renderClassDirectory(containerEl) {
  // 1. PROTECT THE COMPONENT
  // We pass the container, the specific permission required, and the callback code to run if allowed.
  protectComponent(containerEl, PERMISSIONS.VIEW_CLASS_DIRECTORY, async () => {
    
    // =========================================================================
    // AUTHORIZED CONTENT STARTS HERE
    // =========================================================================
    
    // 2. Render the UI Structure
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
          <tbody id="directory-table-body">
             <tr><td colspan="6">Loading directory data...</td></tr>
          </tbody>
        </table>
      </main>
    `;

    // 3. Attach Event Listeners
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            // Pass containerEl so we can wipe it on critical error
            await loadDirectory(query, containerEl);
        });
    }

    // 4. Initial Data Load
    await loadDirectory('', containerEl);
  });
}

/**
 * Fetches users from the API and populates the table.
 * @param {string} query - Search string
 * @param {HTMLElement} containerEl - Reference to main container (for full-page error handling)
 */
async function loadDirectory(query, containerEl) {
  try {
    const url = query
      ? `/users?query=${encodeURIComponent(query)}`
      : `/users?query=`;

    const response = await fetch(url);

    // FIX 1: Handle 403 Forbidden by replacing the ENTIRE container
    // This matches the Journal Page behavior (hiding the header/search).
    if (response.status === 403) {
       containerEl.innerHTML = `
            <div class="error">
                <h2>Access Denied</h2>
                <p>You do not have permission to view this content.</p>
            </div>
       `;
       return;
    }

    if (!response.ok) {
      console.error('Failed to fetch users');
      const tbody = document.getElementById('directory-table-body');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6">Error loading data.</td></tr>`;
      return;
    }

    const data = await response.json();
    const tbody = document.getElementById('directory-table-body');
    
    // Safety check if DOM element still exists
    if (!tbody) return; 
    
    tbody.innerHTML = '';

    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No results found</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('tr');
      
      // FIX 2: Sort roles alphabetically and use the dot separator
      const roleString = Array.isArray(user.roles) 
          ? user.roles.sort().join(' • ') 
          : '—';

      row.innerHTML = `
        <td><img src="${user.photo_url || 'https://via.placeholder.com/40'}" alt="Photo of ${user.name}" width="40" height="40"></td>
        <td>${user.name}</td>
        <td>${roleString}</td>
        <td>${user.group_name || '—'}</td>
        <td><a href="mailto:${user.email}">${user.contact_info || user.email}</a></td>
        <td>${formatAvailability(user.availability)}</td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error in loadDirectory:', error);
    // Optional: You could also wipe the container here on critical network failure
    const tbody = document.getElementById('directory-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6">Network error loading directory.</td></tr>`;
  }
}

/**
 * Helper: Convert JSON availability to readable string
 */
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