import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameController } from '../modules/GameController.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock, PlacedBlock } from '../entities/Item.js';
import { LevelGenerator } from './LevelGenerator.js';
import { UIController } from './UIController.js';
import { SoundGenerator } from './SoundGenerator.js';
import { PLAYER_START_LIVES, PLAYER_START_BLOCKS, PLUTONIUM_TIMER, PLAYER_START_POSITION, CELL_SIZE } from '../config/config.js';

// --- Mocks für Module und Klassen ---

// Mock Player
vi.mock('../entities/Player.js', () => {
  const PlayerMock = vi.fn();
  PlayerMock.prototype.move = vi.fn();
  PlayerMock.prototype.setMoveDirection = vi.fn();
  PlayerMock.prototype.reset = vi.fn();
  PlayerMock.prototype.onMove = vi.fn(); // Mock für den Event-Listener
  PlayerMock.prototype.onWindowResize = vi.fn(); // Mock für die Methode
  // Standard-Eigenschaften für den Mock
  PlayerMock.prototype.gridX = PLAYER_START_POSITION.x;
  PlayerMock.prototype.gridZ = PLAYER_START_POSITION.z;
  PlayerMock.prototype.isMoving = false;
  PlayerMock.prototype.moveDirection = { x: 0, y: 0 }; // y wird als z interpretiert
  PlayerMock.prototype.lastMoveDirection = { x: 0, y: 0 };
  return { Player: PlayerMock };
});

// Mock Enemy
vi.mock('../entities/Enemy.js', () => {
  const EnemyMock = vi.fn();
  EnemyMock.prototype.move = vi.fn();
  EnemyMock.prototype.checkCollisionWithPlayer = vi.fn().mockReturnValue(false); // Standard: keine Kollision
  EnemyMock.prototype.remove = vi.fn();
  EnemyMock.prototype.isMoving = false;
  EnemyMock.prototype.gridX = 0;
  EnemyMock.prototype.gridZ = 0;
  EnemyMock.prototype.occupiedCells = [];
  return { Enemy: EnemyMock };
});

// Mock Items
vi.mock('../entities/Item.js', () => ({
    Plutonium: vi.fn().mockImplementation((gw, x, z) => ({ gridX: x, gridZ: z, collected: false, remove: vi.fn(), collect: vi.fn(), mesh: { visible: true } })),
    Barrel: vi.fn().mockImplementation((gw, x, z) => ({ gridX: x, gridZ: z, remove: vi.fn() })),
    CollectibleBlock: vi.fn().mockImplementation((gw, x, z) => ({ gridX: x, gridZ: z, collected: false, remove: vi.fn(), collect: vi.fn(), mesh: { visible: true } })),
    PlacedBlock: vi.fn().mockImplementation((gw, x, z) => ({ gridX: x, gridZ: z, remove: vi.fn() }))
}));

// Mock LevelGenerator
vi.mock('./LevelGenerator.js', () => ({
    LevelGenerator: vi.fn().mockImplementation(() => ({
        generateLevel: vi.fn(),
        isPositionOccupiedByWalls: vi.fn().mockReturnValue(false) // Standard: Nichts blockiert durch Wände
    }))
}));

// Mock UIController
vi.mock('./UIController.js', () => ({
    UIController: vi.fn().mockImplementation(() => ({
        init: vi.fn(),
        updateTimer: vi.fn(),
        updatePlutonium: vi.fn(),
        updateLives: vi.fn(),
        updateBlocks: vi.fn(),
        updateScore: vi.fn()
    }))
}));

// Mock SoundGenerator
vi.mock('./SoundGenerator.js', () => ({
    SoundGenerator: vi.fn().mockImplementation(() => ({
        init: vi.fn(),
        playPlayerMove: vi.fn(),
        playBlockPlace: vi.fn(),
        playBlockPickup: vi.fn(),
        playCollectPlutonium: vi.fn(),
        playDeliverPlutonium: vi.fn(),
        playEnemyCollision: vi.fn(),
        playLevelComplete: vi.fn(),
        playError: vi.fn(),
        playPlutoniumTimerWarning: vi.fn(),
    }))
}));

// Mock THREE.Group und Exit Mesh
const mockGameWorld = {
    add: vi.fn(),
    remove: vi.fn(),
    children: [], // Wichtig für clearLevel
};
const mockExitMesh = {
    position: { set: vi.fn() },
    visible: false,
    gridX: 27, // Beispielwert aus Code
    gridZ: 27,
};
// Mock THREE global
vi.stubGlobal('THREE', {
    Group: vi.fn().mockImplementation(() => mockGameWorld),
    Mesh: vi.fn().mockImplementation(() => mockExitMesh), // Mock Mesh für Exit
    BoxGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(),
    Color: vi.fn(),
});

// --- Tests für GameController ---

describe('GameController', () => {
    let gameController;
    let mockScene;

    beforeEach(() => {
        // Mock für die Szene
        mockScene = {
            add: vi.fn(),
            remove: vi.fn(),
        };

        // Mocks zurücksetzen
        vi.clearAllMocks();
        mockGameWorld.add.mockClear();
        mockGameWorld.remove.mockClear();
        mockGameWorld.children = [];
        mockExitMesh.visible = false;
        // Reset Player mock defaults if necessary
        Player.prototype.gridX = PLAYER_START_POSITION.x;
        Player.prototype.gridZ = PLAYER_START_POSITION.z;
        Player.prototype.moveDirection = { x: 0, y: 0 };
        Player.prototype.lastMoveDirection = { x: 0, y: 0 };


        // GameController initialisieren
        gameController = new GameController(mockScene);

        // Timer mocken
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should initialize correctly', () => {
        expect(gameController.scene).toBe(mockScene);
        expect(gameController.gameWorld).toBe(mockGameWorld);
        expect(mockScene.add).toHaveBeenCalledWith(mockGameWorld);
        expect(gameController.levelGenerator).toBeInstanceOf(LevelGenerator);
        expect(gameController.uiController).toBeInstanceOf(UIController);
        expect(gameController.soundGenerator).toBeInstanceOf(SoundGenerator);
        expect(gameController.playerLives).toBe(PLAYER_START_LIVES);
        expect(gameController.playerBlocks).toBe(PLAYER_START_BLOCKS);
        expect(gameController.currentLevel).toBe(1);
        expect(gameController.playerScore).toBe(0);
        expect(gameController.plutoniumCollected).toBe(false);
        expect(gameController.remainingPlutonium).toBe(5);
    });

    describe('init', () => {
        it('should call necessary initialization methods', () => {
            const spyUiInit = vi.spyOn(gameController.uiController, 'init');
            const spySoundInit = vi.spyOn(gameController.soundGenerator, 'init');
            const spyGenerateLevel = vi.spyOn(gameController, 'generateLevel');
            const spySetupListeners = vi.spyOn(gameController, 'setupEventListeners');

            gameController.init();

            expect(spyUiInit).toHaveBeenCalledTimes(1);
            expect(spySoundInit).toHaveBeenCalledTimes(1);
            expect(spyGenerateLevel).toHaveBeenCalledWith(1);
            expect(spySetupListeners).toHaveBeenCalledTimes(1);
        });
    });

    describe('generateLevel', () => {
        it('should clear previous level, create player/exit, and generate new level', () => {
            const spyClearLevel = vi.spyOn(gameController, 'clearLevel');
            const spyCreatePlayer = vi.spyOn(gameController, 'createPlayer');
            const spyCreateExit = vi.spyOn(gameController, 'createExit');
            const spyLevelGen = vi.spyOn(gameController.levelGenerator, 'generateLevel');
            const spyUpdateUI = vi.spyOn(gameController, 'updateUI');

            gameController.generateLevel(2);

            expect(spyClearLevel).toHaveBeenCalledTimes(1);
            expect(spyCreatePlayer).toHaveBeenCalledTimes(1);
            expect(spyCreateExit).toHaveBeenCalledTimes(1);
            expect(spyLevelGen).toHaveBeenCalledWith(
                2,
                gameController.walls,
                gameController.enemies,
                gameController.plutoniumItems,
                gameController.barrels,
                gameController.collectibleBlocks
            );
            expect(spyUpdateUI).toHaveBeenCalledTimes(1);
        });
    });

    describe('clearLevel', () => {
        it('should remove all entities and clear arrays', () => {
            const mockWall = { remove: vi.fn() };
            const mockEnemy = { remove: vi.fn() };
            const mockPlutonium = { remove: vi.fn() };
            const mockBarrel = { remove: vi.fn() };
            const mockBlock = { remove: vi.fn() };
            const mockCollectible = { remove: vi.fn() };
            gameController.walls = [mockWall];
            gameController.enemies = [mockEnemy];
            gameController.plutoniumItems = [mockPlutonium];
            gameController.barrels = [mockBarrel];
            gameController.blocks = [mockBlock];
            gameController.collectibleBlocks = [mockCollectible];
            gameController.exit = mockExitMesh;
            mockGameWorld.children = [mockWall, mockEnemy, mockPlutonium, mockBarrel, mockBlock, mockCollectible, mockExitMesh];

            gameController.clearLevel();

            expect(mockWall.remove).toHaveBeenCalledTimes(1);
            expect(mockEnemy.remove).toHaveBeenCalledTimes(1);
            expect(mockPlutonium.remove).toHaveBeenCalledTimes(1);
            expect(mockBarrel.remove).toHaveBeenCalledTimes(1);
            expect(mockBlock.remove).toHaveBeenCalledTimes(1);
            expect(mockCollectible.remove).toHaveBeenCalledTimes(1);
            expect(mockGameWorld.remove).toHaveBeenCalledWith(mockExitMesh);

            expect(gameController.walls).toEqual([]);
            expect(gameController.enemies).toEqual([]);
            expect(gameController.plutoniumItems).toEqual([]);
            expect(gameController.barrels).toEqual([]);
            expect(gameController.blocks).toEqual([]);
            expect(gameController.collectibleBlocks).toEqual([]);
            expect(gameController.placedCollectibleBlocks).toEqual([]);
        });
    });


    describe('createPlayer', () => {
        it('should create a player instance and register move callback', () => {
            gameController.createPlayer();
            expect(Player).toHaveBeenCalledTimes(1);
            expect(gameController.player).toBeInstanceOf(Player);
            expect(gameController.player.onMove).toHaveBeenCalledWith(expect.any(Function));

            const moveCallback = gameController.player.onMove.mock.calls[0][0];
            moveCallback();
            expect(gameController.soundGenerator.playPlayerMove).toHaveBeenCalledTimes(1);
        });
    });

    describe('createExit', () => {
        it('should create an exit mesh at the correct position and hide it', () => {
            gameController.createExit();
            expect(THREE.Mesh).toHaveBeenCalledTimes(1);
            expect(gameController.exit).toBe(mockExitMesh);
            expect(mockExitMesh.position.set).toHaveBeenCalledWith(27 * CELL_SIZE + CELL_SIZE/2, 0.5, 27 * CELL_SIZE + CELL_SIZE/2);
            expect(mockExitMesh.visible).toBe(false);
            expect(mockGameWorld.add).toHaveBeenCalledWith(mockExitMesh);
            expect(gameController.exit.gridX).toBe(27);
            expect(gameController.exit.gridZ).toBe(27);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            gameController.createPlayer();
             // Mock, um Endlosschleifen in Tests zu verhindern
             vi.spyOn(gameController, 'moveEnemies').mockImplementation(() => {});
        });

        it('should call player.move if no block is collected', () => {
            const spyTryCollectBlock = vi.spyOn(gameController, 'tryCollectBlock').mockReturnValue(false);
            gameController.update();
            expect(gameController.player.move).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
            expect(spyTryCollectBlock).toHaveBeenCalled();
        });

        it('should NOT call player.move if a block was collected', () => {
             const spyTryCollectBlock = vi.spyOn(gameController, 'tryCollectBlock').mockReturnValue(true);
             gameController.update();
             expect(gameController.player.move).not.toHaveBeenCalled();
             expect(spyTryCollectBlock).toHaveBeenCalled();
        });

        it('should call moveEnemies', () => {
            // Der Spy wurde im beforeEach gesetzt
            gameController.update();
            expect(gameController.moveEnemies).toHaveBeenCalledTimes(1);
        });

        it('should check for enemy collisions and call loseLife if collision detected', () => {
            const mockEnemy = new Enemy();
            mockEnemy.checkCollisionWithPlayer.mockReturnValue(true);
            gameController.enemies = [mockEnemy];
            const spyLoseLife = vi.spyOn(gameController, 'loseLife');
            const spyPlaySound = vi.spyOn(gameController.soundGenerator, 'playEnemyCollision');

            gameController.update();

            expect(mockEnemy.checkCollisionWithPlayer).toHaveBeenCalledWith(gameController.player, expect.any(Function), gameController.enemies);
            expect(spyPlaySound).toHaveBeenCalledTimes(1);
            expect(spyLoseLife).toHaveBeenCalledTimes(1);
            expect(gameController.lostLifeThisFrame).toBe(true);
        });

         it('should only call loseLife once per frame even with multiple enemy collisions', () => {
            const mockEnemy1 = new Enemy();
            const mockEnemy2 = new Enemy();
            mockEnemy1.checkCollisionWithPlayer.mockReturnValue(true);
            mockEnemy2.checkCollisionWithPlayer.mockReturnValue(true);
            gameController.enemies = [mockEnemy1, mockEnemy2];
            const spyLoseLife = vi.spyOn(gameController, 'loseLife');
            const spyPlaySound = vi.spyOn(gameController.soundGenerator, 'playEnemyCollision');

            gameController.update();

            expect(spyPlaySound).toHaveBeenCalledTimes(1);
            expect(spyLoseLife).toHaveBeenCalledTimes(1);
            expect(gameController.lostLifeThisFrame).toBe(true);

            gameController.lostLifeThisFrame = false;
            mockEnemy1.checkCollisionWithPlayer.mockReturnValue(false);
            mockEnemy2.checkCollisionWithPlayer.mockReturnValue(false);
            gameController.update();
            expect(spyLoseLife).toHaveBeenCalledTimes(1);
        });

        it('should update previousPlayerGrid position correctly', () => {
            const initialX = gameController.player.gridX;
            const initialZ = gameController.player.gridZ;
            gameController.previousPlayerGridX = initialX -1; // Setze eine andere vorherige Position
            gameController.previousPlayerGridZ = initialZ;

            // 1. Spieler bewegt sich nicht, Block wird nicht gesammelt
            vi.spyOn(gameController, 'tryCollectBlock').mockReturnValue(false);
            gameController.update();
            // Da current !== previous, wird previous aktualisiert
            expect(gameController.previousPlayerGridX).toBe(initialX);
            expect(gameController.previousPlayerGridZ).toBe(initialZ);

            // Reset für nächsten Test
             gameController.previousPlayerGridX = initialX;
             gameController.previousPlayerGridZ = initialZ;

            // 2. Spieler bewegt sich
            gameController.player.gridX = initialX + 1;
            gameController.update();
             // previous sollte der Wert *vor* der Bewegung sein
            expect(gameController.previousPlayerGridX).toBe(initialX);
            expect(gameController.previousPlayerGridZ).toBe(initialZ);
            gameController.player.gridX = initialX; // Zurücksetzen für nächsten Schritt

             // Reset für nächsten Test
             gameController.previousPlayerGridX = initialX;
             gameController.previousPlayerGridZ = initialZ;

            // 3. Spieler sammelt Block (bewegt sich nicht explizit)
            vi.spyOn(gameController, 'tryCollectBlock').mockReturnValue(true);
            gameController.update();
            // previous sollte der Wert *vor* dem Sammeln sein
            expect(gameController.previousPlayerGridX).toBe(initialX);
            expect(gameController.previousPlayerGridZ).toBe(initialZ);
        });
    });

    describe('moveEnemies', () => {
        it('should call move() for each enemy', () => {
            const mockEnemy1 = new Enemy();
            const mockEnemy2 = new Enemy();
            gameController.enemies = [mockEnemy1, mockEnemy2];

            gameController.moveEnemies();

            expect(mockEnemy1.move).toHaveBeenCalledTimes(1);
            expect(mockEnemy1.move).toHaveBeenCalledWith(expect.any(Function), gameController.enemies, gameController.player);
            expect(mockEnemy2.move).toHaveBeenCalledTimes(1);
            expect(mockEnemy2.move).toHaveBeenCalledWith(expect.any(Function), gameController.enemies, gameController.player);
        });
    });

    describe('isPositionOccupied', () => {
         beforeEach(() => {
            gameController.createPlayer();
            gameController.player.gridX = 5;
            gameController.player.gridZ = 5;
        });

        it('should return true for wall positions', () => {
            gameController.walls = [new Wall(null, 3, 3)];
            expect(gameController.isPositionOccupied(3, 3)).toBe(true);
        });

        it('should return true for player position', () => {
            expect(gameController.isPositionOccupied(5, 5)).toBe(true);
        });

        it('should return true for placed block positions', () => {
            gameController.blocks = [new PlacedBlock(null, 4, 4)];
            expect(gameController.isPositionOccupied(4, 4)).toBe(true);
        });

        it('should return true for enemy positions (stationary)', () => {
            const enemy = new Enemy();
            enemy.gridX = 6;
            enemy.gridZ = 6;
            enemy.isMoving = false;
            gameController.enemies = [enemy];
            expect(gameController.isPositionOccupied(6, 6)).toBe(true);
        });

        it('should return true for enemy occupied cells (moving)', () => {
            const enemy = new Enemy();
            enemy.gridX = 7;
            enemy.gridZ = 7;
            enemy.isMoving = true;
            enemy.occupiedCells = [{ x: 7, z: 7 }, { x: 7, z: 8 }];
            gameController.enemies = [enemy];
            expect(gameController.isPositionOccupied(7, 7)).toBe(true);
            expect(gameController.isPositionOccupied(7, 8)).toBe(true);
        });

        it('should return false for empty positions', () => {
            expect(gameController.isPositionOccupied(10, 10)).toBe(false);
        });

        it('should return false for collectible block positions', () => {
            gameController.collectibleBlocks = [new CollectibleBlock(null, 8, 8)];
            expect(gameController.isPositionOccupied(8, 8)).toBe(false);
        });

         it('should return false for plutonium positions', () => {
            gameController.plutoniumItems = [new Plutonium(null, 9, 9)];
            expect(gameController.isPositionOccupied(9, 9)).toBe(false);
        });

         it('should return false for barrel positions', () => {
            gameController.barrels = [new Barrel(null, 1, 1)];
            expect(gameController.isPositionOccupied(1, 1)).toBe(false);
        });
    });

    describe('checkCollisions', () => {
         let player;

        beforeEach(() => {
            gameController.createPlayer();
            player = gameController.player;
            player.gridX = 10;
            player.gridZ = 10;

            vi.spyOn(gameController.soundGenerator, 'playCollectPlutonium');
            vi.spyOn(gameController.soundGenerator, 'playDeliverPlutonium');
            vi.spyOn(gameController.soundGenerator, 'playBlockPickup');
            vi.spyOn(gameController.soundGenerator, 'playLevelComplete');
            vi.spyOn(gameController, 'startPlutoniumTimer');
            vi.spyOn(gameController, 'stopPlutoniumTimer');
            vi.spyOn(gameController, 'activateExit');
            vi.spyOn(gameController, 'completeLevel');
        });

        it('should collect plutonium and start timer', () => {
            const plutonium = new Plutonium(null, 10, 10);
            gameController.plutoniumItems = [plutonium];
            gameController.remainingPlutonium = 3;

            gameController.checkCollisions();

            expect(plutonium.collect).toHaveBeenCalledTimes(1);
            expect(gameController.plutoniumCollected).toBe(true);
            expect(gameController.soundGenerator.playCollectPlutonium).toHaveBeenCalledTimes(1);
            expect(gameController.startPlutoniumTimer).toHaveBeenCalledTimes(1);
        });

        it('should deliver plutonium at barrel if collected', () => {
            gameController.plutoniumCollected = true;
            gameController.barrels = [new Barrel(null, 10, 10)];
            gameController.remainingPlutonium = 3;
            gameController.playerScore = 50;

            gameController.checkCollisions();

            expect(gameController.plutoniumCollected).toBe(false);
            expect(gameController.remainingPlutonium).toBe(2);
            expect(gameController.playerScore).toBe(150);
            expect(gameController.soundGenerator.playDeliverPlutonium).toHaveBeenCalledTimes(1);
            expect(gameController.stopPlutoniumTimer).toHaveBeenCalledTimes(1);
            expect(gameController.uiController.updateScore).toHaveBeenCalledWith(150);
            expect(gameController.uiController.updatePlutonium).toHaveBeenCalledWith(2);
        });

         it('should activate exit when last plutonium is delivered', () => {
            gameController.plutoniumCollected = true;
            gameController.barrels = [new Barrel(null, 10, 10)];
            gameController.remainingPlutonium = 1;

            gameController.checkCollisions();

            expect(gameController.remainingPlutonium).toBe(0);
            expect(gameController.activateExit).toHaveBeenCalledTimes(1);
            expect(gameController.stopPlutoniumTimer).toHaveBeenCalledTimes(1);
        });

        it('should collect collectible block', () => {
            const block = new CollectibleBlock(null, 10, 10);
            gameController.collectibleBlocks = [block];
            gameController.playerBlocks = 5;

            gameController.checkCollisions();

            expect(block.collect).toHaveBeenCalledTimes(1);
            expect(gameController.playerBlocks).toBe(6);
            expect(gameController.soundGenerator.playBlockPickup).toHaveBeenCalledTimes(1);
            expect(gameController.uiController.updateBlocks).toHaveBeenCalledWith(6);
        });

        it('should complete level when exit is reached and active', () => {
            gameController.exit = mockExitMesh;
            gameController.exit.visible = true;
            player.gridX = gameController.exit.gridX;
            player.gridZ = gameController.exit.gridZ;

            gameController.checkCollisions();

            expect(gameController.soundGenerator.playLevelComplete).toHaveBeenCalledTimes(1);
            expect(gameController.completeLevel).toHaveBeenCalledTimes(1);
        });

         it('should NOT complete level if exit is not visible', () => {
            gameController.exit = mockExitMesh;
            gameController.exit.visible = false;
            player.gridX = gameController.exit.gridX;
            player.gridZ = gameController.exit.gridZ;

            gameController.checkCollisions();

            expect(gameController.completeLevel).not.toHaveBeenCalled();
        });

        it('should NOT deliver plutonium if not collected', () => {
            gameController.plutoniumCollected = false;
            gameController.barrels = [new Barrel(null, 10, 10)];

            gameController.checkCollisions();

            expect(gameController.stopPlutoniumTimer).not.toHaveBeenCalled();
            expect(gameController.activateExit).not.toHaveBeenCalled();
        });
    });

    describe('activateExit', () => {
        it('should make the exit mesh visible', () => {
            gameController.createExit();
            mockExitMesh.visible = false;
            gameController.activateExit();
            expect(mockExitMesh.visible).toBe(true);
        });
    });

    describe('completeLevel', () => {
        it('should set levelCompleted flag, increment level, generate next level, and update score', () => {
            const spyGenerateLevel = vi.spyOn(gameController, 'generateLevel');
            gameController.currentLevel = 2;
            gameController.playerScore = 150;

            gameController.completeLevel();

            expect(gameController.levelCompleted).toBe(true);
            vi.advanceTimersByTime(100);

            expect(gameController.currentLevel).toBe(3);
            expect(gameController.playerScore).toBe(400);
            expect(spyGenerateLevel).toHaveBeenCalledWith(3);
            expect(gameController.uiController.updateScore).toHaveBeenCalledWith(400);
            expect(gameController.levelCompleted).toBe(false);
        });
    });

    describe('placeBlock', () => {
        beforeEach(() => {
            gameController.createPlayer();
            gameController.player.gridX = 10;
            gameController.player.gridZ = 10;
            gameController.player.lastMoveDirection = { x: 1, y: 0 };
            gameController.playerBlocks = 5;
            vi.spyOn(gameController, 'isPositionOccupied').mockReturnValue(false);
            vi.spyOn(gameController.soundGenerator, 'playBlockPlace');
            vi.spyOn(gameController.soundGenerator, 'playError');
        });

        it('should place a block behind the player if conditions are met', () => {
            gameController.placeBlock();

            const expectedX = 9;
            const expectedZ = 10;

            expect(gameController.playerBlocks).toBe(4);
            expect(PlacedBlock).toHaveBeenCalledWith(gameController.gameWorld, expectedX, expectedZ);
            expect(gameController.blocks.length).toBe(1);
            expect(gameController.blocks[0]).toBeInstanceOf(PlacedBlock);
            expect(gameController.soundGenerator.playBlockPlace).toHaveBeenCalledTimes(1);
            expect(gameController.isPositionOccupied).toHaveBeenCalledWith(expectedX, expectedZ);
            expect(gameController.uiController.updateBlocks).toHaveBeenCalledWith(4);
        });

        it('should not place a block if player has no blocks left', () => {
            gameController.playerBlocks = 0;
            gameController.placeBlock();

            expect(PlacedBlock).not.toHaveBeenCalled();
            expect(gameController.blocks.length).toBe(0);
            expect(gameController.soundGenerator.playError).toHaveBeenCalledTimes(1);
        });

        it('should not place a block if the target position is occupied', () => {
             gameController.isPositionOccupied.mockReturnValue(true);
             gameController.placeBlock();

             expect(PlacedBlock).not.toHaveBeenCalled();
             expect(gameController.blocks.length).toBe(0);
             expect(gameController.soundGenerator.playError).toHaveBeenCalledTimes(1);
             expect(gameController.playerBlocks).toBe(5);
        });

         it('should not place a block if player has no last move direction', () => {
            gameController.player.lastMoveDirection = { x: 0, y: 0 };
            gameController.placeBlock();

            expect(PlacedBlock).not.toHaveBeenCalled();
            expect(gameController.blocks.length).toBe(0);
            expect(gameController.soundGenerator.playError).toHaveBeenCalledTimes(1);
        });

        it('should place block correctly based on different lastMoveDirection', () => {
            gameController.player.lastMoveDirection = { x: -1, y: 0 };
            gameController.placeBlock();
            expect(PlacedBlock).toHaveBeenCalledWith(gameController.gameWorld, 11, 10);
            PlacedBlock.mockClear();

             gameController.player.lastMoveDirection = { x: 0, y: -1 };
             gameController.placeBlock();
             expect(PlacedBlock).toHaveBeenCalledWith(gameController.gameWorld, 10, 11);
             PlacedBlock.mockClear();

             gameController.player.lastMoveDirection = { x: 0, y: 1 };
             gameController.placeBlock();
             expect(PlacedBlock).toHaveBeenCalledWith(gameController.gameWorld, 10, 9);
        });
    });

    describe('loseLife', () => {
        beforeEach(() => {
            global.alert = vi.fn();
            gameController.createPlayer();
             vi.spyOn(gameController, 'resetGame');
             vi.spyOn(gameController.uiController, 'updateLives');
        });

        it('should decrement lives, update UI, and reset player if lives > 0', () => {
            gameController.playerLives = 3;
            gameController.loseLife();

            expect(gameController.playerLives).toBe(2);
            expect(gameController.uiController.updateLives).toHaveBeenCalledWith(2);
            expect(gameController.player.reset).toHaveBeenCalledTimes(1);
            expect(gameController.resetGame).not.toHaveBeenCalled();
            expect(global.alert).not.toHaveBeenCalled();
        });

        it('should decrement lives, update UI, call alert, and reset game if lives reach 0', () => {
            gameController.playerLives = 1;
            gameController.loseLife();

            expect(gameController.playerLives).toBe(0);
            expect(gameController.uiController.updateLives).toHaveBeenCalledWith(0);
            expect(gameController.player.reset).not.toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith('Game Over!');
            expect(gameController.resetGame).toHaveBeenCalledTimes(1);
        });
    });

     describe('startPlutoniumTimer', () => {
         it('should start the interval timer and update UI periodically', () => {
            const spySetInterval = vi.spyOn(global, 'setInterval');
            const spyClearInterval = vi.spyOn(global, 'clearInterval');
            const spyUpdateTimer = vi.spyOn(gameController.uiController, 'updateTimer');
            const spyPlayWarning = vi.spyOn(gameController.soundGenerator, 'playPlutoniumTimerWarning');
            const spyLoseLife = vi.spyOn(gameController, 'loseLife');

            gameController.startPlutoniumTimer();

            expect(spySetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
            expect(gameController.plutoniumTimerValue).toBe(PLUTONIUM_TIMER);
            expect(spyUpdateTimer).toHaveBeenCalledWith(PLUTONIUM_TIMER);

            vi.advanceTimersByTime(5000);
            expect(gameController.plutoniumTimerValue).toBe(PLUTONIUM_TIMER - 5);
            expect(spyUpdateTimer).toHaveBeenCalledTimes(6);
            expect(spyPlayWarning).toHaveBeenCalledTimes(5);

            vi.advanceTimersByTime(PLUTONIUM_TIMER * 1000);
            expect(gameController.plutoniumTimerValue).toBe(0);
            expect(spyLoseLife).toHaveBeenCalledTimes(1);
            expect(spyClearInterval).toHaveBeenCalledWith(gameController.plutoniumTimer);
            expect(gameController.plutoniumTimer).toBeNull();
            expect(gameController.plutoniumCollected).toBe(false);
        });

         it('should clear existing timer before starting a new one', () => {
            gameController.plutoniumTimer = 12345;
            const spyClearInterval = vi.spyOn(global, 'clearInterval');
            gameController.startPlutoniumTimer();
            expect(spyClearInterval).toHaveBeenCalledWith(12345);
        });
    });

    describe('stopPlutoniumTimer', () => {
        it('should clear the interval and reset the timer value if timer exists', () => {
            gameController.plutoniumTimer = 12345;
            gameController.plutoniumTimerValue = 10;
            const spyClearInterval = vi.spyOn(global, 'clearInterval');
            const spyUpdateTimer = vi.spyOn(gameController.uiController, 'updateTimer');

            gameController.stopPlutoniumTimer();

            expect(spyClearInterval).toHaveBeenCalledWith(12345);
            expect(gameController.plutoniumTimer).toBeNull();
            expect(gameController.plutoniumTimerValue).toBe(PLUTONIUM_TIMER);
            expect(spyUpdateTimer).toHaveBeenCalledWith(-1);
        });

         it('should do nothing if timer does not exist', () => {
            gameController.plutoniumTimer = null;
            const spyClearInterval = vi.spyOn(global, 'clearInterval');
            gameController.stopPlutoniumTimer();
            expect(spyClearInterval).not.toHaveBeenCalled();
        });
    });

    describe('updateUI', () => {
         it('should call all UI update methods with current values', () => {
             gameController.plutoniumTimerValue = 15;
             gameController.plutoniumCollected = true;
             gameController.remainingPlutonium = 4;
             gameController.playerLives = 2;
             gameController.playerBlocks = 8;
             gameController.playerScore = 250;

             gameController.updateUI();

             expect(gameController.uiController.updateTimer).toHaveBeenCalledWith(15);
             expect(gameController.uiController.updatePlutonium).toHaveBeenCalledWith(4);
             expect(gameController.uiController.updateLives).toHaveBeenCalledWith(2);
             expect(gameController.uiController.updateBlocks).toHaveBeenCalledWith(8);
             expect(gameController.uiController.updateScore).toHaveBeenCalledWith(250);
         });

          it('should call updateTimer with -1 if plutonium not collected', () => {
             gameController.plutoniumCollected = false;
             gameController.updateUI();
             expect(gameController.uiController.updateTimer).toHaveBeenCalledWith(-1);
         });
    });

    describe('resetGame', () => {
        it('should reset player stats, score, level, stop timer, and generate level 1', () => {
            const spyStopTimer = vi.spyOn(gameController, 'stopPlutoniumTimer');
            const spyGenerateLevel = vi.spyOn(gameController, 'generateLevel');
            const spyUpdateUI = vi.spyOn(gameController, 'updateUI');

            gameController.playerLives = 0;
            gameController.playerBlocks = 3;
            gameController.playerScore = 500;
            gameController.currentLevel = 3;
            gameController.plutoniumCollected = true;

            gameController.resetGame();

            expect(gameController.playerLives).toBe(PLAYER_START_LIVES);
            expect(gameController.playerBlocks).toBe(PLAYER_START_BLOCKS);
            expect(gameController.playerScore).toBe(0);
            expect(gameController.currentLevel).toBe(1);
            expect(gameController.plutoniumCollected).toBe(false);
            expect(gameController.levelCompleted).toBe(false);
            expect(spyStopTimer).toHaveBeenCalledTimes(1);
            expect(spyGenerateLevel).toHaveBeenCalledWith(1);
            expect(spyUpdateUI).toHaveBeenCalledTimes(1);
        });
    });

    describe('Keyboard Events (onKeyDown, onKeyUp)', () => {
        let mockEvent;
        let player;

        beforeEach(() => {
             // Erstelle den Player und mocke seine Methoden neu für jeden Test
             gameController.createPlayer();
             player = gameController.player;
             // Stelle sicher, dass die Mocks vom Player-Mock zurückgesetzt werden
             vi.clearAllMocks();

             mockEvent = { key: '', preventDefault: vi.fn() };
             vi.spyOn(gameController, 'placeBlock');
        });

        it('onKeyDown should set player move direction for movement keys (w,a,s,d,arrows)', () => {
            mockEvent.key = 'w';
            gameController.onKeyDown(mockEvent);
            expect(player.setMoveDirection).toHaveBeenCalledWith(0, -1);
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
            player.setMoveDirection.mockClear();
            mockEvent.preventDefault.mockClear();

            mockEvent.key = 'ArrowLeft';
            gameController.onKeyDown(mockEvent);
            expect(player.setMoveDirection).toHaveBeenCalledWith(-1, 0);
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
        });

         it('onKeyDown should call placeBlock for spacebar', () => {
            mockEvent.key = ' ';
            gameController.onKeyDown(mockEvent);
            expect(gameController.placeBlock).toHaveBeenCalledTimes(1);
            expect(player.setMoveDirection).not.toHaveBeenCalled();
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
        });

        it('onKeyDown should ignore other keys', () => {
            mockEvent.key = 'Shift';
            gameController.onKeyDown(mockEvent);
            expect(player.setMoveDirection).not.toHaveBeenCalled();
            expect(gameController.placeBlock).not.toHaveBeenCalled();
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('onKeyUp should reset player move direction if the corresponding key is released', () => {
             player.moveDirection = { x: 1, y: 0 };
             mockEvent.key = 'd';
             gameController.onKeyUp(mockEvent);
             expect(player.setMoveDirection).toHaveBeenCalledWith(0, 0);
             player.setMoveDirection.mockClear();

             player.moveDirection = { x: 0, y: -1 };
             mockEvent.key = 'ArrowUp';
             gameController.onKeyUp(mockEvent);
             expect(player.setMoveDirection).toHaveBeenCalledWith(0, 0);
        });

        it('onKeyUp should NOT reset direction if a different movement key is released', () => {
             player.moveDirection = { x: 0, y: -1 };
             mockEvent.key = 'a';
             gameController.onKeyUp(mockEvent);
             expect(player.setMoveDirection).not.toHaveBeenCalledWith(0, 0);
        });

         it('onKeyUp should ignore non-movement keys', () => {
            player.moveDirection = { x: 1, y: 0 };
            mockEvent.key = ' ';
            gameController.onKeyUp(mockEvent);
            expect(player.setMoveDirection).not.toHaveBeenCalledWith(0, 0);
        });
    });

    describe('tryCollectBlock', () => {
         let collectibleBlock;

        beforeEach(() => {
            gameController.createPlayer();
            collectibleBlock = new CollectibleBlock(null, 11, 10);
            gameController.collectibleBlocks = [collectibleBlock];
            gameController.playerBlocks = 5;
            vi.spyOn(gameController.soundGenerator, 'playBlockPickup');
            vi.spyOn(gameController.uiController, 'updateBlocks');
        });

        it('should collect the block at the target position and return true', () => {
            const result = gameController.tryCollectBlock(11, 10);

            expect(result).toBe(true);
            expect(collectibleBlock.collect).toHaveBeenCalledTimes(1);
            expect(gameController.playerBlocks).toBe(6);
            expect(gameController.soundGenerator.playBlockPickup).toHaveBeenCalledTimes(1);
            expect(gameController.uiController.updateBlocks).toHaveBeenCalledWith(6);
            expect(gameController.collectibleBlocks.find(b => b === collectibleBlock)).toBeUndefined();
        });

        it('should return false if no block is at the target position', () => {
            const result = gameController.tryCollectBlock(12, 10);
            expect(result).toBe(false);
            expect(collectibleBlock.collect).not.toHaveBeenCalled();
            expect(gameController.playerBlocks).toBe(5);
            expect(gameController.soundGenerator.playBlockPickup).not.toHaveBeenCalled();
        });

         it('should return false if block is already collected (edge case)', () => {
            collectibleBlock.collected = true;
            const result = gameController.tryCollectBlock(11, 10);
            expect(result).toBe(false);
            expect(collectibleBlock.collect).not.toHaveBeenCalled();
        });
    });

    describe('onWindowResize', () => {
        it('should call player.onWindowResize if player exists', () => {
             gameController.createPlayer();
             // Player mock hat bereits onWindowResize
             gameController.onWindowResize();
             expect(gameController.player.onWindowResize).toHaveBeenCalledTimes(1);
        });
         it('should not throw error if player does not exist', () => {
             gameController.player = null;
             expect(() => gameController.onWindowResize()).not.toThrow();
        });
    });

}); 