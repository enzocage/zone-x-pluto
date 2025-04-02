import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from '../modules/GameController.js';
import { Player } from '../entities/Player.js';

// Mocks für Module
vi.mock('../entities/Player.js', () => ({
    Player: vi.fn().mockImplementation(() => ({
        move: vi.fn(),
        setMoveDirection: vi.fn(),
        reset: vi.fn()
    }))
}));

vi.mock('../modules/LevelGenerator.js', () => ({
    LevelGenerator: vi.fn().mockImplementation(() => ({
        generateLevel: vi.fn()
    }))
}));

vi.mock('../modules/UIController.js', () => ({
    UIController: vi.fn().mockImplementation(() => ({
        init: vi.fn(),
        updateTimer: vi.fn(),
        updatePlutonium: vi.fn(),
        updateLives: vi.fn(),
        updateBlocks: vi.fn(),
        updateScore: vi.fn()
    }))
}));

vi.mock('three', () => ({
    Group: vi.fn().mockImplementation(() => ({
        position: { x: 0, z: 0 }
    })),
    BoxGeometry: vi.fn(),
    MeshLambertMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => ({
        position: { set: vi.fn() },
        visible: false,
        material: { color: { set: vi.fn() } }
    }))
}));

describe('GameController', () => {
    let gameController;
    let scene;
    
    beforeEach(() => {
        // Mock für die Szene
        scene = {
            add: vi.fn()
        };
        
        // GameController initialisieren
        gameController = new GameController(scene);
        
        // UI-Initialisierung umgehen
        gameController.uiController.init = vi.fn();
        
        // setInterval-Mock
        vi.useFakeTimers();
    });
    
    afterEach(() => {
        vi.clearAllTimers();
    });
    
    it('sollte korrekt initialisiert werden', () => {
        expect(gameController.scene).toBe(scene);
        expect(gameController.gameWorld).toBeDefined();
        expect(gameController.walls).toEqual([]);
        expect(gameController.enemies).toEqual([]);
        expect(gameController.playerLives).toBe(5);
        expect(gameController.playerBlocks).toBe(15);
        expect(gameController.currentLevel).toBe(1);
    });
    
    it('sollte init() die notwendigen Methoden aufrufen', () => {
        // Spione für die zu testenden Methoden
        const initSpy = vi.spyOn(gameController.uiController, 'init');
        const generateLevelSpy = vi.spyOn(gameController, 'generateLevel');
        const setupEventListenersSpy = vi.spyOn(gameController, 'setupEventListeners');
        
        // Methode aufrufen
        gameController.init();
        
        // Überprüfen, ob die Methoden aufgerufen wurden
        expect(initSpy).toHaveBeenCalled();
        expect(generateLevelSpy).toHaveBeenCalledWith(1);
        expect(setupEventListenersSpy).toHaveBeenCalled();
    });
    
    it('sollte Plutonium-Timer korrekt starten und stoppen', () => {
        // Timer starten
        gameController.startPlutoniumTimer();
        
        // Überprüfen, ob Timer gestartet wurde
        expect(gameController.plutoniumTimer).toBeDefined();
        expect(gameController.plutoniumTimerValue).toBe(20);
        
        // Zeit fortschreiten lassen
        vi.advanceTimersByTime(5000);
        
        // Überprüfen, ob Timer herunterzählt
        expect(gameController.plutoniumTimerValue).toBe(15);
        
        // Timer stoppen
        gameController.stopPlutoniumTimer();
        
        // Überprüfen, ob Timer gestoppt wurde
        expect(gameController.plutoniumTimer).toBeNull();
        
        // Zeit fortschreiten lassen
        vi.advanceTimersByTime(5000);
        
        // Timer sollte nicht mehr zählen
        expect(gameController.plutoniumTimerValue).toBe(15);
    });
    
    it('sollte loseLife() ein Leben abziehen und resetGame() aufrufen, wenn keine Leben mehr übrig sind', () => {
        // Original alert überschreiben
        const originalAlert = global.alert;
        global.alert = vi.fn();
        
        // Spy für resetGame
        const resetGameSpy = vi.spyOn(gameController, 'resetGame').mockImplementation(() => {});
        
        // Lebenszahl auf 1 setzen und loseLife aufrufen
        gameController.playerLives = 1;
        gameController.loseLife();
        
        // Überprüfen, ob alert und resetGame aufgerufen wurden
        expect(global.alert).toHaveBeenCalled();
        expect(resetGameSpy).toHaveBeenCalled();
        expect(gameController.playerLives).toBe(0);
        
        // Zurücksetzen
        global.alert = originalAlert;
    });
    
    it('sollte loseLife() ein Leben abziehen und den Spieler zurücksetzen, wenn noch Leben übrig sind', () => {
        // Spy für player.reset
        const playerSpy = vi.spyOn(gameController, 'createPlayer').mockImplementation(() => {
            gameController.player = { reset: vi.fn() };
        });
        gameController.createPlayer();
        const resetSpy = vi.spyOn(gameController.player, 'reset');
        
        // Lebenszahl auf 2 setzen und loseLife aufrufen
        gameController.playerLives = 2;
        gameController.loseLife();
        
        // Überprüfen, ob Leben abgezogen und Spieler zurückgesetzt wurde
        expect(gameController.playerLives).toBe(1);
        expect(resetSpy).toHaveBeenCalled();
    });
    
    it('sollte onKeyDown() die korrekte Bewegungsrichtung setzen', () => {
        // Player-Mock erstellen
        gameController.player = {
            setMoveDirection: vi.fn()
        };
        
        // Verschiedene Tasten testen
        gameController.onKeyDown({ key: 'w' });
        expect(gameController.player.setMoveDirection).toHaveBeenCalledWith(0, -1);
        
        gameController.onKeyDown({ key: 's' });
        expect(gameController.player.setMoveDirection).toHaveBeenCalledWith(0, 1);
        
        gameController.onKeyDown({ key: 'a' });
        expect(gameController.player.setMoveDirection).toHaveBeenCalledWith(-1, 0);
        
        gameController.onKeyDown({ key: 'd' });
        expect(gameController.player.setMoveDirection).toHaveBeenCalledWith(1, 0);
    });
}); 