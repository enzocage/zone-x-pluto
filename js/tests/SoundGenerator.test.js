import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SoundGenerator } from '../modules/SoundGenerator.js';

// Mock für die Web Audio API
class MockAudioContext {
    constructor() {
        this.state = 'suspended';
        this.currentTime = 0;
        this.destination = {};
    }
    
    createGain() {
        return {
            gain: {
                value: 1,
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn()
            },
            connect: vi.fn()
        };
    }
    
    createOscillator() {
        return {
            type: 'sine',
            frequency: {
                setValueAtTime: vi.fn()
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null
        };
    }
    
    resume() {
        this.state = 'running';
        return Promise.resolve();
    }
}

describe('SoundGenerator', () => {
    let soundGenerator;
    let originalConsoleLog;
    let originalConsoleError;
    
    beforeEach(() => {
        // Originale console-Methoden speichern
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        
        // console-Methoden mocken, um Tests sauber zu halten
        console.log = vi.fn();
        console.error = vi.fn();
        
        // Web Audio API Mocks
        global.window = {
            AudioContext: MockAudioContext
        };
        
        // SoundGenerator-Instanz erstellen
        soundGenerator = new SoundGenerator();
    });
    
    afterEach(() => {
        // Originale console-Methoden wiederherstellen
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });
    
    it('sollte korrekt initialisiert werden', () => {
        expect(soundGenerator.audioContext).toBeNull();
        expect(soundGenerator.initialized).toBe(false);
        expect(soundGenerator.enabled).toBeDefined();
        expect(soundGenerator.debug).toBeDefined();
    });
    
    it('sollte den AudioContext korrekt initialisieren', () => {
        soundGenerator.init();
        
        expect(soundGenerator.audioContext).toBeInstanceOf(MockAudioContext);
        expect(soundGenerator.masterGain).toBeDefined();
        expect(soundGenerator.sfxGain).toBeDefined();
        expect(soundGenerator.musicGain).toBeDefined();
        expect(soundGenerator.initialized).toBe(true);
    });
    
    it('sollte den AudioContext korrekt fortsetzen', async () => {
        // Ersetzen des standardmäßigen Mocks mit einem konfigurierbaren Verhalten
        const customMockAudioContext = {
            state: 'suspended',
            currentTime: 0,
            destination: {},
            createGain: () => ({
                gain: { value: 1 },
                connect: vi.fn()
            }),
            createOscillator: () => ({
                type: 'sine',
                frequency: { setValueAtTime: vi.fn() },
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn()
            }),
            resume: vi.fn().mockImplementation(() => {
                customMockAudioContext.state = 'running';
                return Promise.resolve();
            })
        };
        
        // Mock ersetzen
        soundGenerator.audioContext = customMockAudioContext;
        soundGenerator.initialized = true;
        
        // Ausgangszustand (suspended)
        expect(soundGenerator.audioContext.state).toBe('suspended');
        
        // AudioContext fortsetzen
        await soundGenerator.resumeAudioContext();
        
        // Nach fortsetzen sollte der Zustand 'running' sein
        expect(soundGenerator.audioContext.state).toBe('running');
        expect(customMockAudioContext.resume).toHaveBeenCalled;
    });
    
    it('sollte AudioUnlock-Event-Listener korrekt einrichten', () => {
        // Mock für document.addEventListener
        global.document = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };
        
        soundGenerator.init();
        soundGenerator.setupAudioUnlock();
        
        // Prüfen, ob Event-Listener für relevante Events hinzugefügt wurden
        expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
        expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
    
    it('sollte bei deaktiviertem Audio keinen Testton abspielen', () => {
        soundGenerator.init();
        soundGenerator.enabled = false;
        
        const result = soundGenerator.playTestSound();
        
        expect(result).toBe(false);
    });
    
    it('sollte bei aktiviertem Audio und initialisiertem AudioContext einen Testton abspielen', () => {
        soundGenerator.init();
        soundGenerator.enabled = true;
        
        const result = soundGenerator.playTestSound();
        
        expect(result).toBe(true);
        
        // Der Oszillator sollte erstellt und gestartet worden sein
        expect(soundGenerator.audioContext.createOscillator).toHaveBeenCalled;
    });
    
    it('sollte den Debug-Modus korrekt nutzen', () => {
        // Debug-Modus aktivieren
        soundGenerator.debug = true;
        soundGenerator.init();
        
        // Prüfen ob Debug-Ausgaben erzeugt wurden
        expect(console.log).toHaveBeenCalled();
        
        // Debug-Modus deaktivieren
        console.log.mockClear();
        soundGenerator.debug = false;
        
        // Eine Methode mit Debug-Ausgaben aufrufen
        soundGenerator.resumeAudioContext();
        
        // Es sollten keine Debug-Ausgaben erzeugt worden sein
        expect(console.log).not.toHaveBeenCalled();
    });
}); 