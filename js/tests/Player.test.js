import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../entities/Player.js';

// Mock für THREE.js
vi.mock('three', () => {
    return {
        BoxGeometry: vi.fn().mockImplementation(() => ({})),
        MeshLambertMaterial: vi.fn().mockImplementation(() => ({})),
        Mesh: vi.fn().mockImplementation(() => ({
            position: { set: vi.fn() },
            add: vi.fn()
        })),
        PointLight: vi.fn().mockImplementation(() => ({
            position: { set: vi.fn() }
        }))
    };
});

describe('Player', () => {
    let player;
    let scene;
    let gameWorld;
    
    beforeEach(() => {
        // Mocks für die Abhängigkeiten
        scene = {
            add: vi.fn()
        };
        
        gameWorld = {
            position: { x: 0, z: 0 }
        };
        
        // Player-Instanz erstellen
        player = new Player(scene, gameWorld, 2, 2);
    });
    
    it('sollte korrekt initialisiert werden', () => {
        expect(player.gridX).toBe(2);
        expect(player.gridZ).toBe(2);
        expect(player.moveDirection).toEqual({ x: 0, y: 0 });
        expect(player.isMoving).toBe(false);
        expect(player.targetPosition).toBe(null);
        expect(player.mesh).toBeDefined();
    });
    
    it('sollte die Bewegungsrichtung korrekt setzen', () => {
        player.setMoveDirection(1, 0);
        expect(player.moveDirection).toEqual({ x: 1, y: 0 });
        
        player.setMoveDirection(0, -1);
        expect(player.moveDirection).toEqual({ x: 0, y: -1 });
        
        player.setMoveDirection(0, 0);
        expect(player.moveDirection).toEqual({ x: 0, y: 0 });
    });
    
    it('sollte nicht bewegen, wenn isPositionOccupied true zurückgibt', () => {
        const isPositionOccupied = vi.fn().mockReturnValue(true);
        const checkCollisions = vi.fn();
        
        player.setMoveDirection(1, 0);
        player.move(isPositionOccupied, checkCollisions);
        
        expect(isPositionOccupied).toHaveBeenCalledWith(3, 2);
        expect(player.isMoving).toBe(false);
        expect(player.gridX).toBe(2);
        expect(player.gridZ).toBe(2);
        expect(checkCollisions).not.toHaveBeenCalled();
    });
    
    it('sollte bewegen, wenn isPositionOccupied false zurückgibt', () => {
        const isPositionOccupied = vi.fn().mockReturnValue(false);
        const checkCollisions = vi.fn();
        
        player.setMoveDirection(1, 0);
        player.move(isPositionOccupied, checkCollisions);
        
        expect(isPositionOccupied).toHaveBeenCalledWith(3, 2);
        expect(player.isMoving).toBe(true);
        expect(player.gridX).toBe(3);
        expect(player.gridZ).toBe(2);
    });
    
    it('sollte die Position korrekt zurücksetzen', () => {
        player.gridX = 10;
        player.gridZ = 10;
        player.isMoving = true;
        player.targetPosition = { x: 5, z: 5 };
        
        player.reset(2, 2);
        
        expect(player.gridX).toBe(2);
        expect(player.gridZ).toBe(2);
        expect(player.isMoving).toBe(false);
        expect(player.targetPosition).toBe(null);
        expect(gameWorld.position.x).toBeDefined();
        expect(gameWorld.position.z).toBeDefined();
    });
}); 