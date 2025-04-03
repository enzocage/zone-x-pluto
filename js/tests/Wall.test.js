import { describe, it, expect, vi } from 'vitest';
import { Wall } from '../entities/Wall.js';
import { CELL_SIZE, WALL_COLOR, WALL_OPACITY } from '../config/config.js';

// --- Mock THREE global für diese Datei ---
const mockMesh = {
    position: { set: vi.fn() },
    material: { transparent: false, opacity: 1, color: { set: vi.fn() } }
};
const mockGameWorld = {
    add: vi.fn(),
    remove: vi.fn()
};
vi.stubGlobal('THREE', {
    Mesh: vi.fn(() => mockMesh),
    BoxGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(() => ({ transparent: false, opacity: 1, color: { set: vi.fn() } })),
    Color: vi.fn(),
});

// --- Tests ---
describe('Wall', () => {
    // Verwende das global definierte mockGameWorld
    // beforeEach(() => { mockGameWorld.add.mockClear(); mockGameWorld.remove.mockClear(); })

    it('should initialize correctly and create mesh', () => {
        // mockGameWorld ist bereits definiert
        const wall = new Wall(mockGameWorld, 5, 10);

        expect(wall.gridX).toBe(5);
        expect(wall.gridZ).toBe(10);
        expect(wall.gameWorld).toBe(mockGameWorld);

        // Prüfen, ob die Mock-Konstruktoren aufgerufen wurden
        expect(THREE.Mesh).toHaveBeenCalledTimes(1);
        expect(THREE.BoxGeometry).toHaveBeenCalledTimes(1);
        expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
        
        // Prüfen, ob das Mesh zum GameWorld hinzugefügt wurde
        expect(mockGameWorld.add).toHaveBeenCalledWith(wall.mesh);
        // Prüfen, ob die Position korrekt gesetzt wurde (auf dem Mock-Mesh)
        expect(wall.mesh.position.set).toHaveBeenCalledWith(5 + CELL_SIZE / 2, CELL_SIZE / 2, 10 + CELL_SIZE / 2);
        // Prüfen, ob Materialeigenschaften gesetzt wurden
        expect(wall.mesh.material.color.set).toHaveBeenCalledWith(WALL_COLOR);
        expect(wall.mesh.material.transparent).toBe(true);
        expect(wall.mesh.material.opacity).toBe(WALL_OPACITY);
    });

    it('should remove mesh from gameWorld on remove()', () => {
        // mockGameWorld ist bereits definiert
        const wall = new Wall(mockGameWorld, 2, 3);
        const meshToRemove = wall.mesh; // Das gemockte Mesh
        // Reset mocks before calling remove
        mockGameWorld.remove.mockClear(); 

        wall.remove();

        expect(mockGameWorld.remove).toHaveBeenCalledTimes(1);
        expect(mockGameWorld.remove).toHaveBeenCalledWith(meshToRemove);
        expect(wall.mesh).toBeNull();
    });

    it('should handle remove() when mesh is already null', () => {
        // mockGameWorld ist bereits definiert
        const wall = new Wall(mockGameWorld, 1, 1);
        wall.mesh = null; // Manuell auf null setzen
        mockGameWorld.remove.mockClear(); 

        expect(() => wall.remove()).not.toThrow();
        expect(mockGameWorld.remove).not.toHaveBeenCalled();
    });
}); 