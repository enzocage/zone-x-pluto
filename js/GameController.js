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
            console.log(`Level gewechselt zu: ${this.currentLevel}`);
            break;
        case '-':
        case '_':
            // Zum vorherigen Level springen, wenn möglich (nicht unter Level 1)
            if (this.currentLevel > 1) {
                this.currentLevel--;
                this.generateLevel(this.currentLevel);
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
}

export { GameController }; 