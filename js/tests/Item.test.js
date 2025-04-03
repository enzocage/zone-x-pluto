import { describe, it, expect, vi } from 'vitest';
import { Item, Plutonium, Barrel, CollectibleBlock, PlacedBlock } from '../entities/Item.js';
import { CELL_SIZE } from '../config/config.js';

// Mock für gameWorld (simuliert THREE.Group)
const createMockGameWorld = () => ({
  add: vi.fn(),
  remove: vi.fn(),
});

// Mock für player
const createMockPlayer = (gridX = 0, gridZ = 0) => ({
  gridX: gridX,
  gridZ: gridZ,
});

describe('Item (Base Class)', () => {
  it('should initialize correctly', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 5, 10);
    expect(item.gridX).toBe(5);
    expect(item.gridZ).toBe(10);
    expect(item.gameWorld).toBe(mockGameWorld);
    expect(item.collected).toBe(false);
    expect(item.mesh).toBeNull();
  });

  it('should detect collision with player at the same position', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 3, 4);
    const player = createMockPlayer(3, 4);
    expect(item.checkCollisionWithPlayer(player)).toBe(true);
  });

  it('should not detect collision with player at different position', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 3, 4);
    const player = createMockPlayer(5, 5);
    expect(item.checkCollisionWithPlayer(player)).toBe(false);
  });

  it('should not detect collision if already collected', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 3, 4);
    item.collected = true;
    const player = createMockPlayer(3, 4);
    expect(item.checkCollisionWithPlayer(player)).toBe(false);
  });

  it('should mark as collected and hide mesh on collect()', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 1, 1);
    // Manually assign a mock mesh for testing collect/remove
    item.mesh = { visible: true };
    item.collect();
    expect(item.collected).toBe(true);
    expect(item.mesh.visible).toBe(false);
  });

  it('should not collect if already collected', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 1, 1);
    item.mesh = { visible: true };
    item.collected = true;
    item.collect(); // Try collecting again
    expect(item.collected).toBe(true); // Should still be true
    expect(item.mesh.visible).toBe(true); // Should not have changed visibility again
  });

   it('should not collect if mesh is null', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 1, 1);
    item.mesh = null;
    item.collect();
    expect(item.collected).toBe(false);
  });

  it('should remove mesh from gameWorld on remove()', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 2, 2);
    const mockMesh = { visible: true };
    item.mesh = mockMesh;
    item.remove();
    expect(mockGameWorld.remove).toHaveBeenCalledWith(mockMesh);
    expect(item.mesh).toBeNull();
  });

  it('should handle remove() when mesh is already null', () => {
    const mockGameWorld = createMockGameWorld();
    const item = new Item(mockGameWorld, 2, 2);
    item.mesh = null;
    expect(() => item.remove()).not.toThrow();
    expect(mockGameWorld.remove).not.toHaveBeenCalled();
  });
});

describe('Plutonium', () => {
  it('should create mesh on construction', () => {
    const mockGameWorld = createMockGameWorld();
    const plutonium = new Plutonium(mockGameWorld, 1, 2);
    expect(plutonium.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(plutonium.mesh.geometry).toBeInstanceOf(global.THREE.SphereGeometry);
    expect(plutonium.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial);
    expect(mockGameWorld.add).toHaveBeenCalledWith(plutonium.mesh);
    // Check position (approximate due to CELL_SIZE/2 offset)
    expect(plutonium.mesh.position.set).toHaveBeenCalledWith(1 + CELL_SIZE / 2, CELL_SIZE / 2, 2 + CELL_SIZE / 2);
  });
});

describe('Barrel', () => {
  it('should create mesh on construction', () => {
    const mockGameWorld = createMockGameWorld();
    const barrel = new Barrel(mockGameWorld, 3, 4);
    expect(barrel.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(barrel.mesh.geometry).toBeInstanceOf(global.THREE.CylinderGeometry);
    expect(barrel.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial);
    expect(mockGameWorld.add).toHaveBeenCalledWith(barrel.mesh);
    expect(barrel.mesh.position.set).toHaveBeenCalledWith(3 + CELL_SIZE / 2, CELL_SIZE / 2, 4 + CELL_SIZE / 2);
  });
});

describe('CollectibleBlock', () => {
  it('should create mesh on construction', () => {
    const mockGameWorld = createMockGameWorld();
    const block = new CollectibleBlock(mockGameWorld, 5, 6);
    expect(block.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(block.mesh.geometry).toBeInstanceOf(global.THREE.BoxGeometry);
    expect(block.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial);
    expect(mockGameWorld.add).toHaveBeenCalledWith(block.mesh);
    expect(block.mesh.position.set).toHaveBeenCalledWith(5 + CELL_SIZE / 2, CELL_SIZE / 2, 6 + CELL_SIZE / 2);
  });
});

describe('PlacedBlock', () => {
  it('should create mesh on construction', () => {
    const mockGameWorld = createMockGameWorld();
    const block = new PlacedBlock(mockGameWorld, 7, 8);
    expect(block.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(block.mesh.geometry).toBeInstanceOf(global.THREE.BoxGeometry); // Assuming same geometry as Collectible
    expect(block.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial); // Assuming same material
    expect(mockGameWorld.add).toHaveBeenCalledWith(block.mesh);
    expect(block.mesh.position.set).toHaveBeenCalledWith(7 + CELL_SIZE / 2, CELL_SIZE / 2, 8 + CELL_SIZE / 2);
  });
}); 