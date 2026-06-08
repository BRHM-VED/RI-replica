document.addEventListener("DOMContentLoaded", () => {
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
                // Restore button so user can retry if needed
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                // Still redirect — don't block UX on backend errors
            }
        } else {
            console.warn("[RI] Firebase not configured");
        }

        const isBlog = window.location.pathname.includes("/blog/");
        window.location.href = isBlog ? "../thank-you.html" : "thank-you.html";
    }, true);
});

function collectFormData(form) {
    const data = {};

    // Named inputs via FormData
    const fd = new FormData(form);
    fd.forEach((value, key) => {
        if (key && value) data[key] = value;
    });

    // All visible inputs/selects/textareas (catches Framer's custom fields)
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
