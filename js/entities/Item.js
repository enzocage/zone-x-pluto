/**
 * Basis-Item-Klasse
 * Grundklasse für alle sammelbaren Objekte im Spiel
 */

import { CELL_SIZE } from '../config/config.js';

export class Item {
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        this.collected = false;
        
        this.mesh = null; // Wird in Unterklassen initialisiert
    }
    
    /**
     * Prüft Kollision mit dem Spieler
     */
    checkCollisionWithPlayer(player) {
        return !this.collected && player.gridX === this.gridX && player.gridZ === this.gridZ;
    }
    
    /**
     * Sammelt das Item ein
     */
    collect() {
        if (!this.collected && this.mesh) {
            this.collected = true;
            this.mesh.visible = false;
        }
    }
    
    /**
     * Entfernt das Item aus der Szene
     */
    remove() {
        if (this.mesh) {
            this.gameWorld.remove(this.mesh);
            this.mesh = null;
        }
    }
}

/**
 * Plutonium-Klasse
 * Repräsentiert ein einsammelbares Plutonium-Item
 */
export class Plutonium extends Item {
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für das Plutonium
     */
    createMesh() {
        const geometry = new THREE.SphereGeometry(CELL_SIZE * 0.3, 16, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff, 
            emissiveIntensity: 0.5 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
        this.gameWorld.add(mesh);
        
        return mesh;
    }
}

/**
 * Barrel-Klasse
 * Repräsentiert eine Tonne zum Abliefern von Plutonium
 */
export class Barrel extends Item {
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für die Tonne
     */
    createMesh() {
        const geometry = new THREE.CylinderGeometry(CELL_SIZE * 0.4, CELL_SIZE * 0.3, CELL_SIZE * 0.7, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
        this.gameWorld.add(mesh);
        
        return mesh;
    }
}

/**
 * Block-Klasse
 * Repräsentiert einen sammelbaren Block
 */
export class CollectibleBlock extends Item {
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den sammelbaren Block
     */
    createMesh() {
        const geometry = new THREE.BoxGeometry(CELL_SIZE * 0.5, CELL_SIZE * 0.1, CELL_SIZE * 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
        this.gameWorld.add(mesh);
        
        return mesh;
    }
}

/**
 * PlacedBlock-Klasse
 * Repräsentiert einen vom Spieler platzierten Block
 */
export class PlacedBlock {
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den platzierten Block
     */
    createMesh() {
        const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE * 0.3, CELL_SIZE);
        const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
        this.gameWorld.add(mesh);
        
        return mesh;
    }
    
    /**
     * Entfernt den Block aus der Szene
     */
    remove() {
        if (this.mesh) {
            this.gameWorld.remove(this.mesh);
            this.mesh = null;
        }
    }
} 