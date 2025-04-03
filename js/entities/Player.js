/**
 * Spieler-Klasse
 * Repräsentiert den Spieler im Spiel
 * Verantwortlich für die Steuerung und Bewegung des Spieler-Charakters
 */

import { CELL_SIZE, PLAYER_MOVE_SPEED } from '../config/config.js';

export class Player {
    /**
     * Erstellt eine neue Spieler-Instanz
     * @param {Object} scene - Three.js-Szene, in der der Spieler gerendert wird
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, die um den Spieler bewegt wird
     * @param {number} gridX - Startposition auf der X-Achse des Grids
     * @param {number} gridZ - Startposition auf der Z-Achse des Grids
     */
    constructor(scene, gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.scene = scene;
        this.gameWorld = gameWorld;
        this.moveDirection = { x: 0, y: 0 }; // Behält die aktuelle Eingabe
        this.facingDirection = { x: 0, z: 1 }; // Letzte Richtung, in die geschaut wurde (Standard: unten)
        this.isMoving = false;
        this.targetPosition = null;
        this.moveSpeed = PLAYER_MOVE_SPEED;
        this.lastTime = performance.now();
        this.lastSoundTime = 0; // Zeit der letzten Sound-Wiedergabe
        this.movementSoundCooldown = 200; // Mindestabstand zwischen Bewegungs-Sounds in ms
        
        // Event-Callbacks
        this.onMoveCallback = null;
        this.onCollisionCallback = null;
        
        // Bewegungsstatus
        this.occupiedCells = []; // Aktuell vom Spieler belegte Zellen (Start und Ziel)
        
        this.mesh = this.createMesh();
        this.addLightToPlayer();
    }
    
    /**
     * Erstellt das 3D-Mesh für den Spieler
     * Erzeugt einen grünen Würfel, der den Spieler darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
     */
    createMesh() {
        const geometry = new THREE.BoxGeometry(CELL_SIZE * 0.8, CELL_SIZE * 0.8, CELL_SIZE * 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, CELL_SIZE/2, 0); // Spieler in der Mitte des Koordinatensystems
        this.scene.add(mesh);
        
        // Welt-Container verschieben, um Spieler an Startposition zu setzen
        this.gameWorld.position.x = -(this.gridX + CELL_SIZE/2);
        this.gameWorld.position.z = -(this.gridZ + CELL_SIZE/2);
        
        return mesh;
    }
    
    /**
     * Fügt dem Spieler ein Licht hinzu
     * Erzeugt ein Punktlicht, das der Spieler mit sich führt, um die Umgebung zu beleuchten
     */
    addLightToPlayer() {
        const light = new THREE.PointLight(0xffffff, 1, 20);
        light.position.set(0, 2, 0);
        this.mesh.add(light);
    }
    
    /**
     * Setzt die Bewegungsrichtung des Spielers
     * Wird von den Tastatur-Event-Handlern aufgerufen
     * Aktualisiert auch die Blickrichtung (facingDirection), wenn eine Bewegung initiiert wird.
     * @param {number} x - X-Komponente der Bewegungsrichtung (-1, 0, 1)
     * @param {number} y - Y-Komponente der Bewegungsrichtung (-1, 0, 1)
     */
    setMoveDirection(x, y) {
        this.moveDirection.x = x;
        this.moveDirection.y = y;

        // Aktualisiere die Blickrichtung nur, wenn eine tatsächliche Bewegung stattfindet
        if (x !== 0 || y !== 0) {
            this.facingDirection.x = x;
            this.facingDirection.z = y; // y-Eingabe entspricht z-Achse im Grid
        }
    }
    
    /**
     * Registriert einen Callback für Bewegungsereignisse
     * @param {Function} callback - Die aufzurufende Funktion bei Bewegung
     */
    onMove(callback) {
        this.onMoveCallback = callback;
    }
    
    /**
     * Bewegt den Spieler (bzw. die Spielwelt um den Spieler herum)
     * Unterstützt kontinuierliche Bewegung über mehrere Rasterpunkte
     * @param {Function} isPositionOccupied - Callback-Funktion zum Prüfen, ob die Zielposition belegt ist
     * @param {Function} checkCollisions - Callback-Funktion zum Prüfen von Kollisionen mit Objekten
     */
    move(isPositionOccupied, checkCollisions) {
        // Zeitbasierte Bewegung für flüssige Animation
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // in Sekunden
        this.lastTime = currentTime;
        
        // Geschwindigkeit an deltaTime anpassen für konsistente Bewegung
        const frameSpeed = this.moveSpeed * deltaTime * 60; // Normalisieren auf 60 FPS
        
        // Falls wir uns bewegen und ein Ziel haben
        if (this.isMoving && this.targetPosition) {
            // Aktuelle Bewegung fortsetzen - bewege die Welt, nicht den Spieler
            const dx = this.targetPosition.x - this.gameWorld.position.x;
            const dz = this.targetPosition.z - this.gameWorld.position.z;
            
            // Bewegungsdistanz für diesen Frame berechnen
            const distanceThisFrame = Math.min(frameSpeed, Math.sqrt(dx * dx + dz * dz));
            
            // Sound-Wiedergabe prüfen mit Cooldown
            if (this.onMoveCallback && currentTime - this.lastSoundTime > this.movementSoundCooldown) {
                this.onMoveCallback();
                this.lastSoundTime = currentTime;
            }
            
            // Wenn Ziel fast erreicht ist
            if (distanceThisFrame >= Math.sqrt(dx * dx + dz * dz)) {
                // Position exakt auf Rasterpunkt setzen
                this.gameWorld.position.x = this.targetPosition.x;
                this.gameWorld.position.z = this.targetPosition.z;
                
                // Kollisionsprüfung mit Objekten
                checkCollisions();
                
                // Sofort prüfen, ob eine kontinuierliche Bewegung erfolgen soll
                if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
                    // Nächste Zielposition berechnen
                    const nextTargetX = this.gridX + this.moveDirection.x;
                    const nextTargetZ = this.gridZ + this.moveDirection.y;
                    
                    // Prüfen, ob nächstes Ziel verfügbar ist
                    if (!isPositionOccupied(nextTargetX, nextTargetZ)) {
                        // Grid-Position aktualisieren
                        this.gridX = nextTargetX;
                        this.gridZ = nextTargetZ;
                        
                        // Neue Zielposition setzen
                        this.targetPosition = {
                            x: -(nextTargetX + CELL_SIZE/2),
                            z: -(nextTargetZ + CELL_SIZE/2)
                        };
                        
                        // Beide Zellen als belegt markieren (Start und Ziel)
                        this.occupiedCells = [
                            { x: this.gridX - this.moveDirection.x, z: this.gridZ - this.moveDirection.y },
                            { x: this.gridX, z: this.gridZ }
                        ];
                        
                        // Bewegung fortsetzen (isMoving bleibt true)
                    } else {
                        // Hindernis gefunden, Bewegung stoppen
                        this.isMoving = false;
                        this.targetPosition = null;
                        
                        // Nur aktuelle Zelle als belegt markieren
                        this.occupiedCells = [{ x: this.gridX, z: this.gridZ }];
                    }
                } else {
                    // Keine Richtungstaste mehr gedrückt, Bewegung beenden
                    this.isMoving = false;
                    this.targetPosition = null;
                    
                    // Nur aktuelle Zelle als belegt markieren
                    this.occupiedCells = [{ x: this.gridX, z: this.gridZ }];
                }
            } else {
                // Bewegung fortsetzen mit normalisiertem Vektor für flüssige Bewegung
                const totalDist = Math.sqrt(dx * dx + dz * dz);
                const normalizedDx = dx / totalDist;
                const normalizedDz = dz / totalDist;
                
                this.gameWorld.position.x += normalizedDx * distanceThisFrame;
                this.gameWorld.position.z += normalizedDz * distanceThisFrame;
            }
        } 
        // Neue Bewegung starten, wenn keine aktive Bewegung vorhanden ist
        else if (!this.isMoving && (this.moveDirection.x !== 0 || this.moveDirection.y !== 0)) {
            // Zielposition berechnen
            const targetX = this.gridX + this.moveDirection.x;
            const targetZ = this.gridZ + this.moveDirection.y;
            
            // Prüfen, ob Ziel nicht belegt ist
            if (!isPositionOccupied(targetX, targetZ)) {
                this.isMoving = true;
                this.targetPosition = {
                    x: -(targetX + CELL_SIZE/2),
                    z: -(targetZ + CELL_SIZE/2)
                };
                
                // Grid-Position aktualisieren
                this.gridX = targetX;
                this.gridZ = targetZ;
                
                // Beide Zellen als belegt markieren (Start und Ziel)
                this.occupiedCells = [
                    { x: this.gridX - this.moveDirection.x, z: this.gridZ - this.moveDirection.y },
                    { x: this.gridX, z: this.gridZ }
                ];
                
                // Bewegungs-Callback aufrufen
                if (this.onMoveCallback) {
                    this.onMoveCallback();
                    this.lastSoundTime = currentTime;
                }
            }
        } else {
            // Wenn wir uns nicht bewegen, nur aktuelle Zelle als belegt markieren
            this.occupiedCells = [{ x: this.gridX, z: this.gridZ }];
        }
    }
    
    /**
     * Registriert einen Callback für Kollisionsereignisse
     * @param {Function} callback - Die aufzurufende Funktion bei Kollisionen
     */
    onCollision(callback) {
        this.onCollisionCallback = callback;
    }
    
    /**
     * Prüft Kollision mit einem Gegner
     * Symmetrisch zur Enemy.checkCollisionWithPlayer Methode
     * @param {Array} enemies - Liste aller Gegner für Kollisionsprüfung
     * @returns {boolean} - true, wenn eine Kollision erkannt wurde
     */
    checkCollisionWithEnemies(enemies) {
        let collided = false;
        
        for (const enemy of enemies) {
            // Methode 1: Grid-basierte Kollisionserkennung
            if (enemy.gridX === this.gridX && enemy.gridZ === this.gridZ) {
                console.log('Grid-Kollision zwischen Spieler und Gegner!');
                
                // Kollisions-Callback aufrufen, wenn vorhanden
                if (this.onCollisionCallback) {
                    this.onCollisionCallback(enemy);
                }
                
                collided = true;
                break;
            }
            
            // Methode 2: Kontinuierliche Kollisionserkennung während der Bewegung
            const enemyWorldX = enemy.mesh.position.x;
            const enemyWorldZ = enemy.mesh.position.z;
            
            // Relative Positionen berechnen (wichtig, da Spieler im Mittelpunkt ist)
            const playerRelativeX = -this.gameWorld.position.x;
            const playerRelativeZ = -this.gameWorld.position.z;
            
            // Abstand zwischen Spieler und Gegner
            const distX = Math.abs(playerRelativeX - enemyWorldX);
            const distZ = Math.abs(playerRelativeZ - enemyWorldZ);
            
            // Gleicher Schwellenwert wie in der Gegner-Klasse
            const collisionThreshold = CELL_SIZE * 0.4;
            
            if (distX < collisionThreshold && distZ < collisionThreshold) {
                console.log('Kontinuierliche Kollision zwischen Spieler und Gegner!');
                
                // Kollisions-Callback aufrufen, wenn vorhanden
                if (this.onCollisionCallback) {
                    this.onCollisionCallback(enemy);
                }
                
                collided = true;
                break;
            }
        }
        
        return collided;
    }
    
    /**
     * Behandelt Kollisionen mit Gegnern
     * @param {Object} enemy - Der Gegner, mit dem kollidiert wurde
     */
    handleCollision(enemy) {
        console.log('Spieler-Kollision wird behandelt...');
        
        // Temporär die Bewegung stoppen
        this.isMoving = false;
        this.targetPosition = null;
        
        // Nur aktuelle Zelle als belegt markieren
        this.occupiedCells = [{ x: this.gridX, z: this.gridZ }];
        
        // Kollisions-Callback aufrufen, wenn vorhanden
        if (this.onCollisionCallback) {
            this.onCollisionCallback(enemy);
        }
    }
    
    /**
     * Setzt den Spieler zurück an die Startposition
     * Wird nach Lebensverlust oder Level-Wechsel aufgerufen
     * @param {number} startX - X-Koordinate der Startposition
     * @param {number} startZ - Z-Koordinate der Startposition
     */
    reset(startX, startZ) {
        this.gridX = startX;
        this.gridZ = startZ;
        this.gameWorld.position.x = -(this.gridX + CELL_SIZE/2);
        this.gameWorld.position.z = -(this.gridZ + CELL_SIZE/2);
        this.isMoving = false;
        this.targetPosition = null;
        this.occupiedCells = [{ x: this.gridX, z: this.gridZ }];
    }
} 