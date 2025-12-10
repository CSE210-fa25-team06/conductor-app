import { renderAttendance } from './attendance.js';
import { renderStatistics } from './statistics.js';
import { renderClassDirectory } from './class-directory.js';
import { renderProfilePage } from './profile.js';
import { initCalendarSection } from "./widgets/calendar.js";

const VALID_SECTIONS = ['dashboard', 'directory', 'attendance', 'journal', 'profile', 'settings', 'statistics'];
const SECTION_NAMES = {
    'dashboard': 'Dashboard',
    'directory': 'Class Directory',
    'attendance': 'Attendance',
    'journal': 'Journal',
    'profile': 'Profile',
    'settings': 'Settings',
    'statistics': 'Statistics'
};

let currentUser = null;
let userPermissions = [];

const utils = {
    getCurrentSection() {
        const hash = window.location.hash.substring(1);
        return hash && VALID_SECTIONS.includes(hash) ? hash : 'dashboard';
    },

    showLoading(contentElement) {
        if (!contentElement) return;
        
        contentElement.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
            </div>
        `;
        contentElement.style.opacity = '0.7';
    },

    hideLoading(contentElement) {
        if (!contentElement) return;
        contentElement.style.opacity = '1';
    },

    updateActiveNav(section) {
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === section);
        });
    },

    hasPermission(requiredPermission) {
        return userPermissions.includes(requiredPermission);
    }
};

async function loadCalendarWidget(container) {
    // Create a placeholder div ABOVE the cards
    const calendarDiv = document.createElement("section");
    calendarDiv.id = "calendar-section";
    calendarDiv.style.marginBottom = "2rem"; // spacing above cards
    container.prepend(calendarDiv);

    // Load the calendar HTML widget
    const html = await fetch("../dashboard_widgets/calendar.html").then(r => r.text());
    calendarDiv.innerHTML = html;

    // Now initialize FullCalendar on the injected HTML
    initCalendarSection();
}

async function initializeDashboard() {
    try {
        console.log('Checking session...');
        
        // Check authentication
        const userData = await checkAuthentication();
        if (!userData) return;
        
        currentUser = userData.user;
        userPermissions = userData.user.permissions || [];
        
        // Update UI with user data
        updateUserUI(currentUser);
        
        // Setup UI components
        setupDashboardUI();
        
        // Load appropriate section based on URL
        loadInitialSection();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        redirectToLogin();
    }
}

async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error('Session invalid');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
            throw new Error('No valid user data');
        }
        
        return data;
    } catch (error) {
        console.error('Authentication check failed:', error);
        redirectToLogin();
        return null;
    }
}

function updateUserUI(user) {
    const userNameElement = document.getElementById('user-name-display');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
}

function setupDashboardUI() {
    setupSidebar();
    setupNavigation();
    setupEventListeners();
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-btn');
    
    if (!sidebar || !collapseBtn) {
        console.error('Sidebar elements not found');
        return;
    }
    
    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
        
        // Update icon
        const icon = collapseBtn.querySelector('i');
        icon.classList.toggle('fa-chevron-left', !sidebar.classList.contains('collapsed'));
        icon.classList.toggle('fa-chevron-right', sidebar.classList.contains('collapsed'));
    });
    
    // Hide settings if user doesn't have permission
    const sidebarSettings = document.getElementById('sidebar-settings');
    if (sidebarSettings && !utils.hasPermission('ASSIGN_ROLES')) {
        sidebarSettings.style.display = 'none';
    }
}

function setupNavigation() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('data-section');
            window.location.hash = section;
        });
    });
    
    // Home link
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection('dashboard');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function setupEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('hashchange', handleHashChange);
}

function loadInitialSection() {
    const section = utils.getCurrentSection();
    navigateToSection(section, true); // true = initial load (no animation)
}

function handleHashChange() {
    const section = utils.getCurrentSection();
    navigateToSection(section);
}

function navigateToSection(section, isInitialLoad = false) {
    if (!VALID_SECTIONS.includes(section)) {
        console.error(`Invalid section: ${section}`);
        return;
    }
    
    console.log(`Navigating to: ${section}`);
    
    // Update URL hash
    if (!isInitialLoad) {
        window.location.hash = section;
    }
    
    // Update navigation state
    utils.updateActiveNav(section);
    
    // Update breadcrumb
    updateBreadcrumb(section);
    
    // Update welcome section visibility
    updateWelcomeSection(section === 'dashboard');
    
    // Load section content
    if (section === 'profile' || section === 'settings') {
        loadDropdownSection(section, isInitialLoad);
    } else {
        loadSectionContent(section, isInitialLoad);
    }
}

function updateBreadcrumb(section) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = SECTION_NAMES[section] || 'Dashboard';
    }
}

function updateWelcomeSection(show) {
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
        welcomeSection.style.display = show ? 'block' : 'none';
    }
    document.body.classList.toggle('on-dashboard', show);
}

function loadSectionContent(section, isInitialLoad = false) {
    const content = document.getElementById('content-section');
    if (!content) return;
    
    // Show loading state
    utils.showLoading(content);
    
    // Load content with a small delay for smooth transition
    setTimeout(() => {
        try {
            switch (section) {
                case 'dashboard':
                    renderDashboardContent(content);
                    break;
                case 'directory':
                    renderClassDirectory(content);
                    break;
                case 'attendance':
                    renderAttendance(content);
                    break;
                case 'journal':
                    renderJournalSection(content);
                    break;
                case 'statistics':
                    renderStatistics(content);
                    break;
                default:
                    content.innerHTML = `<p>Section "${section}" not found.</p>`;
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            content.innerHTML = `<p class="error">Error loading ${section}: ${error.message}</p>`;
        }
        
        // Hide loading
        utils.hideLoading(content);
        
        // Setup card event listeners if on dashboard
        if (section === 'dashboard') {
            setupCardEventListeners();
        }
    }, isInitialLoad ? 0 : 250);
}

function loadDropdownSection(section, isInitialLoad = false) {
    const content = document.getElementById('content-section');
    if (!content) return;
    
    utils.showLoading(content);
    
    setTimeout(async () => {
        try {
            if (section === 'profile') {
                if (typeof renderProfilePage === 'function') {
                    renderProfilePage(content);
                } else {
                    throw new Error('Profile module not loaded');
                }
            } else if (section === 'settings') {
                await renderSettingsSection(content);
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            content.innerHTML = `<p class="error">Error loading ${section}: ${error.message}</p>`;
        }
        
        utils.hideLoading(content);
    }, isInitialLoad ? 0 : 250);
}

async function renderDashboardContent(container) {
    container.innerHTML = `
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
    container.classList.remove('centered');

    // Load the calendar ABOVE the cards
    await loadCalendarWidget(container);
}

function setupCardEventListeners() {
    // Card buttons
    document.querySelectorAll('.card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = e.currentTarget.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Whole cards
    document.querySelectorAll('.card[data-section]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-btn')) {
                const section = e.currentTarget.getAttribute('data-section');
                navigateToSection(section);
            }
        });
    });
}

async function renderJournalSection(container) {
    try {
        const response = await fetch('../journal.html');
        if (!response.ok) throw new Error('Failed to load journal');
        
        const html = await response.text();
        container.innerHTML = html;
        container.classList.remove('centered');
        console.log('renderJournalSection called');
        // Initialize journal module
        const { initJournals } = await import('./journal.js');
        initJournals();
    } catch (error) {
        console.error('Error rendering journal:', error);
        container.innerHTML = `<p class="error">Failed to load journal: ${error.message}</p>`;
    }
}

async function renderSettingsSection(container) {
    try {
        const response = await fetch('../settings.html');
        if (!response.ok) throw new Error('Failed to load settings');
        
        const html = await response.text();
        container.innerHTML = html;
        container.classList.remove('centered');
        
        // Initialize settings module
        const { initializeRoleAssignment } = await import('./role-assignment.js');
        await initializeRoleAssignment();
    } catch (error) {
        console.error('Error rendering settings:', error);
        container.innerHTML = `<p class="error">Failed to load settings: ${error.message}</p>`;
    }
}

function handleLogout(e) {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to log out?')) {
        return;
    }
    
    // Clear active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Send logout request
    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/index.html';
        })
        .catch(error => {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        });
}

function redirectToLogin() {
    window.location.href = '/index.html';
}

/** Mobile Nav Menu */

if (typeof window !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
        const mobileBtn = document.getElementById("mobile-menu-btn");
        const overlay = document.getElementById("mobile-nav-overlay");
        const closeBtn = document.getElementById("mobile-nav-close");
        const logoutMobile = document.getElementById("mobile-logout");

        if (!mobileBtn || !overlay) return;

        // Open menu
        mobileBtn.addEventListener("click", () => {
            overlay.classList.remove("hidden");
            overlay.classList.add("show");
        });

        // Close menu
        closeBtn.addEventListener("click", () => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.classList.add("hidden"), 250);
        });

        // Clicking outside panel closes it
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("show");
                setTimeout(() => overlay.classList.add("hidden"), 250);
            }
        });

        // Navigation clicks
        document.querySelectorAll(".mobile-nav-list li[data-section]")
            .forEach(item => {
                item.addEventListener("click", () => {
                    const section = item.dataset.section;
                    navigateToSection(section);
                    overlay.classList.remove("show");
                    setTimeout(() => overlay.classList.add("hidden"), 250);
                });
            });

        // Logout button
        if (logoutMobile) {
            logoutMobile.addEventListener("click", () => {
                handleLogout(new Event("click"));
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

if (typeof window !== 'undefined') {
    window.dashboard = {
        navigateToSection,
        getCurrentSection: utils.getCurrentSection,
        hasPermission: utils.hasPermission
    };
}
