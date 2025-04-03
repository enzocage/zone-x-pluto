import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Player } from '../entities/Player.js';
import { CELL_SIZE, PLAYER_MOVE_SPEED, PLAYER_START_POSITION } from '../config/config.js';
import { Enemy } from '../entities/Enemy.js'; // Import für Kollisionstests

// --- Mocks ---

// Mock für THREE.js Objekte
const mockPlayerMesh = {
    position: { x:0, y:0, z:0, set: vi.fn() },
    add: vi.fn()
};
const mockPointLight = {
    position: { set: vi.fn() }
};
const mockGameWorld = {
    position: { x: 0, z: 0 },
    add: vi.fn() // Nur zur Sicherheit, falls es mal aufgerufen wird
};
const mockScene = {
    add: vi.fn()
};

vi.mock('three', () => ({
    BoxGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => mockPlayerMesh),
    PointLight: vi.fn().mockImplementation(() => mockPointLight),
    // Group wird nicht direkt vom Player importiert, aber gameWorld wird übergeben
}));

// Mock für Enemy (nur für Kollisionstest)
vi.mock('../entities/Enemy.js', () => ({
    Enemy: vi.fn().mockImplementation(() => ({ gridX: 0, gridZ: 0 }))
}));


describe('Player', () => {
    let player;
    let isPositionOccupiedMock;
    let checkCollisionsMock;

    beforeEach(() => {
        // Mocks zurücksetzen
        vi.clearAllMocks();
        mockGameWorld.position = { x: -(PLAYER_START_POSITION.x + CELL_SIZE/2), z: -(PLAYER_START_POSITION.z + CELL_SIZE/2) }; // Startposition simulieren

        // Player-Instanz erstellen
        player = new Player(mockScene, mockGameWorld, PLAYER_START_POSITION.x, PLAYER_START_POSITION.z);

        // Standard-Mocks für Callbacks
        isPositionOccupiedMock = vi.fn().mockReturnValue(false); // Standard: Nichts ist blockiert
        checkCollisionsMock = vi.fn();

        // Zeit mocken
        vi.useFakeTimers();
        vi.setSystemTime(0); // Starte bei Zeit 0
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize correctly', () => {
        expect(player.gridX).toBe(PLAYER_START_POSITION.x);
        expect(player.gridZ).toBe(PLAYER_START_POSITION.z);
        expect(player.scene).toBe(mockScene);
        expect(player.gameWorld).toBe(mockGameWorld);
        expect(player.moveDirection).toEqual({ x: 0, y: 0 });
        expect(player.facingDirection).toEqual({ x: 0, z: 1 }); // Standardblick nach unten
        expect(player.isMoving).toBe(false);
        expect(player.targetPosition).toBeNull();
        expect(player.moveSpeed).toBe(PLAYER_MOVE_SPEED);
        expect(player.occupiedCells).toEqual([{ x: player.gridX, z: player.gridZ }]); // Nur Startzelle

        // Mesh und Licht prüfen
        expect(THREE.Mesh).toHaveBeenCalledTimes(1);
        expect(player.mesh).toBe(mockPlayerMesh);
        expect(mockScene.add).toHaveBeenCalledWith(mockPlayerMesh);
        expect(THREE.PointLight).toHaveBeenCalledTimes(1);
        expect(mockPlayerMesh.add).toHaveBeenCalledWith(mockPointLight);

        // Startposition der Welt prüfen
        expect(mockGameWorld.position.x).toBe(-(PLAYER_START_POSITION.x + CELL_SIZE/2));
        expect(mockGameWorld.position.z).toBe(-(PLAYER_START_POSITION.z + CELL_SIZE/2));
    });

    describe('setMoveDirection', () => {
        it('should update moveDirection', () => {
            player.setMoveDirection(1, 0);
            expect(player.moveDirection).toEqual({ x: 1, y: 0 });
        });

        it('should update facingDirection if direction is non-zero', () => {
            player.setMoveDirection(0, -1); // Nach oben
            expect(player.facingDirection).toEqual({ x: 0, z: -1 });

            player.setMoveDirection(-1, 0); // Nach links
            expect(player.facingDirection).toEqual({ x: -1, z: 0 });
        });

        it('should not update facingDirection if direction is zero', () => {
            player.facingDirection = { x: 1, z: 0 }; // Blick nach rechts
            player.setMoveDirection(0, 0);
            expect(player.facingDirection).toEqual({ x: 1, z: 0 }); // Sollte unverändert bleiben
        });
    });

    describe('Callback Registration (onMove, onCollision)', () => {
        it('should register onMove callback', () => {
            const callback = vi.fn();
            player.onMove(callback);
            expect(player.onMoveCallback).toBe(callback);
        });

        it('should register onCollision callback', () => {
             const callback = vi.fn();
             player.onCollision(callback);
             expect(player.onCollisionCallback).toBe(callback);
        });
    });

    describe('move', () => {
        it('should start moving if direction is set and target is not occupied', () => {
            player.setMoveDirection(1, 0); // Nach rechts
            const startX = player.gridX;
            const startZ = player.gridZ;
            const targetGridX = startX + 1;
            const targetGridZ = startZ;
            const expectedTargetWorldX = -(targetGridX + CELL_SIZE/2);
            const expectedTargetWorldZ = -(targetGridZ + CELL_SIZE/2);

            player.move(isPositionOccupiedMock, checkCollisionsMock);

            expect(isPositionOccupiedMock).toHaveBeenCalledWith(targetGridX, targetGridZ);
            expect(player.isMoving).toBe(true);
            expect(player.gridX).toBe(targetGridX); // Grid-Position wird sofort aktualisiert
            expect(player.gridZ).toBe(targetGridZ);
            expect(player.targetPosition).toEqual({ x: expectedTargetWorldX, z: expectedTargetWorldZ });
            expect(player.occupiedCells).toEqual([{ x: startX, z: startZ }, { x: targetGridX, z: targetGridZ }]);
            expect(player.onMoveCallback).toBeNull(); // Noch kein Callback registriert
        });

        it('should call onMoveCallback when starting to move', () => {
             const moveCb = vi.fn();
             player.onMove(moveCb);
             player.setMoveDirection(0, 1); // Nach unten
             player.move(isPositionOccupiedMock, checkCollisionsMock);

             expect(player.isMoving).toBe(true);
             expect(moveCb).toHaveBeenCalledTimes(1);
             expect(player.lastSoundTime).toBe(0); // Zeit ist 0
        });

        it('should not start moving if target is occupied', () => {
            isPositionOccupiedMock.mockReturnValue(true);
            player.setMoveDirection(-1, 0); // Nach links
            const startX = player.gridX;
            const startZ = player.gridZ;

            player.move(isPositionOccupiedMock, checkCollisionsMock);

            expect(isPositionOccupiedMock).toHaveBeenCalledWith(startX - 1, startZ);
            expect(player.isMoving).toBe(false);
            expect(player.gridX).toBe(startX);
            expect(player.gridZ).toBe(startZ);
            expect(player.targetPosition).toBeNull();
            expect(player.occupiedCells).toEqual([{ x: startX, z: startZ }]);
        });

        it('should continue moving towards targetPosition if already moving', () => {
            // Bewegung starten
            player.setMoveDirection(1, 0);
            player.move(isPositionOccupiedMock, checkCollisionsMock);
            expect(player.isMoving).toBe(true);

            const initialWorldX = mockGameWorld.position.x;
            const initialWorldZ = mockGameWorld.position.z;
            const targetWorldX = player.targetPosition.x;
            const targetWorldZ = player.targetPosition.z;

            // Zeit fortschreiten lassen (weniger als ein Feld)
            const timeStep = 50; // 50 ms
            vi.advanceTimersByTime(timeStep);
            const deltaTime = timeStep / 1000;
            const frameSpeed = player.moveSpeed * deltaTime * 60;

            player.move(isPositionOccupiedMock, checkCollisionsMock);

            expect(player.isMoving).toBe(true); // Immer noch in Bewegung
            expect(mockGameWorld.position.x).not.toBe(initialWorldX);
            expect(mockGameWorld.position.x).toBeCloseTo(initialWorldX + frameSpeed); // Bewegt sich in positive X-Richtung (Welt bewegt sich negativ)
             expect(mockGameWorld.position.z).toBe(initialWorldZ); // Keine Z-Bewegung
            expect(checkCollisionsMock).not.toHaveBeenCalled(); // Kollision erst am Ziel
        });

        it('should call onMoveCallback periodically while moving (respecting cooldown)', () => {
             const moveCb = vi.fn();
             player.onMove(moveCb);
             player.setMoveDirection(1, 0);
             player.move(isPositionOccupiedMock, checkCollisionsMock); // Start -> 1. Aufruf
             expect(moveCb).toHaveBeenCalledTimes(1);
             expect(player.lastSoundTime).toBe(0);

            // Zeit fortschreiten (weniger als Cooldown)
             vi.advanceTimersByTime(player.movementSoundCooldown / 2);
             player.move(isPositionOccupiedMock, checkCollisionsMock);
             expect(moveCb).toHaveBeenCalledTimes(1); // Kein neuer Aufruf

            // Zeit fortschreiten (mehr als Cooldown)
             vi.advanceTimersByTime(player.movementSoundCooldown);
             const currentTime = player.movementSoundCooldown / 2 + player.movementSoundCooldown;
             player.move(isPositionOccupiedMock, checkCollisionsMock);
             expect(moveCb).toHaveBeenCalledTimes(2); // Neuer Aufruf
             expect(player.lastSoundTime).toBe(currentTime);
        });

        it('should stop at target, call checkCollisions, and check for continuous move when reaching target', () => {
            player.setMoveDirection(1, 0);
            player.move(isPositionOccupiedMock, checkCollisionsMock); // Bewegung starten
            const targetX = player.gridX;
            const targetZ = player.gridZ;
            const targetWorldX = player.targetPosition.x;
            const targetWorldZ = player.targetPosition.z;

            // Simulieren, dass das Ziel fast erreicht ist
            mockGameWorld.position.x = targetWorldX + 0.01;
            mockGameWorld.position.z = targetWorldZ;

            // Halte die Bewegungstaste gedrückt
            player.moveDirection = { x: 1, y: 0 };
            isPositionOccupiedMock.mockClear(); // Reset für den nächsten Check

            vi.advanceTimersByTime(16); // Nächster Frame
            player.move(isPositionOccupiedMock, checkCollisionsMock);

            // 1. Exakt am Ziel ankommen
            expect(mockGameWorld.position.x).toBe(targetWorldX);
            expect(mockGameWorld.position.z).toBe(targetWorldZ);
            // 2. Kollision prüfen
            expect(checkCollisionsMock).toHaveBeenCalledTimes(1);
            // 3. Nächstes Feld prüfen (kontinuierliche Bewegung)
            expect(isPositionOccupiedMock).toHaveBeenCalledWith(targetX + 1, targetZ);
            // 4. Bewegung sollte fortgesetzt werden (neues Ziel)
            expect(player.isMoving).toBe(true);
            expect(player.gridX).toBe(targetX + 1); // Neues Grid-Ziel
            expect(player.targetPosition).toEqual({ x: -((targetX + 1) + CELL_SIZE/2), z: -(targetZ + CELL_SIZE/2) });
            expect(player.occupiedCells).toEqual([{ x: targetX, z: targetZ }, { x: targetX + 1, z: targetZ }]);
        });

        it('should stop at target if next position is occupied', () => {
             player.setMoveDirection(1, 0);
             player.move(isPositionOccupiedMock, checkCollisionsMock);
             const targetWorldX = player.targetPosition.x;
             const targetWorldZ = player.targetPosition.z;
             mockGameWorld.position.x = targetWorldX + 0.01;
             mockGameWorld.position.z = targetWorldZ;

             // Nächstes Feld blockieren
             isPositionOccupiedMock.mockImplementation((x, z) => x === player.gridX + 1 && z === player.gridZ);

             vi.advanceTimersByTime(16);
             player.move(isPositionOccupiedMock, checkCollisionsMock);

             expect(mockGameWorld.position.x).toBe(targetWorldX);
             expect(mockGameWorld.position.z).toBe(targetWorldZ);
             expect(checkCollisionsMock).toHaveBeenCalledTimes(1);
             expect(player.isMoving).toBe(false);
             expect(player.targetPosition).toBeNull();
             expect(player.occupiedCells).toEqual([{ x: player.gridX, z: player.gridZ }]); // Nur aktuelle Zelle
        });

        it('should stop at target if no move direction is pressed anymore', () => {
            player.setMoveDirection(1, 0);
            player.move(isPositionOccupiedMock, checkCollisionsMock);
            const targetWorldX = player.targetPosition.x;
            const targetWorldZ = player.targetPosition.z;
            mockGameWorld.position.x = targetWorldX + 0.01;
            mockGameWorld.position.z = targetWorldZ;

            // Richtungstaste loslassen
            player.setMoveDirection(0, 0);

            vi.advanceTimersByTime(16);
            player.move(isPositionOccupiedMock, checkCollisionsMock);

            expect(mockGameWorld.position.x).toBe(targetWorldX);
            expect(mockGameWorld.position.z).toBe(targetWorldZ);
            expect(checkCollisionsMock).toHaveBeenCalledTimes(1);
            expect(player.isMoving).toBe(false);
            expect(player.targetPosition).toBeNull();
            expect(player.occupiedCells).toEqual([{ x: player.gridX, z: player.gridZ }]);
        });

         it('should only occupy current cell if not moving', () => {
            player.isMoving = false;
            player.targetPosition = null;
            player.move(isPositionOccupiedMock, checkCollisionsMock);
            expect(player.occupiedCells).toEqual([{ x: player.gridX, z: player.gridZ }]);
        });
    });

    describe('checkCollisionWithEnemies', () => {
        let enemy1, enemy2;

        beforeEach(() => {
            enemy1 = new Enemy();
            enemy2 = new Enemy();
            player.onCollisionCallback = vi.fn(); // Mock Callback
        });

        it('should return true and call callback if player occupies the same grid cell as an enemy', () => {
             enemy1.gridX = player.gridX;
             enemy1.gridZ = player.gridZ;
             enemy2.gridX = player.gridX + 1;
             enemy2.gridZ = player.gridZ;
             const enemies = [enemy1, enemy2];

             const result = player.checkCollisionWithEnemies(enemies);

             expect(result).toBe(true);
             expect(player.onCollisionCallback).toHaveBeenCalledWith(enemy1);
             expect(player.onCollisionCallback).toHaveBeenCalledTimes(1);
        });

         it('should return false and not call callback if no enemy is at player position', () => {
             enemy1.gridX = player.gridX + 1;
             enemy1.gridZ = player.gridZ;
             enemy2.gridX = player.gridX;
             enemy2.gridZ = player.gridZ + 1;
             const enemies = [enemy1, enemy2];

             const result = player.checkCollisionWithEnemies(enemies);

             expect(result).toBe(false);
             expect(player.onCollisionCallback).not.toHaveBeenCalled();
        });

         it('should return false if enemies array is empty', () => {
             const enemies = [];
             const result = player.checkCollisionWithEnemies(enemies);
             expect(result).toBe(false);
             expect(player.onCollisionCallback).not.toHaveBeenCalled();
        });
    });

    describe('handleCollision', () => {
        // Die Methode ist laut Code leer, daher kein Test nötig oder möglich.
        // Falls Logik hinzugefügt wird, hier Tests erstellen.
        it.skip('should handle collision with enemy (currently empty method)', () => {
             // Test logic here if the method gets implemented
        });
    });

    describe('reset', () => {
        it('should reset player position, state, and gameWorld position', () => {
            // Zustand ändern
            player.gridX = 50;
            player.gridZ = 50;
            player.isMoving = true;
            player.targetPosition = { x: -100, z: -100 };
            player.moveDirection = { x: 1, y: 0 };
            player.facingDirection = { x: 1, z: 0 };
            mockGameWorld.position = { x: -50.5, z: -50.5 }; // Abweichende Weltposition

            const startX = 20;
            const startZ = 30;
            const expectedWorldX = -(startX + CELL_SIZE/2);
            const expectedWorldZ = -(startZ + CELL_SIZE/2);

            player.reset(startX, startZ);

            expect(player.gridX).toBe(startX);
            expect(player.gridZ).toBe(startZ);
            expect(player.isMoving).toBe(false);
            expect(player.targetPosition).toBeNull();
            expect(player.moveDirection).toEqual({ x: 0, y: 0 });
            expect(player.facingDirection).toEqual({ x: 0, z: 1 }); // Zurück auf Standardblickrichtung
            expect(mockGameWorld.position.x).toBe(expectedWorldX);
            expect(mockGameWorld.position.z).toBe(expectedWorldZ);
             // Prüfen, ob die Mesh-Position zurückgesetzt wird (obwohl sie 0,y,0 sein sollte)
             expect(mockPlayerMesh.position.set).toHaveBeenCalledWith(0, CELL_SIZE / 2, 0);
        });
    });

    describe('onWindowResize', () => {
        // Die Methode ist laut Code leer.
        it.skip('should handle window resize (currently empty method)', () => {
            // Test logic here if the method gets implemented
        });
    });

}); 