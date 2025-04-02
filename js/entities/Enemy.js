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
        
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den Gegner
     */
    createMesh() {
        const geometry = new THREE.SphereGeometry(CELL_SIZE * 0.4, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
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
    move(isPositionOccupied) {
        // Aktuelle Position
        const currentX = this.mesh.position.x;
        const currentZ = this.mesh.position.z;
        
        // Nächste Position
        const nextX = currentX + this.direction.x * this.speed;
        const nextZ = currentZ + this.direction.z * this.speed;
        
        // Grid-Position berechnen
        const gridX = Math.floor(nextX);
        const gridZ = Math.floor(nextZ);
        
        // Prüfen, ob nächste Position ein Hindernis ist
        if (isPositionOccupied(gridX, gridZ)) {
            // Richtung ändern
            const directions = [
                { x: 1, z: 0 },
                { x: -1, z: 0 },
                { x: 0, z: 1 },
                { x: 0, z: -1 }
            ];
            
            // Zufällige neue Richtung wählen
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        } else {
            // Bewegung fortsetzen
            this.mesh.position.x = nextX;
            this.mesh.position.z = nextZ;
            
            // Grid-Position aktualisieren
            this.gridX = gridX;
            this.gridZ = gridZ;
        }
    }
    
    /**
     * Prüft Kollision mit einem Spieler
     */
    checkCollisionWithPlayer(player, gameWorld) {
        const distX = Math.abs(player.mesh.position.x - this.mesh.position.x);
        const distZ = Math.abs(player.mesh.position.z - this.mesh.position.z);
        
        return (distX < CELL_SIZE * 0.8 && distZ < CELL_SIZE * 0.8);
    }
} 