import { renderAttendance } from './attendance.js'
import { renderClassDirectory } from './class-directory.js';
import { renderProfilePage } from './profile.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Checking session...');
    const response = await fetch('/api/auth/session', {
      cache: 'no-store' 
    });
    
    console.log('Session response status:', response.status);
    
    if (!response.ok) {
        console.log('Session not valid, redirecting to login');
        window.location.href = '/index.html'; 
        return; 
    }

    const data = await response.json();
    console.log('Session data:', data);

    // server says the login was successful
    if (data.success && data.user) {
      console.log('User authenticated:', data.user.name);
      
      const userNameElement = document.getElementById('user-name-display');
      
      if (userNameElement) {
        userNameElement.textContent = data.user.name;
      }
      
      initializeDashboardUI(data.user.permissions || []);
      setupSidebar();
      updateBreadcrumb('dashboard');

      console.log('Dashboard initialized successfully');

    } else {
      console.log('No valid user data, redirecting');
      window.location.href = '/index.html';
    }
  } catch (error) {
    // catch errors, they can't be logged in.
    console.error('Session check failed:', error);
    window.location.href = '/index.html';
  }
});

function initializeDashboardUI(userPermissions = []) {
  console.log('Initializing UI with permissions:', userPermissions);
  
  const sidebarLogout = document.getElementById('sidebar-logout');
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', function(e) {
      e.preventDefault();
      
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      if (confirm("Do you want to log out?")) {
        fetch('/api/auth/logout', { method: 'POST' })
          .then(() => {
            window.location.href = '/index.html';
          })
          .catch(error => console.error('Logout failed:', error));
      }
    });
  }

  const sidebarSettings = document.getElementById('sidebar-settings');
  if (sidebarSettings && !userPermissions.includes('ASSIGN_ROLES')) {
    sidebarSettings.style.display = 'none';
  }

  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      console.log('Clicked:', section);
      
      if (section === 'profile' || section === 'settings') {
        loadDropdownSection(section);
      } else {
        loadSection(section, e);
      }
    });
  });

  document.querySelectorAll('.card-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const section = this.getAttribute('data-section');
      loadSection(section, e);
    });
  });

  document.querySelectorAll('.card[data-section]').forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.closest('.card-btn')) {
        const section = this.getAttribute('data-section');
        loadSection(section, e);
      }
    });
  });

  const homeLink = document.getElementById("home-link");
  if (homeLink) {
    homeLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadSection("dashboard", e);
    });
  }
}

function setupSidebar() {
    console.log('Setting up sidebar...');
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-btn');
    
    if (!sidebar) {
        console.error('Sidebar element not found!');
        return;
    }
    
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
            
            const icon = collapseBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-left');
            }
        });
    }
    
    console.log('Sidebar setup complete');
}

function updateBreadcrumb(section) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        const sectionNames = {
            'dashboard': 'Dashboard',
            'directory': 'Class Directory',
            'attendance': 'Attendance',
            'journal': 'Journal',
            'profile': 'Profile',
            'settings': 'Settings'
        };
        breadcrumb.textContent = sectionNames[section] || 'Dashboard';
    }
}

function loadSection(section, event) {
  console.log('Loading section:', section);
  
  if (event) event.preventDefault();

  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    if (link.getAttribute('data-section') === section) {
      link.classList.add('active');
    }
  });

  const content = document.getElementById("content-section");
  const welcomeSection = document.getElementById("welcome-section");

  if (!content) {
    console.error('Content section not found!');
    return;
  }

  content.style.opacity = 0;
  updateBreadcrumb(section);

  setTimeout(() => {
    if (section === "dashboard") {
      content.innerHTML = `
        <div class="dashboard-cards">
          <div class="card" data-section="directory">
            <i class="fas fa-users card-icon"></i>
            <h3>Class Directory</h3>
            <p>View and manage all students and groups</p>
            <button class="card-btn" data-section="directory">Open Directory</button>
          </div>
          <div class="card" data-section="attendance">
            <i class="fas fa-clipboard-check card-icon"></i>
            <h3>Attendance</h3>
            <p>Track and manage class attendance</p>
            <button class="card-btn" data-section="attendance">Take Attendance</button>
          </div>
          <div class="card" data-section="journal">
            <i class="fas fa-book card-icon"></i>
            <h3>Journal</h3>
            <p>Review student journals and submissions</p>
            <button class="card-btn" data-section="journal">View Journals</button>
          </div>
        </div>
      `;
      
      setTimeout(() => {
        document.querySelectorAll('.card-btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const section = this.getAttribute('data-section');
            loadSection(section, e);
          });
        });
        
        document.querySelectorAll('.card[data-section]').forEach(card => {
          card.addEventListener('click', function(e) {
            if (!e.target.closest('.card-btn')) {
              const section = this.getAttribute('data-section');
              loadSection(section, e);
            }
          });
        });
      }, 0);
      
      if (welcomeSection) welcomeSection.style.display = "block";
      content.classList.remove("centered");
    } 
    else if (section === "journal") {
      renderJournal();
    }
    else {
      if (welcomeSection) welcomeSection.style.display = "none";
      content.classList.remove("centered");
      switch (section) {
        case "directory":
          renderClassDirectory(content);
          break;
        case "attendance":
          renderAttendance(content);
          break;
        default:
          console.error('Unknown section:', section);
          content.innerHTML = `<p>Section "${section}" not found.</p>`;
          content.style.opacity = 1;
          break;
      }
    }

    content.style.opacity = 1;
  }, 250);
}

function loadDropdownSection(section) {
  console.log('Loading dropdown section:', section);
  
  const content = document.getElementById('content-section');
  const welcomeSection = document.getElementById('welcome-section');
  
  if (!content) {
    console.error('Content section not found!');
    return;
  }

  if (welcomeSection) welcomeSection.style.display = 'none';

  content.style.opacity = 0;
  
  if (section === 'settings') {
    content.classList.add("centered");
  } else {
    content.classList.remove("centered");
  }
  
  updateBreadcrumb(section);

  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    if (link.getAttribute('data-section') === section) {
      link.classList.add('active');
    }
  });

  setTimeout(async () => {
    try {
      switch (section) {
        case 'profile':
          if (typeof renderProfilePage === 'function') {
            renderProfilePage(content);
          } else {
            console.error('renderProfilePage is not a function');
            content.innerHTML = '<p>Error: Profile module not loaded properly</p>';
          }
          break;
        case 'settings':
          renderSettings();
          break;
        default:
          console.error('Unknown dropdown section:', section);
          content.innerHTML = `<p>Section "${section}" not found.</p>`;
          break;
      }
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
      content.innerHTML = `<p>Error loading ${section}: ${error.message}</p>`;
    }
    
    content.style.opacity = 1;
  }, 250);
}

function renderSettings() {
  console.log('Rendering settings...');
  
  const content = document.getElementById('content-section');
  const welcomeSection = document.getElementById('welcome-section');
  
  if (!content) {
    console.error('Content section not found!');
    return;
  }

  content.classList.remove("centered");
  if (welcomeSection) welcomeSection.style.display = 'none';
  
  fetch('../settings.html')
    .then((resp) => {
      if (!resp.ok) throw new Error(resp.statusText || 'Network error');
      return resp.text();
    })
    .then(async (html) => {
      content.innerHTML = html;
      
      try {
        const module = await import('./role-assignment.js');
        await module.initializeRoleAssignment();
      } catch (err) {
        console.error('Error loading role assignment module:', err);
        content.innerHTML = '<p class="error">Failed to load module.</p>';
      }
      
      content.style.opacity = 1;
    })
    .catch((err) => {
      console.error('Failed to load settings:', err);
      content.innerHTML = `<p>Failed to load settings: ${err.message}</p>`;
      content.style.opacity = 1;
    });
}

function renderJournal(){
  console.log('Rendering journal...');
  
  const content = document.getElementById("content-section");
  const welcomeSection = document.getElementById("welcome-section");
  
  if (!content) {
    console.error('Content section not found!');
    return;
  }

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
      console.error('Failed to load journal:', err);
      content.innerHTML = `<p>Failed to load journal: ${err.message}</p>`;
      content.style.opacity = 1;
    });
    
  if (welcomeSection) welcomeSection.style.display = "none";
}

window.loadSection = loadSection;
window.loadDropdownSection = loadDropdownSection;