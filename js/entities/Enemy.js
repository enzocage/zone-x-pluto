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
                // Speichern der letzten Richtung
                this.lastDirection = { ... this.direction };
                
                // Bewegung starten
                this.targetX = nextGridX;
                this.targetZ = nextGridZ;
                this.isMoving = true;
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
        // Tatsächliche Spielerposition in Welt-Koordinaten (unter Berücksichtigung der Spielwelt-Verschiebung)
        const playerWorldX = -this.gameWorld.position.x - CELL_SIZE/2;
        const playerWorldZ = -this.gameWorld.position.z - CELL_SIZE/2;
        
        // Jetzt können wir den richtigen Abstand berechnen
        const distX = Math.abs(playerWorldX - this.mesh.position.x);
        const distZ = Math.abs(playerWorldZ - this.mesh.position.z);
        
        // Kollisionsschwellwert für Spielerkollision
        const collisionThreshold = CELL_SIZE * 0.7;
        
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
        for (const otherEnemy of enemies) {
            // Eigene Kollision ignorieren
            if (otherEnemy === this) continue;
            
            // Prüfe, ob beide auf der gleichen Grid-Position sind
            if (this.gridX === otherEnemy.gridX && this.gridZ === otherEnemy.gridZ) {
                console.log('Kollision zwischen Gegnern erkannt!');
                // Beide Gegner sollen umkehren
                this.reverseDirection();
                otherEnemy.reverseDirection();
                return true;
            }
            
            // Prüfe auch auf Kollision während der Bewegung (wenn beide in Bewegung sind)
            if (this.isMoving && otherEnemy.isMoving) {
                const distX = Math.abs(this.mesh.position.x - otherEnemy.mesh.position.x);
                const distZ = Math.abs(this.mesh.position.z - otherEnemy.mesh.position.z);
                
                // Verbesserte Kollisionserkennung mit neuem Schwellenwert
                if (distX < CELL_SIZE * ENEMY_COLLISION_THRESHOLD && 
                    distZ < CELL_SIZE * ENEMY_COLLISION_THRESHOLD) {
                    console.log('Bewegungskollision zwischen Gegnern erkannt!');
                    this.reverseDirection();
                    otherEnemy.reverseDirection();
                    return true;
                }
            }
        }
        return false;
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
        
        // Bewegung stoppen, falls der Gegner gerade in Bewegung ist
        this.isMoving = false;
    }
} 