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
     * Der Sound wird nun 3 Mal pro Sekunde gespielt
     * @param {number} remainingTime - Die verbleibende Zeit in Sekunden
     */
    playPlutoniumTimerTick(remainingTime) {
        if (this.muted) return;
        
        // Prüfe, ob dieser Aufruf ein Intervall von ca. 0.33 Sekunden trifft
        // Wir verwenden eine Toleranz, da remainingTime eventuell nicht genau auf 0.33-Intervalle fällt
        const subSecond = remainingTime % 1;
        const tolerance = 0.05;
        
        // Wir spielen den Sound an drei Stellen pro Sekunde: 0, 0.33 und 0.66
        const playAt = [0, 0.33, 0.66];
        
        // Prüfe, ob wir nahe genug an einem der Zeitpunkte sind
        let shouldPlay = false;
        for (const time of playAt) {
            if (Math.abs(subSecond - time) < tolerance) {
                shouldPlay = true;
                break;
            }
        }
        
        if (!shouldPlay) return;
        
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
        
        oscillator.type = 'sine';
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
     * Spielt die Anfangsmelodie aus Mozarts "Eine kleine Nachtmusik" (beschleunigt, höher, Sägezahn)
     */
    playLevelComplete() {
        if (this.muted) return;
        
        const now = this.audioContext.currentTime;
        
        // Die Grundfrequenzen für die Noten der G-Dur Tonleiter (eine Oktave höher)
        const noteFrequencies = {
            'G4': 392.00,   // Statt G3
            'A4': 440.00,
            'B4': 493.88,
            'C5': 523.25,
            'D5': 587.33,
            'E5': 659.25,
            'F#5': 739.99,
            'G5': 783.99,   // Statt G4
            'A5': 880.00,
            'B5': 987.77,
            'C6': 1046.50,
            'D6': 1174.66,
            'E6': 1318.51,
            'F#6': 1479.98,
            'G6': 1567.98    // Statt G5
        };
        
        // Die Tonfolge für "Eine kleine Nachtmusik"
        // Alle Noten eine Oktave höher und Dauern um 3x schneller (300% Beschleunigung)
        const melody = [
            // Aufsteigender Dreiklang
            { note: 'G5', duration: 0.25/3 },
            { note: 'D5', duration: 0.25/3 },
            { note: 'G6', duration: 0.5/3 },
            
            // Absteigende Linie
            { note: 'G6', duration: 0.25/3 },
            { note: 'F#6', duration: 0.25/3 },
            { note: 'E6', duration: 0.25/3 },
            { note: 'D6', duration: 0.25/3 },
            { note: 'C6', duration: 0.25/3 },
            { note: 'B5', duration: 0.25/3 },
            
            // Wiederholung des Dreiklangs
            { note: 'G5', duration: 0.25/3 },
            { note: 'D5', duration: 0.25/3 },
            { note: 'G6', duration: 0.5/3 },
            
            // Abschließende Figur
            { note: 'D6', duration: 0.25/3 },
            { note: 'E6', duration: 0.25/3 },
            { note: 'F#6', duration: 0.25/3 },
            { note: 'G6', duration: 0.5/3 }
        ];
        
        // Parameter für den Sound
        const baseVolume = 0.3;
        let elapsedTime = 0;
        
        // Jeden Ton der Melodie abspielen
        melody.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Sägezahnkurve statt Sinuskurve
            osc.type = 'sawtooth';
            
            // Die Frequenz der aktuellen Note setzen
            osc.frequency.setValueAtTime(noteFrequencies[note.note], now + elapsedTime);
            
            // Lautstärke anpassen mit sanftem An- und Abschwellen
            gainNode.gain.setValueAtTime(0, now + elapsedTime);
            gainNode.gain.linearRampToValueAtTime(baseVolume, now + elapsedTime + 0.02);
            gainNode.gain.setValueAtTime(baseVolume, now + elapsedTime + note.duration - 0.02);
            gainNode.gain.linearRampToValueAtTime(0, now + elapsedTime + note.duration);
            
            // Verbindungen herstellen
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // Oszillator starten und stoppen
            osc.start(now + elapsedTime);
            osc.stop(now + elapsedTime + note.duration);
            
            // Zeit für die nächste Note vorrücken
            elapsedTime += note.duration;
        });
        
        // Einen leichten harmonischen Hintergrund hinzufügen (ebenfalls beschleunigt)
        const harmonicIntervals = [
            { note: 'G4', duration: elapsedTime / 2 },
            { note: 'D5', duration: elapsedTime / 2 }
        ];
        
        harmonicIntervals.forEach((interval, index) => {
            const startTime = now + index * (elapsedTime / 2);
            
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Auch der Begleitsound verwendet Sägezahnwellen, aber etwas leiser
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(noteFrequencies[interval.note], startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(baseVolume * 0.10, startTime + 0.05);
            gainNode.gain.setValueAtTime(baseVolume * 0.10, startTime + interval.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + interval.duration);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            osc.start(startTime);
            osc.stop(startTime + interval.duration);
        });
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
     * Erzeugt einen positiven und fröhlichen Sound, wenn das Exit-Element erscheint
     * Der neue Sound ist melodischer mit aufsteigenden Arpeggios und einem "magischen" Gefühl
     */
    playExitAppear() {
        if (this.muted) return;
        
        const now = this.audioContext.currentTime;
        
        // Basis-Parameter für den Sound
        const baseVolume = 0.25;
        const baseDuration = 1.8;
        
        // Aufsteigendes Dur-Arpeggio in C-Dur (C, E, G, C, E, G, C)
        const noteFrequencies = [
            261.63, // C4
            329.63, // E4
            392.00, // G4
            523.25, // C5
            659.26, // E5
            783.99, // G5
            1046.50 // C6
        ];
        
        // Spiele das Arpeggio mit verschiedenen Wellenformen
        noteFrequencies.forEach((freq, index) => {
            // Zeitversatz für jede Note
            const startTime = now + index * 0.09;
            
            // Erstelle den Oszillator
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Abwechselnde Wellenformen für interessanteren Klang
            osc.type = index % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            
            // Moduliere leicht die Frequenz für einen lebendigeren Klang
            if (index > 0) {
                osc.frequency.setValueAtTime(freq, startTime);
                osc.frequency.linearRampToValueAtTime(freq * 1.005, startTime + 0.15);
                osc.frequency.linearRampToValueAtTime(freq, startTime + 0.3);
            }
            
            // Höhere Noten leiser
            const volFactor = 1.0 - (index * 0.1);
            gainNode.gain.setValueAtTime(baseVolume * volFactor, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
            
            // Verbinde Oszillator mit Gain und Ausgang
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // Starte und stoppe den Oszillator
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
        
        // Füge einen "Glitzer"-Effekt mit zufälligen hohen Tönen hinzu
        for (let i = 0; i < 12; i++) {
            const startTime = now + 0.6 + (i * 0.08);
            const randomFreq = 1500 + Math.random() * 1000; // Zwischen 1500-2500 Hz
            
            const sparkle = this.audioContext.createOscillator();
            const sparkleGain = this.audioContext.createGain();
            
            sparkle.type = 'sine';
            sparkle.frequency.setValueAtTime(randomFreq, startTime);
            
            sparkleGain.gain.setValueAtTime(0.05 + (Math.random() * 0.05), startTime);
            sparkleGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
            
            sparkle.connect(sparkleGain);
            sparkleGain.connect(this.masterGainNode);
            
            sparkle.start(startTime);
            sparkle.stop(startTime + 0.2);
        }
        
        // Abschließender tiefer "magischer" Klang
        const finalChord = this.audioContext.createOscillator();
        const finalGain = this.audioContext.createGain();
        
        finalChord.type = 'sine';
        finalChord.frequency.setValueAtTime(130.81, now + 1.2); // C3
        
        finalGain.gain.setValueAtTime(0.2, now + 1.2);
        finalGain.gain.exponentialRampToValueAtTime(0.001, now + baseDuration);
        
        finalChord.connect(finalGain);
        finalGain.connect(this.masterGainNode);
        
        finalChord.start(now + 1.2);
        finalChord.stop(now + baseDuration);
    }
} 