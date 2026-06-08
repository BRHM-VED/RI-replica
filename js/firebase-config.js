const FIREBASE_PROJECT_ID = "ri-website-c476b";
const FIREBASE_API_KEY    = "AIzaSyCtblKBAeF04fG4icgvBsx-o00eb7RcjPk";

const COLLECTION_MAP = {
    "consult-form": "enquiries",
    "contact":      "contacts",
    "careers":      "job_applications",
};

function getCollection() {
    const page = window.location.pathname
        .split("/").pop()
        .replace(".html", "") || "index";
    return COLLECTION_MAP[page] || "form_submissions";
}

// Convert a plain JS object to Firestore REST API field format
function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined || val === "") continue;
        fields[key] = { stringValue: String(val) };
    }
    fields.submittedAt = { timestampValue: new Date().toISOString() };
    fields.page        = { stringValue: window.location.pathname };
    return fields;
}

async function saveFormToFirebase(data) {
    const collection = getCollection();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}?key=${FIREBASE_API_KEY}`;

    const body = JSON.stringify({ fields: toFirestoreFields(data) });

    const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    return true;
}

window.__riFirebase = { saveFormToFirebase };
