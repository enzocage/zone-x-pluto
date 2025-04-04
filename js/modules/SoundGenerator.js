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
     * Alternative Methode für das Platzieren eines Blocks, wird vom GameController verwendet
     */
    playPlaceBlock() {
        // Verwende die bestehende Methode für Konsistenz
        this.playBlockPlace();
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
    
    /**
     * Alternative Methode für das Einsammeln eines Blocks, wird vom GameController verwendet
     */
    playCollectBlock() {
        // Verwende die bestehende Methode für Konsistenz
        this.playBlockPickup();
    }
    
    /**
     * Erzeugt einen Fehlersound für ungültige Aktionen
     */
    playError() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
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
     * Erzeugt einen Sound für das Einsammeln von Plutonium
     * Alternative Methode, wird von GameController verwendet
     */
    playCollectPlutonium() {
        // Verwende die bestehende Methode für Konsistenz
        this.playPlutoniumPickup();
    }
    
    /**
     * Erzeugt einen Sound für das Abliefern von Plutonium
     */
    playDeliverPlutonium() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(330, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
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
    
    /**
     * Erzeugt einen dramatischen Tick-Tack-Sound für den Plutonium-Timer
     * @param {number} remainingTime - Die verbleibende Zeit in Sekunden
     */
    playPlutoniumTimerTick(remainingTime) {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Frequenz und Lautstärke basierend auf verbleibender Zeit
        let frequency = 440;
        let volume = 0.15;
        let duration = 0.1;
        
        // In den letzten 3 Sekunden wird der Sound dramatischer
        if (remainingTime <= 3) {
            // Höhere Frequenz und Lautstärke für mehr Dramatik
            frequency = 550 + (3 - remainingTime) * 100; // Steigt bis zu 850 Hz
            volume = 0.15 + (3 - remainingTime) * 0.1;   // Steigt bis zu 0.45
            duration = 0.1 + (3 - remainingTime) * 0.05; // Längerer Ton
        }
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
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
     * Spielt eine heroische Melodie mit 300% längerer Dauer
     */
    playLevelComplete() {
        if (this.muted) return;
        
        // Längere Tondauer für jeden Ton (ursprünglich 0.3 Sekunden, jetzt 0.9 Sekunden)
        const toneDuration = 0.1;
        const totalDuration = toneDuration * 1; // Gesamtdauer eines Tons mit Ausklang
        
        // Erster Ton
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        
        gain1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + toneDuration);
        
        osc1.connect(gain1);
        gain1.connect(this.masterGainNode);
        
        osc1.start();
        osc1.stop(this.audioContext.currentTime + toneDuration);
        
        // Zweiter Ton (höher) - Mit Verzögerung für ersten Ton
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, this.audioContext.currentTime + totalDuration); // E5
        
        gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime + totalDuration);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + totalDuration + toneDuration);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGainNode);
        
        osc2.start(this.audioContext.currentTime + totalDuration);
        osc2.stop(this.audioContext.currentTime + totalDuration + toneDuration);
        
        // Dritter Ton (noch höher) - Mit Verzögerung für ersten und zweiten Ton
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(880, this.audioContext.currentTime + 2 * totalDuration); // A5
        
        gain3.gain.setValueAtTime(0.3, this.audioContext.currentTime + 2 * totalDuration);
        gain3.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2 * totalDuration + toneDuration);
        
        osc3.connect(gain3);
        gain3.connect(this.masterGainNode);
        
        osc3.start(this.audioContext.currentTime + 2 * totalDuration);
        osc3.stop(this.audioContext.currentTime + 2 * totalDuration + toneDuration);
        
        // Vierter Ton (Fanfare) - Mit Verzögerung für die ersten drei Töne
        const osc4 = this.audioContext.createOscillator();
        const gain4 = this.audioContext.createGain();
        
        osc4.type = 'square'; // Andere Wellenform für besseren Klang
        osc4.frequency.setValueAtTime(1320, this.audioContext.currentTime + 3 * totalDuration); // E6
        
        gain4.gain.setValueAtTime(0.2, this.audioContext.currentTime + 3 * totalDuration);
        gain4.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3 * totalDuration + toneDuration * 1.5);
        
        osc4.connect(gain4);
        gain4.connect(this.masterGainNode);
        
        osc4.start(this.audioContext.currentTime + 3 * totalDuration);
        osc4.stop(this.audioContext.currentTime + 3 * totalDuration + toneDuration * 1.5);
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

    /**
     * Erzeugt einen positiven Sound, wenn das Exit-Element erscheint
     */
    playExitAppear() {
        if (this.muted) return;
        
        // Akkord-Effekt mit mehreren Oszillatoren für ein festliches Gefühl
        
        // Hauptton (C5)
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        
        osc1.type = 'triangle'; // Weicherer Klang
        osc1.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        
        gain1.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        
        osc1.connect(gain1);
        gain1.connect(this.masterGainNode);
        
        // Terz (E5)
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.26, this.audioContext.currentTime); // E5
        
        gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.2);
        
        osc2.connect(gain2);
        gain2.connect(this.masterGainNode);
        
        // Quinte (G5)
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(784.99, this.audioContext.currentTime); // G5
        
        gain3.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        
        osc3.connect(gain3);
        gain3.connect(this.masterGainNode);
        
        // Glitzernde Obertöne für zusätzlichen Effekt
        const osc4 = this.audioContext.createOscillator();
        const gain4 = this.audioContext.createGain();
        
        osc4.type = 'sine';
        osc4.frequency.setValueAtTime(1046.50, this.audioContext.currentTime); // C6 (eine Oktave höher)
        
        gain4.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain4.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        
        osc4.connect(gain4);
        gain4.connect(this.masterGainNode);
        
        // Alle Oszillatoren starten und stoppen
        osc1.start();
        osc2.start();
        osc3.start();
        osc4.start();
        
        osc1.stop(this.audioContext.currentTime + 1.5);
        osc2.stop(this.audioContext.currentTime + 1.2);
        osc3.stop(this.audioContext.currentTime + 1.0);
        osc4.stop(this.audioContext.currentTime + 0.8);
    }
} 