import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../game.js';
// Mock GameController explizit, da es von game.js importiert und instanziiert wird
import { GameController as MockGameController } from '../modules/GameController.js';

// Mock GameController
vi.mock('../modules/GameController.js', () => {
  const GameControllerMock = vi.fn();
  GameControllerMock.prototype.init = vi.fn();
  GameControllerMock.prototype.update = vi.fn();
  return { GameController: GameControllerMock };
});

// Mock für globale Browser-APIs
const mockRequestAnimationFrame = vi.fn((fn) => { fn(); }); // Ruft den Callback sofort auf
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn(); // Für mögliches Cleanup
const mockAppendChild = vi.fn();

const originalRequestAnimationFrame = global.requestAnimationFrame;
const originalWindow = global.window;
const originalDocument = global.document;

beforeEach(() => {
    // Setze Mocks für Browser-APIs
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        // Füge andere benötigte window-Eigenschaften hinzu
    };
    global.document = {
        body: {
            appendChild: mockAppendChild,
        },
        // Füge andere benötigte document-Eigenschaften hinzu
    };

    // Setze THREE.js Mocks zurück (obwohl setup.js dies tun sollte, zur Sicherheit)
    if (global.THREE) {
        if (global.THREE.Scene?.mockClear) global.THREE.Scene.mockClear();
        if (global.THREE.PerspectiveCamera?.mockClear) global.THREE.PerspectiveCamera.mockClear();
        if (global.THREE.WebGLRenderer?.mockClear) global.THREE.WebGLRenderer.mockClear();
        if (global.THREE.AmbientLight?.mockClear) global.THREE.AmbientLight.mockClear();
        if (global.THREE.DirectionalLight?.mockClear) global.THREE.DirectionalLight.mockClear();
        // Mock-Instanzen für Tests holen
         if (global.THREE.PerspectiveCamera) {
            global.mockCameraInstance = {
                aspect: 0,
                position: { x: 0, y: 0, z: 0, set: vi.fn(), },
                lookAt: vi.fn(),
                updateProjectionMatrix: vi.fn(),
            };
             global.THREE.PerspectiveCamera.mockReturnValue(global.mockCameraInstance);
        }
        if (global.THREE.WebGLRenderer) {
             global.mockRendererInstance = {
                setSize: vi.fn(),
                render: vi.fn(),
                domElement: 'mock-canvas'
            };
            global.THREE.WebGLRenderer.mockReturnValue(global.mockRendererInstance);
        }
         if (global.THREE.Scene) {
             global.mockSceneInstance = {
                add: vi.fn(),
                background: null,
            };
            global.THREE.Scene.mockReturnValue(global.mockSceneInstance);
        }
    }

    // MockGameController zurücksetzen
    MockGameController.mockClear();
    MockGameController.prototype.init.mockClear();
    MockGameController.prototype.update.mockClear();

    // Event Listener Mocks zurücksetzen
    mockAddEventListener.mockClear();
    mockAppendChild.mockClear();
    mockRequestAnimationFrame.mockClear();
});

afterEach(() => {
    // Stelle ursprüngliche globale Objekte wieder her
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.window = originalWindow;
    global.document = originalDocument;
    vi.clearAllMocks();
});

describe('Game', () => {
    let game;

    beforeEach(() => {
        // THREE muss gemockt sein *bevor* Game instanziiert wird
        if (!global.THREE) {
            throw new Error("THREE mock not found. Ensure setup.js ran and mocked THREE globally.");
        }
        game = new Game();
    });

    it('should initialize properties to null in constructor', () => {
        expect(game.scene).toBeNull();
        expect(game.camera).toBeNull();
        expect(game.renderer).toBeNull();
        expect(game.gameController).toBeNull();
    });

    describe('init', () => {
        beforeEach(() => {
             // Mock setupThreeJs, addLights, animate, damit wir init isoliert testen können
             // (Obwohl wir auch die Aufrufe prüfen wollen)
            vi.spyOn(game, 'setupThreeJs').mockImplementation(() => {
                 // Simuliere das Setzen der Instanzen, wie es setupThreeJs tun würde
                 game.scene = global.mockSceneInstance;
                 game.camera = global.mockCameraInstance;
                 game.renderer = global.mockRendererInstance;
            });
            vi.spyOn(game, 'addLights').mockImplementation(() => {});
            vi.spyOn(game, 'animate').mockImplementation(() => {});
            game.init();
        });

        it('should call setupThreeJs', () => {
            expect(game.setupThreeJs).toHaveBeenCalledTimes(1);
        });

        it('should call addLights', () => {
            expect(game.addLights).toHaveBeenCalledTimes(1);
        });

        it('should create and initialize GameController', () => {
            expect(MockGameController).toHaveBeenCalledTimes(1);
            expect(MockGameController).toHaveBeenCalledWith(game.scene);
            expect(game.gameController).toBeInstanceOf(MockGameController);
            expect(game.gameController.init).toHaveBeenCalledTimes(1);
        });

        it('should add window event listeners for resize and wheel', () => {
            expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
            expect(mockAddEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
        });

        it('should call animate', () => {
            expect(game.animate).toHaveBeenCalledTimes(1);
        });
    });

    describe('setupThreeJs', () => {
        beforeEach(() => {
            game.setupThreeJs();
        });

        it('should create a Scene', () => {
            expect(global.THREE.Scene).toHaveBeenCalledTimes(1);
            expect(game.scene).toBeDefined();
            expect(game.scene.background).toBeDefined(); // THREE.Color wird intern gemockt
        });

        it('should create a PerspectiveCamera', () => {
            expect(global.THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
            expect(global.THREE.PerspectiveCamera).toHaveBeenCalledWith(60, 1024 / 768, 0.1, 1000);
            expect(game.camera).toBeDefined();
            expect(game.camera.position.set).toHaveBeenCalledWith(0, 15, 10);
            expect(game.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
        });

        it('should create a WebGLRenderer and append its element', () => {
            expect(global.THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
            expect(global.THREE.WebGLRenderer).toHaveBeenCalledWith({ antialias: true });
            expect(game.renderer).toBeDefined();
            expect(game.renderer.setSize).toHaveBeenCalledWith(1024, 768);
            expect(mockAppendChild).toHaveBeenCalledWith(game.renderer.domElement);
        });
    });

    describe('addLights', () => {
         beforeEach(() => {
            // Szene muss existieren, bevor Lichter hinzugefügt werden
             game.scene = global.mockSceneInstance;
            game.addLights();
        });

        it('should create and add AmbientLight', () => {
            expect(global.THREE.AmbientLight).toHaveBeenCalledTimes(1);
            expect(global.THREE.AmbientLight).toHaveBeenCalledWith(0x404040);
            expect(game.scene.add).toHaveBeenCalledWith(expect.any(global.THREE.AmbientLight));
        });

        it('should create and add DirectionalLight', () => {
            expect(global.THREE.DirectionalLight).toHaveBeenCalledTimes(1);
            expect(global.THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 0.5);
            // TODO: Prüfen, ob die Position des DirectionalLight gesetzt wird (erfordert Mocking der Instanz)
            expect(game.scene.add).toHaveBeenCalledWith(expect.any(global.THREE.DirectionalLight));
        });
    });

    describe('animate', () => {
        beforeEach(() => {
             // Stellen Sie sicher, dass gameController und renderer existieren
            game.gameController = new MockGameController();
            game.renderer = global.mockRendererInstance;
            game.scene = global.mockSceneInstance;
            game.camera = global.mockCameraInstance;
            game.animate();
        });

        it('should request animation frame', () => {
            // Der mockRequestAnimationFrame ruft den Callback sofort auf, daher wird er erneut aufgerufen.
            // Wir prüfen nur den ersten Aufruf innerhalb von animate selbst.
             expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
             expect(mockRequestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should call gameController.update', () => {
            expect(game.gameController.update).toHaveBeenCalledTimes(1);
        });

        it('should call renderer.render', () => {
            expect(game.renderer.render).toHaveBeenCalledTimes(1);
            expect(game.renderer.render).toHaveBeenCalledWith(game.scene, game.camera);
        });

         it('should not call update/render if controller/renderer missing (edge case)', () => {
            game.gameController = null;
            game.renderer = null;
            mockRequestAnimationFrame.mockClear(); // Zurücksetzen für diesen Test

            // Rufe den animate-Callback manuell auf (da RAF gemockt ist)
            const animateCallback = mockRequestAnimationFrame.mock.calls[0][0];
            animateCallback();

            expect(MockGameController.prototype.update).not.toHaveBeenCalled();
            // renderer.render würde im echten RAF-Callback aufgerufen, aber nicht wenn renderer null ist.
        });
    });

    describe('onWindowResize', () => {
        beforeEach(() => {
            // Setze Kamera und Renderer für den Test
            game.camera = global.mockCameraInstance;
            game.renderer = global.mockRendererInstance;
             // Simuliere Fenstergrößenänderung
            global.window.innerWidth = 800;
            global.window.innerHeight = 600;
            game.onWindowResize();
        });

        it('should update camera aspect ratio and projection matrix', () => {
            expect(game.camera.aspect).toBe(800 / 600);
            expect(game.camera.updateProjectionMatrix).toHaveBeenCalledTimes(1);
        });

        it('should update renderer size', () => {
            expect(game.renderer.setSize).toHaveBeenCalledWith(800, 600);
        });
    });

    describe('onMouseWheel', () => {
        beforeEach(() => {
            // Setze Kamera für den Test
             game.camera = global.mockCameraInstance;
             game.camera.position.y = 15; // Startposition
        });

        it('should zoom in (decrease camera y) on scroll up', () => {
            const mockEvent = { deltaY: -100 };
            game.onMouseWheel(mockEvent);
            // Erwarteter Wert: 15 - 0.1 * 10 = 14 (muss aber >= 5 sein)
            expect(game.camera.position.y).toBeCloseTo(14);
             expect(game.camera.lookAt).toHaveBeenCalled(); // lookAt sollte aufgerufen werden
        });

        it('should zoom out (increase camera y) on scroll down', () => {
            const mockEvent = { deltaY: 100 };
            game.onMouseWheel(mockEvent);
            // Erwarteter Wert: 15 + 0.1 * 10 = 16 (muss aber <= 40 sein)
            expect(game.camera.position.y).toBeCloseTo(16);
             expect(game.camera.lookAt).toHaveBeenCalled();
        });

        it('should clamp zoom in at minimum y position', () => {
            game.camera.position.y = 5.5;
            const mockEvent = { deltaY: -100 };
            game.onMouseWheel(mockEvent);
            // Erwarteter Wert: 5.5 - 1 = 4.5, geklemmt auf 5
            expect(game.camera.position.y).toBeCloseTo(5);
             expect(game.camera.lookAt).toHaveBeenCalled();
        });

        it('should clamp zoom out at maximum y position', () => {
            game.camera.position.y = 39.5;
            const mockEvent = { deltaY: 100 };
            game.onMouseWheel(mockEvent);
            // Erwarteter Wert: 39.5 + 1 = 40.5, geklemmt auf 40
            expect(game.camera.position.y).toBeCloseTo(40);
             expect(game.camera.lookAt).toHaveBeenCalled();
        });
    });

    // Test für den globalen Event Listener (schwieriger zu testen, da er außerhalb der Klasse liegt)
    // Man könnte prüfen, ob addEventListener auf window aufgerufen wurde, aber der spezifische Callback
    // ist schwer zu isolieren und zu triggern in einem Unit-Test.
}); 