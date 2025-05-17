// Debug script to help diagnose loading issues
console.log("Debug script loaded successfully");

// Check if React loaded
console.log("React available:", typeof React !== "undefined");
console.log("ReactDOM available:", typeof ReactDOM !== "undefined");

// Check if other scripts loaded successfully
window.addEventListener("load", function () {
  console.log("Window loaded, checking script status");
  console.log("App.js loaded:", typeof App !== "undefined");
  console.log("Auth component available:", typeof Auth !== "undefined");

  // Show any scripts that failed to load
  const scripts = document.querySelectorAll("script");
  scripts.forEach((script) => {
    if (script.src && !script.dataset.loaded) {
      console.error("Script may have failed to load:", script.src);
    }
  });

  // Mark this script as successfully loaded
  console.log(
    "Debug complete - if you see this message, debug.js loaded correctly"
  );
});
