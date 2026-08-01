// sidebar.js

import { signOut } from "./signIn.js";

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");

  const toggleButton = document.getElementById("side_btn");
  const serverButton = document.getElementById("servers");
  const settingButton = document.getElementById("settings");
  const marketplaceButton = document.getElementById("thememarketplace");
  const logoutButton = document.getElementById("logout");

  let sidebarOpen = false;

  // Sidebar Toggle
  if (toggleButton && sidebar) {
    toggleButton.addEventListener("click", () => {
      sidebarOpen = !sidebarOpen;

      toggleButton.textContent = sidebarOpen ? ">" : "<";

      sidebar.classList.toggle("show");
      document.body.classList.toggle("sidebar-open");
    });
  }

  // Server Selection
  if (serverButton) {
    serverButton.addEventListener("click", () => {
      window.location.href = "../Pages/server_selection.html";
    });
  }

  // Settings
  if (settingButton) {
    settingButton.addEventListener("click", () => {
      alert("Settings are still a work in progress.");
    });
  }

  // Theme Marketplace
  if (marketplaceButton) {
    marketplaceButton.addEventListener("click", () => {
      alert("Theme Marketplace is still a work in progress.");
    });
  }

  // Logout
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await signOut();
      } catch (err) {
        console.error("Logout failed:", err);
        alert("Failed to log out.");
      }
    });
  }
});