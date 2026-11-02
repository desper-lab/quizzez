# Personality Quiz & Admin Architecture Documentation

## 1. System Overview
A lightweight, modular, and privacy-conscious personality quiz web application. It features a public-facing 10-question multiple-choice questionnaire evaluating 4 core archetypes (Thinker, Creator, Leader, Supporter) and a dedicated administrator dashboard (`/admin`) backed by an atomic local JSON database.

---

## 2. Architecture & File Structure

```
├── /data/
│   ├── submissions.json      # Persistent storage for quiz responses
│   └── logs.json             # Structured troubleshooting & audit logs
├── /src/
│   ├── types/
│   │   └── quiz.ts           # Unified TypeScript domain definitions
│   ├── data/
│   │   └── quizData.ts       # 10 scenario-based questions & archetype profiles
│   ├── server/
│   │   ├── storage.ts        # Atomic JSON I/O, scoring engine, OWASP sanitizers
│   │   └── apiMiddleware.ts  # Vite/Connect API endpoint handlers & rate limiting
│   ├── services/
│   │   └── api.ts            # Client HTTP service with error handling & offline fallback
│   ├── components/
│   │   ├── quiz/
│   │   │   └── QuizFlow.tsx  # Welcome view, 10-step question flow, result breakdown
│   │   └── admin/
│   │       └── AdminDashboard.tsx # PIN gate, metrics, submissions table, audit logs
│   ├── App.tsx               # Root view router & Top Bar Contract header
│   ├── main.tsx              # Application entry point
│   └── index.css             # Tailwind v4 styles with dark-mode custom variant
├── vite.config.ts            # Vite config with embedded API server plugin
├── metadata.json             # App metadata
└── DOCUMENTATION.md          # System reference manual
```

---

## 3. Endpoints & API Specification

| Method | Endpoint | Description | Security / OWASP Controls |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/submissions` | Submits participant answers & calculates archetypes | Input sanitization, max 16KB payload limit, rate limiting |
| `GET` | `/api/submissions` | Retrieves list of all submitted responses | Read-only JSON access with safe error handling |
| `POST` | `/api/admin/verify` | Validates admin PIN | Constant-time string comparison (`crypto.timingSafeEqual`) |
| `GET` | `/api/admin/logs` | Fetches chronological troubleshooting activity logs | Auditing of errors, warnings, and submissions |
| `POST` | `/api/admin/clear` | Clears all stored submissions | PIN-protected action, audited in log file |
| `GET` | `/api/health` | Service health status | Uptime and timestamp probe |

---

## 4. OWASP & Security Safeguards

1. **XSS & Injection Mitigation**: All participant names are strictly stripped of `<>` characters, filtered for dangerous URI schemes (`javascript:`), trimmed, and capped at 50 characters.
2. **Timing-Attack Resistance**: Admin PIN verification utilizes Node's `crypto.timingSafeEqual` with constant-time length matching to mitigate side-channel timing analysis.
3. **Denial of Service (DoS) Mitigation**:
   - Request bodies are rejected immediately if they exceed 16KB.
   - In-memory rate limiting throttles excessive requests per IP within sliding 60-second windows.
4. **Data Integrity & Atomic I/O**:
   - JSON database writes employ temporary file creation followed by atomic filesystem renaming (`fs.renameSync`) to eliminate partial-write or crash corruption.
5. **No Broken External Assets**:
   - Zero external third-party CDN or fragile photo dependencies. Clean vector Lucide icons and native SVG charts.

---

## 5. Admin Troubleshooting Guide

- **Access URL**: Navigate directly to `/admin` or click "Admin Dashboard" in the top bar.
- **Default PIN**: `1234`
- **Troubleshooting Logs**:
  - Open the **Troubleshoot Logs** tab inside `/admin`.
  - Check timestamps and severity levels (`INFO`, `WARN`, `ERROR`).
  - View event details including payload errors, rate-limiting triggers, and PIN verification attempts.
- **Data Export**:
  - Click the **CSV** or **JSON** download buttons above the submissions table to export records for external analysis.
- **Database Reset**:
  - Click **Reset Data** in the top bar and enter the admin PIN to wipe test submissions safely.
