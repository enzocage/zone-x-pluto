/**
 * Gegner-Klasse
 * Repräsentiert einen Gegner im Spiel
 * Der Gegner bewegt sich autonom durch das Level und verfolgt eigene Bewegungsmuster
 */

import { CELL_SIZE, ENEMY_MIN_SPEED, ENEMY_SPEED_VARIATION, ENEMY_COLLISION_THRESHOLD } from '../config/config.js';

export class Enemy {
    /**
     * Erstellt einen neuen Gegner
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der der Gegner platziert wird
     * @param {number} gridX - Startposition auf der X-Achse des Grids
     * @param {number} gridZ - Startposition auf der Z-Achse des Grids
     */
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        this.direction = this.getRandomDirection();
        this.speed = ENEMY_MIN_SPEED + Math.random() * ENEMY_SPEED_VARIATION;
        this.isMoving = false;
        this.targetX = gridX;
        this.targetZ = gridZ;
        this.lastDirection = { ... this.direction }; // Speichert die letzte Richtung
        
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den Gegner
     * Erzeugt einen roten Würfel, der den Gegner darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
     */
    createMesh() {
        // Würfel statt Kugel verwenden
        const geometry = new THREE.BoxGeometry(CELL_SIZE * 0.8, CELL_SIZE * 0.8, CELL_SIZE * 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            this.gridX * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE/2, 
            this.gridZ * CELL_SIZE + CELL_SIZE/2
        );
        this.gameWorld.add(mesh);
        
        return mesh;
    }
    
    /**
     * Gibt eine zufällige Bewegungsrichtung zurück
     * Wählt eine der vier Richtungen (oben, unten, links, rechts)
     * @returns {Object} - Bewegungsrichtung als {x, z}-Objekt
     */
    getRandomDirection() {
        const direction = Math.floor(Math.random() * 4);
        let dx = 0, dz = 0;
        
        if (direction === 0) dx = 1;
        else if (direction === 1) dx = -1;
        else if (direction === 2) dz = 1;
        else if (direction === 3) dz = -1;
        
        return { x: dx, z: dz };
    }
    
    /**
     * Bewegt den Gegner durch das Spielfeld
     * Wählt bei Hindernissen automatisch eine neue Richtung
     * @param {Function} isPositionOccupied - Callback-Funktion zum Prüfen, ob die Zielposition belegt ist
     * @param {Array} enemies - Liste aller Gegner für Kollisionsprüfung
     */
    move(isPositionOccupied, enemies) {
        // Wenn Gegner aktuell nicht in Bewegung ist, setze neues Ziel
        if (!this.isMoving) {
            // Zeit-basierte kleine Zufallsänderungen, um Synchronisierungen zu verhindern
            if (!this.lastChangeTime) {
                this.lastChangeTime = Date.now();
            } else if (Date.now() - this.lastChangeTime > 5000) {
                // Alle 5 Sekunden eine kleine Zufallsänderung
                this.lastChangeTime = Date.now();
                if (Math.random() > 0.7) {
                    // 30% Chance die Richtung zu ändern
                    const directions = [
                        { x: 1, z: 0 },
                        { x: -1, z: 0 },
                        { x: 0, z: 1 },
                        { x: 0, z: -1 }
                    ];
                    this.direction = directions[Math.floor(Math.random() * directions.length)];
                }
            }
            
            // Nächste Grid-Position berechnen
            const nextGridX = this.gridX + this.direction.x;
            const nextGridZ = this.gridZ + this.direction.z;
            
            // Prüfen, ob nächste Position ein Hindernis ist
            if (isPositionOccupied(nextGridX, nextGridZ)) {
                // Richtung ändern
                const directions = [
                    { x: 1, z: 0 },
                    { x: -1, z: 0 },
                    { x: 0, z: 1 },
                    { x: 0, z: -1 }
                ];
                
                // Zufällige neue Richtung wählen
                this.lastDirection = { ... this.direction };
                this.direction = directions[Math.floor(Math.random() * directions.length)];
            } else {
                // Prüfen, ob ein anderer Gegner auf dem Weg zum nächsten Feld ist
                const isEnemyMovingTowardsNextCell = this.checkForApproachingEnemies(nextGridX, nextGridZ, enemies);
                
                if (isEnemyMovingTowardsNextCell) {
                    // Kurz warten und versuchen, Kollision zu vermeiden
                    this.isMoving = false;
                    
                    // Kurze Verzögerung oder andere Richtung wählen
                    if (Math.random() > 0.5) {
                        // Andere Richtung wählen
                        const directions = [
                            { x: 1, z: 0 },
                            { x: -1, z: 0 },
                            { x: 0, z: 1 },
                            { x: 0, z: -1 }
                        ].filter(dir => 
                            !(dir.x === this.direction.x && dir.z === this.direction.z)
                        );
                        
                        if (directions.length > 0) {
                            this.lastDirection = { ... this.direction };
                            this.direction = directions[Math.floor(Math.random() * directions.length)];
                        }
                    }
                } else {
                    // Speichern der letzten Richtung
                    this.lastDirection = { ... this.direction };
                    
                    // Bewegung starten
                    this.targetX = nextGridX;
                    this.targetZ = nextGridZ;
                    this.isMoving = true;
                }
            }
        }
        
        // Wenn Gegner in Bewegung ist, bewege ihn zum Ziel
        if (this.isMoving) {
            const targetWorldX = this.targetX * CELL_SIZE + CELL_SIZE/2;
            const targetWorldZ = this.targetZ * CELL_SIZE + CELL_SIZE/2;
            
            // Aktuelle Position
            const currentX = this.mesh.position.x;
            const currentZ = this.mesh.position.z;
            
            // Bewegung in Richtung Ziel
            const moveX = Math.sign(targetWorldX - currentX) * this.speed;
            const moveZ = Math.sign(targetWorldZ - currentZ) * this.speed;
            
            // Neue Position berechnen
            let newX = currentX + moveX;
            let newZ = currentZ + moveZ;
            
            // Prüfen, ob Ziel erreicht oder überschritten wurde
            if ((moveX > 0 && newX >= targetWorldX) || (moveX < 0 && newX <= targetWorldX)) {
                newX = targetWorldX;
            }
            
            if ((moveZ > 0 && newZ >= targetWorldZ) || (moveZ < 0 && newZ <= targetWorldZ)) {
                newZ = targetWorldZ;
            }
            
            // Position aktualisieren
            this.mesh.position.x = newX;
            this.mesh.position.z = newZ;
            
            // Prüfen, ob Ziel erreicht wurde
            if (newX === targetWorldX && newZ === targetWorldZ) {
                this.gridX = this.targetX;
                this.gridZ = this.targetZ;
                this.isMoving = false;
                
                // Kollision mit anderen Gegnern prüfen
                this.checkCollisionWithEnemies(enemies);
            }
        }
    }
    
    /**
     * Prüft, ob ein anderer Gegner sich auf die gleiche Zielposition zubewegt
     * Verhindert Kollisionen, bevor sie passieren
     * @param {number} targetX - Ziel-X-Position
     * @param {number} targetZ - Ziel-Z-Position
     * @param {Array} enemies - Liste aller Gegner
     * @returns {boolean} - true, wenn ein Gegner sich auf die gleiche Position zubewegt
     */
    checkForApproachingEnemies(targetX, targetZ, enemies) {
        for (const enemy of enemies) {
            if (enemy === this) continue;
            
            // Prüfen, ob der andere Gegner sich auf dieselbe Zielposition zubewegt
            if (enemy.isMoving && enemy.targetX === targetX && enemy.targetZ === targetZ) {
                return true;
            }
            
            // Prüfen, ob der andere Gegner bereits auf der Zielposition steht
            if (enemy.gridX === targetX && enemy.gridZ === targetZ && !enemy.isMoving) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Prüft Kollision mit einem Spieler
     * @param {Object} player - Spieler-Objekt zum Prüfen der Kollision
     * @returns {boolean} - true, wenn eine Kollision erkannt wurde
     */
    checkCollisionWithPlayer(player) {
        // Methode 1: Grid-basierte Kollisionserkennung (für präzise Raster-Positionen)
        if (player.gridX === this.gridX && player.gridZ === this.gridZ) {
            console.log('Grid-Kollision zwischen Spieler und Gegner!');
            return true;
        }
        
        // Methode 2: Kontinuierliche Kollisionserkennung für Bewegung zwischen Rasterpunkten
        // Korrektur: Tatsächliche Spielerposition nutzen statt nur gameWorld-Position
        // Wir nehmen an, dass player.mesh die tatsächliche Position des Spielers enthält
        const playerWorldX = player.mesh.position.x;
        const playerWorldZ = player.mesh.position.z;
        
        // Berechnung des tatsächlichen Abstands zwischen Spieler und Gegner
        const distX = Math.abs(playerWorldX - this.mesh.position.x);
        const distZ = Math.abs(playerWorldZ - this.mesh.position.z);
        
        // Kleinerer Kollisionsschwellwert für genauere Kollisionserkennung
        const collisionThreshold = CELL_SIZE * 0.4;
        
        if (distX < collisionThreshold && distZ < collisionThreshold) {
            console.log('Kontinuierliche Kollision zwischen Spieler und Gegner!');
            return true;
        }
        
        return false;
    }
    
    /**
     * Prüft Kollision mit anderen Gegnern
     * Bei Kollision ändern beide Gegner ihre Richtung
     * @param {Array} enemies - Liste aller Gegner im Spiel
     * @returns {boolean} - true, wenn eine Kollision erkannt wurde
     */
    checkCollisionWithEnemies(enemies) {
        let collisionDetected = false;
        
        for (const otherEnemy of enemies) {
            // Eigene Kollision ignorieren
            if (otherEnemy === this) continue;
            
            // Prüfe, ob beide auf der gleichen Grid-Position sind
            if (this.gridX === otherEnemy.gridX && this.gridZ === otherEnemy.gridZ) {
                console.log('Kollision zwischen Gegnern erkannt!');
                
                // Aktiv trennen statt nur Richtung umkehren
                this.separateEnemies(otherEnemy);
                
                // Unterschiedliche neue Richtungen wählen
                this.chooseNewDirection(otherEnemy);
                
                collisionDetected = true;
            }
            
            // Prüfe auch auf Kollision während der Bewegung (wenn beide in Bewegung sind)
            if (this.isMoving && otherEnemy.isMoving) {
                const distX = Math.abs(this.mesh.position.x - otherEnemy.mesh.position.x);
                const distZ = Math.abs(this.mesh.position.z - otherEnemy.mesh.position.z);
                
                // Verbesserte Kollisionserkennung mit neuem Schwellenwert
                if (distX < CELL_SIZE * ENEMY_COLLISION_THRESHOLD && 
                    distZ < CELL_SIZE * ENEMY_COLLISION_THRESHOLD) {
                    console.log('Bewegungskollision zwischen Gegnern erkannt!');
                    
                    // Aktiv trennen
                    this.separateEnemies(otherEnemy);
                    
                    // Unterschiedliche neue Richtungen wählen
                    this.chooseNewDirection(otherEnemy);
                    
                    collisionDetected = true;
                }
            }
        }
        
        return collisionDetected;
    }
    
    /**
     * Wählt eine neue Richtung, die sich von der des anderen Gegners unterscheidet
     * @param {Enemy} otherEnemy - Der andere Gegner
     */
    chooseNewDirection(otherEnemy) {
        // Mögliche Richtungen
        const directions = [
            { x: 1, z: 0 },  // rechts
            { x: -1, z: 0 }, // links
            { x: 0, z: 1 },  // unten
            { x: 0, z: -1 }  // oben
        ];
        
        // Entferne aktuelle Richtungen beider Gegner aus den Optionen
        const filteredDirections = directions.filter(dir => 
            !(dir.x === this.direction.x && dir.z === this.direction.z) && 
            !(dir.x === otherEnemy.direction.x && dir.z === otherEnemy.direction.z)
        );
        
        // Wenn es noch Optionen gibt, wähle neue Richtungen
        if (filteredDirections.length > 0) {
            // Wähle zufällige Richtung für diesen Gegner
            const myNewDir = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
            this.direction = { ...myNewDir };
            
            // Entferne diese Richtung aus den Optionen für den anderen Gegner
            const remainingDirs = filteredDirections.filter(dir => 
                !(dir.x === myNewDir.x && dir.z === myNewDir.z)
            );
            
            if (remainingDirs.length > 0) {
                // Wähle eine andere Richtung für den anderen Gegner
                const otherNewDir = remainingDirs[Math.floor(Math.random() * remainingDirs.length)];
                otherEnemy.direction = { ...otherNewDir };
            } else {
                otherEnemy.reverseDirection();
            }
        } else {
            // Fallback: Beide Gegner umkehren
            this.reverseDirection();
            otherEnemy.reverseDirection();
        }
        
        // Beide Gegner stoppen
        this.isMoving = false;
        otherEnemy.isMoving = false;
    }
    
    /**
     * Kehrt die Bewegungsrichtung um
     * Wird bei Kollisionen oder Hindernissen aufgerufen
     */
    reverseDirection() {
        // In die entgegengesetzte Richtung der aktuellen Richtung bewegen
        this.direction = {
            x: -this.lastDirection.x,
            z: -this.lastDirection.z
        };
        
        // Zufällige kleine Variation hinzufügen, um Verhakungen zu vermeiden
        if (Math.random() > 0.5) {
            this.direction.x += (Math.random() > 0.5 ? 0.1 : -0.1);
        } else {
            this.direction.z += (Math.random() > 0.5 ? 0.1 : -0.1);
        }
        
        // Richtung normalisieren
        const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.z * this.direction.z);
        if (length > 0) {
            this.direction.x /= length;
            this.direction.z /= length;
        }
        
        // Bewegung stoppen, falls der Gegner gerade in Bewegung ist
        this.isMoving = false;
    }
    
    /**
     * Trennt zwei Gegner aktiv voneinander
     * @param {Enemy} otherEnemy - Der andere Gegner
     */
    separateEnemies(otherEnemy) {
        // Berechne Richtungsvektor zwischen den zwei Gegnern
        const dirX = this.mesh.position.x - otherEnemy.mesh.position.x;
        const dirZ = this.mesh.position.z - otherEnemy.mesh.position.z;
        
        // Normalisiere den Richtungsvektor
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        const normDirX = length > 0 ? dirX / length : 0;
        const normDirZ = length > 0 ? dirZ / length : 0;
        
        // Bewege beide Gegner leicht auseinander
        const separationDistance = CELL_SIZE * 0.1;
        
        this.mesh.position.x += normDirX * separationDistance;
        this.mesh.position.z += normDirZ * separationDistance;
        
        otherEnemy.mesh.position.x -= normDirX * separationDistance;
        otherEnemy.mesh.position.z -= normDirZ * separationDistance;
        
        // Aktualisiere die Grid-Positionen basierend auf der tatsächlichen Weltposition
        this.gridX = Math.floor(this.mesh.position.x / CELL_SIZE);
        this.gridZ = Math.floor(this.mesh.position.z / CELL_SIZE);
        
        otherEnemy.gridX = Math.floor(otherEnemy.mesh.position.x / CELL_SIZE);
        otherEnemy.gridZ = Math.floor(otherEnemy.mesh.position.z / CELL_SIZE);
    }
} 