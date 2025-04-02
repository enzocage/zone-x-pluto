/**
 * UI Controller
 * Verantwortlich für die Verwaltung und Aktualisierung der UI-Elemente
 * Stellt die Benutzeroberfläche des Spiels dar und aktualisiert Spielstatistiken
 */

export class UIController {
    /**
     * Erstellt einen neuen UI-Controller
     * Initialisiert die UI-Element-Referenzen mit null
     */
    constructor() {
        this.timerElement = null;
        this.plutoniumElement = null;
        this.livesElement = null;
        this.blocksElement = null;
        this.scoreElement = null;
    }
    
    /**
     * Initialisiert die UI-Elemente
     * Findet die DOM-Elemente über ihre IDs und speichert Referenzen
     */
    init() {
        this.timerElement = document.getElementById('timer');
        this.plutoniumElement = document.getElementById('plutonium');
        this.livesElement = document.getElementById('lives');
        this.blocksElement = document.getElementById('blocks');
        this.scoreElement = document.getElementById('score');
    }
    
    /**
     * Aktualisiert den Timer
     * Zeigt die verbleibende Zeit an oder "-" wenn kein Timer aktiv ist
     * @param {number} time - Die verbleibende Zeit, -1 wenn kein Timer aktiv ist
     */
    updateTimer(time) {
        if (time >= 0) {
            this.timerElement.textContent = `Timer: ${time}s`;
        } else {
            this.timerElement.textContent = 'Timer: -';
        }
    }
    
    /**
     * Aktualisiert die Anzeige der verbleibenden Plutonium-Proben
     * Zeigt an, wie viele Plutonium-Proben noch eingesammelt werden müssen
     * @param {number} count - Die Anzahl der verbleibenden Plutonium-Proben
     */
    updatePlutonium(count) {
        this.plutoniumElement.textContent = `Plutonium übrig: ${count}`;
    }
    
    /**
     * Aktualisiert die Anzeige der verbleibenden Leben
     * Zeigt die verbleibenden Spielerleben an
     * @param {number} lives - Die Anzahl der verbleibenden Leben
     */
    updateLives(lives) {
        this.livesElement.textContent = `Leben: ${lives}`;
    }
    
    /**
     * Aktualisiert die Anzeige der verfügbaren Blöcke
     * Zeigt an, wie viele Blöcke der Spieler platzieren kann
     * @param {number} blocks - Die Anzahl der verfügbaren Blöcke
     */
    updateBlocks(blocks) {
        this.blocksElement.textContent = `Blocks: ${blocks}`;
    }
    
    /**
     * Aktualisiert die Punkteanzeige
     * Zeigt den aktuellen Punktestand des Spielers an
     * @param {number} score - Die aktuelle Punktzahl
     */
    updateScore(score) {
        this.scoreElement.textContent = `Punkte: ${score}`;
    }
} 