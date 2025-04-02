/**
 * Gegner-Klasse
 * Repräsentiert einen Gegner im Spiel
 */

import { CELL_SIZE, ENEMY_MIN_SPEED, ENEMY_SPEED_VARIATION } from '../config/config.js';

export class Enemy {
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
     * Bewegt den Gegner
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
     */
    checkCollisionWithPlayer(player) {
        const distX = Math.abs(player.mesh.position.x - this.mesh.position.x);
        const distZ = Math.abs(player.mesh.position.z - this.mesh.position.z);
        
        return (distX < CELL_SIZE * 0.7 && distZ < CELL_SIZE * 0.7);
    }
    
    /**
     * Prüft Kollision mit anderen Gegnern
     */
    checkCollisionWithEnemies(enemies) {
        for (const otherEnemy of enemies) {
            // Eigene Kollision ignorieren
            if (otherEnemy === this) continue;
            
            // Prüfe, ob beide auf der gleichen Grid-Position sind
            if (this.gridX === otherEnemy.gridX && this.gridZ === otherEnemy.gridZ) {
                // Beide Gegner sollen umkehren
                this.reverseDirection();
                otherEnemy.reverseDirection();
                return true;
            }
        }
        return false;
    }
    
    /**
     * Kehrt die Bewegungsrichtung um
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