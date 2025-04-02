/**
 * Game Controller
 * Hauptsteuerungsklasse für das Spiel, verwaltet den Spielzustand und steuert den Spielablauf
 */

import { 
    PLAYER_START_LIVES, 
    PLAYER_START_BLOCKS, 
    PLUTONIUM_TIMER, 
    PLAYER_START_POSITION 
} from '../config/config.js';
import { Player } from '../entities/Player.js';
import { LevelGenerator } from './LevelGenerator.js';
import { PlacedBlock } from '../entities/Item.js';
import { UIController } from './UIController.js';

export class GameController {
    constructor(scene) {
        // Three.js-Elemente
        this.scene = scene;
        this.gameWorld = new THREE.Group();
        scene.add(this.gameWorld);
        
        // Spielobjekte
        this.player = null;
        this.exit = null;
        this.walls = [];
        this.enemies = [];
        this.plutoniumItems = [];
        this.barrels = [];
        this.blocks = [];
        this.collectibleBlocks = [];
        
        // Spielstatus
        this.playerLives = PLAYER_START_LIVES;
        this.playerBlocks = PLAYER_START_BLOCKS;
        this.playerScore = 0;
        this.plutoniumCollected = false;
        this.plutoniumTimer = null;
        this.plutoniumTimerValue = PLUTONIUM_TIMER;
        this.remainingPlutonium = 5;
        this.levelCompleted = false;
        this.currentLevel = 1;
        this.exitReached = false;
        
        // Hilfsobjekte
        this.levelGenerator = new LevelGenerator(this.gameWorld);
        this.uiController = new UIController();
    }
    
    /**
     * Initialisiert das Spiel
     */
    init() {
        // UI initialisieren
        this.uiController.init();
        
        // Level generieren
        this.generateLevel(this.currentLevel);
        
        // Event-Listener registrieren
        this.setupEventListeners();
    }
    
    /**
     * Registriert Event-Listener für Tastatureingaben und andere Ereignisse
     */
    setupEventListeners() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    /**
     * Generiert ein neues Level
     */
    generateLevel(level) {
        this.clearLevel();
        
        // Spieler erstellen
        this.createPlayer();
        
        // Ausgang erstellen
        this.createExit();
        
        // Level generieren
        this.levelGenerator.generateLevel(
            level, 
            this.walls, 
            this.enemies, 
            this.plutoniumItems, 
            this.barrels, 
            this.collectibleBlocks
        );
        
        // UI aktualisieren
        this.updateUI();
    }
    
    /**
     * Erstellt den Spieler
     */
    createPlayer() {
        this.player = new Player(
            this.scene, 
            this.gameWorld, 
            PLAYER_START_POSITION.x, 
            PLAYER_START_POSITION.z
        );
    }
    
    /**
     * Erstellt den Ausgang
     */
    createExit() {
        const geometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        this.exit = new THREE.Mesh(geometry, material);
        this.exit.position.set(27, 0.5, 27);
        this.exit.visible = false; // Erst sichtbar, wenn alle Plutonium abgeliefert wurde
        this.gameWorld.add(this.exit);
        
        // Exit-Koordinaten
        this.exit.gridX = 27;
        this.exit.gridZ = 27;
    }
    
    /**
     * Leert das aktuelle Level (entfernt alle Objekte)
     */
    clearLevel() {
        // Arrays leeren und Objekte entfernen
        this.walls.forEach(wall => wall.remove());
        this.enemies.forEach(enemy => enemy.remove && enemy.remove());
        this.plutoniumItems.forEach(item => item.remove());
        this.barrels.forEach(barrel => barrel.remove());
        this.blocks.forEach(block => block.remove());
        this.collectibleBlocks.forEach(block => block.remove());
        
        if (this.exit) this.gameWorld.remove(this.exit);
        
        // Arrays zurücksetzen
        this.walls = [];
        this.enemies = [];
        this.plutoniumItems = [];
        this.barrels = [];
        this.blocks = [];
        this.collectibleBlocks = [];
    }
    
    /**
     * Führt die Spiellogik für jeden Frame aus
     */
    update() {
        if (!this.levelCompleted) {
            // Spieler bewegen
            this.player.move(
                this.isPositionOccupied.bind(this),
                this.checkCollisions.bind(this)
            );
            
            // Gegner bewegen
            this.moveEnemies();
        }
    }
    
    /**
     * Bewegt alle Gegner
     */
    moveEnemies() {
        for (const enemy of this.enemies) {
            enemy.move(this.isPositionOccupied.bind(this));
            
            // Kollision mit Spieler prüfen
            if (enemy.checkCollisionWithPlayer(this.player)) {
                this.loseLife();
            }
        }
    }
    
    /**
     * Prüft, ob eine Position von einem Objekt belegt ist
     */
    isPositionOccupied(x, z) {
        // Spieler prüfen
        if (this.player && this.player.gridX === x && this.player.gridZ === z) {
            return true;
        }
        
        // Wände prüfen
        for (const wall of this.walls) {
            if (wall.gridX === x && wall.gridZ === z) {
                return true;
            }
        }
        
        // Tonnen prüfen
        for (const barrel of this.barrels) {
            if (barrel.gridX === x && barrel.gridZ === z) {
                return true;
            }
        }
        
        // Platzierte Blocks prüfen
        for (const block of this.blocks) {
            if (block.gridX === x && block.gridZ === z) {
                return true;
            }
        }
        
        // Position ist frei
        return false;
    }
    
    /**
     * Prüft Kollisionen des Spielers mit anderen Objekten
     */
    checkCollisions() {
        // Kollision mit Plutonium
        for (const plutonium of this.plutoniumItems) {
            if (plutonium.checkCollisionWithPlayer(this.player)) {
                plutonium.collect();
                this.remainingPlutonium--;
                this.plutoniumCollected = true;
                
                // Timer starten
                this.startPlutoniumTimer();
                
                this.updateUI();
            }
        }
        
        // Kollision mit Tonnen (wenn Plutonium gesammelt wurde)
        if (this.plutoniumCollected) {
            for (const barrel of this.barrels) {
                if (barrel.checkCollisionWithPlayer(this.player)) {
                    this.plutoniumCollected = false;
                    this.playerScore += 100;
                    
                    // Timer stoppen
                    this.stopPlutoniumTimer();
                    
                    // Wenn alle Plutonium-Proben abgeliefert wurden, Exit aktivieren
                    if (this.remainingPlutonium === 0) {
                        this.activateExit();
                    }
                    
                    this.updateUI();
                }
            }
        }
        
        // Kollision mit sammelbaren Blocks
        for (let i = this.collectibleBlocks.length - 1; i >= 0; i--) {
            const block = this.collectibleBlocks[i];
            if (block.checkCollisionWithPlayer(this.player)) {
                block.collect();
                this.collectibleBlocks.splice(i, 1);
                this.playerBlocks++;
                this.updateUI();
            }
        }
        
        // Kollision mit Exit (wenn alle Plutonium-Proben abgeliefert wurden)
        if (this.remainingPlutonium === 0 && 
            this.player.gridX === this.exit.gridX && 
            this.player.gridZ === this.exit.gridZ) {
            this.completeLevel();
        }
    }
    
    /**
     * Aktiviert den Ausgang, nachdem alle Plutonium-Proben abgeliefert wurden
     */
    activateExit() {
        this.exit.visible = true;
        this.exit.material.color.set(0x00ff00);
        
        // Blinkeffekt für den Exit
        const blinkInterval = setInterval(() => {
            this.exit.visible = !this.exit.visible;
        }, 500);
    }
    
    /**
     * Schließt das aktuelle Level ab und lädt das nächste
     */
    completeLevel() {
        this.exitReached = true;
        this.levelCompleted = true;
        
        // Level-Übergang starten
        setTimeout(() => {
            this.currentLevel++;
            this.generateLevel(this.currentLevel);
            this.exitReached = false;
            this.levelCompleted = false;
        }, 2000);
    }
    
    /**
     * Platziert einen Block
     */
    placeBlock() {
        if (this.playerBlocks <= 0) return;
        
        // Position hinter dem Spieler berechnen
        let blockX = this.player.gridX;
        let blockZ = this.player.gridZ;
        
        if (this.player.moveDirection.x > 0) blockX--;
        else if (this.player.moveDirection.x < 0) blockX++;
        else if (this.player.moveDirection.y > 0) blockZ--;
        else if (this.player.moveDirection.y < 0) blockZ++;
        else return; // Keine Richtung, kein Block
        
        // Prüfen, ob Position frei ist
        if (this.isPositionOccupied(blockX, blockZ)) return;
        
        // Block erstellen
        this.blocks.push(new PlacedBlock(this.gameWorld, blockX, blockZ));
        
        // Block abziehen
        this.playerBlocks--;
        this.updateUI();
    }
    
    /**
     * Reduziert die Spielerleben
     */
    loseLife() {
        this.playerLives--;
        this.updateUI();
        
        if (this.playerLives <= 0) {
            // Game Over
            alert("Game Over! Punkte: " + this.playerScore);
            this.resetGame();
        } else {
            // Spieler zurücksetzen
            this.player.reset(PLAYER_START_POSITION.x, PLAYER_START_POSITION.z);
        }
    }
    
    /**
     * Startet den Plutonium-Timer
     */
    startPlutoniumTimer() {
        this.stopPlutoniumTimer();
        
        this.plutoniumTimerValue = PLUTONIUM_TIMER;
        this.plutoniumTimer = setInterval(() => {
            this.plutoniumTimerValue--;
            
            if (this.plutoniumTimerValue <= 0) {
                this.stopPlutoniumTimer();
                this.loseLife();
                this.plutoniumCollected = false;
            }
            
            this.updateUI();
        }, 1000);
    }
    
    /**
     * Stoppt den Plutonium-Timer
     */
    stopPlutoniumTimer() {
        if (this.plutoniumTimer) {
            clearInterval(this.plutoniumTimer);
            this.plutoniumTimer = null;
        }
    }
    
    /**
     * Aktualisiert die UI-Elemente
     */
    updateUI() {
        this.uiController.updateTimer(this.plutoniumTimer ? this.plutoniumTimerValue : -1);
        this.uiController.updatePlutonium(this.remainingPlutonium);
        this.uiController.updateLives(this.playerLives);
        this.uiController.updateBlocks(this.playerBlocks);
        this.uiController.updateScore(this.playerScore);
    }
    
    /**
     * Setzt das Spiel zurück
     */
    resetGame() {
        this.playerLives = PLAYER_START_LIVES;
        this.playerBlocks = PLAYER_START_BLOCKS;
        this.playerScore = 0;
        this.plutoniumCollected = false;
        this.remainingPlutonium = 5;
        this.levelCompleted = false;
        this.currentLevel = 1;
        this.exitReached = false;
        
        this.clearLevel();
        this.generateLevel(this.currentLevel);
    }
    
    /**
     * Behandelt Tastendruck-Events
     */
    onKeyDown(event) {
        switch (event.key) {
            case 'w':
            case 'W':
                this.player.setMoveDirection(0, -1);
                break;
            case 's':
            case 'S':
                this.player.setMoveDirection(0, 1);
                break;
            case 'a':
            case 'A':
                this.player.setMoveDirection(-1, 0);
                break;
            case 'd':
            case 'D':
                this.player.setMoveDirection(1, 0);
                break;
            case ' ':
                this.placeBlock();
                break;
        }
    }
    
    /**
     * Behandelt Tastenloslassen-Events
     */
    onKeyUp(event) {
        switch (event.key) {
            case 'q':
            case 'Q':
            case 's':
            case 'S':
                this.player.setMoveDirection(0, 0);
                break;
            case 'a':
            case 'A':
            case 'd':
            case 'D':
                this.player.setMoveDirection(0, 0);
                break;
        }
    }
    
    /**
     * Behandelt Fenstergrößenänderungen
     */
    onWindowResize() {
        // Wird von der Game-Instanz implementiert
    }
} 