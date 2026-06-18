# Prerequisites & Artifacts for LLM Agent

Before an LLM coding agent starts writing code for the Zero-Gravity Carbon Footprint application, you need to prepare several structured artifacts. LLMs building React Three Fiber (R3F) applications without these artifacts often hallucinate file paths, create massive memory leaks, or generate disjointed code.

Here is the checklist of artifacts to prepare *before* the agent starts coding:

## 1. The Technical Specification (`SPEC.md` or `challenge.md`)
You already have a good start with `challenge.md` and `testing.md`, but ensure the final spec explicitly declares:
*   **Tech Stack:** React 19, Next.js or Vite, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` (for physics), and `framer-motion` (for the 2D UI).
*   **State Management Strategy:** Specify that 3D object positions should be managed via `useRef`, while UI state (like modal visibility or footprint score) should use `useState` or `Zustand`.

## 2. 3D Assets & Media Manifest (`ASSETS.md`)
The LLM cannot browse the internet to download 3D models for you. You must provide the assets and a manifest file describing them so the agent can code the loading logic.
*   **The Artifact:** Create an `ASSETS.md` or `assets.json` file.
*   **Content:**
    *   Paths to the `.glb` or `.gltf` files for the 8 everyday objects (e.g., `/public/models/ac_unit.glb`).
    *   Paths to the "Clippy Earth" WebP images (e.g., `/public/images/earth_happy.webp`).
    *   **Optimization State:** Note if models are compressed (e.g., using Draco) so the LLM knows to implement the `DracoLoader`.

## 3. The Static Knowledge Base Data (`kb_data.json`)
Since we decided against a live RAG system, the LLM needs the hardcoded data to function.
*   **The Artifact:** A `data.json` or `knowledge_base.js` file.
*   **Content:** A structured JSON object containing the base emission factors and AI prompt instructions.
    ```json
    {
      "ac_unit": {
        "co2_per_hour_kg": 0.5,
        "recommendation": "Set the thermostat 2 degrees higher to save 10% energy."
      },
      "burger": {
        "co2_per_serving_kg": 3.0,
        "recommendation": "Swap one beef meal a week for a plant-based alternative."
      }
    }
    ```

## 4. Architectural Rules (`RULES.md` or `.cursorrules`)
To prevent the LLM from making classic R3F mistakes (like creating geometries in the render loop), provide a rules file that the agent must read on every turn.
*   **The Artifact:** A markdown file containing the "Prompt Engineering Constraints" we defined in `testing.md`.
*   **Content:** Explicit instructions to use `delta` in `useFrame`, avoid `useState` for rapid 3D animations, and strictly separate the 3D Canvas layer from the 2D HTML modal layer using `@react-three/html` or absolute positioning.

## 5. UI/UX Mockups (Optional but Recommended)
If possible, provide wireframes or mockups of the 2D UI (the input modal, the Clippy Earth speech bubble). 
*   **The Artifact:** A low-fidelity sketch or a textual description of the layout (e.g., "Mascot fixed to bottom-right corner, 150x150px"). This prevents the LLM from generating terrible CSS layouts.

### Workflow Summary
Once these 5 artifacts are prepared and placed in the project root, you can prompt the agent: 
> *"Read `SPEC.md`, `ASSETS.md`, `RULES.md`, and `kb_data.json`. Start by setting up the base Next.js project and implementing the `<Canvas>` environment following the rules provided."*

---

## 6. Human Developer Asset Preparation Guide
Before you ask the LLM to write any code, you (the human developer) must manually create the folder structure and place the external files inside. The LLM cannot generate or download `.glb` or `.webp` files automatically. 

Here are the step-by-step instructions for you to prepare the environment:

### Step 1: Create the Public Folder Structure
In the root of your project directory, create a `public` folder with two subdirectories:
```bash
mkdir -p public/models
mkdir -p public/images
```

### Step 2: Generate/Acquire the 3D Models
You need 8 basic 3D models for the zero-gravity scene (e.g., AC Unit, Car, Amazon Package).
*   **Where to get them:** 
    *   *Option A (Fastest):* Download free low-poly models from [Sketchfab](https://sketchfab.com) or [Poly Pizza](https://poly.pizza).
    *   *Option B (Custom):* Build simple versions in a browser tool like [Spline](https://spline.design/) and export them.
*   **Export Format:** You **must** download/export them as `.glb` files (this is the binary standard for web 3D).
*   **Action:** Save them into your `public/models` folder.
    *   *Example:* `public/models/ac_unit.glb`, `public/models/car.glb`, etc.

### Step 3: Generate the "Clippy Earth" Mascot Images
You need 2D images for the Earth mascot's different emotional states.
*   **Where to get them:** 
    *   Use an AI image generator (like Midjourney, DALL-E 3, or Canva) with a prompt like: *"A cute, simple 2D vector mascot of the Earth with a face, giving a thumbs up, transparent background."*
    *   Generate 3 variations: Happy/Idle, Sweating/Feverish, and Thinking.
*   **Export Format:** Remove the backgrounds (if needed) and convert them to `.webp` (for best web performance) or `.png`.
*   **Action:** Save them into your `public/images` folder.
    *   *Example:* `public/images/earth_happy.webp`, `public/images/earth_sweating.webp`, etc.

### Step 4: Write the Manifest File
Now that your folders are populated, create the `ASSETS.md` file in your project root so the LLM knows exactly what files exist.
*   **Action:** Write a simple list inside `ASSETS.md`:
    ```markdown
    # Asset Manifest
    The following files have been prepared and are located in the `public` directory:
    
    ## 3D Models (Load with useGLTF)
    - `/models/ac_unit.glb`
    - `/models/car.glb`
    - `/models/burger.glb`
    
    ## 2D Mascot Images (Load in standard <img> tags)
    - `/images/earth_happy.webp`
    - `/images/earth_sweating.webp`
    ```

**Result:** You are now ready! When you invite the LLM to start coding, it will simply read `ASSETS.md`, know exactly which URLs to point its loaders to, and can seamlessly connect the frontend code to your pre-made files without hallucinating missing URLs.
