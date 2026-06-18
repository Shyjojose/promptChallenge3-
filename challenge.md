## UI and Artifacts

### The Zero-Gravity 3D Concept
The design envisions an immersive, interactive "zero-gravity" space where everyday items float weightlessly. This visual metaphor represents how our daily habits and possessions "weigh" on the environment, even if we don't physically feel it.

### Everyday 3D Objects to Include
To make the carbon footprint calculator relatable, the following 3D models should be floating in the scene:
1. **Amazon/Delivery Package:** Represents online shopping, shipping, and packaging waste.
2. **Smartphone/Laptop:** Represents e-waste, electricity for charging, and the hidden carbon cost of data centers.
3. **Air Conditioner (AC Unit):** Represents high household energy consumption.
4. **Car (Sedan/SUV):** Represents daily commuting and fossil fuel usage.
5. **House/Apartment Building:** Represents heating, cooling, and overall household energy efficiency.
6. **Burger/Steak:** Represents the high carbon footprint of the meat and dairy industry.
7. **Airplane:** Represents the massive impact of air travel.
8. **Coffee Cup (Disposable):** Represents single-use plastics and daily consumer waste.

### Rendering the 3D Floating UI
To achieve this dynamic, interactive 3D web experience, modern web technologies should be used:

**1. Tech Stack:**
*   **Three.js / React Three Fiber (R3F):** The industry standard for rendering 3D graphics in the browser using WebGL. R3F allows building 3D scenes declaratively in React.
*   **Physics Engine (Rapier / Cannon.js):** To create the true "zero-gravity" effect, a physics engine like `@react-three/rapier` is used. By setting the world gravity to `[0, 0, 0]`, objects will drift aimlessly and bounce off each other realistically.
*   **3D Assets:** Models can be built or sourced using tools like **Spline** or **Blender**, then exported as `.glb` or `.gltf` files to be loaded into the scene.

**2. Interaction Process:**
*   **Floating State:** Objects drift slowly across the screen, rotating gently. They might have a slight glow to indicate they are interactive.
*   **Hover & Click (Pointer Events):** Using R3F's built-in pointer events (`onPointerOver`, `onClick`), the user can interact with the floating objects. Hovering might stop their drift or enlarge them slightly.
*   **Input Modal:** Clicking an object (e.g., the AC unit) pauses the background and brings up an overlay UI. The user inputs their usage (e.g., "3 ACs, running 24 hours").
*   **Dynamic Feedback (Clipart & Text):**
    *   *Warning State:* If the usage is excessively high, the UI displays alert/warning clipart (e.g., a sweating Earth or red sirens) along with a stark visualization of the carbon cost.
    *   *Green Action State:* Below the warning, a green, encouraging text box provides actionable, AI-driven recommendations on how to reduce this footprint (e.g., "Set the AC to 24°C to save 20% energy").
*   **Visual Transformation:** Once the user commits to a reduction goal, the 3D object could change visually (e.g., the dirty car turns into an EV, or the AC unit glows green) and its weight/speed in the zero-gravity simulation could adjust to reflect a "lighter" footprint.

### Backend Architecture
**Static Knowledge Base (Rule-Based + LLM):** 
Instead of a complex, expensive RAG (Retrieval-Augmented Generation) system, the backend should start with a **Static Knowledge Base**. 
*   **How it works:** Hardcode average emission factors (e.g., 1 AC running 24h = 70kg CO2) and standard actionable recommendations into a database or JSON file. For the LLM component, use the **Gemini API** to act as a formatter, taking the user's input, matching it to the static rules, and generating a conversational response.
*   **Why choose this:** It is highly performant, much faster to build, cheaper to run (fewer API calls/tokens), and perfectly suited for an educational MVP where rough averages are acceptable.

### The "Clippy" Earth Mascot
To make the AI agent feel alive and fun, the UI will feature an animated Earth mascot that acts like the classic Windows Paperclip (Clippy). The Earth sits in the corner of the screen and delivers the backend's recommendations via comic-book speech bubbles.

**Low-Complexity Implementation Strategy:**
To keep development simple and avoid the overhead of custom 3D rigging or heavy animation libraries, implement the mascot using **Optimized Images (WebP/GIF) + Framer Motion**.
1.  **Asset Preparation:** Design 2D/3D Earth illustrations for different emotional states:
    *   *Happy Earth* (Thumbs up) for good habits.
    *   *Sweating Earth* (Feverish, holding thermometer) for high carbon footprints.
    *   *Thinking Earth* (Looking at a clipboard) when fetching data.
    *   Export these as lightweight `.webp` files.
2.  **React Integration:** Treat the mascot as standard image assets in React. Wrap the `<img>` tag in a Framer Motion `<motion.div>` component.
3.  **Animation Control:** Use Framer Motion to handle layout shifts, entrance/exit animations (`initial={{ opacity: 0, y: 50 }}`), and hover interactions (`whileHover={{ scale: 1.1 }}`).
4.  **State Management:** Use simple React `useState` to swap the `src` of the image based on the current context (e.g., if `carbonCost > threshold`, `setMascotState('sweating')`). 
This approach provides a highly polished, interactive feel without the complexity of Rive or full 3D skeletal animation.
