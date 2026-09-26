# NexCampus — Complete AI-Powered College Super App, Student ERP, LMS & Institutional Website

A complete, production-ready, full-stack **College Management System, Student ERP, LMS & Public University Website** built strictly with **HTML5, CSS3, and Vanilla JavaScript (ES modules)** on the frontend, and **Node.js, Express.js, and MongoDB (Mongoose)** on the backend.

> **Zero-Setup Execution**: Automatic embedded MongoDB server fallback (`mongodb-memory-server`) ensures turnkey execution even if local MongoDB daemon is not running.

---

## 🌟 Architecture & Technology Stack

```text
Frontend (Vanilla HTML5 / CSS3 / ES Modules)
    ↓ Fetch API + Bearer JWT
Backend (Node.js + Express.js ESM REST API)
    ↓ Mongoose ODM
Database (MongoDB / Automatic In-Memory Embedded Fallback)
```

- **Frontend**: Pure HTML5, CSS3 Design System, Vanilla JavaScript (Fetch API, ES modules). No React, Vue, or Angular.
- **Backend**: Node.js (`"type": "module"`), Express.js, JWT RBAC Auth, Multer, ExcelJS, xlsx, PDFKit.
- **Database**: MongoDB + Mongoose with automatic embedded MongoDB fallback.
- **AI Engine**: Grounded Assistant with RAG over official university regulations & real student metrics.
- **Document Services**: Official PDF Hall Ticket generator, GST-compliant Fee Receipt PDF generator, Excel Defaulters import/export.

---

## 🚀 Quick Start Guide

### 1. Start the Server
```bash
npm start
```
*Or directly:*
```bash
node backend/server.js
```

### 2. Open in Browser
- **Public Institutional Website**: [http://localhost:5000/](http://localhost:5000/)
- **1-Click Role Login Gateway**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **REST API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👥 13 Role Portals with 1-Click Instant Switching

Visit `http://localhost:5000/login.html` and click on any card for instant single-click demo login:

| Role | Demo User | Portal Page | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | Aarav Kapoor | `student.html` | My Day Agenda, Attendance Tracker (<75% shortage alert), What-If Simulator, CIA Marks, Digital Hall Ticket with QR, Online Fee Payment simulation, Grounded AI Copilot |
| **Faculty** | Dr. Radhika Sharma | `faculty.html` | Today's Teaching Schedule, Attendance Roster with "Mark All Present", CIA Marks Entry, Assignment Publisher & Grading, LMS Notes Upload |
| **Admin** | Marcus Vance | `admin.html` | Institutional KPIs, User Directory with Active/Suspended status toggle, Admission Inquiries manager, Security Audit logs, CSV Reports |
| **HOD** | Dr. Arvind Verma | `hod.html` | Department Defaulters Console (<75% list), One-click Parent Notification, Faculty Workload Allocation, Excel Defaulters Export |
| **Parent** | Rajesh Kapoor | `parent.html` | Ward Progress, Attendance shortage alert in DBMS (70.0%), Online fee payment for ward, Contact Faculty Mentor |
| **Principal** | Dr. Eleanor Vance | `principal.html` | Institutional Benchmarks, Department Pass & Attendance comparison (CSE, ECE, ME, MBA), NIRF & NAAC metrics |
| **Accountant** | Vikram Joshi | `accountant.html` | Real-time Fee Ledger, Cash/DD/POS offline fee entry, Instant PDF Receipt download |
| **Exam Cell** | Suresh Menon | `exam-cell.html` | End-Semester Schedule Matrix, Batch Hall Ticket generation with automatic shortage withholding, Result publishing |
| **Placement Officer** | Ananya Rao | `placement.html` | Tier-1 Corporate Recruitment Drives (Google, Microsoft, Cisco), Automated Student Eligibility matching |
| **Librarian** | Sunita Rao | `librarian.html` | OPAC Book Catalog Search, One-click book issue/return, Overdue tracking |
| **Hostel Warden** | Kishan Lal | `hostel.html` | Inmate Capacity & Rooms, Curfew Biometrics, Digital Outpass Approval with QR code |
| **Transport Staff** | Mahesh Rawat | `transport.html` | Bus Fleet Tracking, Metropolitan Route Stops, Bus Pass allocation |
| **Event Coordinator** | Priya Sharma | `events.html` | Campus Fests, 36-Hour Hackathons (NexHacks), Student registrations |

---

## 🧪 Automated End-to-End Verification

To run the automated test suite testing health, inquiry creation, demo logins across all 13 roles, attendance breakdown, AI chat, and fee payments:

```bash
node scratch/test_portal.mjs
```

To test PDF generation (Hall Ticket and Fee Receipt with digital signatures):
```bash
node scratch/test_pdf.mjs
```

---

## 🔒 Security & Performance Features
- JWT Bearer Authentication + strict Role-Based Access Control (RBAC).
- Parameterized Mongoose queries preventing NoSQL injections.
- Helmet security headers with CSP configured for modern CDNs (Chart.js, FontAwesome, QRCode.js).
- High-contrast Dark Mode with automatic `localStorage` persistence.
- Fully responsive layout for Desktop, Tablet, and Mobile devices.

