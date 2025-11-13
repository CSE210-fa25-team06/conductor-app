import { renderClassDirectory } from './class-directory.js';

document.addEventListener("DOMContentLoaded", () => {
  const userName = "<Name>";
  document.getElementById("user-name").textContent = userName;

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
          window.location.href = '/';
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
});

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
          text = "Attendance content will be here...";
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
  const content = document.getElementById("content-section");
  const welcomeSection = document.getElementById("welcome-section");
  welcomeSection.style.display = "none";

  content.style.opacity = 0;
  content.classList.add("centered");

  setTimeout(() => {
    let text = "";
    switch (section) {
      case "profile":
        text = "Profile content will appear here...";
        break;
      case "settings":
        text = "Settings content will appear here...";
        break;
    }
    content.innerHTML = `<p>${text}</p>`;
    content.style.opacity = 1;
  }, 250);
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
      
      // Import and call initJournals after HTML is loaded
      try {
        const { initJournals } = await import('./journal/journal.js');
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
