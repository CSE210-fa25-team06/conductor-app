document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");
  const statusText = document.getElementById("status");

  // Helper Function: Create and Show Toast
  function showToast(message, type = 'error') {
      const container = document.getElementById('toast-container');
      
      // 1. Create Element
      const toast = document.createElement('div');
      toast.className = `toast ${type}`; // Adds 'toast' and 'error' classes
      toast.textContent = message;
      
      // 2. Add to DOM
      container.appendChild(toast);

      // 3. Auto-remove after 4 seconds
      setTimeout(() => {
          toast.style.opacity = '0'; // Fade out
          // Wait for fade out transition to finish before removing
          setTimeout(() => toast.remove(), 600); 
      }, 4000);
  }

  // Check URL for Error
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error) {
    const messages = {
      'email_not_authorized': 'Access Denied: Please sign in with your @ucsd.edu email.',
      'server_error': 'System Error: Please try again later.',
      'login_failed': 'Login failed. Please try again.'
    };

    const userMessage = messages[error] || decodeURIComponent(error);
    
    showToast(userMessage, 'error');

    window.history.replaceState({}, document.title, window.location.pathname);
  }

  googleLoginButton.addEventListener("click", () => {
    statusText.textContent = "Connecting to Google...";
    statusText.style.color = "gray";
  });
});