/**
 * Sound-Generator-Modul
 * Verantwortlich für die Generierung und Verwaltung von Spielsounds
 */

import { 
    AUDIO_ENABLED, 
    AUDIO_VOLUME_MASTER, 
    AUDIO_VOLUME_SFX, 
    AUDIO_VOLUME_MUSIC 
} from '../config/config.js';

export class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        // Oscillator für Timer-Countdown
        this.timerOscillator = null;
        
        // Audio-Puffer für Sound-Effekte
        this.soundBuffers = {};
        
        // Status
        this.initialized = false;
        this.enabled = AUDIO_ENABLED;
        
        // Debug-Modus
        this.debug = true; // Debug-Modus aktivieren
    }
    
    /**
     * Initialisiert den Audio-Kontext und lädt Sounds
     */
    init() {
        if (this.initialized) return;
        
        try {
            if (this.debug) console.log('SoundGenerator: Initialisierung gestartet');
            
            // Audio-Kontext erstellen
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.debug) console.log('SoundGenerator: AudioContext erstellt, Status:', this.audioContext.state);
            
            // Master-Gain-Node für Gesamt-Lautstärke
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = AUDIO_VOLUME_MASTER;
            this.masterGain.connect(this.audioContext.destination);
            
            // SFX-Gain-Node
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = AUDIO_VOLUME_SFX;
            this.sfxGain.connect(this.masterGain);
            
            // Musik-Gain-Node
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = AUDIO_VOLUME_MUSIC;
            this.musicGain.connect(this.masterGain);
            
            this.initialized = true;
            
            if (this.debug) {
                console.log('SoundGenerator: Erfolgreich initialisiert');
                console.log('SoundGenerator: Master-Volume:', this.masterGain.gain.value);
                console.log('SoundGenerator: SFX-Volume:', this.sfxGain.gain.value);
                console.log('SoundGenerator: Musik-Volume:', this.musicGain.gain.value);
            }
            
            // AudioContext-Status prüfen und versuchen zu starten
            this.resumeAudioContext();
            
            // Event-Listener für Audio-Entsperrung einrichten
            this.setupAudioUnlock();
            
            // Sofort einen Testton abspielen, um zu prüfen, ob Audio funktioniert
            setTimeout(() => {
                if (this.debug) console.log('SoundGenerator: Testton wird abgespielt...');
                this.playTestSound(0.3); // Hörbarer Testton
            }, 1000);
            
        } catch (error) {
            console.error('Web Audio API wird von diesem Browser nicht unterstützt:', error);
            this.enabled = false;
        }
    }
    
    /**
     * Richtet Event-Listener ein, um den AudioContext nach Benutzerinteraktion freizuschalten
     */
    setupAudioUnlock() {
        const unlockEvents = ['mousedown', 'touchstart', 'keydown'];
        
        const unlock = () => {
            // AudioContext entsperren
            this.resumeAudioContext();
            
            // Event-Listener entfernen, nachdem Audio entsperrt wurde
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlock);
            });
        };
        
        // Event-Listener für verschiedene Benutzerinteraktionen hinzufügen
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlock);
        });
    }
    
    /**
     * Versucht, den AudioContext zu entsperren/fortzusetzen
     * Muss nach einer Benutzerinteraktion aufgerufen werden
     */
    resumeAudioContext() {
        if (!this.audioContext) {
            if (this.debug) console.log('SoundGenerator: Kein AudioContext vorhanden');
            return;
        }
        
        if (this.debug) console.log('SoundGenerator: AudioContext-Status vor Resume:', this.audioContext.state);
        
        // Prüfen ob der Kontext unterbrochen ist
        if (this.audioContext.state === 'suspended') {
            if (this.debug) console.log('SoundGenerator: Versuche AudioContext fortzusetzen...');
            
            this.audioContext.resume().then(() => {
                console.log('SoundGenerator: AudioContext wurde erfolgreich gestartet');
                
                // Leisen Testton spielen, um die Audioausgabe zu aktivieren
                this.playTestSound(0.1); // Leiser Testton
                
                if (this.debug) {
                    console.log('SoundGenerator: AudioContext-Status nach Resume:', this.audioContext.state);
                    console.log('SoundGenerator: Testton wurde abgespielt');
                }
            }).catch(error => {
                console.error('Fehler beim Starten des AudioContext:', error);
            });
        } else {
            if (this.debug) console.log('SoundGenerator: AudioContext ist bereits aktiv, Status:', this.audioContext.state);
        }
    }
    
    /**
     * Spielt einen kurzen Testton ab
     * @param {number} volume - Lautstärke des Testtons (0.0 bis 1.0)
     */
    playTestSound(volume = 0.2) {
        if (!this.enabled) {
            if (this.debug) console.log('SoundGenerator: Audio ist deaktiviert, kein Testton abgespielt');
            return false;
        }
        
        if (!this.initialized) {
            if (this.debug) console.log('SoundGenerator: Nicht initialisiert, kein Testton abgespielt');
            return false;
        }
        
        // Sicherstellen, dass der AudioContext aktiv ist
        this.resumeAudioContext();
        
        try {
            if (this.debug) console.log('SoundGenerator: Erzeuge Testton mit Lautstärke', volume);
            
            // Oszillator für Testton
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4 Note
            
            // Gain für den Sound
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            
            // Verbinden und abspielen
            oscillator.connect(gain);
            gain.connect(this.sfxGain);
            
            if (this.debug) console.log('SoundGenerator: Testton wird gestartet...');
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            oscillator.onended = () => {
                if (this.debug) console.log('SoundGenerator: Testton wurde beendet');
            };
            
            if (this.debug) {
                console.log('SoundGenerator: Aktuelle Volume-Werte:');
                console.log('  - Master:', this.masterGain.gain.value);
                console.log('  - SFX:', this.sfxGain.gain.value);
                console.log('  - Effektiv:', this.masterGain.gain.value * this.sfxGain.gain.value * volume);
            }
            
            return true;
        } catch (error) {
            console.error('Fehler beim Abspielen des Testtons:', error);
            return false;
        }
    }
    
    /**
     * Generiert einen Timer-Countdown-Sound
     * @param {number} timeLeft - Verbleibende Zeit in Sekunden
     */
    playTimerSound(timeLeft) {
        if (!this.enabled || !this.initialized) return;
        
        // Sicherstellen, dass der AudioContext läuft
        this.resumeAudioContext();
        
        // Vorherigen Timer-Sound stoppen
        this.stopTimerSound();
        
        // Oszillator erstellen
        this.timerOscillator = this.audioContext.createOscillator();
        
        // Frequenz basierend auf verbleibender Zeit
        const baseFrequency = 440;  // A4 Note
        let frequency = baseFrequency;
        
        if (timeLeft <= 5) {
            // Tiefere Frequenz bei wenig Zeit (höhere Dringlichkeit)
            frequency = baseFrequency + (5 - timeLeft) * 30;
        }
        
        // Waveform und Frequenz einstellen
        this.timerOscillator.type = 'sine';
        this.timerOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Gain-Node für den Timer
        const timerGain = this.audioContext.createGain();
        
        // Kurzer Ton mit schnellem Attack und Decay
        timerGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        timerGain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
        timerGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
        
        // Verbindungen herstellen
        this.timerOscillator.connect(timerGain);
        timerGain.connect(this.sfxGain);
        
        if (this.debug) console.log('SoundGenerator: Timer-Sound wird abgespielt, Frequenz:', frequency);
        
        // Oszillator starten und stoppen
        this.timerOscillator.start();
        this.timerOscillator.stop(this.audioContext.currentTime + 0.2);
        
        this.timerOscillator.onended = () => {
            this.timerOscillator = null;
        };
    }
    
    /**
     * Stoppt den Timer-Sound
     */
    stopTimerSound() {
        if (this.timerOscillator) {
            this.timerOscillator.stop();
            this.timerOscillator = null;
        }
    }
    
    /**
     * Generiert einen Sound für das Einsammeln von Plutonium
     */
    playCollectPlutoniumSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Sicherstellen, dass der AudioContext läuft
        this.resumeAudioContext();
        
        // Oszillator für Plutonium-Sammeln
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        
        // Frequenz-Sweep von hoch nach niedrig
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
        
        // Gain für den Sound
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);
        
        // Verbinden und abspielen
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        if (this.debug) console.log('SoundGenerator: Plutonium-Sammel-Sound wird abgespielt');
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }
    
    /**
     * Generiert einen Sound für das Einsammeln von Blöcken
     */
    playCollectBlockSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Sicherstellen, dass der AudioContext läuft
        this.resumeAudioContext();
        
        // Oszillator für Block-Sammeln
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'square';
        
        // Kurzer, hoher Ton
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        
        // Gain für den Sound
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
        
        // Verbinden und abspielen
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        if (this.debug) console.log('SoundGenerator: Block-Sammel-Sound wird abgespielt');
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    /**
     * Generiert einen Sound für das Platzieren von Blöcken
     */
    playPlaceBlockSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Sicherstellen, dass der AudioContext läuft
        this.resumeAudioContext();
        
        // Noise-Generator für Block-Platzierung
        const bufferSize = this.audioContext.sampleRate * 0.2; // 200ms Buffer
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Weißes Rauschen generieren
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        // Noise-Source erstellen
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // BandPass-Filter für den "Thud"-Sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 150;
        filter.Q.value = 1.5;
        
        // Gain für den Sound
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        // Verbinden und abspielen
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        if (this.debug) console.log('SoundGenerator: Block-Platzierungs-Sound wird abgespielt');
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }
    
    /**
     * Generiert einen Sound für Kollisionen mit Wänden
     */
    playWallCollisionSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Oszillator für Wand-Kollision
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        
        // Filter für dumpfen Klang
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        // Gain für den Sound
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        
        // Verbinden und abspielen
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * Generiert einen Sound für Kollisionen mit Gegnern
     */
    playEnemyCollisionSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Oszillatoren für komplexeren Klang
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        
        // Gain-Nodes
        const gain1 = this.audioContext.createGain();
        gain1.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain1.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
        gain1.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        
        const gain2 = this.audioContext.createGain();
        gain2.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
        gain2.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        
        // Verbinden und abspielen
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.sfxGain);
        gain2.connect(this.sfxGain);
        
        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.5);
        osc2.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Generiert einen Sound für das Erreichen des Ausgangs
     */
    playExitSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Oszillatoren für den Sound
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        
        // Aufsteigender Ton
        osc1.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.5);
        osc1.frequency.exponentialRampToValueAtTime(900, this.audioContext.currentTime + 1.0);
        
        // Gain für Fade-in/out
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.9);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.0);
        
        // Verbinden und abspielen
        osc1.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.start();
        osc1.stop(this.audioContext.currentTime + 1.0);
    }
    
    /**
     * Generiert einen Sound für das Verlieren eines Lebens
     */
    playLoseLifeSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Oszillator für absteigenden Ton
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        
        // Absteigender Ton
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.6);
        
        // Gain mit langsamem Decay
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        
        // Verbinden und abspielen
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.8);
    }
    
    /**
     * Generiert einen Sound für das Game Over
     */
    playGameOverSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Mehrere absteigende Töne
        for (let i = 0; i < 3; i++) {
            const delay = i * 0.2;
            
            const osc = this.audioContext.createOscillator();
            osc.type = i === 2 ? 'sawtooth' : 'triangle';
            
            // Absteigender Ton, jeder tiefer als der vorherige
            const startFreq = 300 - i * 50;
            osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(startFreq / 4, this.audioContext.currentTime + delay + 0.7);
            
            // Gain mit Verzögerung
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + 0.9);
            
            // Verbinden und abspielen
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.9);
        }
    }
    
    /**
     * Generiert einen Sound für das Abschließen eines Levels
     */
    playLevelCompleteSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Aufsteigende Akkorde
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((note, index) => {
            const delay = index * 0.15;
            
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note, this.audioContext.currentTime + delay);
            
            // Gain mit Verzögerung
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + delay + 0.05);
            gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + delay + 0.3);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + delay + 0.8);
            
            // Verbinden und abspielen
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.8);
        });
    }
    
    /**
     * Generiert einen Sound für die Explosion einer Tonne
     */
    playBarrelExplosionSound() {
        if (!this.enabled || !this.initialized) return;
        
        // Noise für die Explosion
        const bufferSize = this.audioContext.sampleRate * 1.0; // 1 Sekunde
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Rauschen mit Decay generieren
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.max(0, 1 - t * 2);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        // Noise-Source erstellen
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // Filter für den Explosions-Sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        // Gain für Lautstärke
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        
        // Verbinden und abspielen
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
    }
    
    /**
     * Aktiviert/Deaktiviert alle Sounds
     */
    toggleAudio(enabled) {
        this.enabled = enabled;
        
        if (this.initialized) {
            this.masterGain.gain.value = enabled ? AUDIO_VOLUME_MASTER : 0;
            if (this.debug) console.log('SoundGenerator: Audio wurde', enabled ? 'aktiviert' : 'deaktiviert');
        }
    }
    
    /**
     * Setzt die SFX-Lautstärke
     */
    setSfxVolume(volume) {
        if (this.initialized) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
            if (this.debug) console.log('SoundGenerator: SFX-Volume auf', this.sfxGain.gain.value, 'gesetzt');
        }
    }
    
    /**
     * Setzt die Musik-Lautstärke
     */
    setMusicVolume(volume) {
        if (this.initialized) {
            this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
            if (this.debug) console.log('SoundGenerator: Musik-Volume auf', this.musicGain.gain.value, 'gesetzt');
        }
    }
    
    /**
     * Gibt den aktuellen Status des AudioContext zurück
     * @returns {Object} Status-Informationen zum AudioContext
     */
    getAudioStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            contextState: this.audioContext ? this.audioContext.state : 'nicht erstellt',
            masterVolume: this.masterGain ? this.masterGain.gain.value : 0,
            sfxVolume: this.sfxGain ? this.sfxGain.gain.value : 0,
            musicVolume: this.musicGain ? this.musicGain.gain.value : 0
        };
    }
    
    /**
     * Manuelle Test-Methode, die auf der Konsole aufgerufen werden kann
     * @param {number} testNumber - Welcher Test ausgeführt werden soll (1-5)
     */
    testAudio(testNumber = 1) {
        if (!this.enabled || !this.initialized) {
            console.log('SoundGenerator ist nicht initialisiert oder deaktiviert');
            console.log('Status:', this.getAudioStatus());
            this.init(); // Versuchen zu initialisieren
            return;
        }
        
        // Sicherstellen, dass der AudioContext läuft
        this.resumeAudioContext();
        
        console.log('SoundGenerator-Test wird ausgeführt...');
        console.log('AudioContext-Status:', this.audioContext.state);
        
        switch(testNumber) {
            case 1:
                console.log('Test 1: Einfacher Testton');
                this.playTestSound(0.5);
                break;
            case 2:
                console.log('Test 2: Collecting Plutonium Sound');
                this.playCollectPlutoniumSound();
                break;
            case 3:
                console.log('Test 3: Lautstärketest (Laut)');
                this.setMasterVolume(1.0);
                this.setSfxVolume(1.0);
                this.playTestSound(0.8);
                break;
            case 4:
                console.log('Test 4: Timer-Sound');
                this.playTimerSound(3);
                break;
            case 5:
                console.log('Test 5: Alle Sounds nacheinander');
                this.playSequentialSounds();
                break;
            default:
                console.log('Unbekannter Test-Nummer. Verwende 1-5.');
        }
    }
    
    /**
     * Spielt nacheinander mehrere Sounds ab (für Testzwecke)
     */
    playSequentialSounds() {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Sofort ausführende asynchrone Funktion
        (async () => {
            console.log('Sequenz startet...');
            
            await delay(500);
            this.playTestSound(0.3);
            
            await delay(1000);
            this.playCollectPlutoniumSound();
            
            await delay(1000);
            this.playCollectBlockSound();
            
            await delay(1000);
            this.playPlaceBlockSound();
            
            await delay(1000);
            this.playExitSound();
            
            console.log('Sequenz beendet.');
        })();
    }
    
    /**
     * Setzt die Gesamt-Lautstärke
     */
    setMasterVolume(volume) {
        if (this.initialized) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
            if (this.debug) console.log('SoundGenerator: Master-Volume auf', this.masterGain.gain.value, 'gesetzt');
        }
    }
} 