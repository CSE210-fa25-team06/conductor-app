import { renderAttendance } from './attendance.js'
import { renderClassDirectory } from './class-directory.js';
import { renderProfilePage } from './profile.js';

// This block runs when the page loads to check if the user is logged in.
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store' 
    });
    
    if (!response.ok) {
        window.location.href = '/index.html'; 
        return; 
    }

    const data = await response.json();

    if (data.success && data.user) {
      document.getElementById('user-name').textContent = data.user.name;
      
      // FIX 1: Pass permissions to the UI initializer
      initializeDashboardUI(data.user.permissions || []);

    } else {
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Session check failed:', error);
    window.location.href = '/index.html';
  }
});

/**
 * Sets up buttons, links, and permission-based visibility.
 * FIX 1: Accepts permissions array to hide restricted links.
 */
function initializeDashboardUI(userPermissions = []) {
  const profileBtn = document.getElementById("profile-btn");
  const dropdown = document.getElementById("dropdown");
  const settingsOption = document.getElementById("settings-option");

  // SECURITY: Hide Settings link if user lacks permission
  // We check for the basic Admin permission 'ASSIGN_ROLES'
  if (settingsOption && !userPermissions.includes('ASSIGN_ROLES')) {
      settingsOption.style.display = 'none';
  }

  // Profile dropdown toggle
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    dropdown.classList.add("hidden");
  });

  // Dropdown links
  dropdown.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.textContent.toLowerCase();

      if (section === "log out") {
        if (confirm("Do you want to log out?")) {
          fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
              window.location.href = '/index.html';
            })
            .catch(error => console.error('Logout failed:', error));
        }
        return;
      }

      loadDropdownSection(section);
      dropdown.classList.add("hidden");
    });
  });

  // Home link
  document.getElementById("home-link").addEventListener("click", (e) => {
    e.preventDefault();
    loadSection("dashboard", e);
  });
};

// Navigation content
function loadSection(section, event) {
  if (event) event.preventDefault();

  document
    .querySelectorAll("nav a")
    .forEach((link) => link.classList.remove("active"));
  if (event && event.target.tagName === "A")
    event.target.classList.add("active");

  const content = document.getElementById("content-section");
  const welcomeSection = document.getElementById("welcome-section");

  content.style.opacity = 0;

  setTimeout(() => {
    let text = "";

    if (section === "dashboard") {
      text = "Dashboard content will appear here...";
      welcomeSection.style.display = "block";
      content.classList.remove("centered");
    } 
    else if (section === "journal") {
      renderJournal();
    }
    else {
      welcomeSection.style.display = "none";
      switch (section) {
        case "directory":
          renderClassDirectory(content);
          break;
        case "attendance":
          renderAttendance(content);
          break;
        case "journal":
          text = "Journal content will be here...";
          break;
        case "evaluation":
          text = "Evaluation content will be here...";
          break;
      }
    }

    if (text) {
      content.innerHTML = `<p>${text}</p>`;
    }
    content.style.opacity = 1;
  }, 250);
}

// Dropdown content
function loadDropdownSection(section) {
	const content = document.getElementById('content-section')
	const welcomeSection = document.getElementById('welcome-section')
	welcomeSection.style.display = 'none'

  content.style.opacity = 0;
  content.classList.add("centered");

	setTimeout(() => {
		switch (section) {
			case 'profile':
				renderProfilePage(content);
				break
			case 'settings':
				renderSettings();
				break
		}
        // Note: opacity is handled inside renderSettings for that case
        if (section !== 'settings') content.style.opacity = 1;
	}, 250)
}

// Render Settings page
function renderSettings() {
	const content = document.getElementById('content-section');
	const welcomeSection = document.getElementById('welcome-section');
	
	content.classList.remove("centered");
	welcomeSection.style.display = 'none';
	
	fetch('../settings.html')
		.then((resp) => {
			if (!resp.ok) throw new Error(resp.statusText || 'Network error');
			return resp.text();
		})
		.then(async (html) => {
			content.innerHTML = html;
			
			// Import and initialize the role assignment script
			try {
				const module = await import('./role-assignment.js');
                // FIX 2: Await the initialization so AuthGuard finishes checking
                // before we fade the content in.
                await module.initializeRoleAssignment();
			} catch (err) {
				console.error('Error loading role assignment module:', err);
                content.innerHTML = '<p class="error">Failed to load module.</p>';
			}
			
			content.style.opacity = 1;
		})
		.catch((err) => {
			content.innerHTML = `<p>Failed to load settings: ${err.message}</p>`;
			content.style.opacity = 1;
		});
}

function renderJournal(){
  const content = document.getElementById("content-section");
  const welcomeSection = document.getElementById("welcome-section");
  content.classList.remove("centered");
  fetch("../journal.html")
    .then((resp) => {
      if (!resp.ok) throw new Error(resp.statusText || "Network error");
      return resp.text();
    })
    .then(async (html) => {
      content.innerHTML = html;
      
      try {
        const { initJournals } = await import('./journal.js');
        initJournals();
      } catch (err) {
        console.error('Error loading journal module:', err);
      }
      
      content.style.opacity = 1;
    })
    .catch((err) => {
      content.innerHTML = `<p>Failed to load journal: ${err.message}</p>`;
      content.style.opacity = 1;
    });
  welcomeSection.style.display = "none";
  return;
}
window.loadSection = loadSection;