import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIController } from '../modules/UIController.js';

describe('UIController', () => {
    let uiController;
    
    // Mock für HTML-Elemente
    let mockTimerElement;
    let mockPlutoniumElement;
    let mockLivesElement;
    let mockBlocksElement;
    let mockScoreElement;
    
    beforeEach(() => {
        // Mocks für DOM-Elemente erstellen
        mockTimerElement = { textContent: '' };
        mockPlutoniumElement = { textContent: '' };
        mockLivesElement = { textContent: '' };
        mockBlocksElement = { textContent: '' };
        mockScoreElement = { textContent: '' };
        
        // document.getElementById mocken
        global.document = {
            getElementById: (id) => {
                switch (id) {
                    case 'timer': return mockTimerElement;
                    case 'plutonium': return mockPlutoniumElement;
                    case 'lives': return mockLivesElement;
                    case 'blocks': return mockBlocksElement;
                    case 'score': return mockScoreElement;
                    default: return null;
                }
            }
        };
        
        // UIController-Instanz erstellen
        uiController = new UIController();
        
        // Initialisieren
        uiController.init();
    });
    
    it('sollte korrekt initialisiert werden', () => {
        expect(uiController.timerElement).toBe(mockTimerElement);
        expect(uiController.plutoniumElement).toBe(mockPlutoniumElement);
        expect(uiController.livesElement).toBe(mockLivesElement);
        expect(uiController.blocksElement).toBe(mockBlocksElement);
        expect(uiController.scoreElement).toBe(mockScoreElement);
    });
    
    it('sollte den Timer korrekt aktualisieren', () => {
        // Positiver Wert
        uiController.updateTimer(30);
        expect(mockTimerElement.textContent).toBe('Timer: 30s');
        
        // Null-Wert
        uiController.updateTimer(0);
        expect(mockTimerElement.textContent).toBe('Timer: 0s');
        
        // Negativer Wert (kein Timer aktiv)
        uiController.updateTimer(-1);
        expect(mockTimerElement.textContent).toBe('Timer: -');
    });
    
    it('sollte die Plutonium-Anzeige korrekt aktualisieren', () => {
        uiController.updatePlutonium(5);
        expect(mockPlutoniumElement.textContent).toBe('Plutonium übrig: 5');
        
        uiController.updatePlutonium(0);
        expect(mockPlutoniumElement.textContent).toBe('Plutonium übrig: 0');
    });
    
    it('sollte die Leben-Anzeige korrekt aktualisieren', () => {
        uiController.updateLives(3);
        expect(mockLivesElement.textContent).toBe('Leben: 3');
        
        uiController.updateLives(0);
        expect(mockLivesElement.textContent).toBe('Leben: 0');
    });
    
    it('sollte die Block-Anzeige korrekt aktualisieren', () => {
        uiController.updateBlocks(10);
        expect(mockBlocksElement.textContent).toBe('Blocks: 10');
        
        uiController.updateBlocks(0);
        expect(mockBlocksElement.textContent).toBe('Blocks: 0');
    });
    
    it('sollte die Punkte-Anzeige korrekt aktualisieren', () => {
        uiController.updateScore(100);
        expect(mockScoreElement.textContent).toBe('Punkte: 100');
        
        uiController.updateScore(0);
        expect(mockScoreElement.textContent).toBe('Punkte: 0');
    });
}); 