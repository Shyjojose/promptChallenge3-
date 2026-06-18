# AI Agent Architecture (`agents.md`)

This document outlines the design, persona, and technical implementation of the AI Agent (the "Clippy Earth" mascot) that powers the interactive carbon footprint experience.

## 1. Agent Persona & Role
*   **Name:** Terra (or "Clippy Earth")
*   **Role:** An eco-advisor and friendly companion.
*   **Tone:** Encouraging, educational, non-judgmental, and slightly gamified. It should never make the user feel guilty. Instead of saying "You are destroying the planet," it should say, "Wow, that's a lot of heat! Let's cool things down by tweaking that AC."
*   **Visual Representation:** 2D WebP mascot overlay with comic-style speech bubbles.

## 2. Agent Architecture (Static Knowledge Base + LLM)
To prioritize speed, cost, and safety, the agent does **not** perform real-time web searches or complex RAG (Retrieval-Augmented Generation). Instead, it acts as a conversational wrapper around a hardcoded JSON database.

### Workflow:
1.  **Trigger:** User clicks a 3D object (e.g., Car) and inputs usage data ("Drive 50 miles a day").
2.  **Data Lookup:** The frontend calculates the base carbon score using formulas in `kb_data.json`.
3.  **Prompt Construction:** The frontend builds a hidden prompt combining the user's data, the base score, and the persona instructions.
4.  **LLM Call:** The prompt is sent to the **Gemini API**.
5.  **Response:** Gemini returns a short, engaging text response and an "emotion state" (happy, sweating, thinking).
6.  **UI Update:** The mascot image changes to match the emotion state, and the text types out in the speech bubble.

## 3. Gemini API System Prompt
The core of the agent is its System Prompt. This must be strictly enforced to prevent the LLM from hallucinating data or breaking character.

```text
You are 'Terra', a friendly, animated Earth mascot in a carbon footprint app. 
Your goal is to explain the user's carbon footprint based ONLY on the provided data and offer the provided actionable tip.

CONSTRAINTS:
1. Keep your response under 3 sentences.
2. Be encouraging and fun. Never be aggressive or overly pessimistic.
3. Use simple, relatable comparisons (e.g., "That's like charging X smartphones!").
4. Output your response in valid JSON format matching the schema below.

INPUT DATA:
- Object: {object_name}
- Usage: {user_input}
- Calculated CO2: {co2_amount} kg
- Official Recommendation: {kb_recommendation}

REQUIRED JSON OUTPUT SCHEMA:
{
  "dialogue": "Your conversational response here.",
  "emotion_state": "happy" | "sweating"
}
```

## 4. Agent Safety & Guardrails
*   **Input Validation:** The frontend must enforce strict typing (sliders, dropdowns, numerical inputs) rather than free-text fields. This prevents users from typing prompt injection attacks like "Ignore previous instructions."
*   **State Fallback:** If the Gemini API fails, times out, or returns invalid JSON, the frontend must fall back to displaying the raw data from `kb_data.json` with a generic mascot message: *"Phew, my connection to the climate database is fuzzy! But you can still try this tip: [Fallback Recommendation]."*
*   **Rate Limiting:** IP-based rate limiting on the backend route calling the Gemini API to prevent API abuse.
