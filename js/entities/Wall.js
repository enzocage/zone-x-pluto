/**
 * Wand-Klasse
 * Repräsentiert eine Wand im Spiel
 */

import { CELL_SIZE, WALL_COLOR, WALL_OPACITY } from '../config/config.js';

export class Wall {
    constructor(gameWorld, gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameWorld = gameWorld;
        
        this.mesh = this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für die Wand
     */
    createMesh() {
        const material = new THREE.MeshLambertMaterial({ 
            color: WALL_COLOR,
            transparent: false,
            opacity: WALL_OPACITY
        });
        const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.gridX + CELL_SIZE/2, CELL_SIZE/2, this.gridZ + CELL_SIZE/2);
        this.gameWorld.add(mesh);
        
        return mesh;
    }
    
    /**
     * Entfernt die Wand aus der Szene
     */
    remove() {
        if (this.mesh) {
            this.gameWorld.remove(this.mesh);
            this.mesh = null;
        }
    }
} 