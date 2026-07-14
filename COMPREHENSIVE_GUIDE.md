# Comprehensive System Guide (V2)
**Bishop Martin Document Request Portal**

This authoritative guide exhaustively documents every architectural decision, strict business rule, and operational flow powering the Document Request Portal (V2). It serves as the master blueprint for backend logic, front-end integrations, and staff procedures. 

---

## 1. The 4-Tier Hierarchy (User Roles & Permissions)
The system employs a strict, JSON Web Token (JWT)-enforced Role-Based Access Control (RBAC) model. The middleware rigorously checks roles before any route execution.

### Tier 1: Parents and Past Students (End-Users)
- **Account Creation**: Users self-register, defining their `user_type` explicitly as either `parent` or `past_student`.
- **Identity & Age Verification (Strict Rule)**: **EVERY** registering user (both parents and past students) must provide their valid Date of Birth (`dob`).
- **Past Student Restrictions (Strict Rule)**:
  - If a user selects `past_student`, the backend automatically calculates their age using the provided `dob`. 
  - The system will **block** the registration entirely if the calculated age is under 18.
  - Past students are systematically restricted: they are **ONLY permitted to request Transcripts**. All other document types are hidden and blocked for them at the API level.
- **ID Verification Flow**:
  - The application links ID verification to each document request. Every request must be submitted with an uploaded copy of the parent/requester's ID card.
  - All new requests are initially set to `pending_verification`. Staff must verify the uploaded ID directly from the request's details view.
  - Once staff approves the ID, the request progresses to `pending` (if payment is required) or `processing` (if automated or already paid).

### Tier 2: Viewers (e.g., Principal)
- **Purpose**: A read-only analytical account meant for high-level administration/principals who need full visibility of the school's operational queues without the risk of structurally altering data.
- **Constraints**: Middlewares securely sandbox this role. They are strictly limited to `GET` requests across the board. Any attempt to execute `POST`, `PUT`, `PATCH`, or `DELETE` commands (e.g., trying to delete a request, approve an SSN, or modify staff) will result in an immediate `403 Forbidden` rejection from the server.

### Tier 3: Admins (e.g., Accounts Clerk, Office Staff)
- **Purpose**: The core workforce of the portal.
- **Capabilities**: They have standard operational power. This includes:
  - Viewing the massive data tables containing parent requests.
  - Visually verifying uploaded Bank Payment Image receipts and marking them as approved.
  - Visually verifying SSN cards and marking the parent's identity as "verified".
  - Updating document request statuses manually (e.g., moving a letter from `pending` -> `ready_for_pickup`).
- **Constraints**: They cannot access Super Admin functionality, meaning they cannot register new staff accounts, alter Tier 2 accounts, or physically delete historical records from the cluster.

### Tier 4: Super Admins (e.g., IT Technician / System Administrator)
- **Purpose**: The ultimate system override accounts.
- **Capabilities**: They inherit all Admin capabilities but have exclusive clearance to the `/superadmin` endpoint space.
  - Can register and provision new Admin or Viewer accounts (`POST /superadmin/staff`).
  - Can safely and permanently delete corrupted or fraudulent accounts via explicit database queries.

---

## 2. Document Generation Engine & Strict Request Rules

The behavior of every request is centrally coordinated by the `document_types` database matrix. This dictates if a document is "Automated" (`is_auto_generated: true/false`) or if it requires banking verification (`requires_payment: true/false`).

> [!IMPORTANT]
> ### The Universal Crucial Rule: Student Name
> **Regardless of the exact type of request—whether it is a free automated absence slip, a paid verification letter, or a past student transcript—the student's FULL NAME is explicitly and irrevocably REQUIRED in the payload.** 
> 
> The system will immediately reject any request payload missing the student's full name. This is necessary because every request, manual or automated, relies on this identifier for correct database linkage, PDF generation, and historical archiving. Note that the Student ID/BEMIS ID field is no longer required or collected anywhere in the system.

### A. Simple / Manual Requests (Transcripts & General Letters)
- **Configuration**: `is_auto_generated: false`, `requires_payment: true`
- **Flow**:
  1. The user selects the document type (e.g., Transcript) from the front-end.
  2. The user uploads their government ID and inputs the mandatory **Student Name**.
  3. The API logs a blank, passive request in the database.
  4. The office staff is tasked to physically type out the letter or print the transcript themselves from internal school management systems.
  5. **Payment Process:** Because these documents incur a fee, the site will prominently display the proper Account Information (Bank Details) to the parent. The parent must then perform a bank transfer and upload proof of payment (e.g. a receipt image) via the front-end to the `POST /payment/upload-receipt` endpoint. Until this proof of payment is uploaded by the user and verified by an Admin, the request will remain paused and will not progress to `ready_for_pickup`.

### B. Automated Submissions (Absence, Lateness, Standard Permissions)
These are not traditional document "requests" that parents physically pick up. Instead, they function strictly as official **submissions** to the institution.
- **Configuration**: `is_auto_generated: true`, `requires_payment: false`
- **Flow**:
  1. The user selects an automated submission type (e.g., Lateness Slip).
  2. The user uploads their government ID and provides the mandatory **Student Name**.
  3. The front-end renders a custom sub-form collecting `form_data` (e.g., "Reason for lateness: Missed the bus").
  4. The parent is required to use their touchscreen/mouse to physically draw their signature on an HTML canvas.
  5. The front-end packages the **Student Name**, the JSON `form_data`, the ID file, and a base64 string of the signature (`signature_image`) and fires it to the API.
  6. **The Backend PDF Engine**: Our server intercepts these data points, immediately boots up `pdfkit`, and dynamically paints a perfectly formatted PDF document. It stamps the Student Name, Reason, and explicitly embeds the drawn signature onto the document's signature line. 
  7. **Internal Retention:** The final PDF is automatically generated and saved directly to the school's active server directory. It is then held securely by the school for their internal records without any manual data entry required. The parents are not prompted to pick up these documents.

---

## 3. Front-End Integration Blueprint

For the Front-End (React, Next.js, or HTML/JS) to interface properly and cleanly with our robust backend, strictly follow these structural blueprints:

### I. The Unified Authentication Protocol
A single, universal endpoint (`POST /auth/login`) handles all 5 tiers of users seamlessly.
1. The UI holds one identical login dialog asking for an `email` and `password`.
2. The user submits this payload.
3. The server hunts across the databases, resolves their identity, and injects a heavily customized JWT and metadata block.
   - Parent Payload Example: `{ "token": "ey...", "type": "parent" }`
   - Staff Payload Example: `{ "token": "ey...", "type": "staff", "role": "super_admin" }`
4. **Front-End Action**: The Javascript client must read this exact `type` and `role` string and instantly divert the traffic to the correct React Router tree (`if (res.type === 'parent') { navigate('/dashboard/parents') }`). **Do not build separate login menus.**

### II. Registration Screens (`POST /auth/register`)
- Requires a prominent dropdown selector for **Role**: ('Parent' or 'Past Student'). 
- If the user selects **'Past Student'**, the UI must conditionally reveal a Date Picker. **The backend validation will crash if `dob` is omitted or if they are under 18.**

### III. Parent & Past Student Dashboards
- **Crucial Component**: A clear form requesting the **Student Name**, strictly enforced before activating the "Submit Request" button.
- **In-Wizard ID Upload**: The request wizard contains an **Identity Verification** step (Step 2) requiring the parent/requester to upload their government ID file before continuing.
- **Dynamic Render Logic**:
  - When the user selects a document from the dropdown. 
  - If the document is `is_auto_generated: true`: Reveal the reason input text boxes and the HTML Canvas Signature pad. Hide everything else.
  - If the document is `requires_payment: true`: Hide the signature pad. Show a screen detailing the School's Bank Details (`GET /payment/instructions`). Offer an image drop-zone for bank transfer receipts.
- **History List**: A clean, unified table fetching `GET /requests/my-requests`, visibly showing the status of their current requests (`pending_verification`, `pending`, `ready_for_pickup`).

### IV. Staff Dashboard (Office/Admin Portal)
- A powerful, highly-responsive Data Table populated from `GET /staff/requests`. 
- **Required UI Triggers**:
  - A button rendering a modal to view uploaded Bank Payment slips, with "Approve Payment" and "Reject Payment" buttons.
  - A card on the request details page displaying the uploaded ID file, with "Approve ID" and "Reject ID" buttons.
  - A dropdown selector on each request row that patches the status to "Ready for Pickup" when the document is physically prepared, triggering the final notification to the parent.

### V. Super Admin Control Panel (3-Tab Orchestration)
The SuperAdmin console is architected into three dedicated, full-width zones to maximize breathing room and clarity:
1. **STAFF REGISTRY**: A comprehensive full-width table for managing the active node cluster.
2. **PROVISION NEW STAFF**: A focused, clean zone for onboarding new personnel.
3. **PUBLIC USERS**: An expansive table for managing parent and past student accounts.

---

## 5. Design Philosophy: The "Space-First" Standard

To maintain the portal's elite, premium feel, all developers must adhere to the **Space-First** methodology. This is the antidote to "janky," cramped UIs and ensures a state-of-the-art administrative experience.

### I. The Padding Manifesto
- **Global Panels**: Every `glass-panel` must have a minimum internal padding of `2.5rem` to `3.5rem`. Never cram content to the edges.
- **Section Gaps**: Use massive vertical gaps (e.g., `mb-20` or `gap-16`) between major dashboard components.

### II. Unified Table Expansion
- All data registries must be **full-width**. Avoid tucking tables into side-columns unless strictly necessary for a secondary utility.
- Every table row must have high-contrast hover effects and generous cell vertical padding.

### III. Mobile Scroll Integrity
- **No Locked Viewports**: The use of `100vh` on the primary `app-container` or `html/body` is strictly prohibited. 
- **Native Scrolling**: Allow the document to flow naturally. Mobile users must be able to scroll through long lists without competing with internal overflow containers.

---

## 6. Unified Docker Architecture (Standard Deployment)

The portal is designed for high-availability "one-command" deployment.

### I. Reverse Proxy (Nginx)
The system uses an Nginx container as the **Standard Entrance**. It serves the compiled React assets and acts as a reverse proxy for all `/api` calls. This centralizes all traffic on Port 80 and eliminates CORS-related configuration overhead.

### II. Cross-Platform Compatibility
All Docker images are built using `alpine` variants, which provide native multi-architecture support. This ensures the system runs with optimized performance on Intel, AMD, and Apple Silicon (ARM) hardware without modification.

---

## 4. Docker Deployment & Local Development

This application is fully containerized and uses Docker Compose to seamlessly orchestrate both the Node.js API and the PostgreSQL database. **Zero manual configuration is required.**

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) installed and running on your machine.
- (Optional but recommended) Git to clone the repository.

### How to Run Successfully
1. **Clone the project** OR **Navigate** to the project directory in your terminal:
   ```bash
   cd Bishop_Martin_parentPortal
   ```
2. **Start the containers**:
   Run the following command to automatically build the API image, pull the Postgres database, execute the database seed files, and run the server:
   ```bash
   docker-compose up --build -d
   ```
   *The `-d` flag runs everything in the background (detached mode).*

3. **Verify the Deployment**:
   - The API will be active and listening at `http://localhost:3000`.
   - You can test it by visiting `http://localhost:3000/api/health` in your browser.
   - The PostgreSQL database is securely bound to port `5432` internally.

### Clean up and Stopping
- To stop the server gracefully, run:
  ```bash
  docker-compose down
  ```
- All uploaded images (SSN cards, receipts) and generated PDFs will persist safely in your local `uploads` directory automatically thanks to volume binding!

---
_Leave literally nothing to assumption. This document dictates the definitive standard operating procedures across the portal's entire technology stack._
