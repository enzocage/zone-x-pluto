import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundGenerator } from '../modules/SoundGenerator.js';

// --- Mocking Web Audio API ---

const mockAudioContext = vi.fn();
const mockGainNode = vi.fn();
const mockOscillatorNode = vi.fn();

// Halten Sie Referenzen auf die ursprünglichen Objekte, falls vorhanden
const originalAudioContext = global.window?.AudioContext;
const originalWebkitAudioContext = global.window?.webkitAudioContext;

beforeEach(() => {
  // Mock für GainNode
  const gainNodeInstance = {
    gain: {
      value: 0.5, // Standardwert im Konstruktor
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  mockGainNode.mockReturnValue(gainNodeInstance);

  // Mock für OscillatorNode
  const oscillatorNodeInstance = {
    type: '',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  mockOscillatorNode.mockReturnValue(oscillatorNodeInstance);

  // Mock für AudioContext
  const audioContextInstance = {
    currentTime: 0, // Einfacher Zeitstempel für Tests
    state: 'running', // Standardzustand
    destination: 'mock-destination', // Dummy-Ziel
    createGain: mockGainNode,
    createOscillator: mockOscillatorNode,
    resume: vi.fn().mockImplementation(() => {
      // Ändert den Zustand, wenn resume() aufgerufen wird
      audioContextInstance.state = 'running';
      return Promise.resolve();
    }),
    suspend: vi.fn().mockImplementation(() => {
      audioContextInstance.state = 'suspended';
      return Promise.resolve();
    }),
    close: vi.fn().mockImplementation(() => {
        audioContextInstance.state = 'closed';
        return Promise.resolve();
    }),
  };
  mockAudioContext.mockReturnValue(audioContextInstance);

  // Weisen Sie die Mocks dem globalen Fensterobjekt zu (simuliert Browserumgebung)
  global.window = global.window || {}; // Stellen Sie sicher, dass window existiert
  global.window.AudioContext = mockAudioContext;
  global.window.webkitAudioContext = mockAudioContext; // Auch für ältere Browser/Safari
});

afterEach(() => {
  // Stellen Sie die ursprünglichen Objekte wieder her
  if (originalAudioContext) {
      global.window.AudioContext = originalAudioContext;
  }
  if (originalWebkitAudioContext) {
      global.window.webkitAudioContext = originalWebkitAudioContext;
  }
  // Löschen Sie das Fensterobjekt, wenn es nur für den Test erstellt wurde
  // if (!originalAudioContext && !originalWebkitAudioContext) delete global.window;
  vi.clearAllMocks();
});

// --- Tests für SoundGenerator ---

describe('SoundGenerator', () => {
  let soundGenerator;
  let mockContextInstance; // Zugriff auf die konkrete Mock-Instanz

  beforeEach(() => {
    soundGenerator = new SoundGenerator();
    // Zugriff auf die spezifische Instanz, die vom Konstruktor erstellt wurde
    mockContextInstance = mockAudioContext.mock.results[0].value;
  });

  it('should initialize AudioContext and master GainNode on construction', () => {
    expect(mockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockContextInstance.createGain).toHaveBeenCalledTimes(1);
    expect(soundGenerator.masterGainNode).toBeDefined();
    expect(soundGenerator.masterGainNode.connect).toHaveBeenCalledWith(mockContextInstance.destination);
    expect(soundGenerator.masterGainNode.gain.value).toBe(0.5); // Initial volume
    expect(soundGenerator.muted).toBe(false);
  });

  it('should resume AudioContext if suspended on init()', () => {
    mockContextInstance.state = 'suspended';
    soundGenerator.init();
    expect(mockContextInstance.resume).toHaveBeenCalledTimes(1);
  });

  it('should not resume AudioContext if running on init()', () => {
    mockContextInstance.state = 'running';
    soundGenerator.init();
    expect(mockContextInstance.resume).not.toHaveBeenCalled();
  });

  it('should set master gain volume correctly with setVolume()', () => {
    soundGenerator.setVolume(0.8);
    expect(soundGenerator.masterGainNode.gain.value).toBe(0.8);
    soundGenerator.setVolume(0);
    expect(soundGenerator.masterGainNode.gain.value).toBe(0);
  });

  it('should not set volume outside the range [0, 1]', () => {
    const initialVolume = soundGenerator.masterGainNode.gain.value;
    soundGenerator.setVolume(1.5);
    expect(soundGenerator.masterGainNode.gain.value).toBe(initialVolume);
    soundGenerator.setVolume(-0.5);
    expect(soundGenerator.masterGainNode.gain.value).toBe(initialVolume);
  });

  it('should mute and unmute correctly with setMuted()', () => {
    // Mute
    soundGenerator.setMuted(true);
    expect(soundGenerator.muted).toBe(true);
    expect(soundGenerator.masterGainNode.gain.value).toBe(0);

    // Unmute
    soundGenerator.setMuted(false);
    expect(soundGenerator.muted).toBe(false);
    expect(soundGenerator.masterGainNode.gain.value).toBe(0.5); // Should return to default 0.5
  });

  describe('Sound Playback', () => {
    it('should not play sound if muted', () => {
      soundGenerator.setMuted(true);
      soundGenerator.playPlayerMove();
      expect(mockContextInstance.createOscillator).not.toHaveBeenCalled();
      expect(mockContextInstance.createGain).toHaveBeenCalledTimes(1); // Master Gain wird immer erstellt
    });

    it('should play PlayerMove sound correctly', () => {
      soundGenerator.playPlayerMove();

      expect(mockContextInstance.createOscillator).toHaveBeenCalledTimes(1);
      // Zweiter Aufruf von createGain für den lokalen Gain des Sounds
      expect(mockContextInstance.createGain).toHaveBeenCalledTimes(2);

      const oscillator = mockOscillatorNode.mock.results[0].value;
      const gainNode = mockGainNode.mock.results[1].value; // Der zweite erstellte GainNode

      expect(oscillator.type).toBe('sine');
      expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(220, mockContextInstance.currentTime);
      expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(110, mockContextInstance.currentTime + 0.1);
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.1, mockContextInstance.currentTime);
      expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockContextInstance.currentTime + 0.1);

      expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
      expect(gainNode.connect).toHaveBeenCalledWith(soundGenerator.masterGainNode);

      expect(oscillator.start).toHaveBeenCalledTimes(1);
      expect(oscillator.stop).toHaveBeenCalledWith(mockContextInstance.currentTime + 0.1);
    });

    it('should play BlockPlace sound correctly', () => {
        soundGenerator.playBlockPlace();
        expect(mockContextInstance.createOscillator).toHaveBeenCalledTimes(1);
        expect(mockContextInstance.createGain).toHaveBeenCalledTimes(2);

        const oscillator = mockOscillatorNode.mock.results[0].value;
        const gainNode = mockGainNode.mock.results[1].value;

        expect(oscillator.type).toBe('square');
        expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(150, mockContextInstance.currentTime);
        expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.2, mockContextInstance.currentTime);
        expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockContextInstance.currentTime + 0.3);
        expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
        expect(gainNode.connect).toHaveBeenCalledWith(soundGenerator.masterGainNode);
        expect(oscillator.start).toHaveBeenCalledTimes(1);
        expect(oscillator.stop).toHaveBeenCalledWith(mockContextInstance.currentTime + 0.3);
    });

     it('should call playBlockPlace when playPlaceBlock is called', () => {
        const spy = vi.spyOn(soundGenerator, 'playBlockPlace');
        soundGenerator.playPlaceBlock();
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    it('should play PlutoniumPickup sound correctly', () => {
        soundGenerator.playPlutoniumPickup();
        expect(mockContextInstance.createOscillator).toHaveBeenCalledTimes(1);
        expect(mockContextInstance.createGain).toHaveBeenCalledTimes(2);

        const oscillator = mockOscillatorNode.mock.results[0].value;
        const gainNode = mockGainNode.mock.results[1].value;

        expect(oscillator.type).toBe('sine');
        expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, mockContextInstance.currentTime);
        expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(880, mockContextInstance.currentTime + 0.2);
        expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.2, mockContextInstance.currentTime);
        expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockContextInstance.currentTime + 0.3);
        expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
        expect(gainNode.connect).toHaveBeenCalledWith(soundGenerator.masterGainNode);
        expect(oscillator.start).toHaveBeenCalledTimes(1);
        expect(oscillator.stop).toHaveBeenCalledWith(mockContextInstance.currentTime + 0.3);
    });

     it('should call playPlutoniumPickup when playCollectPlutonium is called', () => {
        const spy = vi.spyOn(soundGenerator, 'playPlutoniumPickup');
        soundGenerator.playCollectPlutonium();
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

     it('should play Error sound correctly', () => {
        soundGenerator.playError();
        expect(mockContextInstance.createOscillator).toHaveBeenCalledTimes(1);
        expect(mockContextInstance.createGain).toHaveBeenCalledTimes(2);

        const oscillator = mockOscillatorNode.mock.results[0].value;
        const gainNode = mockGainNode.mock.results[1].value;

        expect(oscillator.type).toBe('square');
        expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(110, mockContextInstance.currentTime);
        expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.2, mockContextInstance.currentTime);
        expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockContextInstance.currentTime + 0.2);
        expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
        expect(gainNode.connect).toHaveBeenCalledWith(soundGenerator.masterGainNode);
        expect(oscillator.start).toHaveBeenCalledTimes(1);
        expect(oscillator.stop).toHaveBeenCalledWith(mockContextInstance.currentTime + 0.2);
    });

    // Weitere Tests für andere Sounds (z.B. playDeliverPlutonium, playLevelComplete etc.) könnten hier hinzugefügt werden,
    // dem gleichen Muster folgend wie playPlayerMove, playBlockPlace etc.

  });
}); 