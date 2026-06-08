import urllib.request
import json
from datetime import datetime, timezone

PROJECT_ID = "ri-website-c476b"
API_KEY    = "AIzaSyCtblKBAeF04fG4icgvBsx-o00eb7RcjPk"

def to_fields(data):
    fields = {}
    for key, value in data.items():
        fields[key] = {"stringValue": str(value)}
    return fields

def save_to_firestore(collection, data):
    url = (
        f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}"
        f"/databases/(default)/documents/{collection}?key={API_KEY}"
    )
    payload = json.dumps({"fields": to_fields(data)}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())

def run_tests():
    print("\n=== Reidius Infra — Firebase Connection Test ===\n")

    tests = [
        ("enquiries", {
            "Name":          "Test User",
            "Phone number":  "+91 9000000000",
            "Email":         "test@example.com",
            "Plot Address":  "123, Vaishali Nagar, Jaipur",
            "submittedAt":   datetime.now(timezone.utc).isoformat(),
            "page":          "/consult-form",
            "source":        "CLI test",
        }),
        ("contacts", {
            "Name":        "Test Contact",
            "Phone Number":"+91 9111111111",
            "Email":       "contact@example.com",
            "Message":     "Test message from CLI",
            "submittedAt": datetime.now(timezone.utc).isoformat(),
            "page":        "/contact",
            "source":      "CLI test",
        }),
    ]

    for collection, data in tests:
        print(f"Writing to '{collection}'... ", end="", flush=True)
        try:
            result = save_to_firestore(collection, data)
            doc_id = result["name"].split("/")[-1]
            print(f"OK  →  Document ID: {doc_id}")
        except Exception as e:
            print(f"FAILED  →  {e}")

    print("\n✅ Check your Firebase console:")
    print(f"   https://console.firebase.google.com/project/{PROJECT_ID}/firestore/data\n")

if __name__ == "__main__":
    run_tests()
