/**
 * Hauptspiel-Klasse
 * Einstiegspunkt für das Spiel, initialisiert Three.js und steuert den Spielablauf.
 * Verantwortlich für die Einrichtung der 3D-Umgebung und der Spielschleife.
 */

import { GameController } from './modules/GameController.js';
import { MenuController } from './modules/MenuController.js';

export class Game {
    constructor() {
        this.scene = null;       // Three.js-Szene
        this.camera = null;      // Kamera-Objekt
        this.renderer = null;    // Three.js-Renderer
        this.gameController = null; // Spielsteuerung
        this.menuController = null; // Menüsteuerung
        this.gameRunning = false; // Flag, ob das Spiel läuft
    }
    
    /**
     * Initialisiert das Spiel
     * Richtet Three.js ein, erstellt die Beleuchtung und startet den GameController.
     */
    init() {
        // Three.js-Setup
        this.setupThreeJs();
        
        // Licht hinzufügen
        this.addLights();
        
        // Spielcontroller erstellen (wird erst nach Menüauswahl initialisiert)
        this.gameController = new GameController(this.scene);
        
        // Menü erstellen und anzeigen
        this.menuController = new MenuController(this.onLevelGeneratorSelect.bind(this));
        this.menuController.init();
        
        // Event-Listener für Fenstergröße
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('wheel', this.onMouseWheel.bind(this));
        
        // Animation starten
        this.animate();
    }
    
    /**
     * Callback-Funktion für die Auswahl eines Level-Generators
     * Wird aufgerufen, wenn der Benutzer einen Level-Generator im Menü auswählt
     * @param {number} generatorId - Die ID des ausgewählten Level-Generators
     */
    onLevelGeneratorSelect(generatorId) {
        console.log(`Level-Generator ${generatorId} ausgewählt.`);
        
        // Level-Generator im GameController auswählen
        this.gameController.selectLevelGenerator(generatorId);
        
        // Spiel initialisieren
        this.gameController.init();
        
        // Flag setzen, dass das Spiel läuft
        this.gameRunning = true;
    }
    
    /**
     * Richtet Three.js ein
     * Erstellt die 3D-Szene, Kamera und den WebGL-Renderer.
     */
    setupThreeJs() {
        // Szene erstellen
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Kamera isometrisch
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }
    
    /**
     * Fügt Beleuchtung zur Szene hinzu
     * Erstellt ein ambientes Licht für Grundbeleuchtung und ein direktionales Licht für Schatten.
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
     * Wird für jeden Frame aufgerufen, aktualisiert die Spiellogik und rendert die Szene.
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Spiellogik aktualisieren, wenn das Spiel läuft
        if (this.gameRunning && this.gameController) {
            this.gameController.update();
        }
        
        // Rendern
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Behandelt Fenstergrößenänderungen
     * Passt Kamera und Renderer an die neue Fenstergröße an.
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Behandelt Mausrad-Events für Zoom
     * Ermöglicht dem Spieler, mit dem Mausrad in die Szene hinein- und herauszuzoomen.
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