# Terra's Zero-Gravity Carbon Tracker 🌍

A modern, interactive, AI-powered carbon footprint tracker built with React Three Fiber, Framer Motion, and the Google Gemini API. This application provides a unique 3D zero-gravity experience where users can interact with everyday objects to calculate their carbon emissions and receive friendly, AI-driven eco-advice from "Terra", the animated Earth mascot.

---

## 🎯 Problem Statement Alignment

Our goal was to create an educational, non-judgmental, and highly engaging environmental tool. Instead of presenting users with boring forms and guilt-inducing charts, this application gamifies learning about carbon footprints. 

* **Engaging UI:** A 3D zero-gravity canvas draws users in and makes interaction intuitive.
* **Friendly Persona:** Terra acts as an eco-companion, utilizing the Gemini API to offer conversational, encouraging, and digestible feedback based on a static environmental knowledge base.
* **Actionable Advice:** Users are provided with specific, calculate-able metrics and actionable tips to reduce their footprint without feeling overwhelmed.

---

## 💻 Code Quality & Architecture

The application is built on a robust, modern stack focusing on maintainability and DRY principles.

* **Frontend:** React, React Three Fiber (R3F), `@react-three/drei`, `@react-three/rapier` (physics), and Tailwind CSS / custom vanilla CSS for styling.
* **Backend:** Express.js Node backend serving as an API gateway to the Gemini API.
* **Design Patterns:** 
  * Strict componentization (e.g., separating `Scene`, `FloatingObject`, and `Mascot`).
  * Procedural 3D geometries are heavily utilized alongside optimized `.glb` assets.
  * State management ensures seamless UI/UX transitions between 3D and 2D HTML Overlays.
* **Version Control & Repository:** Unnecessary bloat is avoided (total repo size < 10MB) by ignoring `node_modules` and build outputs (`dist`) via strict `.gitignore` rules.

---

## 🚀 Efficiency & Performance

High-performance 3D rendering in the browser requires strict adherence to WebGL constraints:

* **Anti-Re-render Optimization:** Animations and physics drift are handled imperatively within R3F's `useFrame` via `useRef`, explicitly avoiding React `useState` re-renders that would crash the 60fps loop.
* **Memory Leak Prevention:** All `THREE.Geometry` and `THREE.Material` instances are either declared declaratively using JSX elements or cached/memoized outside of the component body. The application does not instantiate new `THREE` objects in the render loop.
* **Frame-Rate Independence:** All animations use `delta` time provided by `useFrame` to ensure consistent physics simulation speed across different monitor refresh rates (60Hz vs 120Hz).
* **Asset Optimization:** External 3D models were aggressively optimized and shrunk to ensure rapid load times.

---

## 🔒 Security

We implemented defenses against the OWASP Top 10 vulnerabilities for LLM Applications:

* **Prompt Injection Defense:** Strict numerical and categorical input validation (`isNaN(Number(user_input))`) enforces boundaries before hitting the Gemini API, preventing users from hijacking the AI's persona.
* **XSS Sanitization:** The React UI treats all LLM output as untrusted data, safely rendering it as strings without `dangerouslySetInnerHTML`.
* **Rate Limiting:** The Express backend implements IP-based rate limiting using `express-rate-limit` to prevent "Denial of Wallet" attacks (unbounded consumption) and API abuse.
* **Authentication Security & Client-Side Key Exposure:** Securely leverages Google Application Default Credentials (ADC) via `google-auth-library` and strictly routes all traffic through the Node/Express backend reverse proxy to ensure the API credentials are never exposed to the client-side browser network tab.
* **Model Data Leakage / Sensitive Data Poisoning (LLM07):** PII Masking algorithms automatically strip out and redact sensitive user data (like emails, Social Security Numbers, and Credit Cards) from user chat payloads on the proxy server before they are ever transmitted to the Google Gemini API.

---

## 🧪 Testing

A robust three-tier testing strategy guarantees code reliability:

1. **3D Component Testing (Vitest & React Three Test Renderer):** 
   Headless rendering verifies that 3D meshes exist, tests for frame-rate independence, ensures imperative animations do not trigger React state, and validates that geometries do not leak memory via UUID tracking.
2. **2D & Security Testing (Vitest & Supertest):** 
   Verifies Mascot state transitions, ensures safe XSS handling, tests Express backend prompt-injection defenses, and enforces rate limits.
3. **End-to-End Visual Testing (Playwright):** 
   Automated browser tests ensure the WebGL canvas mounts, physics engines apply drift successfully, and simulated click interactions properly trigger the DOM modals.

---

## ♿ Accessibility (A11y)

* **Contrast:** High contrast ratios are maintained between the dark void background and neon floating labels.
* **Keyboard Navigation & Screen Readers:** The HTML DOM overlays (the modal, form inputs, and buttons) are fully navigable via keyboard (`Tab`, `Enter`).
* **ARIA Attributes:** ARIA labels (`aria-label`, `aria-hidden`) are utilized on buttons, modals, and the Mascot image to provide meaningful context to assistive technologies.
* **Reduced Motion:** While the application centers around a zero-gravity physics engine, physics logic can be bounded and interactive elements scale gracefully to avoid disorienting motion.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js
* Google Cloud SDK (for Application Default Credentials)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Setup your local environment variables in `.env`:
   ```env
   GOOGLE_CLOUD_PROJECT="your-project-id"
   ```
3. Authenticate locally with Google Cloud (ADC):
   ```bash
   gcloud auth application-default login
   ```

### Running the App
1. **Start the Express Backend Server:**
   ```bash
   npm run server
   ```
2. **Start the Vite Dev Server:**
   ```bash
   npm run dev
   ```

### Running Tests
* Run Unit & Security Tests: `npm run test`
* Run Playwright E2E Tests: `npm run test:e2e`
