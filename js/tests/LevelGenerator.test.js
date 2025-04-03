import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LevelGenerator } from '../modules/LevelGenerator.js';
import { Wall } from '../entities/Wall.js';
import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock } from '../entities/Item.js';
import { GRID_WIDTH, GRID_HEIGHT, PLAYER_START_POSITION } from '../config/config.js'; // Importiere Grid-Größe

// --- Mocks für Abhängigkeiten ---
vi.mock('../entities/Wall.js', () => {
    return {
        Wall: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld,
            // Mock Mesh für Tests, die indirekt darauf zugreifen könnten
            mesh: { position: { set: vi.fn() } }
        }))
    };
});

vi.mock('../entities/Enemy.js', () => {
    return {
        Enemy: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld,
            mesh: { position: { set: vi.fn() } }
        }))
    };
});

vi.mock('../entities/Item.js', () => {
    return {
        Plutonium: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld,
            mesh: { position: { set: vi.fn() } }
        })),
        Barrel: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld,
            mesh: { position: { set: vi.fn() } }
        })),
        CollectibleBlock: vi.fn().mockImplementation((gameWorld, x, z) => ({
            gridX: x,
            gridZ: z,
            gameWorld,
            mesh: { position: { set: vi.fn() } }
        }))
    };
});

// Helper zum Erstellen eines leeren Grids für Zugänglichkeitstests
const createEmptyGrid = (width, height, borderValue = true) => {
    let grid = Array(width).fill().map(() => Array(height).fill(false));
    // Rahmen setzen
    for (let x = 0; x < width; x++) {
        grid[x][0] = borderValue;          // Oben
        grid[x][height - 1] = borderValue; // Unten
    }
    for (let z = 1; z < height - 1; z++) {
        grid[0][z] = borderValue;          // Links
        grid[width - 1][z] = borderValue; // Rechts
    }
    return grid;
};

describe('LevelGenerator', () => {
    let levelGenerator;
    let gameWorld;
    let originalMathRandom;

    beforeEach(() => {
        gameWorld = {
            add: vi.fn()
        };
        levelGenerator = new LevelGenerator(gameWorld);

        // Mocks zurücksetzen
        vi.clearAllMocks();

        // Math.random mocken für deterministische Tests wo nötig
        originalMathRandom = Math.random;
    });

    afterEach(() => {
        // Math.random wiederherstellen
        Math.random = originalMathRandom;
    });

    it('sollte korrekt initialisiert werden', () => {
        expect(levelGenerator.gameWorld).toBe(gameWorld);
    });

    describe('generateLevel', () => {
        let walls, enemies, plutoniumItems, barrels, collectibleBlocks;
        let spyCreateBorder, spyGenerateWalls, spyCreateEnemies, spyCreatePlutonium, spyCreateBarrels, spyCreateCollectibleBlocks;

        beforeEach(() => {
            walls = [];
            enemies = [];
            plutoniumItems = [];
            barrels = [];
            collectibleBlocks = [];

            // Spies für interne Methoden
            spyCreateBorder = vi.spyOn(levelGenerator, 'createBorder');
            spyGenerateWalls = vi.spyOn(levelGenerator, 'generateWalls');
            spyCreateEnemies = vi.spyOn(levelGenerator, 'createEnemies');
            spyCreatePlutonium = vi.spyOn(levelGenerator, 'createPlutonium');
            spyCreateBarrels = vi.spyOn(levelGenerator, 'createBarrels');
            spyCreateCollectibleBlocks = vi.spyOn(levelGenerator, 'createCollectibleBlocks');
        });

        it('should call generation methods with correct parameters for level 1', () => {
            levelGenerator.generateLevel(1, walls, enemies, plutoniumItems, barrels, collectibleBlocks);

            expect(spyCreateBorder).toHaveBeenCalledWith(walls);
            // Prüfe die Argumente für generateWalls und createEnemies spezifisch für Level 1
            expect(spyGenerateWalls).toHaveBeenCalledWith(expect.any(Number), walls); // WALL_RATIO prüfen wäre genauer, aber komplexer
            expect(spyCreateEnemies).toHaveBeenCalledWith(15, enemies, walls); // Feste Anzahl für Level 1
            expect(spyCreatePlutonium).toHaveBeenCalledWith(5, plutoniumItems, walls);
            expect(spyCreateBarrels).toHaveBeenCalledWith(3, barrels, walls);
            expect(spyCreateCollectibleBlocks).toHaveBeenCalledWith(expect.any(Number), collectibleBlocks, walls); // Zufällige Anzahl
        });

        it('should call generation methods with calculated parameters for level > 1', () => {
            const level = 3;
            const expectedEnemyCount = Math.floor(7 * Math.pow(2.2, level - 1));
            const expectedWallRatio = 0.025 * Math.pow(0.2, level - 1); // WALL_RATIO aus config.js

            levelGenerator.generateLevel(level, walls, enemies, plutoniumItems, barrels, collectibleBlocks);

            expect(spyCreateBorder).toHaveBeenCalledWith(walls);
            expect(spyGenerateWalls).toHaveBeenCalledWith(expectedWallRatio, walls);
            expect(spyCreateEnemies).toHaveBeenCalledWith(expectedEnemyCount, enemies, walls);
            expect(spyCreatePlutonium).toHaveBeenCalledWith(5, plutoniumItems, walls);
            expect(spyCreateBarrels).toHaveBeenCalledWith(3, barrels, walls);
            expect(spyCreateCollectibleBlocks).toHaveBeenCalledWith(expect.any(Number), collectibleBlocks, walls);
        });
    });

    describe('createBorder', () => {
         it('sollte eine Außengrenze erstellen', () => {
            const walls = [];
            levelGenerator.createBorder(walls);

            // Erwartete Anzahl Wände: 2 * Breite + 2 * (Höhe - 2)
            const expectedWallCount = 2 * GRID_WIDTH + 2 * (GRID_HEIGHT - 2);
            expect(walls.length).toBe(expectedWallCount);
            expect(Wall).toHaveBeenCalledTimes(expectedWallCount);

            // Prüfe einige spezifische Eck- und Kantenpunkte
            expect(walls.some(w => w.gridX === 0 && w.gridZ === 0)).toBe(true);
            expect(walls.some(w => w.gridX === GRID_WIDTH - 1 && w.gridZ === 0)).toBe(true);
            expect(walls.some(w => w.gridX === 0 && w.gridZ === GRID_HEIGHT - 1)).toBe(true);
            expect(walls.some(w => w.gridX === GRID_WIDTH - 1 && w.gridZ === GRID_HEIGHT - 1)).toBe(true);
            expect(walls.some(w => w.gridX === Math.floor(GRID_WIDTH / 2) && w.gridZ === 0)).toBe(true);
            expect(walls.some(w => w.gridX === 0 && w.gridZ === Math.floor(GRID_HEIGHT / 2))).toBe(true);
        });
    });

    describe('isPositionOccupiedByWalls', () => {
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
            expect(levelGenerator.isPositionOccupiedByWalls(0, 0, [])).toBe(false); // Leere Wandliste
            expect(levelGenerator.isPositionOccupiedByWalls(5, 5, [])).toBe(false);
        });
    });

    describe('isPositionOccupied', () => {
        it('sollte korrekt prüfen, ob eine Position von Objekten belegt ist (Tonnen ignoriert)', () => {
            const player = { gridX: 1, gridZ: 1 };
            const walls = [{ gridX: 2, gridZ: 2 }];
            const barrels = [{ gridX: 3, gridZ: 3 }];
            const blocks = [{ gridX: 4, gridZ: 4 }];

            // Positionen von Spieler, Wänden und Blöcken sind belegt
            expect(levelGenerator.isPositionOccupied(1, 1, player, walls, barrels, blocks)).toBe(true); // Spieler
            expect(levelGenerator.isPositionOccupied(2, 2, player, walls, barrels, blocks)).toBe(true); // Wand
            expect(levelGenerator.isPositionOccupied(4, 4, player, walls, barrels, blocks)).toBe(true); // Block

            // Position der Tonne ist frei
            expect(levelGenerator.isPositionOccupied(3, 3, player, walls, barrels, blocks)).toBe(false);

            // Leere Position ist frei
            expect(levelGenerator.isPositionOccupied(5, 5, player, walls, barrels, blocks)).toBe(false);

            // Test ohne Spieler
            expect(levelGenerator.isPositionOccupied(1, 1, null, walls, barrels, blocks)).toBe(false);
            expect(levelGenerator.isPositionOccupied(2, 2, null, walls, barrels, blocks)).toBe(true);
        });
    });

    describe('isLevelFullyAccessible', () => {
        const startX = Math.floor(GRID_WIDTH / 2);
        const startZ = Math.floor(GRID_HEIGHT / 2);

        it('should return true for an empty grid (only borders)', () => {
            const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
            expect(levelGenerator.isLevelFullyAccessible(grid, startX, startZ)).toBe(true);
        });

        it('should return true for a grid with some obstacles but still connected', () => {
            const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
            grid[5][5] = true;
            grid[5][6] = true;
            grid[6][5] = true;
            expect(levelGenerator.isLevelFullyAccessible(grid, startX, startZ)).toBe(true);
        });

        it('should return false if the start point is walled off', () => {
            const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
            grid[startX - 1][startZ] = true;
            grid[startX + 1][startZ] = true;
            grid[startX][startZ - 1] = true;
            grid[startX][startZ + 1] = true;
            // Stelle sicher, dass der Startpunkt selbst nicht blockiert ist
            grid[startX][startZ] = false;
            expect(levelGenerator.isLevelFullyAccessible(grid, startX, startZ)).toBe(false);
        });

        it('should return false if a large area is inaccessible', () => {
            const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
            // Eine vertikale Wand, die den Bereich teilt
            for (let z = 1; z < GRID_HEIGHT - 1; z++) {
                grid[Math.floor(GRID_WIDTH / 3)][z] = true;
            }
             // Startpunkt auf einer Seite der Wand
            const accessibleStartX = Math.floor(GRID_WIDTH / 4);
            const accessibleStartZ = Math.floor(GRID_HEIGHT / 2);
             grid[Math.floor(GRID_WIDTH / 3)][accessibleStartZ] = false; // Ein Loch lassen, damit der Startpunkt nicht isoliert ist

            expect(levelGenerator.isLevelFullyAccessible(grid, accessibleStartX, accessibleStartZ)).toBe(false);
        });

        it('should return true if the grid has complex paths but is fully connected', () => {
             // Erstelle ein Labyrinth-ähnliches Gitter (Beispiel)
             const grid = createEmptyGrid(10, 10);
             grid[1][3] = true; grid[2][3] = true; grid[3][3] = true; grid[4][3] = true; grid[5][3] = true; grid[6][3] = true; grid[7][3] = true;
             grid[3][1] = true; grid[3][2] = true;
             grid[7][1] = true; grid[7][2] = true;
             grid[1][5] = true; grid[2][5] = true; grid[3][5] = true; grid[4][5] = true; grid[5][5] = true; grid[6][5] = true; grid[7][5] = true; grid[8][5] = true;
             grid[1][7] = true; grid[2][7] = true; grid[3][7] = true; grid[4][7] = true; grid[5][7] = true; grid[6][7] = true;
             grid[5][6] = true;
             grid[8][1] = true; grid[8][2] = true; grid[8][3] = true; grid[8][4] = true;
             grid[8][6] = true; grid[8][7] = true; grid[8][8] = true;

             expect(levelGenerator.isLevelFullyAccessible(grid, 5, 1)).toBe(true);
        });
    });

     describe('generateWalls', () => {
        let walls;
        let startX = 2;
        let startZ = 2;

        beforeEach(() => {
            walls = [];
            // Immer den Rand erstellen, da generateWalls dies voraussetzt
            levelGenerator.createBorder(walls);
        });

        it('should not place a wall at the start position (2, 2)', () => {
             // Mock Math.random, um sicherzustellen, dass eine Wand platziert werden *würde*
             Math.random = vi.fn().mockReturnValue(0.01); // Sehr niedrige Zahl < ratio
             // Mock isLevelFullyAccessible, um immer true zurückzugeben
             vi.spyOn(levelGenerator, 'isLevelFullyAccessible').mockReturnValue(true);

             levelGenerator.generateWalls(0.5, walls);

             // Prüfen, ob an (2,2) keine Wand ist
             expect(walls.some(w => w.gridX === startX && w.gridZ === startZ)).toBe(false);
             // Prüfen, ob Wände an anderen Stellen hinzugefügt wurden (aufgrund des hohen Ratios und gemocktem Random)
             expect(walls.length).toBeGreaterThan(2 * GRID_WIDTH + 2 * (GRID_HEIGHT - 2)); // Mehr als nur der Rand
        });

        it('should place walls based on ratio when accessible', () => {
            // Mock Math.random, um vorhersehbare Platzierung zu ermöglichen
            let randomCounter = 0;
            const randomValues = [0.1, 0.9, 0.2, 0.8, 0.3]; // Beispielwerte
            Math.random = vi.fn(() => randomValues[randomCounter++ % randomValues.length]);
            vi.spyOn(levelGenerator, 'isLevelFullyAccessible').mockReturnValue(true);

            const ratio = 0.4;
            const initialWallCount = walls.length;
            levelGenerator.generateWalls(ratio, walls);

            // Erwarte Wände bei Werten < 0.4 (0.1, 0.2, 0.3)
            const expectedNewWalls = 3;
            // Die genaue Anzahl ist schwer vorherzusagen wegen der inneren Schleife und Koordinaten, aber es sollten mehr sein.
            expect(walls.length).toBeGreaterThan(initialWallCount);
            expect(Wall).toHaveBeenCalledTimes(walls.length); // Jedes Objekt in walls sollte ein Wall sein
        });

         it('should not place a wall if it makes the level inaccessible', () => {
            Math.random = vi.fn().mockReturnValue(0.1); // Versucht immer, eine Wand zu platzieren
            // Mock isLevelFullyAccessible, gibt nur beim ersten Mal true zurück
            let accessibleCallCount = 0;
            vi.spyOn(levelGenerator, 'isLevelFullyAccessible').mockImplementation(() => {
                return accessibleCallCount++ === 0;
            });

            const initialWallCount = walls.length;
            levelGenerator.generateWalls(0.5, walls);

            // Nur eine Wand sollte hinzugefügt worden sein (beim ersten accessibleCall)
            expect(walls.length).toBe(initialWallCount + 1);
            expect(Wall).toHaveBeenCalledTimes(initialWallCount + 1);
        });

         it('should attempt to generate lines of walls', () => {
            // Mock Math.random: [place wall?, line?, direction, length, place wall in line?, ...]
            const randomValues = [
                0.1, // Ja, Wand bei (2,3) platzieren
                0.1, // Ja, Linie generieren
                0.0, // Richtung rechts (Index 0)
                0.5, // Länge 3 + floor(0.5*5) = 5
                0.1, // Wand platzieren (3,3) - Annahme: accessible
                0.1, // Wand platzieren (4,3) - Annahme: accessible
                0.1, // Wand platzieren (5,3) - Annahme: accessible
                0.1, // Wand platzieren (6,3) - Annahme: accessible
                0.1, // Wand platzieren (7,3) - Annahme: accessible
                0.9, // Nein, keine Wand bei (2,4) platzieren
            ];
            let randomCallCount = 0;
            Math.random = vi.fn(() => {
                const val = randomValues[randomCallCount % randomValues.length];
                // console.log(`Random call ${randomCallCount}: returning ${val}`);
                randomCallCount++;
                return val;
            });
            vi.spyOn(levelGenerator, 'isLevelFullyAccessible').mockReturnValue(true);

            const initialWallCount = walls.length;
            levelGenerator.generateWalls(0.5, walls);

            // Erwarte ursprüngliche Wand + 5 Wände in der Linie
            // Die genaue Anzahl ist schwer zu testen, aber wir prüfen, ob die Linie generiert wurde
            expect(walls.some(w => w.gridX === 2 && w.gridZ === 3)).toBe(true); // Erste Wand
            expect(walls.some(w => w.gridX === 3 && w.gridZ === 3)).toBe(true); // Linie
            expect(walls.some(w => w.gridX === 4 && w.gridZ === 3)).toBe(true); // Linie
            expect(walls.some(w => w.gridX === 5 && w.gridZ === 3)).toBe(true); // Linie
            expect(walls.some(w => w.gridX === 6 && w.gridZ === 3)).toBe(true); // Linie
            expect(walls.some(w => w.gridX === 7 && w.gridZ === 3)).toBe(true); // Linie
            expect(walls.length).toBe(initialWallCount + 1 + 5);
        });
    });

    // --- Tests für die create*-Methoden ---
    // Diese Tests prüfen hauptsächlich die Anzahl und den Konstruktoraufruf.
    // Eine Verbesserung wäre, die Logik zum Finden freier Plätze robuster zu testen.

    describe('createEnemies', () => {
        it('sollte die korrekte Anzahl Gegner erstellen an freien Positionen', () => {
            const enemies = [];
            const walls = [];
            levelGenerator.createBorder(walls); // Rand erstellen

            // Mock isPositionOccupiedByWalls, um Kollisionen zu simulieren
            let occupiedCallCount = 0;
            vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockImplementation((x, z) => {
                 // Simuliere, dass die ersten 2 Versuche fehlschlagen
                 return occupiedCallCount++ < 2;
            });

            levelGenerator.createEnemies(3, enemies, walls);

            expect(enemies.length).toBe(3);
            expect(Enemy).toHaveBeenCalledTimes(3);
            // isPositionOccupiedByWalls sollte 3 (erfolgreich) + 3*2 (fehlgeschlagen) = 9 mal aufgerufen werden
            expect(levelGenerator.isPositionOccupiedByWalls).toHaveBeenCalledTimes(3 * 3);

            // Prüfen, ob keine zwei Gegner an derselben Stelle sind (indirekter Test für freie Platzwahl)
            const positions = enemies.map(e => `${e.gridX},${e.gridZ}`);
            const uniquePositions = new Set(positions);
            expect(positions.length).toBe(uniquePositions.size);
        });
    });

     describe('createPlutonium', () => {
         it('sollte die korrekte Anzahl Plutonium erstellen an freien Positionen', () => {
            const items = [];
            const walls = [];
            levelGenerator.createBorder(walls);
            vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false); // Einfacher Test

            levelGenerator.createPlutonium(5, items, walls);

            expect(items.length).toBe(5);
            expect(Plutonium).toHaveBeenCalledTimes(5);
            expect(levelGenerator.isPositionOccupiedByWalls).toHaveBeenCalledTimes(5);
             // Prüfen auf unique positions
             const positions = items.map(i => `${i.gridX},${i.gridZ}`);
             const uniquePositions = new Set(positions);
             expect(positions.length).toBe(uniquePositions.size);
        });
    });

     describe('createBarrels', () => {
         it('sollte die korrekte Anzahl Tonnen erstellen an freien Positionen', () => {
            const items = [];
            const walls = [];
            levelGenerator.createBorder(walls);
            vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);

            levelGenerator.createBarrels(3, items, walls);

            expect(items.length).toBe(3);
            expect(Barrel).toHaveBeenCalledTimes(3);
            expect(levelGenerator.isPositionOccupiedByWalls).toHaveBeenCalledTimes(3);
             const positions = items.map(i => `${i.gridX},${i.gridZ}`);
             const uniquePositions = new Set(positions);
             expect(positions.length).toBe(uniquePositions.size);
        });
    });

     describe('createCollectibleBlocks', () => {
        it('sollte die korrekte Anzahl Blöcke erstellen an freien Positionen', () => {
            const items = [];
            const walls = [];
            levelGenerator.createBorder(walls);
            vi.spyOn(levelGenerator, 'isPositionOccupiedByWalls').mockReturnValue(false);

            levelGenerator.createCollectibleBlocks(7, items, walls);

            expect(items.length).toBe(7);
            expect(CollectibleBlock).toHaveBeenCalledTimes(7);
            expect(levelGenerator.isPositionOccupiedByWalls).toHaveBeenCalledTimes(7);
             const positions = items.map(i => `${i.gridX},${i.gridZ}`);
             const uniquePositions = new Set(positions);
             expect(positions.length).toBe(uniquePositions.size);
        });
    });

}); 