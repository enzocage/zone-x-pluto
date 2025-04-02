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
import { PlacedBlock, CollectibleBlock } from '../entities/Item.js';
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
        
        // Hinzugefügte Eigenschaften für vorherige Spielerposition
        this.previousPlayerGridX = PLAYER_START_POSITION.x;
        this.previousPlayerGridZ = PLAYER_START_POSITION.z;
        
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
        if (!this.levelCompleted && this.player) {
            // Speichere die vorherige Position, BEVOR der Spieler sich bewegt oder versucht zu bewegen
            // Nur updaten, wenn sich die Position tatsächlich geändert HATTE im letzten Frame
            // Oder einfach immer die aktuelle Position als 'vorherige' für den nächsten Frame speichern.
            // Die Logik hier speichert die Position vom *Beginn* des aktuellen Frames.
            const currentX = this.player.gridX;
            const currentZ = this.player.gridZ;

            // Spieler bewegen (checkCollisions wird als Callback übergeben)
            this.player.move(
                this.isPositionOccupied.bind(this),
                this.checkCollisions.bind(this) // Wird nach der Bewegung aufgerufen
            );

            // Aktualisiere die 'vorherige' Position für den nächsten Frame,
            // *nachdem* die Bewegung für diesen Frame versucht wurde.
            if (this.player.gridX !== currentX || this.player.gridZ !== currentZ) {
                // Nur wenn sich der Spieler tatsächlich bewegt hat
                this.previousPlayerGridX = currentX;
                this.previousPlayerGridZ = currentZ;
                // console.log(`Spieler bewegt. Vorherige Pos: (${this.previousPlayerGridX}, ${this.previousPlayerGridZ}), Aktuelle Pos: (${this.player.gridX}, ${this.player.gridZ})`);
            }

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
            if (enemy.checkCollisionWithPlayer(this.player, this.isPositionOccupied.bind(this), this.enemies)) {
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
     * Wichtig für Spielerbewegung und Gegner-KI
     */
    isPositionOccupied(x, z) {
        // Spieler prüfen (wichtig für Gegner-KI, nicht für Spielerbewegung selbst)
        // Ein Spieler sollte nicht durch sich selbst blockiert werden
        // if (this.player && this.player.gridX === x && this.player.gridZ === z) {
        //     return true;
        // }

        // Wände prüfen
        if (this.walls.some(wall => wall.gridX === x && wall.gridZ === z)) {
            // console.log(`Position (${x}, ${z}) durch Wand blockiert.`);
            return true;
        }

        // Gegner prüfen
         if (this.enemies.some(enemy => enemy.gridX === x && enemy.gridZ === z)) {
             // console.log(`Position (${x}, ${z}) durch Gegner blockiert.`);
             return true;
         }

        // Platzierte Blöcke prüfen (NEU) - Nur aktive Blöcke blockieren
        if (this.blocks.some(block => !block.collected && block.gridX === x && block.gridZ === z)) {
            // console.log(`Position (${x}, ${z}) durch platzierten Block blockiert.`);
            return true;
        }

        // Fässer prüfen - Blockieren normalerweise nicht
        // if (this.barrels.some(barrel => barrel.gridX === x && barrel.gridZ === z)) {
        //     return true;
        // }

        // Plutonium prüfen - Blockiert normalerweise nicht
        // if (this.plutoniumItems.some(item => !item.collected && item.gridX === x && item.gridZ === z)) {
        //     return true;
        // }

        // Sammelbare Blöcke prüfen - Blockieren normalerweise nicht
        // if (this.collectibleBlocks.some(block => !block.collected && block.gridX === x && block.gridZ === z)) {
        //     return true;
        // }

        // Exit prüfen - Blockiert normalerweise nicht, außer wenn er physisch ist
        // if (this.exit && this.exit.visible && this.exit.gridX === x && this.exit.gridZ === z) {
        //     return true;
        // }

        // console.log(`Position (${x}, ${z}) ist frei.`);
        return false;
    }
    
    /**
     * Prüft Kollisionen des Spielers mit verschiedenen Objekten nach der Bewegung
     */
    checkCollisions() {
        if (!this.player) return; // Frühzeitiger Ausstieg, wenn Spieler nicht existiert

        const playerX = this.player.gridX;
        const playerZ = this.player.gridZ;

        let uiNeedsUpdate = false;

        // Kollision mit Plutonium
        this.plutoniumItems.forEach((item) => {
            if (item.checkCollisionWithPlayer(this.player)) {
                if (!item.collected) { // Nur einsammeln, wenn noch nicht eingesammelt
                    item.collect();
                    this.plutoniumCollected = true;
                    this.startPlutoniumTimer();
                    this.soundGenerator.playCollectPlutonium();
                    uiNeedsUpdate = true;
                    console.log("Plutonium eingesammelt.");
                }
            }
        });

        // Kollision mit Fässern (Plutonium abliefern)
        this.barrels.forEach(barrel => {
            if (barrel.checkCollisionWithPlayer(this.player) && this.plutoniumCollected) {
                this.plutoniumCollected = false;
                this.stopPlutoniumTimer();
                this.remainingPlutonium--;
                this.playerScore += 100; // Beispiel-Score
                this.soundGenerator.playDeliverPlutonium();
                console.log(`Plutonium abgeliefert. Verbleibend: ${this.remainingPlutonium}`);
                if (this.remainingPlutonium <= 0) {
                    this.activateExit();
                }
                uiNeedsUpdate = true;
            }
        });

        // Kollision mit sammelbaren Blöcken (im Level verteilt)
         this.collectibleBlocks.forEach((block) => {
              if (block.checkCollisionWithPlayer(this.player)) {
                  if(!block.collected){ // Nur sammeln, wenn noch nicht gesammelt
                      block.collect(); // Macht den Block unsichtbar
                      this.playerBlocks++;
                      this.soundGenerator.playCollectBlock();
                      uiNeedsUpdate = true;
                      console.log(`Sammelbaren Block eingesammelt. Inventar: ${this.playerBlocks}`);
                  }
              }
          });
         // Optional: Entferne gesammelte Blöcke aus dem Array, um Performance zu verbessern
         // this.collectibleBlocks = this.collectibleBlocks.filter(block => !block.collected);


        // Kollision mit platzierten Blöcken (NEU)
        let collectedPlacedBlock = false;
        this.blocks = this.blocks.filter(block => {
            if (!block.collected && block.checkCollisionWithPlayer(this.player)) {
                block.collect(); // Markiert als gesammelt, macht unsichtbar
                // Es ist wichtig, dass collect() auch das Mesh ausblendet.
                // Die .remove() Methode sollte hier nicht unbedingt aufgerufen werden,
                // da sie das Objekt komplett zerstört, was zu Problemen führen kann,
                // wenn andere Teile des Codes noch darauf zugreifen.
                // Das Filtern aus dem Array ist der Hauptmechanismus zum Entfernen.
                this.playerBlocks++;
                this.soundGenerator.playCollectBlock(); // Gleicher Sound wie CollectibleBlock
                collectedPlacedBlock = true;
                console.log(`Platzierten Block eingesammelt. Inventar: ${this.playerBlocks}`);
                // Gib false zurück, um diesen Block aus dem `this.blocks` Array zu entfernen
                return false;
            }
            // Behalte alle anderen Blöcke (die nicht kollidiert sind oder bereits gesammelt wurden)
            return true;
        });
        if (collectedPlacedBlock) {
            uiNeedsUpdate = true;
        }


        // Kollision mit Exit
        if (this.exit && this.exit.visible && this.exit.gridX === playerX && this.exit.gridZ === playerZ) {
            if (!this.exitReached) { // Nur einmal auslösen
                this.exitReached = true;
                 console.log("Exit erreicht!");
                this.completeLevel();
                 // uiNeedsUpdate wird in completeLevel gesetzt oder dort updateUI() aufgerufen
            }
        }

        // UI nur einmal am Ende aktualisieren, wenn nötig
        if (uiNeedsUpdate) {
            this.updateUI();
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
     * Platziert einen Block an der Position, die der Spieler ZULETZT verlassen hat
     */
    placeBlock() {
        // Prüfe, ob der Spieler Blöcke hat und ob Spieler existiert
        if (!this.player || this.playerBlocks <= 0) {
            if (this.player) this.soundGenerator.playError(); // Nur Sound, wenn Spieler existiert
            console.log("Platzieren fehlgeschlagen: Keine Blöcke im Inventar.");
            return;
        }

        // Zielposition ist die *vorherige* Position des Spielers
        const targetX = this.previousPlayerGridX;
        const targetZ = this.previousPlayerGridZ;

         // Zusätzliche Sicherheitsprüfung: Stelle sicher, dass die vorherige Position nicht die aktuelle ist
         // (sollte durch die Update-Logik abgedeckt sein, aber sicher ist sicher)
         if (targetX === this.player.gridX && targetZ === this.player.gridZ) {
             console.log("Platzieren fehlgeschlagen: Zielposition ist die aktuelle Spielerposition.");
              this.soundGenerator.playError();
             return;
         }


        // Prüfe, ob die Zielposition bereits belegt ist
        if (this.isPositionOccupied(targetX, targetZ)) {
             console.log(`Platzieren fehlgeschlagen: Position (${targetX}, ${targetZ}) ist belegt.`);
             this.soundGenerator.playError(); // Position belegt Sound
             return;
        }

        // Platziere den Block
        this.playerBlocks--;
        const newBlock = new PlacedBlock(this.gameWorld, targetX, targetZ);
        this.blocks.push(newBlock); // Füge den neuen Block zur Liste der platzierten Blöcke hinzu
        this.soundGenerator.playPlaceBlock();
        this.updateUI(); // UI aktualisieren, um die Blockanzahl zu zeigen

        console.log(`Block platziert bei (${targetX}, ${targetZ}). Verbleibende Blöcke: ${this.playerBlocks}`);
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
        if (!this.player) return;

        // Blockiere weitere Eingaben, wenn das Level abgeschlossen ist, aber erlaube vielleicht Neustart?
        if (this.levelCompleted) return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.player.setMoveDirection(0, -1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.player.setMoveDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.player.setMoveDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.player.setMoveDirection(1, 0);
                break;
            case 'Space':
                // Block platzieren (Logik ist jetzt in placeBlock)
                this.placeBlock();
                // Verhindere Standardverhalten der Leertaste (z.B. Scrollen)
                event.preventDefault();
                break;
            // Beispiel: Neustart-Taste
            // case 'KeyR':
            //     this.resetGame(); // Oder eine spezifischere Neustart-Funktion
            //     break;
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