class GameController {
onKeyDown(event) {
    let handled = true; // Assume handled unless proven otherwise

    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            this.player.setMoveDirection(0, -1); // Nach oben (negatives Z)
            break;
        case 'ArrowDown':
        case 's':
            this.player.setMoveDirection(0, 1); // Nach unten (positives Z)
            break;
        case 'ArrowLeft':
        case 'a':
            this.player.setMoveDirection(-1, 0); // Nach links (negatives X)
            break;
        case 'ArrowRight':
        case 'd':
            this.player.setMoveDirection(1, 0); // Nach rechts (positives X)
            break;
        case '+':
        case '=':
            // Zum nächsten Level springen
            this.currentLevel++;
            this.generateLevel(this.currentLevel);
            // Spieler in die Bildschirmmitte setzen
            this.centerPlayerOnScreen();
            console.log(`Level gewechselt zu: ${this.currentLevel}`);
            break;
        case '-':
        case '_':
            // Zum vorherigen Level springen, wenn möglich (nicht unter Level 1)
            if (this.currentLevel > 1) {
                this.currentLevel--;
                this.generateLevel(this.currentLevel);
                // Spieler in die Bildschirmmitte setzen
                this.centerPlayerOnScreen();
                console.log(`Level gewechselt zu: ${this.currentLevel}`);
            }
            break;
        // ... potentially other cases ...
        default:
            handled = false; // Key not handled by movement
            break;
    }
    
    // ... potentially other code in onKeyDown ...

    if (handled) {
        event.preventDefault(); // Prevent default browser action (scrolling)
    }
}

/**
 * Zentriert den Spieler in der Mitte des Bildschirms
 * Wird nach dem Generieren eines neuen Levels aufgerufen
 */
centerPlayerOnScreen() {
    if (this.player) {
        // Welt-Container-Position neu setzen, um Spieler in der Mitte zu positionieren
        this.gameWorld.position.x = -(this.player.gridX * CELL_SIZE + CELL_SIZE/2);
        this.gameWorld.position.z = -(this.player.gridZ * CELL_SIZE + CELL_SIZE/2);
        
        console.log(`Spieler auf Bildschirmmitte zentriert bei Position (${this.player.gridX}, ${this.player.gridZ})`);
    }
}
}

export { GameController }; 