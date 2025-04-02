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
        this.moveDirection = { x: 0, y: 0 };
        this.isMoving = false;
        this.targetPosition = null;
        this.moveSpeed = PLAYER_MOVE_SPEED;
        this.lastTime = performance.now();
        this.lastSoundTime = 0; // Zeit der letzten Sound-Wiedergabe
        this.movementSoundCooldown = 200; // Mindestabstand zwischen Bewegungs-Sounds in ms
        
        // Event-Callbacks
        this.onMoveCallback = null;
        
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
     * @param {number} x - X-Komponente der Bewegungsrichtung (-1, 0, 1)
     * @param {number} y - Y-Komponente der Bewegungsrichtung (-1, 0, 1)
     */
    setMoveDirection(x, y) {
        this.moveDirection.x = x;
        this.moveDirection.y = y;
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
                        // Bewegung fortsetzen (isMoving bleibt true)
                    } else {
                        // Hindernis gefunden, Bewegung stoppen
                        this.isMoving = false;
                        this.targetPosition = null;
                    }
                } else {
                    // Keine Richtungstaste mehr gedrückt, Bewegung beenden
                    this.isMoving = false;
                    this.targetPosition = null;
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
                
                // Bewegungs-Callback aufrufen
                if (this.onMoveCallback) {
                    this.onMoveCallback();
                    this.lastSoundTime = currentTime;
                }
            }
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
    }
} 