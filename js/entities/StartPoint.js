/**
 * StartPoint-Klasse
 * Repräsentiert den Startpunkt eines Levels
 * Abstraktes visuelles Element aus dreieckigen Oberflächen, das sich dreht und als Hindernis für Gegner dient
 */

import { CELL_SIZE } from '../config/config.js';

export class StartPoint {
    /**
     * Erstellt einen neuen Startpunkt
     * @param {Object} gameWorld - Die Spielwelt-Gruppe
     * @param {number} gridX - X-Koordinate im Grid
     * @param {number} gridZ - Z-Koordinate im Grid
     */
    constructor(gameWorld, gridX, gridZ) {
        this.gameWorld = gameWorld;
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.active = true; // Aktiv bedeutet, die Animation läuft
        this.rotationSpeed = {
            inner: 0.03,
            outer: 0.01,
            y: 0.005
        };
        
        this.createMesh();
    }
    
    /**
     * Erstellt das 3D-Mesh für den Startpunkt
     * Erzeugt eine abstrakte Geometrie aus dreieckigen Oberflächen
     */
    createMesh() {
        // Position im Weltkoordinatensystem
        const posX = this.gridX * CELL_SIZE + CELL_SIZE/2;
        const posZ = this.gridZ * CELL_SIZE + CELL_SIZE/2;
        
        // Containergruppe für alle Elemente
        this.container = new THREE.Group();
        this.container.position.set(posX, 0.05, posZ);
        this.gameWorld.add(this.container);
        
        // Innere rotierende Tetraeder-Gruppe
        this.innerGroup = new THREE.Group();
        this.container.add(this.innerGroup);
        
        // Äußere rotierende Dreiecksring-Gruppe
        this.outerGroup = new THREE.Group();
        this.container.add(this.outerGroup);
        
        // 1. Erstelle vier Tetraeder (dreieckige Pyramiden) als innere Struktur
        const tetraColors = [0x8800ff, 0x00ffff, 0xff8800, 0x22ff22];
        const tetraSize = CELL_SIZE * 0.15;
        const tetraOffset = CELL_SIZE * 0.12;
        
        const tetraPositions = [
            {x: tetraOffset, y: 0.15, z: tetraOffset},
            {x: -tetraOffset, y: 0.15, z: tetraOffset},
            {x: -tetraOffset, y: 0.15, z: -tetraOffset},
            {x: tetraOffset, y: 0.15, z: -tetraOffset}
        ];
        
        tetraPositions.forEach((pos, index) => {
            const tetraGeometry = new THREE.TetrahedronGeometry(tetraSize);
            const tetraMaterial = new THREE.MeshLambertMaterial({
                color: tetraColors[index],
                transparent: true,
                opacity: 0.85,
                flatShading: true
            });
            
            const tetra = new THREE.Mesh(tetraGeometry, tetraMaterial);
            tetra.position.set(pos.x, pos.y, pos.z);
            tetra.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            
            this.innerGroup.add(tetra);
        });
        
        // 2. Erstelle äußere Ringstruktur aus dreieckigen Flächen
        const triangleCount = 8;
        const outerRadius = CELL_SIZE * 0.35;
        const triangleHeight = CELL_SIZE * 0.2;
        const triangleWidth = CELL_SIZE * 0.12;
        
        for (let i = 0; i < triangleCount; i++) {
            const angle = (i / triangleCount) * Math.PI * 2;
            const x = Math.cos(angle) * outerRadius;
            const z = Math.sin(angle) * outerRadius;
            
            // Dreieckige Geometrie (anstatt vordefinierten Objekten)
            const triangleGeometry = new THREE.BufferGeometry();
            
            // Geometrie aus 3 Punkten erzeugen
            const vertices = new Float32Array([
                0, 0, -triangleWidth/2,   // Punkt 1
                0, triangleHeight, 0,     // Punkt 2 (Spitze)
                0, 0, triangleWidth/2     // Punkt 3
            ]);
            
            triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            triangleGeometry.computeVertexNormals();
            
            const triangleMaterial = new THREE.MeshLambertMaterial({
                color: 0x30cfd0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
                flatShading: true
            });
            
            const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
            
            // Ausrichten zum Mittelpunkt
            triangle.rotation.y = angle + Math.PI/2;
            triangle.position.set(x, 0.15, z);
            
            this.outerGroup.add(triangle);
        }
        
        // 3. Basis-Kreis als Plattform für den Startpunkt
        const baseGeometry = new THREE.CircleGeometry(CELL_SIZE * 0.4, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({
            color: 0x1c1c1c,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        this.baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        this.baseMesh.rotation.x = -Math.PI / 2; // Auf X-Y-Ebene legen
        this.baseMesh.position.y = 0.01; // Knapp über dem Boden
        this.container.add(this.baseMesh);
    }
    
    /**
     * Aktualisiert den Startpunkt (Rotation)
     */
    update() {
        if (!this.active) return;
        
        // Rotation der inneren Tetraeder-Gruppe
        if (this.innerGroup) {
            this.innerGroup.rotation.y += this.rotationSpeed.inner;
            
            // Individuelle Rotation jedes Tetraeders
            this.innerGroup.children.forEach((tetra, index) => {
                tetra.rotation.x += 0.03 * (index % 2 + 1);
                tetra.rotation.z += 0.02 * ((index + 1) % 2 + 1);
            });
        }
        
        // Rotation der äußeren Dreieck-Gruppe (entgegengesetzt)
        if (this.outerGroup) {
            this.outerGroup.rotation.y -= this.rotationSpeed.outer;
        }
        
        // Gesamtrotation des Containers
        if (this.container) {
            this.container.rotation.y += this.rotationSpeed.y;
        }
    }
    
    /**
     * Entfernt den Startpunkt aus der Szene
     */
    remove() {
        if (this.container) this.gameWorld.remove(this.container);
        
        this.active = false;
    }
} 