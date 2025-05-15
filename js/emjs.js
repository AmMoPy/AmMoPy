// Enhanced Modal Logic with Debug Logging
const modal = document.getElementById("contact-modal");
const contactLink = document.getElementById("contact-link");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("contact-form");
const statusDiv = document.createElement("div");

// Debug logging to console
function debugLog(message, data = {}) {
  console.log(`[Contact Form Debug] ${message}`, {
    timestamp: new Date().toISOString(),
    page: window.location.href,
    ...data
  });
}

// Add status message display to the form
statusDiv.id = "form-status";
statusDiv.style.marginTop = "10px";
statusDiv.style.padding = "5px";
statusDiv.style.borderRadius = "3px";
statusDiv.style.display = "none";
form.appendChild(statusDiv);

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.display = "block";
  statusDiv.style.backgroundColor = isError ? "#ffdddd" : "#ddffdd";
  statusDiv.style.color = isError ? "#990000" : "#006600";
}

// Open modal when "Contact" link is clicked
contactLink.addEventListener("click", async (e) => {
  e.preventDefault();
  debugLog("Contact link clicked, opening modal");
  modal.style.display = "block";

  // Reset status message and form
  statusDiv.style.display = "none";
  form.reset();

  // Fetch CSRF token from the backend
  debugLog("Fetching CSRF token from API");
  try {
    const response = await fetch("https://werdos.vercel.app/api/sendEmail", {
      method: "GET",
      credentials: "include", // Include cookies in the request
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    
    const data = await response.json();
    debugLog("CSRF token fetch successful", { status: response.status, data });
    
    // Check for cookies
    const hasCookies = document.cookie.includes('csrfToken');
    debugLog("Cookie check after fetch", { 
      cookiesExist: hasCookies,
      cookieString: document.cookie.length > 0 ? "Present (contents hidden)" : "Empty"
    });
    
  } catch (error) {
    debugLog("CSRF Token Error", { error: error.message });
    showStatus("Error preparing the contact form. Please try again later.", true);
  }
});

// Close modal when close button is clicked
closeBtn.addEventListener("click", () => {
  debugLog("Modal closed via close button");
  modal.style.display = "none";
});

// Close modal when clicking outside the modal
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    debugLog("Modal closed via outside click");
    modal.style.display = "none";
  }
});

// Sanitize inputs before processing
const sanitizeInput = (input) => {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  debugLog("Form submission initiated");

  const email = sanitizeInput(document.getElementById("email").value);
  const subject = sanitizeInput(document.getElementById("subject").value);
  const message = sanitizeInput(document.getElementById("message").value);

  debugLog("Form data collected", { 
    hasEmail: !!email, 
    hasSubject: !!subject, 
    messageLength: message.length 
  });

  // Show loading status
  showStatus("Sending message...");

  try {
    debugLog("Sending POST request to API");
    
    // Log cookie status before sending
    const hasCookies = document.cookie.includes('csrfToken');
    debugLog("Cookie status before POST", { 
      cookiesExist: hasCookies,
      cookieString: document.cookie.length > 0 ? "Present (contents hidden)" : "Empty"
    });
    
    const response = await fetch("https://werdos.vercel.app/api/sendEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify({ email, subject, message }),
    });

    const responseData = await response.json();
    debugLog("API response received", { 
      status: response.status, 
      responseData,
      headers: Array.from(response.headers.entries())
    });

    if (response.ok) {
      debugLog("Message sent successfully");
      showStatus("Message sent successfully!");
      setTimeout(() => {
        modal.style.display = "none"; // Close modal after success
      }, 2000);
    } else {
      throw new Error(responseData.error || "Failed to send message");
    }
  } catch (error) {
    debugLog("Error during form submission", { 
      errorMessage: error.message,
      errorStack: error.stack
    });
    showStatus(`Failed to send message: ${error.message}. Please try again.`, true);
  }
});