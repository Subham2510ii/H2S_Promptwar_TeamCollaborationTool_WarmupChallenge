# SyncSpace - FinTech Product Delivery Hub

**SyncSpace** is a lightweight, ultra-fast, and deeply integrated team collaboration platform designed to bridge the gap between FinTech Business teams and Engineering.

## Chosen Vertical
**Product Delivery & Feature Launches (FinTech)**
The standard agile workflow, tailored for finance. In FinTech, Business teams (like Product Managers) want to launch features quickly (e.g., "Instant Loans"), while Tech teams (Full-Stack Developers) need to ensure API security, database integrity, and clean code. 

**Personas:**
- **Persona A (Business)**: FinTech Product Manager. They care about timelines, market fit, and revenue impact.
- **Persona B (Tech)**: Full-Stack Developer. They care about API limits, database schema, and clean, secure code.

## Approach and Logic
To meet the challenge criteria (specifically Efficiency and the strict <10 MB size limit), the application was architected entirely using **Vanilla JavaScript, HTML5, and CSS3**. 
- By avoiding heavy build tools and `node_modules`, the codebase remains exceptionally clean and instantly executable in any browser without environment setup issues.
- **Glassmorphism UI** and CSS Custom Properties (variables) create a stunning, accessible, and responsive user interface.
- It dynamically falls back to a **Mock Mode** if Firebase credentials are not supplied, ensuring evaluators can still test the core logic and drag-and-drop capabilities.

## How the Solution Works
1. **Smart Assistant (AI Translation)**: The AI intercepts broad requests from the Product Manager and translates them into actionable technical sub-tasks for the developers (e.g., generating API endpoints and unit tests for decimal math).
2. **State Management**: A centralized `STATE` object manages the application's data. DOM manipulation is decoupled from data logic, ensuring clean updates.
3. **Real-time Synchronization (Google Services)**: Integrates deeply with **Google Firebase** (Auth & Firestore) via CDN imports. 
   - `onSnapshot` listeners automatically push changes across all connected clients instantaneously.
   - Authentication is handled securely via `signInWithEmailAndPassword` and `GoogleAuthProvider`.
4. **Drag & Drop**: Utilizes the native HTML5 Drag and Drop API to move task cards between columns, updating the underlying Firestore database on drop.

## Meeting the Evaluation Criteria
- **Code Quality**: Modular code structure (`app.js`, `firebase-config.js`), semantic HTML, and strict separation of concerns.
- **Security**: Input is sanitized using an `escapeHTML` utility function to prevent XSS attacks when rendering task descriptions. Highly critical in FinTech.
- **Efficiency**: Zero-dependency architecture. The entire project is less than 100 KB.
- **Testing**: A custom Vanilla JS test runner is included (`test.html` / `tests.js`) to validate logic and data transformations.
- **Accessibility**: High contrast colors, `aria-labels`, semantic tags (`<nav>`, `<main>`, `<aside>`), and keyboard-navigable elements.
- **Google Services Used**: Firebase Authentication, Cloud Firestore (Realtime DB), and hooks designed for Google Gemini API.

## Assumptions Made
1. **Environment Variability**: Assuming the reviewer might not have Node.js or `npm` globally configured in their PATH, the app is built to run natively in the browser.
2. **API Keys**: Firebase configurations and Gemini API keys are sensitive. The codebase includes placeholders, assuming the user will inject their own keys for production use. The app automatically enters "Mock Mode" with pre-filled FinTech data for evaluation purposes.

## Instructions: How to Run
1. Clone the repository to your local machine.
2. Navigate into the project folder.
3. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
   - *No build steps or `npm install` required!*
4. **Testing**: Open `test.html` in your browser to run the automated unit test suite.

### To enable Full Google Services:
1. Open `firebase-config.js` in a text editor.
2. Replace the `firebaseConfig` object with your own Firebase project credentials.
3. Refresh `index.html`—the app will now operate in live cloud mode, synchronizing across multiple browser windows!
