document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");
  const statusText = document.getElementById("status");
  
  googleLoginButton.addEventListener("click", (e) => {
    e.preventDefault();
    
    statusText.textContent = "Redirecting to Google...";
    statusText.style.color = "#036";
    
    setTimeout(() => {
      window.location.href = "/api/auth/login";
    }, 300);
  });
});