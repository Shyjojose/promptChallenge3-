# Terra's Zero-Gravity Carbon Tracker 🌍

A modern, interactive, AI-powered carbon footprint tracker built with React Three Fiber, Framer Motion, and the Google Gemini API. This application provides a unique 3D zero-gravity experience where users can interact with everyday objects to calculate their carbon emissions and receive friendly, AI-driven eco-advice from "Terra", the animated Earth mascot.

> 🌍 **Live Demo:** [https://terra-tracker-503366840079.us-central1.run.app](https://terra-tracker-503366840079.us-central1.run.app)
>
> 📁 **GitHub Repository:** [https://github.com/Shyjojose/promptChallenge3-](https://github.com/Shyjojose/promptChallenge3-)

---

## 🎯 Chosen Vertical

**Sustainability & Environmental Awareness**

This project addresses the challenge of making carbon footprint education engaging, accessible, and actionable. Traditional environmental tools present raw data in tables and charts that fail to emotionally connect with users. Our solution gamifies the experience — turning everyday objects floating in a zero-gravity 3D space into interactive carbon calculators, guided by a friendly AI mascot named "Terra".

---

## 🧠 Approach & Logic

### Design Philosophy
Instead of showing numbers alone, we built an **experience**: a zero-gravity void where common objects (car, burger, laptop, plastic bottle, etc.) float around the user. Each object represents a real-world carbon source. The user clicks an object, enters their usage, and instantly receives a personalized, encouraging response from Terra.

### Technical Architecture

```
[React + R3F Frontend]
        ↓ (user clicks object)
[Input Modal: slider/numeric input]
        ↓ (user submits usage)
[Frontend calculates CO2]
   formula: usage × co2_per_unit_kg (from kb_data.json)
        ↓
[Express.js Backend Proxy /api/terra]
   - Validates input (numeric gate first, then regex injection blacklist)
   - Masks any PII from chat payloads (emails, SSNs, credit cards)
   - Applies IP-based rate limiting (max 10 req/60s window)
        ↓
[Google Gemini API (via Vertex AI / AI Studio)]
   - System prompt enforces Terra's persona
   - Returns JSON: { dialogue, emotion_state }
        ↓
[React UI Updates]
   - Terra mascot swaps image (happy / sweating / thinking)
   - Speech bubble types out Terra's dialogue (aria-live announced)
   - CO2 score animates into view with a coloured badge
   - Chat window opens for follow-up conversation
```

### Knowledge Base (`kb_data.json`)
The app tracks **12 everyday carbon sources**, each with:
- A static CO2 emission factor (kg CO2 per unit)
- A unit of measurement (miles, hours, servings, items, etc.)
- A pre-written actionable recommendation

| Object | CO2 Factor | Unit |
|---|---|---|
| Gasoline Car | 0.40 kg | per mile |
| Zuk Van | 0.50 kg | per mile |
| Air Conditioner | 0.50 kg | per hour |
| Beef Burger | 3.00 kg | per serving |
| Cotton Shirt | 2.10 kg | per item |
| Laptop Computer | 0.05 kg | per hour |
| Single-Use Plastic Bottle | 0.08 kg | per bottle |
| Plastic Coffee Cup | 0.15 kg | per cup |
| Imported Avocado | 0.20 kg | per serving |
| Plastic Rubber Duck | 0.10 kg | per item |
| Incandescent Light Bulb | 0.05 kg | per bulb |
| Digital Footprint (Cloud) | 0.02 kg | per GB |

---

## ⚙️ How the Solution Works

### User Journey (Step-by-Step)

1. **Land on the app** → A spinning 🌍 loading screen fades into a dark zero-gravity void with 12 everyday objects floating around. Terra (the Earth mascot) greets the user from the bottom-right corner.

2. **Click a 3D object** (e.g., the 🚗 Car) → An accessible input modal (`role="dialog"`) slides open, showing a slider labeled *"How many miles do you drive per day?"*.

3. **Enter usage data** → The frontend immediately computes:
   ```
   CO2 (kg) = daily_usage × co2_per_unit_kg
   ```

4. **Submit** → The calculated CO2 total, object name, and knowledge base recommendation are packaged into a prompt and sent to `/api/terra` on the Express backend.

5. **Backend processes the request**:
   - Runs strict numeric validation first (primary security gate)
   - Runs case-insensitive regex injection patterns as a secondary check
   - **Injects Context:** The backend dynamically injects the user's selected object, CO2 score, and `kb_data.json` tip into the system prompt so the chat remains highly relevant and focused.
   - **Token Budgeting:** Since Gemini 2.5 Flash utilizes internal "thinking tokens", the `maxOutputTokens` limit is explicitly raised to `1024` to prevent premature response truncation mid-sentence.
   - Calls the Gemini API and returns `{ dialogue, emotion_state }` or raw `{ text }` for chat JSON.

6. **React UI updates**:
   - Terra's image switches to match the `emotion_state` (`happy`, `sweating`, or `thinking`)
   - The `dialogue` text types out character-by-character in the speech bubble (announced via `aria-live`)
   - The CO2 score animates into view with a colour-coded badge
   - A context-aware chat window opens with suggested follow-up questions for Terra.

7. **Fallback** → If the Gemini API fails or returns invalid JSON, Terra displays a pre-written fallback message from `kb_data.json` so the UX never breaks.

---

## 📋 Assumptions Made

1. **CO2 emission factors are global static averages.** The values in `kb_data.json` are based on general IPCC/EPA published averages and are not adjusted for regional energy grids, vehicle types, or seasonal variation.

2. **Gemini is a conversational wrapper, not a calculator.** All CO2 arithmetic is performed deterministically on the frontend using `kb_data.json`. The LLM's only job is to rephrase the pre-calculated result into encouraging, conversational language. This prevents hallucinated figures.

3. **User inputs represent daily usage.** When a user inputs "50 miles", this is treated as their daily average.

4. **No real-time data feeds are used.** The application does not integrate live electricity grid data, live fuel prices, or live weather APIs. It is intentionally designed to be fast, offline-capable (minus the LLM call), and cost-predictable.

5. **Single user session model.** The app does not persist user data or track historical footprints across sessions. Each interaction is stateless.

---

## 💻 Code Quality & Architecture

The application is built on a robust, modern stack focusing on maintainability, DRY principles, and **zero-tolerance static analysis**.

* **Frontend:** React 18, React Three Fiber (R3F), `@react-three/drei`, `@react-three/rapier` (physics), Framer Motion, and custom vanilla CSS.
* **Backend:** Express.js Node backend serving as a secure API gateway to the Gemini API.
* **Design Patterns:**
  * Strict componentization: `Scene`, `FloatingObject`, `Mascot`, `Modal`, `HUD`, and `ChatWindow` are fully decoupled.
  * Complex render bodies are decomposed into focused sub-components (`MessageBubble`, `SuggestionChips`, `ChatInput`, `ObjectModel`) to keep cyclomatic complexity below 10 per function.
  * Procedural 3D geometries for key objects (Car, AC, Burger, Laptop) alongside optimized `.glb` assets for the rest.
  * CO2 total is derived deterministically from a `contributions` map inside a single `setState` call, eliminating stale closure bugs.
  * All `THREE.js` scene clones are memoized with `useMemo` to prevent re-instantiation on parent re-renders.
  * Global CSS design tokens via CSS custom properties (`var(--...)`) for consistent theming and scalable UI updates.
* **Backend Optimizations:**
  * Gemini/Vertex AI auth clients are cached at module startup, eliminating disk I/O on every API request.
  * API response parsing extracted into a dedicated `extractGeminiResponse()` helper to reduce branching complexity.
  * Token usage strictly bounded (`maxOutputTokens: 600`) and chat histories sliced to `MAX_HISTORY = 10` for cost and payload efficiency.
* **Version Control & Repository:** Unnecessary bloat is avoided (total repo size < 10MB) by ignoring `node_modules` and build outputs (`dist`) via strict `.gitignore` rules.

### Static Code Analysis & Formatting

The codebase enforces **zero linter errors and zero warnings** via automated tooling:

| Metric | Tool | Target | Status |
|--------|------|--------|--------|
| Syntax & Pattern Errors | ESLint v9 (Flat Config) | Zero errors / warnings | ✅ Achieved |
| Code Formatting | Prettier | Consistent across all files | ✅ Achieved |
| Cyclomatic Complexity | ESLint `complexity` rule | ≤ 10 per function | ✅ Achieved |
| Unused Imports / Dead Code | ESLint `no-unused-vars` | Zero warnings | ✅ Achieved |

**ESLint plugins configured:** `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-prettier`.

```bash
# Lint the entire codebase
npx eslint "src/**/*.{js,jsx}" "server/**/*.js"

# Auto-fix formatting issues
npx eslint "src/**/*.{js,jsx}" "server/**/*.js" --fix
```

---

## 🚀 Efficiency & Performance

High-performance 3D rendering in the browser requires strict adherence to WebGL constraints:

* **Anti-Re-render Optimization:** Animations and physics drift are handled imperatively within R3F's `useFrame` via `useRef`, explicitly avoiding React `useState` re-renders that would crash the 60fps loop.
* **Memory Leak Prevention:** All `THREE.Geometry` and `THREE.Material` instances are either declared declaratively using JSX elements or memoized (`useMemo`) outside the render loop. The application does not instantiate new `THREE` objects per frame.
* **Frame-Rate Independence:** All animations use `delta` time provided by `useFrame` to ensure consistent physics simulation speed across different monitor refresh rates (60Hz vs 120Hz).
* **Asset Preloading:** All GLB 3D model paths are preloaded via `useGLTF.preload()` at module initialization time, eliminating visible pop-in as the scene initializes.
* **Robust Error Handling:** Missing or malformed GLB models are wrapped in a `GLBErrorBoundary` to render fallback geometries without crashing the main React tree.
* **Loading Experience:** A smooth animated overlay (spinning 🌍 with fade-out) is displayed while the WebGL context and physics engine initialize, preventing a jarring blank-screen first impression.

---

## 🔒 Security

We implemented defenses against the OWASP Top 10 vulnerabilities for LLM Applications:

* **Prompt Injection Defense (LLM01):** A two-layer defense system: (1) strict numeric type validation as the primary gate (`isNaN(Number(user_input))`), (2) case-insensitive regex pattern matching as a secondary check to catch jailbreak variations like `IGNORE ALL INSTRUCTIONS`, `JaIlBrEaK`, etc.
* **XSS Sanitization:** The React UI treats all LLM output as untrusted data, safely rendering it as text strings without `dangerouslySetInnerHTML`.
* **Rate Limiting (LLM10):** The Express backend implements IP-based rate limiting using `express-rate-limit` — dropping the 11th request in a 60-second window with HTTP 429, preventing "Denial of Wallet" attacks.
* **Authentication Security:** Securely leverages Google Application Default Credentials (ADC) via `google-auth-library` in production (Vertex AI) with API key fallback for development (AI Studio). All traffic routes through the Node/Express backend reverse proxy — API credentials are **never** exposed to the client-side browser.
* **PII Masking (LLM07):** Custom middleware automatically redacts emails, Social Security Numbers, and credit card numbers from user chat payloads before they are transmitted to the Gemini API.
* **CORS Hardening:** The `cors` middleware reads `FRONTEND_URL` from environment variables, supporting both local development (`localhost:5173`) and production Cloud Run deployments without hardcoded origins.

### Implemented Backend Security Layers
* [x] **OWASP LLM01 Mitigation:** Numeric type validation + case-insensitive regex injection blacklist (catches typo/case variations).
* [x] **OWASP LLM07 Mitigation:** In-flight PII parsing middleware (emails, SSNs, credit cards redacted before Gemini call).
* [x] **OWASP LLM10 Mitigation:** IP/Session rate-limiter drops burst traffic on the 11th request with HTTP 429.

---

## 🧪 Testing

A robust three-tier testing strategy guarantees code reliability:

1. **3D Component Testing (Vitest & React Three Test Renderer):**
   Headless rendering verifies that 3D meshes exist, tests for frame-rate independence (scale advances further with larger `delta`), ensures imperative animations do not trigger React state re-renders, and validates that geometries do not leak memory across re-renders via UUID tracking.

2. **2D & Security Testing (Vitest & Supertest):**
   Verifies Mascot state transitions (happy → sweating on high CO2), ensures safe XSS handling (no `<script>` DOM injection), tests Express backend prompt-injection defenses (HTTP 400 on malicious input), and enforces rate limits with strict HTTP 429 assertions.
   * **Coverage:** Expanded to **37 tests** across 7 test files, comprehensively covering the React frontend (`App`, `ChatWindow`, `HUD`, `Modal`, `Mascot`, `FloatingObject`) and the Express backend.

3. **End-to-End Visual Testing (Playwright):**
   Automated browser tests ensure the WebGL canvas mounts, physics engines apply drift successfully, and simulated click interactions properly trigger the DOM modals.

### Running Tests
```bash
# Unit & Security Tests
npm run test

# Lint (zero errors / zero warnings)
npx eslint "src/**/*.{js,jsx}" "server/**/*.js"

# Playwright E2E Tests
npm run test:e2e
```

---

## ♿ Accessibility (A11y)

Full ARIA compliance is implemented across all interactive components:

* **Modal Dialog:** `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` linking to the object's title heading — enabling screen readers to correctly announce the modal context.
* **HUD Score Badge:** `role="button"`, `aria-expanded` (reflects collapse/expand state), and `onKeyDown` Enter key support for full keyboard navigation.
* **Chat Window:** Close button has `aria-label="Close Terra chat"`. The message list uses `role="log"` and `aria-live="polite"` so new messages are announced. The input field has `aria-label="Message to Terra"` (not just a placeholder).
* **Mascot Speech Bubble:** Wrapped in `aria-live="polite"` and `aria-atomic="true"` so every new Terra dialogue is announced to screen readers as it appears.
* **Mascot Image:** Descriptive `alt` text includes both the mascot name and current emotional state (e.g., `"Terra the Earth mascot, sweating"`).
* **Contrast:** High contrast ratios are maintained between the dark void background and neon labels/text elements.
* **Keyboard Navigation:** All interactive overlays (modal, form inputs, buttons, HUD) are fully navigable via `Tab` and `Enter`.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js v18+
* Google Cloud SDK (for Application Default Credentials)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Shyjojose/promptChallenge3-.git
   cd promptChallenge3-
   npm install
   ```
2. Setup your local environment variables in `.env`:
   ```env
   GOOGLE_CLOUD_PROJECT="your-project-id"
   GEMINI_API_KEY="your-api-key"      # Optional: use instead of ADC
   FRONTEND_URL="http://localhost:5173" # For CORS in development
   ```
3. Authenticate locally with Google Cloud (ADC):
   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project your-project-id
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
   The app will be available at `http://localhost:5173` (or the next available port).

### Cloud Deployment (Google Cloud Run)
```bash
gcloud run deploy terra-tracker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,FRONTEND_URL=https://terra-tracker-503366840079.us-central1.run.app \
  --project=your-project-id
```

---

## 📦 Project Structure

```
.
├── server/
│   ├── index.js          # Express API (CORS, rate limiting, PII masking, Gemini proxy)
│   └── server.test.js    # Supertest security & rate-limit tests
├── src/
│   ├── components/
│   │   ├── Scene.jsx         # R3F scene (stars, lights, physics walls, GLB preloading)
│   │   ├── FloatingObject.jsx # Per-object physics + hover/click + ObjectModel sub-component
│   │   ├── Modal.jsx          # Accessible input modal (role="dialog")
│   │   ├── Mascot.jsx         # Terra mascot + aria-live speech bubble
│   │   ├── HUD.jsx            # CO2 score panel with accessible keyboard toggle
│   │   ├── ChatWindow.jsx     # Chat with Terra + MessageBubble, SuggestionChips, ChatInput
│   │   ├── ProceduralCar.jsx  # Procedural THREE.js Car geometry
│   │   ├── ProceduralAC.jsx   # Procedural AC unit geometry
│   │   ├── ProceduralBurger.jsx
│   │   └── ProceduralLaptop.jsx
│   ├── data/
│   │   └── kb_data.json      # Knowledge base: 12 carbon sources
│   ├── App.jsx               # Root component + state management
│   └── index.css             # Global styles + CSS design tokens (30 tokens)
├── public/
│   └── images/               # Terra mascot WebP assets (happy/sweating/thinking)
├── eslint.config.js          # ESLint Flat Config (React, Hooks, a11y, Prettier, complexity)
├── .prettierrc               # Prettier formatting rules
├── Dockerfile                # Production container
├── index.html                # Entry HTML with OG/Twitter meta tags
└── playwright.config.js      # E2E test config
```
