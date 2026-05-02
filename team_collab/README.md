# SyncSpace — FinTech Product Delivery Hub

A premium, zero-dependency team collaboration platform designed specifically for FinTech teams to bridge Business and Engineering workflows.

## Chosen Vertical
**Product Delivery & Feature Launches (FinTech)**

## Personas
| Persona | Role | Focus |
|---------|------|-------|
| **Ananya Sharma** | Product Manager | Timelines, market fit, revenue impact |
| **Rahul Verma** | Full-Stack Developer | API security, database schema, clean code |
| **Priya Nair** | Compliance Officer | KYC/AML regulations, audit trails |
| **Dev Kapoor** | Site Reliability Engineer | Uptime, incident response, monitoring |

## Features
- **Kanban Board** — Drag-and-drop task management across 4 columns
- **Task Priorities** — Low / Medium / High / Critical with visual indicators
- **@Tagging** — Tag team members on tasks for visibility
- **Team Page** — View all members, roles, and task counts
- **Activity Log** — Track all board changes in real-time
- **Settings Page** — Manage API keys, export data, view security status
- **Search** — Filter tasks by title or @mention
- **Task Detail View** — Click any card for full details and delete option

## Google Services Used
1. **Google Gemini API** — AI Smart Assistant that summarizes the board, generates sub-tasks from business requests, and answers natural-language queries
2. **Google Fonts (Inter)** — Premium typography via Google CDN
3. **Google Cloud Run** — Production deployment with Dockerfile included
4. **Content Security Policy** — Restricts connections to Google APIs only

## Security
- **CSP Headers** — Meta tag enforces script/connect/style sources
- **XSS Prevention** — All user input is escaped via `escapeHTML()` before DOM insertion
- **Input Sanitization** — `sanitizeInput()` strips dangerous characters and enforces length limits
- **Prompt Injection Guard** — `sanitizePrompt()` blocks common injection patterns before sending to Gemini
- **No `innerHTML` with raw user data** — All user-generated content uses `textContent` or escaped HTML

## How to Run
1. Open `index.html` in any modern browser — **no build tools or npm required**
2. Enter any email and password to sign in
3. Optionally paste a [Gemini API key](https://aistudio.google.com/app/apikey) to enable the AI assistant
4. Open `test.html` to run the automated test suite (15 tests)

## Deployment (Google Cloud Run)
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud run deploy syncspace-app --source . --region us-central1 --allow-unauthenticated
```

## Architecture
- **Zero dependencies** — Pure HTML5 + CSS3 + Vanilla JS (~30 KB total)
- **localStorage** for instant offline-first persistence
- **Modular code** — Separated concerns (auth, board, team, assistant, security)
- **Accessible** — ARIA roles, labels, keyboard navigation, focus-visible outlines, semantic HTML
