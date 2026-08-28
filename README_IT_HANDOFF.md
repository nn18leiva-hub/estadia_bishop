# IT Handoff — External SIS / Student DB Integration

The portal features an abstracted adapter service (`src/services/studentService.js`) for querying external student databases/APIs without modifying codebase logic.

## 1. Environment Config (`.env`)
Set these environment variables to connect your external SIS API:

```env
USE_EXTERNAL_STUDENT_DB=true
EXTERNAL_STUDENT_DB_URL=https://your-api.bmhs.edu.bz/api/students
EXTERNAL_STUDENT_DB_KEY=your_optional_bearer_token
```

## 2. API Contract
Your endpoint should handle `GET {EXTERNAL_STUDENT_DB_URL}?q={query}` and return HTTP 200 with JSON matching:

```json
[
  {
    "student_id": "STU-1001",
    "full_name": "Alex Johnson",
    "class_grade": "Sr Science",
    "homeroom_teacher": "Mr. Robert Davis",
    "dob": "2008-04-12"
  }
]
```

## 3. Fallback
If `USE_EXTERNAL_STUDENT_DB=false` or if the external API request fails/times out (5s limit), the system falls back to the internal PostgreSQL `students` table.

---

## 4. School Email Setup (SMTP)

To connect the school's official email address (e.g., `notifications@bishopmartin.edu.bz`) for sending automated emails and password reset codes:

1. Open `.env` on your server and configure:

```env
# ── School Email SMTP Credentials ──────────────────────────────
SMTP_HOST=smtp.gmail.com                 # Or smtp.office365.com / mail server
SMTP_PORT=587                            # 587 (STARTTLS) or 465 (SSL)
SMTP_SECURE=false                        # Set 'true' if using port 465
SMTP_USER=notifications@bishopmartin.edu.bz
SMTP_PASS=your_app_password_here         # Google App Password or M365 App Password
SMTP_FROM="Bishop Martin High School" <notifications@bishopmartin.edu.bz>
```

> [!TIP]
> **Google Workspace / Gmail**: Turn on 2-Factor Authentication on the school email account, then generate an **App Password** under Security settings.
> **Microsoft 365**: Ensure **SMTP AUTH** is enabled for the sender mailbox in the M365 Admin Portal.

---

## 5. WhatsApp Business Gateway Setup

To dispatch automated WhatsApp notifications to parents:

1. Configure the gateway variables in `.env`:

```env
# ── WhatsApp Business Gateway ─────────────────────────────────
WHATSAPP_API_URL=https://api.whatsapp-gateway.com/v1/messages
WHATSAPP_API_TOKEN=your_whatsapp_bearer_token
WHATSAPP_SENDER_NUMBER=+5016000000       # School official WhatsApp number
```

2. Parent notifications (status updates, slip downloads, receipts) will automatically route to parents who registered via WhatsApp or provided a phone number.
