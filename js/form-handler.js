document.addEventListener("DOMContentLoaded", () => {
    // Load API base URL exclusively from .env on load
    let apiBaseUrl = null;
    fetch("/.env")
        .then(r => r.ok && r.text())
        .then(t => {
            const m = t && t.match(/^\s*API_BASE_URL\s*=\s*["']?(.*?)["']?\s*$/m);
            if (m && m[1]) {
                apiBaseUrl = m[1].trim();
                console.log("[RI] API Base URL loaded from environment:", apiBaseUrl);
            }
        })
        .catch(err => {
            console.error("[RI] Failed to load environment config:", err);
        });

    // Hash routing for thank-you popup
    window.addEventListener("hashchange", () => {
        if (window.location.hash === "#thank-you") {
            showThankYouModal();
        } else {
            closeThankYouModal();
        }
    });

    // Check on initial load
    if (window.location.hash === "#thank-you") {
        showThankYouModal();
    }

    document.body.addEventListener("submit", async (event) => {
        const form = event.target;
        if (!form || form.tagName !== "FORM") return;

        event.preventDefault();
        event.stopPropagation();

        const data = collectFormData(form);
        console.log("[RI] Form captured:", data);

        // Loading state on submit button
        const submitBtn = form.querySelector('[type="submit"], button[type="submit"], button');
        const originalText = submitBtn ? submitBtn.textContent : null;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending…";
        }

        // Save to Firebase
        if (window.__riFirebase) {
            try {
                await window.__riFirebase.saveFormToFirebase(data);
                console.log("[RI] Saved to Firebase successfully");
            } catch (err) {
                console.error("[RI] Firebase save failed:", err.message);
            }
        }

        // Send to API if base URL is resolved
        if (apiBaseUrl) {
            try {
                const isCareers = window.location.pathname.includes("careers");
                const getValue = (selector) => form.querySelector(selector)?.value?.trim() || "";
                
                const apiEndpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/${isCareers ? "CareersLeads" : "RI_WebLeads"}`;
                
                let payload = {};
                if (isCareers) {
                    const rawPhone = getValue('[name*="phone" i], [name*="mobile" i], [name*="contact" i], [placeholder*="phone" i], [placeholder*="mobile" i], #phone');
                    const digits = rawPhone.replace(/\D/g, "");
                    const phoneNumber = (digits.length === 12 && digits.startsWith("91")) ? digits.substring(2) : (digits.length > 10 ? digits.slice(-10) : digits);

                    payload = {
                        name: getValue('[name*="name" i], [placeholder*="name" i], #name'),
                        phoneNumber: phoneNumber,
                        email: getValue('[name*="email" i], [placeholder*="email" i], #email'),
                        location: getValue('[name*="location" i], [placeholder*="location" i], #location'),
                        linkedIn: getValue('[name*="linkedin" i], [placeholder*="linkedin" i], #linkedin'),
                        role: getValue('[name*="role" i], [placeholder*="role" i], #role, [name*="position" i]'),
                        resumeLink: getValue('[name*="resume" i], [placeholder*="resume" i], #resume, [name*="cv" i]'),
                        yearsOfExperience: getValue('[name*="experience" i], [placeholder*="experience" i], [name*="exp" i]'),
                        currentEmployer: getValue('[name*="employer" i], [placeholder*="employer" i], [name*="company" i], [placeholder*="company" i]'),
                        expectedSalary: getValue('[name*="salary" i], [placeholder*="salary" i], [name*="ctc" i], [placeholder*="ctc" i]'),
                        noticePeriod: getValue('[name*="notice" i], [placeholder*="notice" i]'),
                        readyToRelocate: getValue('[name*="relocate" i], [placeholder*="relocate" i]')
                    };
                } else {
                    payload = {
                        name: getValue('[name*="name" i], [placeholder*="name" i], #name'),
                        phoneNumber: getValue('[name*="phone" i], [name*="contact" i], [placeholder*="phone" i], [placeholder*="contact" i], #phone'),
                        email: getValue('[name*="email" i], [placeholder*="email" i], #email'),
                        message: getValue('[name*="message" i], [placeholder*="message" i], #message, [name*="enquiry" i], [placeholder*="enquiry" i]')
                    };
                }

                console.log("[RI] Hitting API:", apiEndpoint, payload);

                await fetch(apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error("[RI] API call failed:", err.message);
            }
        } else {
            console.error("[RI] API not called: API_BASE_URL not loaded from .env");
        }

        // Reset submit button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        // Route to thank-you popup modal on current page instead of redirecting
        window.location.hash = "thank-you";
    }, true);
});

function collectFormData(form) {
    const data = {};
    const fd = new FormData(form);
    fd.forEach((value, key) => {
        if (key && value) data[key] = value;
    });

    form.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.type === "hidden" || el.type === "submit") return;
        const value = el.value || "";
        if (!value) return;
        const key =
            el.name ||
            el.placeholder ||
            el.getAttribute("aria-label") ||
            el.getAttribute("data-framer-name") ||
            el.id ||
            null;
        if (key && !data[key]) data[key] = value;
    });

    return data;
}

// Modal HTML and CSS configuration
let modalElement = null;

const modalStyles = `
    .ri-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
    }
    .ri-modal-overlay.active {
        opacity: 1;
    }
    .ri-modal-card {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 12px 64px rgba(0, 0, 0, 0.15);
        padding: 48px 40px;
        text-align: center;
        max-width: 500px;
        width: 100%;
        position: relative;
        transform: translateY(30px);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Archivo', sans-serif;
    }
    .ri-modal-overlay.active .ri-modal-card {
        transform: translateY(0);
    }
    .ri-modal-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #888;
        line-height: 1;
        padding: 4px;
        transition: color 0.2s;
    }
    .ri-modal-close:hover {
        color: #1a1a1a;
    }
    .ri-modal-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 2px solid #d0c412;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        background: rgba(208, 196, 18, 0.08);
    }
    .ri-modal-icon svg {
        width: 32px;
        height: 32px;
    }
    .ri-modal-card h2 {
        font-size: 28px;
        font-weight: 700;
        color: #111;
        margin-bottom: 12px;
        letter-spacing: -0.3px;
        line-height: 1.2;
    }
    .ri-modal-card p {
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 32px;
    }
    .ri-modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
    }
    .ri-modal-btn {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-block;
    }
    .ri-modal-btn-primary {
        background: #d0c412;
        color: #1a1a1a;
        border: none;
    }
    .ri-modal-btn-primary:hover {
        opacity: 0.9;
    }
    .ri-modal-btn-secondary {
        background: transparent;
        color: #1a1a1a;
        border: 1.5px solid #1a1a1a;
    }
    .ri-modal-btn-secondary:hover {
        background: #1a1a1a;
        color: #fff;
    }
`;

function ensureModalCreated() {
    if (modalElement) return;

    // Inject styles
    const styleEl = document.createElement("style");
    styleEl.textContent = modalStyles;
    document.head.appendChild(styleEl);

    // Create modal DOM structure
    modalElement = document.createElement("div");
    modalElement.className = "ri-modal-overlay";
    modalElement.innerHTML = `
        <div class="ri-modal-card">
            <button class="ri-modal-close" aria-label="Close modal">&times;</button>
            <div class="ri-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <h2>Thank You!</h2>
            <p>Thank you for filling the form. We've received your request and our engineers will get in touch with you shortly.</p>
            <div class="ri-modal-actions">
                <button class="ri-modal-btn ri-modal-btn-primary ri-btn-home">GO TO HOME</button>
                <button class="ri-modal-btn ri-modal-btn-secondary ri-btn-projects">EXPLORE PROJECTS</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalElement);

    // Close button event
    modalElement.querySelector(".ri-modal-close").addEventListener("click", () => {
        closeThankYouModal();
    });

    // Close on overlay click
    modalElement.addEventListener("click", (e) => {
        if (e.target === modalElement) {
            closeThankYouModal();
        }
    });

    // Home button
    modalElement.querySelector(".ri-btn-home").addEventListener("click", () => {
        closeThankYouModal();
        window.location.href = "index.html";
    });

    // Projects button
    modalElement.querySelector(".ri-btn-projects").addEventListener("click", () => {
        closeThankYouModal();
        window.location.href = "architecture.html";
    });
}

function showThankYouModal() {
    ensureModalCreated();
    modalElement.style.display = "flex";
    setTimeout(() => {
        modalElement.classList.add("active");
    }, 10);
}

function closeThankYouModal() {
    if (!modalElement) return;
    modalElement.classList.remove("active");
    setTimeout(() => {
        modalElement.style.display = "none";
    }, 300);

    // Remove hash if present
    if (window.location.hash === "#thank-you") {
        history.pushState(null, "", window.location.pathname + window.location.search);
    }
}





