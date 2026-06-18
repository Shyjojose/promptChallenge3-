import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Mascot from './Mascot';

describe('Clippy Earth Mascot Tests (Jest)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Test Case 4: Default Mascot State', () => {
    render(<Mascot emotion="happy" dialogue={null} />);
    
    // The DOM contains an <img> tag for the mascot with src pointing to the "happy" WebP asset
    const img = screen.getByAltText(/Terra the Earth mascot/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/earth_happy.webp');
  });

  it('Test Case 5: Mascot State Transition on High Usage', () => {
    const { rerender } = render(<Mascot emotion="happy" dialogue={null} />);
    
    // Trigger transition by rerendering with sweating state and dialogue
    rerender(<Mascot emotion="sweating" dialogue="Wow, that's a lot of heat!" />);
    
    const img = screen.getByAltText(/Terra the Earth mascot/i);
    expect(img).toHaveAttribute('src', '/images/earth_sweating.webp');
  });

  it('Test Case 6: XSS Sanitization Check', () => {
    const maliciousPayload = "<script>alert('xss')</script>";
    
    render(<Mascot emotion="thinking" dialogue={maliciousPayload} />);
    
    // Advance timers so typewriter effect completes
    act(() => {
      vi.advanceTimersByTime(22 * maliciousPayload.length + 100);
    });

    // We look for the exact string. If React rendered it as HTML, it wouldn't be textContent
    const textElement = screen.getByText(maliciousPayload);
    expect(textElement).toBeInTheDocument();
    
    // Also confirm no script tags were actually created in the DOM
    expect(document.querySelector('script')).toBeNull();
  });
});
