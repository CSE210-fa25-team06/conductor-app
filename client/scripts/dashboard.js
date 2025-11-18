import { renderAttendance } from './attendance.js'
import { renderClassDirectory } from './class-directory.js';

// This block runs when the page loads to check if the user is logged in.
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch user session data from the backend.
    // 'cache: "no-store"' makes prevents a cached page to a logged-out user.
    const response = await fetch('/api/auth/session', {
      cache: 'no-store' 
    });
    
    // server returns an error, the user is not logged in
    if (!response.ok) {
        window.location.href = '/index.html'; // Send them to the login page instead.
        return; // Stop running the rest of the script.
    }

    const data = await response.json();

    // server says the login was successful
    if (data.success && data.user) {
      // Put the user's real name on the page.
      document.getElementById('user-name').textContent = data.user.name;

      initializeDashboardUI();

    } else {
      // If something else went wrong, send them to the login page just in case.
      window.location.href = '/index.html';
    }
  } catch (error) {
    // catch errors, they can't be logged in.
    console.error('Session check failed:', error);
    window.location.href = '/index.html';
  }
});

/**
 * This function sets up all the buttons and links on the dashboard.
 * It only runs *after* we have confirmed the user is logged in.
 */
function initializeDashboardUI() {
  const profileBtn = document.getElementById("profile-btn");
  const dropdown = document.getElementById("dropdown");

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
          // update logout logic
          fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
              // redirect to the login page.
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
		let text = ''
		switch (section) {
			case 'profile':
				text = 'Profile content will appear here...'
				break
			case 'settings':
				text = 'Settings content will appear here...'
				break
		}
		content.innerHTML = `<p>${text}</p>`
		content.style.opacity = 1
	}, 250)
}

window.loadSection = loadSection;
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
      
      // Import and call initJournals after HTML is loaded
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
