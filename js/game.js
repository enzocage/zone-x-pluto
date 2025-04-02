/**
 * Hauptspiel-Klasse
 * Einstiegspunkt für das Spiel, initialisiert Three.js und steuert den Spielablauf
 */

import { GameController } from './modules/GameController.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gameController = null;
    }
    
    /**
     * Initialisiert das Spiel
     */
    init() {
        // Three.js-Setup
        this.setupThreeJs();
        
        // Licht hinzufügen
        this.addLights();
        
        // Spielcontroller erstellen
        this.gameController = new GameController(this.scene);
        this.gameController.init();
        
        // Event-Listener für Fenstergröße
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('wheel', this.onMouseWheel.bind(this));
        
        // Animation starten
        this.animate();
    }
    
    /**
     * Richtet Three.js ein
     */
    setupThreeJs() {
        // Szene erstellen
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Kamera isometrisch
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 30, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }
    
    /**
     * Fügt Beleuchtung zur Szene hinzu
     */
    addLights() {
        // Ambientes Licht
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Direktionales Licht
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    /**
     * Animationsschleife
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Spiellogik aktualisieren
        if (this.gameController) {
            this.gameController.update();
        }
        
        // Rendern
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Behandelt Fenstergrößenänderungen
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Behandelt Mausrad-Events für Zoom
     */
    onMouseWheel(event) {
        const zoomSpeed = 0.1;
        
        if (event.deltaY < 0) {
            // Zoom in
            this.camera.position.y = Math.max(5, this.camera.position.y - zoomSpeed * 10);
        } else {
            // Zoom out
            this.camera.position.y = Math.min(40, this.camera.position.y + zoomSpeed * 10);
        }
        
        // Look-At-Position bleibt unverändert bei (0,0,0)
        // Stelle sicher, dass die Blickrichtung konstant ist
        const lookAtPosition = new THREE.Vector3(0, 0, 0);
        this.camera.lookAt(lookAtPosition);
    }
}

// Spiel starten, wenn das Dokument geladen ist
window.addEventListener('load', () => {
    const game = new Game();
    game.init();
}); 