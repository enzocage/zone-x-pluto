import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Item, Plutonium, Barrel, CollectibleBlock, PlacedBlock } from '../entities/Item.js';
import { CELL_SIZE, PLUTONIUM_COLOR, BARREL_COLOR } from '../config/config.js';

// --- Mock THREE global für alle Tests in dieser Datei ---
const mockMesh = {
    position: { set: vi.fn() },
    visible: true,
    material: { color: { set: vi.fn() }, transparent: false, opacity: 1 }
};
const mockGameWorld = {
    add: vi.fn(),
    remove: vi.fn()
};
vi.stubGlobal('THREE', {
    Mesh: vi.fn(() => mockMesh),
    SphereGeometry: vi.fn(),
    CylinderGeometry: vi.fn(),
    BoxGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(() => ({ color: { set: vi.fn() }, transparent: false, opacity: 1 })),
    Color: vi.fn(),
    // Fügen Sie hier weitere benötigte THREE-Teile hinzu
});

// Mock für player
const createMockPlayer = (gridX = 0, gridZ = 0) => ({
  gridX: gridX,
  gridZ: gridZ,
});

describe('Item (Base Class)', () => {
  let item;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    item = new Item(mockGameWorld, 5, 10);
  });

  it('should initialize correctly', () => {
    expect(item.gridX).toBe(5);
    expect(item.gridZ).toBe(10);
    expect(item.gameWorld).toBe(mockGameWorld);
    expect(item.collected).toBe(false);
    expect(item.mesh).toBeNull();
  });

  it('should detect collision with player at the same position', () => {
    const player = createMockPlayer(5, 10);
    expect(item.checkCollisionWithPlayer(player)).toBe(true);
  });

  it('should not detect collision with player at different position', () => {
    const player = createMockPlayer(3, 4);
    expect(item.checkCollisionWithPlayer(player)).toBe(false);
  });

  it('should not detect collision if already collected', () => {
    item.collected = true;
    const player = createMockPlayer(5, 10);
    expect(item.checkCollisionWithPlayer(player)).toBe(false);
  });

  it('should mark as collected and hide mesh on collect()', () => {
    item.mesh = { visible: true };
    item.collect();
    expect(item.collected).toBe(true);
    expect(item.mesh.visible).toBe(false);
  });

  it('should not collect if already collected', () => {
    item.mesh = { visible: true };
    item.collected = true;
    item.collect();
    expect(item.collected).toBe(true);
    expect(item.mesh.visible).toBe(true);
  });

   it('should not collect if mesh is null', () => {
    item.mesh = null;
    item.collect();
    expect(item.collected).toBe(false);
  });

  it('should remove mesh from gameWorld on remove()', () => {
    const mockMeshInstance = { visible: true };
    item.mesh = mockMeshInstance;
    item.remove();
    expect(mockGameWorld.remove).toHaveBeenCalledWith(mockMeshInstance);
    expect(item.mesh).toBeNull();
  });

  it('should handle remove() when mesh is already null', () => {
    item.mesh = null;
    expect(() => item.remove()).not.toThrow();
    expect(mockGameWorld.remove).toHaveBeenCalledWith(null);
  });
});

describe('Plutonium', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('should create mesh on construction', () => {
    const plutonium = new Plutonium(mockGameWorld, 1, 2);
    expect(THREE.Mesh).toHaveBeenCalledTimes(1);
    expect(THREE.SphereGeometry).toHaveBeenCalledTimes(1);
    expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
    expect(mockGameWorld.add).toHaveBeenCalledWith(plutonium.mesh);
    expect(plutonium.mesh.position.set).toHaveBeenCalledWith(1 + CELL_SIZE / 2, CELL_SIZE / 2, 2 + CELL_SIZE / 2);
    expect(plutonium.mesh.material.color.set).toHaveBeenCalledWith(PLUTONIUM_COLOR);
  });
});

describe('Barrel', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('should create mesh on construction', () => {
    const barrel = new Barrel(mockGameWorld, 3, 4);
    expect(THREE.Mesh).toHaveBeenCalledTimes(1);
    expect(THREE.CylinderGeometry).toHaveBeenCalledTimes(1);
    expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
    expect(mockGameWorld.add).toHaveBeenCalledWith(barrel.mesh);
    expect(barrel.mesh.position.set).toHaveBeenCalledWith(3 + CELL_SIZE / 2, CELL_SIZE / 2, 4 + CELL_SIZE / 2);
    expect(barrel.mesh.material.color.set).toHaveBeenCalledWith(BARREL_COLOR);
  });
});

describe('CollectibleBlock', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('should create mesh on construction', () => {
    const block = new CollectibleBlock(mockGameWorld, 5, 6);
    expect(THREE.Mesh).toHaveBeenCalledTimes(1);
    expect(THREE.BoxGeometry).toHaveBeenCalledTimes(1);
    expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
    expect(mockGameWorld.add).toHaveBeenCalledWith(block.mesh);
    expect(block.mesh.position.set).toHaveBeenCalledWith(5 + CELL_SIZE / 2, CELL_SIZE / 2, 6 + CELL_SIZE / 2);
  });
});

describe('PlacedBlock', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('should create mesh on construction', () => {
    const block = new PlacedBlock(mockGameWorld, 7, 8);
    expect(THREE.Mesh).toHaveBeenCalledTimes(1);
    expect(THREE.BoxGeometry).toHaveBeenCalledTimes(1);
    expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
    expect(mockGameWorld.add).toHaveBeenCalledWith(block.mesh);
    expect(block.mesh.position.set).toHaveBeenCalledWith(7 + CELL_SIZE / 2, CELL_SIZE / 2, 8 + CELL_SIZE / 2);
  });
}); 