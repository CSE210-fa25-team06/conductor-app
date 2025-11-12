document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");
  const statusText = document.getElementById("status");

  googleLoginButton.addEventListener("click", () => {
    statusText.textContent = "Redirecting to dashboard...";
    statusText.style.color = "gray";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  });
});
