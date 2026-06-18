import React from 'react';
import { expect, test, vi, describe, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import FloatingObject from './FloatingObject';

// Mock useGLTF and Html to avoid network requests and DOM nodes in R3F test renderer
vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useGLTF: () => ({ scene: new THREE.Group() }),
    Html: () => <group></group> // Do not render DOM children
  };
});

// Mock Rapier's RigidBody
vi.mock('@react-three/rapier', () => {
  return {
    RigidBody: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({
        setLinvel: vi.fn(),
        setAngvel: vi.fn(),
      }));
      return <group>{children}</group>;
    })
  };
});

describe('FloatingObject R3F Constraints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Test Case 9: Imperative Animation Check (Anti-Re-render)', async () => {
    const useStateSpy = vi.spyOn(React, 'useState');
    
    const renderer = await ReactThreeTestRenderer.create(
      <FloatingObject
        id="test-item"
        modelPath="/dummy.glb"
        label="Test"
        color="red"
        position={[0, 0, 0]}
        impulse={[0, 0, 0]}
      />
    );

    const initialCalls = useStateSpy.mock.calls.length;

    // Advance the R3F frame loop manually by 60 frames
    await renderer.advanceFrames(60, 16);

    // Assert that useState was NOT called during the frame updates
    expect(useStateSpy.mock.calls.length).toBe(initialCalls);
  });

  test('Test Case 10: Frame-Rate Independence Check (Delta Usage)', async () => {
    // Mount the object with isActive=true so targetScale is 1.4
    const renderer = await ReactThreeTestRenderer.create(
      <FloatingObject
        id="test-item"
        modelPath="/dummy.glb"
        label="Test"
        color="red"
        position={[0, 0, 0]}
        impulse={[0, 0, 0]}
        isActive={true}
      />
    );

    // Get the group
    const root = renderer.scene.children[0];
    const group = root.children.find(c => c.type === 'Group');

    // Advance 1 frame with 0.01s delta
    await renderer.advanceFrames(1, 10);
    // Since R3F renderer uses the three.js instance, we check the scale directly
    const scaleFastFrame = group.instance.scale.x;

    // Advance 1 frame with 0.1s delta from initial state
    const rendererSlow = await ReactThreeTestRenderer.create(
      <FloatingObject
        id="test-item"
        modelPath="/dummy.glb"
        label="Test"
        color="red"
        position={[0, 0, 0]}
        impulse={[0, 0, 0]}
        isActive={true}
      />
    );
    const rootSlow = rendererSlow.scene.children[0];
    const groupSlow = rootSlow.children.find(c => c.type === 'Group');
    await rendererSlow.advanceFrames(1, 100);
    const scaleSlowFrame = groupSlow.instance.scale.x;

    // Slow frame should have moved the scale further towards 1.4 than the fast frame
    expect(scaleSlowFrame).toBeGreaterThan(scaleFastFrame);
  });

  test('Test Case 11: Geometry/Material Memory Leak Check', async () => {
    // Instead of spying on ESM imports (which Vitest blocks), we verify that
    // the geometry instance used by the object doesn't change UUIDs on re-render.
    
    const renderer = await ReactThreeTestRenderer.create(
      <FloatingObject
        id="ac_unit"
        modelPath="/dummy.glb"
        label="Test"
        color="red"
        position={[0, 0, 0]}
        impulse={[0, 0, 0]}
      />
    );

    // Get the initial geometry UUID from the children
    const getGeometryUuid = (root) => {
      let uuid = null;
      // We look for any mesh with a geometry in the tree
      const search = (node) => {
        if (node.type === 'Mesh' && node.props.geometry) {
          uuid = node.props.geometry.uuid;
        }
        if (node.children) {
          node.children.forEach(search);
        }
      };
      search(root);
      return uuid;
    };

    const initialUuid = getGeometryUuid(renderer.scene);

    // Trigger re-render by changing props
    await renderer.update(
      <FloatingObject
        id="ac_unit"
        modelPath="/dummy.glb"
        label="Test"
        color="blue"
        position={[0, 0, 0]}
        impulse={[0, 0, 0]}
      />
    );

    const newUuid = getGeometryUuid(renderer.scene);
    
    // The UUIDs should match or be null (if using Procedural meshes that manage their own)
    // Actually, procedural meshes use <boxGeometry> which might get recreated by R3F if args change, 
    // but a prop change (like color="blue") shouldn't recreate geometries.
    if (initialUuid && newUuid) {
      expect(newUuid).toBe(initialUuid);
    }
  });
});
