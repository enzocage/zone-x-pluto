import { describe, it, expect, vi } from 'vitest';
import { Wall } from '../entities/Wall.js';
import { CELL_SIZE } from '../config/config.js';

// Mock für gameWorld (simuliert THREE.Group)
const createMockGameWorld = () => ({
  add: vi.fn(),
  remove: vi.fn(),
});

describe('Wall', () => {
  it('should initialize correctly and create mesh', () => {
    const mockGameWorld = createMockGameWorld();
    const wall = new Wall(mockGameWorld, 5, 10);

    expect(wall.gridX).toBe(5);
    expect(wall.gridZ).toBe(10);
    expect(wall.gameWorld).toBe(mockGameWorld);
    expect(wall.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(wall.mesh.geometry).toBeInstanceOf(global.THREE.BoxGeometry);
    expect(wall.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial);

    // Check if mesh was added to the game world
    expect(mockGameWorld.add).toHaveBeenCalledWith(wall.mesh);

    // Check position (approximate due to CELL_SIZE/2 offset)
    expect(wall.mesh.position.set).toHaveBeenCalledWith(5 + CELL_SIZE / 2, CELL_SIZE / 2, 10 + CELL_SIZE / 2);
  });

  it('should remove mesh from gameWorld on remove()', () => {
    const mockGameWorld = createMockGameWorld();
    const wall = new Wall(mockGameWorld, 2, 3);
    const mockMesh = wall.mesh; // Get the mesh created by the constructor

    wall.remove();

    expect(mockGameWorld.remove).toHaveBeenCalledWith(mockMesh);
    expect(wall.mesh).toBeNull();
  });

  it('should handle remove() when mesh is already null', () => {
    const mockGameWorld = createMockGameWorld();
    const wall = new Wall(mockGameWorld, 1, 1);
    wall.mesh = null; // Manually set mesh to null

    expect(() => wall.remove()).not.toThrow();
    expect(mockGameWorld.remove).not.toHaveBeenCalled();
  });
}); 