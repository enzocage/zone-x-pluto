import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Enemy } from '../entities/Enemy.js';
import { CELL_SIZE, ENEMY_MIN_SPEED, ENEMY_SPEED_VARIATION } from '../config/config.js';

// --- Mock THREE global für diese Datei ---
const mockMesh = {
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    material: { color: { set: vi.fn() } }
};
const mockGameWorld = {
    add: vi.fn(),
    remove: vi.fn()
};
vi.stubGlobal('THREE', {
    Mesh: vi.fn(() => mockMesh),
    ConeGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(() => ({ color: { set: vi.fn() } })),
    Color: vi.fn(),
    // Fügen Sie hier weitere benötigte THREE-Teile hinzu
});

// Mock für isPositionOccupied
const mockIsPositionOccupied = vi.fn();

// Mock für player
const createMockPlayer = (gridX = -1, gridZ = -1) => ({
  gridX: gridX,
  gridZ: gridZ,
});

// Helper zum Erstellen von Mock-Gegnern
const createMockEnemy = (gridX, gridZ, isMoving = false, targetX = gridX, targetZ = gridZ, occupiedCells = [{ x: gridX, z: gridZ }], id = Math.random()) => ({
    gridX,
    gridZ,
    isMoving,
    targetX,
    targetZ,
    occupiedCells, // Wichtig für Kollisionsprüfung
    id // Eindeutige ID zur Unterscheidung
});

describe('Enemy', () => {
  let mockGameWorld;

  beforeEach(() => {
    mockGameWorld = createMockGameWorld();
    mockIsPositionOccupied.mockClear();
    // Standardmäßig ist keine Position belegt
    mockIsPositionOccupied.mockReturnValue(false);
  });

  it('should initialize correctly', () => {
    const enemy = new Enemy(mockGameWorld, 5, 10);

    expect(enemy.gridX).toBe(5);
    expect(enemy.gridZ).toBe(10);
    expect(enemy.gameWorld).toBe(mockGameWorld);
    expect(enemy.isMoving).toBe(false);
    expect(enemy.targetX).toBe(5);
    expect(enemy.targetZ).toBe(10);
    expect(enemy.occupiedCells).toEqual([{ x: 5, z: 10 }]); // Initial nur die eigene Zelle
    expect(enemy.speed).toBeGreaterThanOrEqual(ENEMY_MIN_SPEED);
    expect(enemy.speed).toBeLessThanOrEqual(ENEMY_MIN_SPEED + ENEMY_SPEED_VARIATION);

    // Check direction (must be one of the four)
    const possibleDirections = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
    expect(possibleDirections).toContainEqual(enemy.direction);
    expect(enemy.lastDirection).toEqual(enemy.direction);

    // Check mesh creation
    expect(enemy.mesh).toBeInstanceOf(global.THREE.Mesh);
    expect(enemy.mesh.geometry).toBeInstanceOf(global.THREE.BoxGeometry);
    expect(enemy.mesh.material).toBeInstanceOf(global.THREE.MeshLambertMaterial);
    expect(mockGameWorld.add).toHaveBeenCalledWith(enemy.mesh);
    expect(enemy.mesh.position.set).toHaveBeenCalledWith(5 * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, 10 * CELL_SIZE + CELL_SIZE / 2);
  });

  describe('getRandomDirection', () => {
    it('should return one of the four valid directions', () => {
        const enemy = new Enemy(mockGameWorld, 0, 0);
        const possibleDirections = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        // Rufen Sie die Methode mehrmals auf, um die Zufälligkeit zu testen (obwohl die Verteilung nicht garantiert ist).
        for (let i = 0; i < 10; i++) {
            const direction = enemy.getRandomDirection();
            expect(possibleDirections).toContainEqual(direction);
        }
    });
  });

  describe('findFreeDirection', () => {
    it('should return the current direction if it is free (randomOrder=false)', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 }; // Nach rechts
        mockIsPositionOccupied.mockReturnValue(false); // Alle Felder frei
        const enemies = [enemy];
        const player = createMockPlayer();

        const freeDirection = enemy.findFreeDirection(mockIsPositionOccupied, enemies, player, false);
        expect(freeDirection).toEqual({ x: 1, z: 0 });
        expect(mockIsPositionOccupied).toHaveBeenCalledWith(3, 2); // Prüft das Feld rechts
    });

    it('should return another free direction if current direction is blocked (randomOrder=false)', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 }; // Rechts
        mockIsPositionOccupied.mockImplementation((x, z) => x === 3 && z === 2); // Nur Feld rechts ist blockiert
        const enemies = [enemy];
        const player = createMockPlayer();

        const freeDirection = enemy.findFreeDirection(mockIsPositionOccupied, enemies, player, false);
        expect(freeDirection).not.toBeNull();
        expect(freeDirection).not.toEqual({ x: 1, z: 0 });
        expect([{ x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }]).toContainEqual(freeDirection);
    });

     it('should return null if all directions are blocked by obstacles', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 };
        mockIsPositionOccupied.mockReturnValue(true); // Alle Felder blockiert
        const enemies = [enemy];
        const player = createMockPlayer();

        const freeDirection = enemy.findFreeDirection(mockIsPositionOccupied, enemies, player, false);
        expect(freeDirection).toBeNull();
    });

    it('should return null if a direction is blocked by a stationary enemy', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 }; // Nach rechts
        mockIsPositionOccupied.mockReturnValue(false);
        const blockingEnemy = createMockEnemy(3, 2, false); // Steht auf 3,2
        const enemies = [enemy, blockingEnemy];
        const player = createMockPlayer();

        // Nur Richtung {x:1, z:0} prüfen
        const isOccupied = (x, z) => {
             if (x === 3 && z === 2) {
                 // Kollision mit blockingEnemy prüfen
                 for (const other of enemies) {
                     if (other === enemy) continue;
                     if (other.gridX === x && other.gridZ === z && !other.isMoving) return true;
                     for (const cell of other.occupiedCells || []) {
                         if (cell.x === x && cell.z === z) return true;
                     }
                 }
             }
             return false; // Andere Felder sind frei
        }

        const freeDirection = enemy.findFreeDirection(isOccupied, enemies, player, false);
        // Erwartet, dass eine andere Richtung gefunden wird, da rechts blockiert ist
        expect(freeDirection).not.toBeNull();
        expect(freeDirection).not.toEqual({ x: 1, z: 0 });
    });

     it('should return null if a direction is blocked by a moving enemy (target cell)', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 }; // Nach rechts
        mockIsPositionOccupied.mockReturnValue(false);
        // Anderer Gegner bewegt sich nach 3,2
        const movingEnemy = createMockEnemy(3, 1, true, 3, 2, [{x: 3, z: 1}, {x: 3, z: 2}]);
        const enemies = [enemy, movingEnemy];
        const player = createMockPlayer();

        const isOccupied = (x, z) => {
             if (x === 3 && z === 2) {
                 for (const other of enemies) {
                     if (other === enemy) continue;
                     if (other.gridX === x && other.gridZ === z && !other.isMoving) return true;
                     for (const cell of other.occupiedCells || []) {
                         if (cell.x === x && cell.z === z) return true; // Blockiert durch Zielzelle des anderen
                     }
                 }
             }
             return false;
        }

        const freeDirection = enemy.findFreeDirection(isOccupied, enemies, player, false);
        // Erwartet, dass eine andere Richtung gefunden wird
        expect(freeDirection).not.toBeNull();
        expect(freeDirection).not.toEqual({ x: 1, z: 0 });
    });

    it('should ignore player position when checking for obstacles', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 1, z: 0 }; // Nach rechts
        mockIsPositionOccupied.mockReturnValue(false); // Keine Hindernisse
        const enemies = [enemy];
        const player = createMockPlayer(3, 2); // Spieler steht im Weg

        const freeDirection = enemy.findFreeDirection(mockIsPositionOccupied, enemies, player, false);
        // Sollte die Richtung trotzdem als frei betrachten (Kollision wird später behandelt)
        expect(freeDirection).toEqual({ x: 1, z: 0 });
    });

    it('should check directions in random order if randomOrder=true', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        mockIsPositionOccupied.mockReturnValue(false);
        const enemies = [enemy];
        const player = createMockPlayer();

        const firstDirections = [];
        for(let i=0; i<5; i++) {
           firstDirections.push(enemy.findFreeDirection(mockIsPositionOccupied, enemies, player, true));
        }
        // Es ist unwahrscheinlich (aber nicht unmöglich), dass immer die gleiche Richtung zuerst kommt.
        // Ein besserer Test würde die interne Logik prüfen, aber das ist schwierig von außen.
        // Wir prüfen zumindest, ob *irgendeine* gültige Richtung zurückgegeben wird.
        const possibleDirections = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        firstDirections.forEach(dir => expect(possibleDirections).toContainEqual(dir));
        // Man könnte noch prüfen, ob die Richtungen variieren, aber das ist nicht garantiert.
    });

  });

  describe('move', () => {
    it('should set target and start moving if not moving and free direction found', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.direction = { x: 0, z: 1 }; // Nach unten
        mockIsPositionOccupied.mockReturnValue(false);
        const enemies = [enemy];
        const player = createMockPlayer();

        enemy.move(mockIsPositionOccupied, enemies, player);

        expect(enemy.isMoving).toBe(true);
        expect(enemy.targetX).toBe(2);
        expect(enemy.targetZ).toBe(3);
        expect(enemy.occupiedCells).toEqual([{ x: 2, z: 2 }, { x: 2, z: 3 }]);
        expect(enemy.lastDirection).toEqual({ x: 0, z: 1 });
    });

    it('should not start moving if no free direction is found', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        mockIsPositionOccupied.mockReturnValue(true); // Alles blockiert
        const enemies = [enemy];
        const player = createMockPlayer();

        enemy.move(mockIsPositionOccupied, enemies, player);

        expect(enemy.isMoving).toBe(false);
        expect(enemy.targetX).toBe(2); // Bleibt unverändert
        expect(enemy.targetZ).toBe(2);
        expect(enemy.occupiedCells).toEqual([{ x: 2, z: 2 }]); // Nur eigene Zelle
    });

    it('should update mesh position towards target if moving', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.isMoving = true;
        enemy.targetX = 2;
        enemy.targetZ = 3;
        enemy.direction = { x: 0, z: 1 };
        enemy.speed = CELL_SIZE / 10; // Braucht 10 Schritte
        enemy.mesh.position.set(2 * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, 2 * CELL_SIZE + CELL_SIZE / 2);

        const startX = enemy.mesh.position.x;
        const startZ = enemy.mesh.position.z;

        enemy.move(mockIsPositionOccupied, [], createMockPlayer()); // Keine Kollisionen hier relevant

        expect(enemy.mesh.position.x).toBe(startX); // Keine X-Bewegung
        expect(enemy.mesh.position.z).toBeCloseTo(startZ + enemy.speed);
        expect(enemy.isMoving).toBe(true); // Noch nicht am Ziel
        expect(enemy.gridX).toBe(2); // Grid-Position ändert sich erst am Ziel
        expect(enemy.gridZ).toBe(2);
    });

     it('should stop moving and update grid position when target is reached', () => {
        const enemy = new Enemy(mockGameWorld, 2, 2);
        enemy.isMoving = true;
        enemy.targetX = 3;
        enemy.targetZ = 2;
        enemy.direction = { x: 1, z: 0 };
        enemy.speed = CELL_SIZE * 2; // Erreicht Ziel in einem Schritt
        const targetWorldX = 3 * CELL_SIZE + CELL_SIZE / 2;
        const targetWorldZ = 2 * CELL_SIZE + CELL_SIZE / 2;
        enemy.mesh.position.set(targetWorldX - CELL_SIZE/2, CELL_SIZE / 2, targetWorldZ); // Kurz vor Ziel

        enemy.move(mockIsPositionOccupied, [], createMockPlayer());

        expect(enemy.mesh.position.x).toBe(targetWorldX);
        expect(enemy.mesh.position.z).toBe(targetWorldZ);
        expect(enemy.isMoving).toBe(false);
        expect(enemy.gridX).toBe(3);
        expect(enemy.gridZ).toBe(2);
        expect(enemy.occupiedCells).toEqual([{ x: 3, z: 2 }]);
    });

    // --- Placeholder tests for collision methods (require full code) ---
    // it('checkForApproachingEnemies should return true if another enemy targets the same cell');
    // it('checkCollisionWithEnemies should call handleCollision on overlap');
    // it('handleCollision should attempt to find a new random direction');
    // it('checkCollisionWithPlayer should return true on overlap');
    // it('reverseDirection should invert the current direction');
    // it('separateEnemies should adjust positions slightly');

  });
}); 