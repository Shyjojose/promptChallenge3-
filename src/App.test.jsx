import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from './App';

// ---------------------------------------------------------------------------
// Comprehensive mocks — stub out everything that requires WebGL / Rapier WASM
// These must be declared before any imports that transitively use them.
// ---------------------------------------------------------------------------

// Mock @react-three/fiber — Canvas just renders its children in a plain div
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, onCreated }) => {
    React.useEffect(() => { if (onCreated) onCreated(); }, [onCreated]);
    return <div data-testid="r3f-canvas">{children}</div>;
  },
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));

// Mock @react-three/rapier — Physics and RigidBody pass through children
vi.mock('@react-three/rapier', () => ({
  Physics: ({ children }) => <>{children}</>,
  RigidBody: React.forwardRef(({ children }, ref) => {
    React.useImperativeHandle(ref, () => ({ setLinvel: vi.fn(), setAngvel: vi.fn() }));
    return <>{children}</>;
  }),
}));

// Mock @react-three/drei — stub all hooks and components used transitively
vi.mock('@react-three/drei', () => ({
  Stars: () => null,
  Html: () => null,
  useGLTF: () => ({ scene: { clone: () => ({}) } }),
}));

// Mock three — not needed in jsdom tests
vi.mock('three', () => ({
  default: {},
  Group: class { clone() { return this; } },
  MathUtils: { lerp: (a, b, t) => a + (b - a) * t },
  SphereGeometry: class {},
  MeshStandardMaterial: class {},
  BackSide: 1,
}));

// Mock all child components directly so we can control their behavior precisely
vi.mock('./components/Scene', () => ({
  default: ({ onObjectClick }) => (
    <button data-testid="scene-car-trigger" onClick={() => onObjectClick('car')}>
      Click Car
    </button>
  ),
}));

vi.mock('./components/Modal', () => ({
  default: ({ object, onClose, onSubmit, setMascotState }) => (
    <div data-testid="modal">
      <span>{object.name}</span>
      <button onClick={onClose}>Close Modal</button>
      <button
        onClick={() => {
          setMascotState({ emotion: 'happy', dialogue: null });
          onSubmit(
            object.id,
            4.8,
            { dialogue: 'Good job!', emotion_state: 'happy', object_name: object.name },
            object.recommendation
          );
          onClose();
        }}
      >
        Submit
      </button>
    </div>
  ),
}));

vi.mock('./components/Mascot', () => ({
  default: ({ emotion, dialogue }) => (
    <div data-testid="mascot">
      <span data-testid="mascot-emotion">{emotion}</span>
      {dialogue && <span data-testid="mascot-dialogue">{dialogue}</span>}
    </div>
  ),
}));

vi.mock('./components/ChatWindow', () => ({
  default: ({ onClose, initialContext }) => (
    <div data-testid="chat-window">
      <span data-testid="chat-object">{initialContext.object_name}</span>
      <span data-testid="chat-recommendation">{initialContext.recommendation}</span>
      <button onClick={onClose}>Close Chat</button>
    </div>
  ),
}));

vi.mock('./components/HUD', () => ({
  default: ({ totalCO2 }) => (
    <div data-testid="hud">
      <span data-testid="hud-co2">{totalCO2.toFixed(1)}</span>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App Integration Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders HUD and canvas on mount', () => {
    render(<App />);
    expect(screen.getByTestId('hud')).toBeInTheDocument();
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('opens Modal when a scene object is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Gasoline Car')).toBeInTheDocument();
    });
  });

  it('closes Modal on Close button click', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Close Modal/i }));
    await waitFor(() => expect(screen.queryByTestId('modal')).not.toBeInTheDocument());
  });

  it('H2: opens ChatWindow with correct recommendation after submit', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      // HUD should reflect the CO₂ update
      expect(screen.getByTestId('hud-co2')).toHaveTextContent('4.8');
      // ChatWindow should open
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
      expect(screen.getByTestId('chat-object')).toHaveTextContent('Gasoline Car');
      // H2 fix: recommendation must be passed correctly (not empty string)
      expect(screen.getByTestId('chat-recommendation')).not.toHaveTextContent('');
    });
  });

  it('closes ChatWindow when its Close button is clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await waitFor(() => expect(screen.getByTestId('chat-window')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Close Chat/i }));
    await waitFor(() => expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument());
  });

  it('accumulates CO₂ uniquely per object ID (same key updates in place)', async () => {
    render(<App />);

    // First submission
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await waitFor(() => expect(screen.getByTestId('hud-co2')).toHaveTextContent('4.8'));

    // Close chat
    fireEvent.click(screen.getByRole('button', { name: /Close Chat/i }));

    // Second submission (same object id → contributions['car'] updated, not doubled)
    fireEvent.click(screen.getByTestId('scene-car-trigger'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await waitFor(() => {
      // Same objectId → total should still be 4.8 (replace, not accumulate)
      expect(screen.getByTestId('hud-co2')).toHaveTextContent('4.8');
    });
  });
});
