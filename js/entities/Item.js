/**
 * Basis-Item-Klasse
 * Grundklasse für alle sammelbaren Objekte im Spiel
 * Definiert grundlegende Eigenschaften und Methoden für alle Item-Typen
 */

import { CELL_SIZE } from '../config/config.js';

export class Item {
    /**
     * Erstellt ein neues Item
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der das Item platziert wird
     * @param {number} gridX - X-Position im Grid
     * @param {number} gridZ - Z-Position im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        this.collected = false;
        
        this.mesh = null; // Wird in Unterklassen initialisiert
    }
    
    /**
     * Prüft Kollision mit dem Spieler
     * @param {Object} player - Das Spieler-Objekt
     * @returns {boolean} - true, wenn der Spieler das Item berührt hat
     */
    checkCollisionWithPlayer(player) {
        return !this.collected && player.gridX === this.gridX && player.gridZ === this.gridZ;
    }
    
    /**
     * Sammelt das Item ein
     * Markiert das Item als eingesammelt und macht es unsichtbar
     */
    collect() {
        if (!this.collected && this.mesh) {
            this.collected = true;
            this.mesh.visible = false;
        }
    }
    
    /**
     * Entfernt das Item aus der Szene
     * Bereinigt Ressourcen, wenn das Item nicht mehr benötigt wird
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
 * Hauptziel des Spielers ist es, alle Plutonium-Items einzusammeln und abzuliefern
 */
export class Plutonium extends Item {
    /**
     * Erstellt ein neues Plutonium-Item
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der das Item platziert wird
     * @param {number} gridX - X-Position im Grid
     * @param {number} gridZ - Z-Position im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für das Plutonium
     * Erzeugt eine leuchtende Kugel, die das Plutonium darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
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
 * Der Spieler muss gesammeltes Plutonium zu einer Tonne transportieren
 */
export class Barrel extends Item {
    /**
     * Erstellt eine neue Tonne
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der das Item platziert wird
     * @param {number} gridX - X-Position im Grid
     * @param {number} gridZ - Z-Position im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für die Tonne
     * Erzeugt einen Zylinder, der die Tonne darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
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
 * Der Spieler kann Blöcke einsammeln und später wieder platzieren
 */
export class CollectibleBlock extends Item {
    /**
     * Erstellt einen neuen sammelbaren Block
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der das Item platziert wird
     * @param {number} gridX - X-Position im Grid
     * @param {number} gridZ - Z-Position im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        super(gameWorld, gridX, gridZ);
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den sammelbaren Block
     * Erzeugt einen flachen Würfel, der einen Block darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
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
 * Dient als Hindernis für Gegner und kann Wege blockieren oder neue erschaffen
 */
export class PlacedBlock {
    /**
     * Erstellt einen neuen platzierten Block
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der der Block platziert wird
     * @param {number} gridX - X-Position im Grid
     * @param {number} gridZ - Z-Position im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den platzierten Block
     * Erzeugt einen grauen Würfel, der den Block darstellt
     * @returns {Object} - Das erstellte Three.js-Mesh
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
     * Bereinigt Ressourcen, wenn der Block nicht mehr benötigt wird
     */
    remove() {
        if (this.mesh) {
            this.gameWorld.remove(this.mesh);
            this.mesh = null;
        }
    }
} 