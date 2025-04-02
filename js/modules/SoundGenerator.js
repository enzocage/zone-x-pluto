/**
 * Sound Generator
 * Erzeugt Soundeffekte für verschiedene Spielereignisse mit Web Audio API
 * Verwaltet alle Klangeffekte zentral für konsistente Audioausgabe
 */

export class SoundGenerator {
    /**
     * Erstellt einen neuen Sound Generator
     */
    constructor() {
        // Audio Context initialisieren
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.value = 0.5; // 50% Lautstärke
        
        // Audio-Puffer für vorbereitete Klänge
        this.soundEffects = {};
        
        // Status
        this.muted = false;
    }
    
    /**
     * Initialisiert den Sound Generator
     * Wird nach dem ersten Benutzerinteraktionsevent aufgerufen (wegen Autoplay-Richtlinien)
     */
    init() {
        // AudioContext fortsetzen, wenn sie suspendiert ist
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Stellt die Gesamtlautstärke ein
     * @param {number} volume - Lautstärke zwischen 0 und 1
     */
    setVolume(volume) {
        if (volume >= 0 && volume <= 1) {
            this.masterGainNode.gain.value = volume;
        }
    }
    
    /**
     * Schaltet alle Sounds stumm oder wieder ein
     * @param {boolean} muted - true zum Stummschalten, false zum Einschalten
     */
    setMuted(muted) {
        this.muted = muted;
        this.masterGainNode.gain.value = muted ? 0 : 0.5;
    }
    
    // ===== SPIELEREREIGNISSE =====
    
    /**
     * Erzeugt einen Bewegungssound für den Spieler
     */
    playPlayerMove() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * Erzeugt einen Sound für das Platzieren eines Blocks
     */
    playBlockPlace() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    /**
     * Erzeugt einen Sound für das Einsammeln eines Blocks
     */
    playBlockPickup() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // ===== PLUTONIUM-EREIGNISSE =====
    
    /**
     * Erzeugt einen Sound für das Einsammeln von Plutonium
     */
    playPlutoniumPickup() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    /**
     * Erzeugt einen Warnton für den Plutonium-Timer
     */
    playPlutoniumTimerWarning() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // ===== KOLLISIONSEREIGNISSE =====
    
    /**
     * Erzeugt einen Sound für die Kollision mit einem Gegner
     */
    playEnemyCollision() {
        if (this.muted) return;
        
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.buffer = buffer;
        noise.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        noise.start();
    }
    
    /**
     * Erzeugt einen Sound für die Kollision von Gegnern untereinander
     */
    playEnemyToEnemyCollision() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // ===== SPIELSTATUSEREIGNISSE =====
    
    /**
     * Erzeugt einen Sound für den Verlust eines Lebens
     */
    playLifeLost() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Erzeugt einen Sound für das Betreten des Ausgangs
     */
    playLevelComplete() {
        if (this.muted) return;
        
        // Erster Ton
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        
        gain1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc1.connect(gain1);
        gain1.connect(this.masterGainNode);
        
        osc1.start();
        osc1.stop(this.audioContext.currentTime + 0.3);
        
        // Zweiter Ton (höher)
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, this.audioContext.currentTime + 0.3);
        
        gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGainNode);
        
        osc2.start(this.audioContext.currentTime + 0.3);
        osc2.stop(this.audioContext.currentTime + 0.6);
        
        // Dritter Ton (noch höher)
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.6);
        
        gain3.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.6);
        gain3.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.9);
        
        osc3.connect(gain3);
        gain3.connect(this.masterGainNode);
        
        osc3.start(this.audioContext.currentTime + 0.6);
        osc3.stop(this.audioContext.currentTime + 0.9);
    }
    
    /**
     * Erzeugt einen Sound für das Game Over
     */
    playGameOver() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 2.0);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.0);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2.0);
    }
} 