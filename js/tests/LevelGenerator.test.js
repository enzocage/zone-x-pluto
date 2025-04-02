import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelGenerator } from '../modules/LevelGenerator.js';
import { Wall } from '../entities/Wall.js';
import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock } from '../entities/Item.js';

// Mock für Abhängigkeiten
vi.mock('../entities/Wall.js', () => {
    return {
        Wall: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld
        }))
    };
});

vi.mock('../entities/Enemy.js', () => {
    return {
        Enemy: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld
        }))
    };
});

vi.mock('../entities/Item.js', () => {
    return {
        Plutonium: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld
        })),
        Barrel: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld
        })),
        CollectibleBlock: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld
        }))
    };
});

describe('LevelGenerator', () => {
    let levelGenerator;
    let gameWorld;
    
    beforeEach(() => {
        gameWorld = {
            add: vi.fn()
        };
        
        levelGenerator = new LevelGenerator(gameWorld);
    });
    
    it('sollte korrekt initialisiert werden', () => {
        expect(levelGenerator.gameWorld).toBe(gameWorld);
    });
    
    it('sollte eine Außengrenze erstellen', () => {
        const walls = [];
        
        levelGenerator.createBorder(walls);
        
        // Überprüfen, ob alle Wände korrekt erstellt wurden
        // Die Grenzen sollten jeweils oben, unten, links und rechts sein
        const expectBorderWalls = (walls.length > 0);
        expect(expectBorderWalls).toBe(true);
        
        // Prüft obere und untere Grenzen
        const topWalls = walls.filter(wall => wall.gridZ === 0);
        const bottomWalls = walls.filter(wall => wall.gridZ === 29); // GRID_HEIGHT - 1
        
        expect(topWalls.length).toBeGreaterThan(0);
        expect(bottomWalls.length).toBeGreaterThan(0);
        
        // Prüft linke und rechte Grenzen
        const leftWalls = walls.filter(wall => wall.gridX === 0);
        const rightWalls = walls.filter(wall => wall.gridX === 29); // GRID_WIDTH - 1
        
        expect(leftWalls.length).toBeGreaterThan(0);
        expect(rightWalls.length).toBeGreaterThan(0);
    });
    
    it('sollte korrekt prüfen, ob eine Position von Wänden belegt ist', () => {
        const walls = [
            { gridX: 5, gridZ: 5 },
            { gridX: 10, gridZ: 10 }
        ];
        
        // Position ist belegt
        expect(levelGenerator.isPositionOccupiedByWalls(5, 5, walls)).toBe(true);
        expect(levelGenerator.isPositionOccupiedByWalls(10, 10, walls)).toBe(true);
        
        // Position ist frei
        expect(levelGenerator.isPositionOccupiedByWalls(6, 6, walls)).toBe(false);
        expect(levelGenerator.isPositionOccupiedByWalls(0, 0, walls)).toBe(false);
    });
    
    it('sollte korrekt prüfen, ob eine Position von Objekten belegt ist', () => {
        const player = { gridX: 1, gridZ: 1 };
        const walls = [{ gridX: 2, gridZ: 2 }];
        const barrels = [{ gridX: 3, gridZ: 3 }];
        const blocks = [{ gridX: 4, gridZ: 4 }];
        
        // Positionen von Spieler, Wänden und Blöcken sind belegt
        expect(levelGenerator.isPositionOccupied(1, 1, player, walls, barrels, blocks)).toBe(true);
        expect(levelGenerator.isPositionOccupied(2, 2, player, walls, barrels, blocks)).toBe(true);
        // Tonnen sind jetzt keine Hindernisse mehr
        expect(levelGenerator.isPositionOccupied(3, 3, player, walls, barrels, blocks)).toBe(false);
        expect(levelGenerator.isPositionOccupied(4, 4, player, walls, barrels, blocks)).toBe(true);
        
        // Position ist frei
        expect(levelGenerator.isPositionOccupied(5, 5, player, walls, barrels, blocks)).toBe(false);
    });
    
    it('sollte Gegner erstellen', () => {
        const enemies = [];
        const walls = [];
        
        // Mock für isPositionOccupiedByWalls, damit der Test deterministisch ist
        vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);
        
        levelGenerator.createEnemies(3, enemies, walls);
        
        expect(enemies.length).toBe(3);
        expect(Enemy).toHaveBeenCalledTimes(3);
    });
    
    it('sollte Plutonium-Items erstellen', () => {
        const plutoniumItems = [];
        const walls = [];
        
        // Mock für isPositionOccupiedByWalls, damit der Test deterministisch ist
        vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);
        
        levelGenerator.createPlutonium(2, plutoniumItems, walls);
        
        expect(plutoniumItems.length).toBe(2);
        expect(Plutonium).toHaveBeenCalledTimes(2);
    });
    
    it('sollte Tonnen erstellen', () => {
        const barrels = [];
        const walls = [];
        
        // Mock für isPositionOccupiedByWalls, damit der Test deterministisch ist
        vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);
        
        levelGenerator.createBarrels(4, barrels, walls);
        
        expect(barrels.length).toBe(4);
        expect(Barrel).toHaveBeenCalledTimes(4);
    });
    
    it('sollte sammelbare Blöcke erstellen', () => {
        const collectibleBlocks = [];
        const walls = [];
        
        // Mock für isPositionOccupiedByWalls, damit der Test deterministisch ist
        vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);
        
        levelGenerator.createCollectibleBlocks(5, collectibleBlocks, walls);
        
        expect(collectibleBlocks.length).toBe(5);
        expect(CollectibleBlock).toHaveBeenCalledTimes(5);
    });
}); 