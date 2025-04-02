/**
 * Game Controller
 * Hauptsteuerungsklasse für das Spiel, verwaltet den Spielzustand und steuert den Spielablauf
 * Koordiniert die Interaktion zwischen Spieler, Gegnern, Items und dem Level
 */

import { 
    PLAYER_START_LIVES, 
    PLAYER_START_BLOCKS, 
    PLUTONIUM_TIMER, 
    PLAYER_START_POSITION,
    CELL_SIZE,
    ENEMY_COLLISION_THRESHOLD
} from '../config/config.js';
import { Player } from '../entities/Player.js';
import { LevelGenerator } from './LevelGenerator.js';
import { PlacedBlock } from '../entities/Item.js';
import { UIController } from './UIController.js';
import { SoundGenerator } from './SoundGenerator.js';

export class GameController {
    /**
     * Erstellt einen neuen GameController
     * Initialisiert alle grundlegenden Spielvariablen und -zustände
     * @param {Object} scene - Die Three.js-Szene für Rendering
     */
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
        this.soundGenerator = new SoundGenerator();
    }
    
    /**
     * Initialisiert das Spiel
     * Startet das UI, generiert das erste Level und richtet Event-Listener ein
     */
    init() {
        // UI initialisieren
        this.uiController.init();
        
        // Sound Generator initialisieren
        this.soundGenerator.init();
        
        // Level generieren
        this.generateLevel(this.currentLevel);
        
        // Event-Listener registrieren
        this.setupEventListeners();
    }
    
    /**
     * Registriert Event-Listener für Tastatureingaben und andere Ereignisse
     * Ermöglicht die Steuerung des Spiels durch den Benutzer
     */
    setupEventListeners() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    /**
     * Generiert ein neues Level
     * Löscht das vorherige Level und erstellt ein neues mit dem LevelGenerator
     * @param {number} level - Die Levelnummer, beeinflusst die Schwierigkeit
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
     * Erzeugt eine neue Spieler-Instanz an der Startposition
     */
    createPlayer() {
        this.player = new Player(
            this.scene, 
            this.gameWorld, 
            PLAYER_START_POSITION.x, 
            PLAYER_START_POSITION.z
        );
        
        // Bewegungs-Sound-Callback registrieren
        this.player.onMove(() => {
            this.soundGenerator.playPlayerMove();
        });
    }
    
    /**
     * Erstellt den Ausgang
     * Der Ausgang wird zunächst unsichtbar sein, bis alle Plutonium-Proben abgeliefert wurden
     */
    createExit() {
        const geometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        // Genaue Raster-Koordinaten für den Exit festlegen
        const exitGridX = 27;
        const exitGridZ = 27;
        
        this.exit = new THREE.Mesh(geometry, material);
        // Präzise Positionierung auf den Rasterpunkt
        this.exit.position.set(
            exitGridX * CELL_SIZE + CELL_SIZE/2, // Exakte Rasterposition
            0.5, 
            exitGridZ * CELL_SIZE + CELL_SIZE/2  // Exakte Rasterposition
        );
        this.exit.visible = false; // Erst sichtbar, wenn alle Plutonium abgeliefert wurde
        this.gameWorld.add(this.exit);
        
        // Exit-Koordinaten präzise speichern (ohne Nachkommastellen)
        this.exit.gridX = exitGridX;
        this.exit.gridZ = exitGridZ;
    }
    
    /**
     * Leert das aktuelle Level (entfernt alle Objekte)
     * Wird vor der Generierung eines neuen Levels aufgerufen
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
     * Aktualisiert Spieler- und Gegnerbewegungen
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
     * Lässt die Gegner autonom durch das Level wandern und prüft Kollisionen mit dem Spieler
     */
    moveEnemies() {
        // Zuerst die Bewegung aller Gegner aktualisieren
        for (const enemy of this.enemies) {
            enemy.move(this.isPositionOccupied.bind(this), this.enemies);
            
            // Kollision mit Spieler prüfen
            if (enemy.checkCollisionWithPlayer(this.player)) {
                this.soundGenerator.playEnemyCollision();
                this.loseLife();
            }
        }
        
        // Anschließend auch kontinuierlich Kollisionen zwischen allen Gegnern prüfen
        // Dies verbessert die Kollisionserkennung während der Bewegung
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                
                // Kollidieren die Gegner miteinander?
                const distX = Math.abs(enemy1.mesh.position.x - enemy2.mesh.position.x);
                const distZ = Math.abs(enemy1.mesh.position.z - enemy2.mesh.position.z);
                
                if (distX < CELL_SIZE * ENEMY_COLLISION_THRESHOLD && 
                    distZ < CELL_SIZE * ENEMY_COLLISION_THRESHOLD) {
                    // Beide Gegner umdrehen lassen
                    enemy1.reverseDirection();
                    enemy2.reverseDirection();
                    
                    // Sound abspielen
                    this.soundGenerator.playEnemyToEnemyCollision();
                    
                    console.log('Gegner-Kollision in GameController erkannt!');
                }
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
     * Behandelt Kollisionen mit Plutonium, Tonnen, Blöcken und dem Ausgang
     * Löst Aktionen wie Einsammeln, Timer-Steuerung und Levelabschluss aus
     */
    checkCollisions() {
        // Prüfe Kollision mit Plutonium
        for (let i = 0; i < this.plutoniumItems.length; i++) {
            const item = this.plutoniumItems[i];
            
            if (this.player.gridX === item.gridX && this.player.gridZ === item.gridZ) {
                console.log('Plutonium aufgesammelt!');
                
                // Sound abspielen
                this.soundGenerator.playPlutoniumPickup();
                
                // Plutonium entfernen
                item.remove();
                this.plutoniumItems.splice(i, 1);
                i--;
                
                // Plutonium-Timer starten
                this.startPlutoniumTimer();
                
                // Spielstatus aktualisieren
                this.plutoniumCollected = true;
                this.remainingPlutonium--;
                this.playerScore += 100;
                
                // UI aktualisieren
                this.updateUI();
                
                if (this.remainingPlutonium === 0) {
                    this.activateExit();
                }
                
                break;
            }
        }
        
        // Prüfe Kollision mit Fässern/Tonnen
        for (let i = 0; i < this.barrels.length; i++) {
            const barrel = this.barrels[i];
            
            if (this.player.gridX === barrel.gridX && this.player.gridZ === barrel.gridZ) {
                console.log('Tonne erreicht!');
                
                if (this.plutoniumCollected) {
                    // Plutonium in Fass entsorgen
                    this.soundGenerator.playPlutoniumPickup(); // Hier könnte ein eigener Sound sein
                    
                    this.stopPlutoniumTimer();
                    this.plutoniumCollected = false;
                    this.playerScore += 200;
                    
                    // UI aktualisieren
                    this.updateUI();
                }
                
                break;
            }
        }
        
        // Prüfe Kollision mit einsammelbaren Blöcken
        for (let i = 0; i < this.collectibleBlocks.length; i++) {
            const block = this.collectibleBlocks[i];
            
            if (this.player.gridX === block.gridX && this.player.gridZ === block.gridZ) {
                console.log('Block aufgesammelt!');
                
                // Sound abspielen
                this.soundGenerator.playBlockPickup();
                
                // Block entfernen
                block.remove();
                this.collectibleBlocks.splice(i, 1);
                i--;
                
                // Block dem Spieler hinzufügen
                this.playerBlocks++;
                this.playerScore += 50;
                
                // UI aktualisieren
                this.updateUI();
                
                break;
            }
        }
        
        // Prüfe Kollision mit Exit
        if (this.exit && this.exit.visible) {
            if (this.player.gridX === this.exit.gridX && 
                this.player.gridZ === this.exit.gridZ) {
                console.log('Exit erreicht!');
                
                // Sound abspielen
                this.soundGenerator.playLevelComplete();
                
                this.completeLevel();
            }
        }
    }
    
    /**
     * Aktiviert den Ausgang, nachdem alle Plutonium-Proben abgeliefert wurden
     * Macht den Ausgang sichtbar und fügt einen Blinkeffekt hinzu
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
     * Wird aufgerufen, wenn der Spieler den Ausgang erreicht
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
     * Platziert einen Block an der aktuellen Spieler-Position
     * Kann verwendet werden, um Wege zu blockieren oder Gegner einzusperren
     */
    placeBlock() {
        // Prüfen, ob der Spieler überhaupt Blöcke hat
        if (this.playerBlocks <= 0) {
            console.log('Keine Blöcke mehr verfügbar!');
            return;
        }
        
        // Prüfen, ob an der aktuellen Position bereits ein Block ist
        const targetPos = { x: this.player.gridX, z: this.player.gridZ };
        
        for (const block of this.blocks) {
            if (block.gridX === targetPos.x && block.gridZ === targetPos.z) {
                console.log('Hier steht bereits ein Block!');
                return;
            }
        }
        
        // Block platzieren
        console.log('Block platziert!');
        
        // Sound abspielen
        this.soundGenerator.playBlockPlace();
        
        // Block-Objekt erstellen
        const block = new PlacedBlock(this.gameWorld, targetPos.x, targetPos.z);
        this.blocks.push(block);
        
        // Block vom Inventar abziehen
        this.playerBlocks--;
        
        // UI aktualisieren
        this.updateUI();
    }
    
    /**
     * Reduziert die Spielerleben
     * Bei Lebensverlust wird der Spieler zurückgesetzt oder das Spiel beendet
     */
    loseLife() {
        // Leben abziehen
        this.playerLives--;
        console.log('Leben verloren! Verbleibende Leben: ' + this.playerLives);
        
        // Sound abspielen
        this.soundGenerator.playLifeLost();
        
        // Plutonium zurücksetzen, falls getragen
        if (this.plutoniumCollected) {
            this.stopPlutoniumTimer();
            this.plutoniumCollected = false;
        }
        
        // UI aktualisieren
        this.updateUI();
        
        // Spieler zurücksetzen
        this.player.reset(PLAYER_START_POSITION.x, PLAYER_START_POSITION.z);
        
        // Prüfen, ob das Spiel verloren ist
        if (this.playerLives <= 0) {
            this.soundGenerator.playGameOver();
            this.resetGame();
        }
    }
    
    /**
     * Startet den Plutonium-Timer
     * Zählt herunter, bis das Plutonium entsorgt werden muss
     */
    startPlutoniumTimer() {
        // Vorherigen Timer löschen, falls vorhanden
        this.stopPlutoniumTimer();
        
        // Timer-Wert zurücksetzen
        this.plutoniumTimerValue = PLUTONIUM_TIMER;
        
        // Neuen Timer starten
        this.plutoniumTimer = setInterval(() => {
            this.plutoniumTimerValue--;
            
            // UI aktualisieren
            this.updateUI();
            
            // Tick-Tack-Sound für jede Sekunde
            this.soundGenerator.playPlutoniumTimerTick(this.plutoniumTimerValue);
            
            // Zusätzlicher Warnsound bei 5 und weniger Sekunden
            if (this.plutoniumTimerValue <= 5) {
                this.soundGenerator.playPlutoniumTimerWarning();
            }
            
            // Zeit abgelaufen
            if (this.plutoniumTimerValue <= 0) {
                this.stopPlutoniumTimer();
                this.loseLife();
            }
        }, 1000);
    }
    
    /**
     * Stoppt den Plutonium-Timer
     * Wird aufgerufen, wenn Plutonium abgeliefert wurde oder der Timer abgelaufen ist
     */
    stopPlutoniumTimer() {
        if (this.plutoniumTimer) {
            clearInterval(this.plutoniumTimer);
            this.plutoniumTimer = null;
        }
    }
    
    /**
     * Aktualisiert die UI-Elemente
     * Aktualisiert alle Anzeigen des Spiels (Timer, Plutonium, Leben, Blöcke, Punkte)
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
     * Wird nach Game Over aufgerufen, setzt alle Spielwerte auf Anfangswerte
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
     * Behandelt Tastendruck-Ereignisse
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    onKeyDown(event) {
        // Nur reagieren, wenn Level nicht abgeschlossen ist
        if (this.levelCompleted) return;
        
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.player.setMoveDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
                this.player.setMoveDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.player.setMoveDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.player.setMoveDirection(1, 0);
                break;
            case ' ':
                this.placeBlock();
                break;
            case 'm':
                // Sound ein-/ausschalten
                const muted = !this.soundGenerator.muted;
                this.soundGenerator.setMuted(muted);
                console.log('Sound ' + (muted ? 'aus' : 'ein'));
                break;
        }
    }
    
    /**
     * Behandelt Tastenloslassung-Ereignisse
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    onKeyUp(event) {
        // Nur reagieren, wenn Level nicht abgeschlossen ist
        if (this.levelCompleted) return;
        
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                if (this.player.moveDirection.y === -1) {
                    this.player.setMoveDirection(0, 0);
                }
                break;
            case 'ArrowDown':
            case 's':
                if (this.player.moveDirection.y === 1) {
                    this.player.setMoveDirection(0, 0);
                }
                break;
            case 'ArrowLeft':
            case 'a':
                if (this.player.moveDirection.x === -1) {
                    this.player.setMoveDirection(0, 0);
                }
                break;
            case 'ArrowRight':
            case 'd':
                if (this.player.moveDirection.x === 1) {
                    this.player.setMoveDirection(0, 0);
                }
                break;
        }
    }
    
    /**
     * Behandelt Fenstergrößenänderungen
     * Wird von der Game-Instanz implementiert
     */
    onWindowResize() {
        // Wird von der Game-Instanz implementiert
    }
} 