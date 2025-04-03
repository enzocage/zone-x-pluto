import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '../game.js';
import { GameController } from '../modules/GameController.js'; // Pfad ggf. anpassen

// Mock GameController und seine Methoden
vi.mock('../modules/GameController.js', () => {
    const GameControllerMock = vi.fn();
    GameControllerMock.prototype.init = vi.fn();
    GameControllerMock.prototype.update = vi.fn();
    GameControllerMock.prototype.onKeyDown = vi.fn();
    GameControllerMock.prototype.onKeyUp = vi.fn();
    GameControllerMock.prototype.onWindowResize = vi.fn();
    return { GameController: GameControllerMock };
});

// Mock globale Browser-Objekte und requestAnimationFrame
// (jsdom sollte window und document bereitstellen)
vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { /* Store callback if needed */ }));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock THREE nicht mehr global hier, da jsdom vorhanden ist und
// andere Tests THREE lokal mocken. Bei Bedarf können spezifische
// Teile hier gemockt werden, wenn jsdom nicht reicht.


// --- Hilfsfunktionen ---
// Erzeugt ein Mock-Event-Objekt
const createMockEvent = (key, type = 'keydown') => ({
    key: key,
    type: type,
    preventDefault: vi.fn(),
});

// --- Tests für Game ---
describe('Game', () => {
    let game;
    let mockContainer;

    // Mock für THREE Teile, die von Game direkt verwendet werden könnten (falls notwendig)
    let mockScene, mockCamera, mockRenderer;

    beforeEach(() => {
        // Erstelle einen Container für den Renderer
        mockContainer = document.createElement('div');
        document.body.appendChild(mockContainer);

        // Mock für THREE Objekte, die von Game erwartet werden könnten
        mockScene = { add: vi.fn(), background: { set: vi.fn() } }; // Beispiel
        mockCamera = { position: { set: vi.fn(), y: 10 }, aspect: 1, updateProjectionMatrix: vi.fn() }; // Beispiel
        mockRenderer = { domElement: document.createElement('canvas'), setSize: vi.fn(), render: vi.fn() }; // Beispiel

        // Mock THREE global (nur für diese beforeEach, falls benötigt)
        // Hier stubben, wenn game.js direkt THREE verwendet und nicht nur über GameController
        // vi.stubGlobal('THREE', {
        //     Scene: vi.fn(() => mockScene),
        //     PerspectiveCamera: vi.fn(() => mockCamera),
        //     WebGLRenderer: vi.fn(() => mockRenderer),
        //     Color: vi.fn(),
        //     AmbientLight: vi.fn(),
        //     DirectionalLight: vi.fn(),
        // });

        // Instanziiere Game
        game = new Game(mockContainer);

        // Mocks zurücksetzen (wichtig NACH der Initialisierung von Game)
        vi.clearAllMocks();
        // Setze Mocks erneut, da clearAllMocks sie löscht
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        // Setze THREE Mocks erneut, falls oben verwendet
        // vi.stubGlobal('THREE', { ... });

    });

    afterEach(() => {
        // Räume den Container auf
        if (mockContainer && mockContainer.parentNode) {
            mockContainer.parentNode.removeChild(mockContainer);
        }
        vi.restoreAllMocks();
    });

    it('should initialize properties to null in constructor', () => {
        // Prüfe Initialzustand VOR init()
        expect(game.container).toBe(mockContainer);
        expect(game.scene).toBeNull();
        expect(game.camera).toBeNull();
        expect(game.renderer).toBeNull();
        expect(game.gameController).toBeNull();
    });

    describe('init', () => {
        // Mock THREE hier spezifisch für init Tests
        beforeEach(() => {
            vi.stubGlobal('THREE', {
                Scene: vi.fn(() => mockScene),
                PerspectiveCamera: vi.fn(() => mockCamera),
                WebGLRenderer: vi.fn(() => mockRenderer),
                Color: vi.fn(),
                AmbientLight: vi.fn(),
                DirectionalLight: vi.fn(),
            });
            // GameController Mock Instanz holen
             game.gameController = new GameController();
        });

        it('should call setupThreeJs, addLights, create GameController, setupEventListeners, call controller.init and start animation', () => {
            const spySetupThreeJs = vi.spyOn(game, 'setupThreeJs');
            const spyAddLights = vi.spyOn(game, 'addLights');
            const spySetupListeners = vi.spyOn(game, 'setupEventListeners');
            const spyAnimate = vi.spyOn(game, 'animate');
            // Zugriff auf die Mock-Instanz von GameController
            const controllerInitSpy = vi.spyOn(game.gameController, 'init');

            game.init();

            expect(spySetupThreeJs).toHaveBeenCalledTimes(1);
            expect(spyAddLights).toHaveBeenCalledTimes(1);
            expect(GameController).toHaveBeenCalledWith(game.scene); // Prüfen ob Controller mit Szene erstellt wurde
            expect(game.gameController).toBeInstanceOf(GameController);
            expect(spySetupListeners).toHaveBeenCalledTimes(1);
            expect(controllerInitSpy).toHaveBeenCalledTimes(1);
            expect(spyAnimate).toHaveBeenCalledTimes(1); // Prüft, ob animate zum Start aufgerufen wird
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1); // Prüft, ob die Animationsschleife gestartet wurde
        });

        it('should add resize and mouse wheel listeners', () => {
            const spyAddEventListener = vi.spyOn(window, 'addEventListener');
            game.setupEventListeners(); // Rufe explizit auf, da init gemockt wird
            expect(spyAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
            expect(spyAddEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
        });

         it('should add keydown and keyup listeners', () => {
            const spyAddEventListener = vi.spyOn(document, 'addEventListener');
            game.setupEventListeners(); 
            expect(spyAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(spyAddEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
        });

    });

    describe('setupThreeJs', () => {
         beforeEach(() => {
             // Stelle sicher, dass THREE gemockt ist
             vi.stubGlobal('THREE', {
                 Scene: vi.fn(() => mockScene),
                 PerspectiveCamera: vi.fn(() => mockCamera),
                 WebGLRenderer: vi.fn(() => mockRenderer),
                 Color: vi.fn(),
             });
         });

        it('should create a Scene', () => {
            game.setupThreeJs();
            expect(THREE.Scene).toHaveBeenCalledTimes(1);
            expect(game.scene).toBe(mockScene);
            expect(game.scene.background.set).toHaveBeenCalledWith(0x111111);
        });

        it('should create a PerspectiveCamera', () => {
            game.setupThreeJs();
            expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
            expect(game.camera).toBe(mockCamera);
            expect(game.camera.position.set).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number));
        });

        it('should create a WebGLRenderer and append its element', () => {
            const spyAppendChild = vi.spyOn(mockContainer, 'appendChild');
            game.setupThreeJs();
            expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
            expect(game.renderer).toBe(mockRenderer);
            expect(spyAppendChild).toHaveBeenCalledWith(mockRenderer.domElement);
            expect(game.renderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        });
    });

    describe('addLights', () => {
         beforeEach(() => {
             game.scene = mockScene; // Weise die Mock-Szene zu
             vi.stubGlobal('THREE', {
                 AmbientLight: vi.fn(),
                 DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })), // Mock für DirectionalLight
             });
         });

        it('should create and add AmbientLight', () => {
            game.addLights();
            expect(THREE.AmbientLight).toHaveBeenCalledWith(0x404040);
            expect(game.scene.add).toHaveBeenCalledTimes(1);
        });

        it('should create and add DirectionalLight', () => {
            game.addLights();
            expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1);
            // DirectionalLight wird als zweites hinzugefügt
            expect(game.scene.add).toHaveBeenCalledTimes(2);
        });
    });

    describe('animate', () => {
        beforeEach(() => {
            // Stelle sicher, dass GameController und Renderer gemockt sind
            game.gameController = new GameController();
            game.renderer = mockRenderer;
            game.scene = mockScene;
            game.camera = mockCamera;
            // Mock rAF für diesen Test
            vi.stubGlobal('requestAnimationFrame', vi.fn()); 
        });

        it('should request animation frame', () => {
            game.animate();
            expect(requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should call gameController.update', () => {
            game.animate();
            expect(game.gameController.update).toHaveBeenCalledTimes(1);
        });

        it('should call renderer.render', () => {
            game.animate();
            expect(game.renderer.render).toHaveBeenCalledWith(game.scene, game.camera);
        });

        it('should not call update/render if controller/renderer missing (edge case)', () => {
            game.gameController = null;
            game.renderer = null;
            game.animate();
            // Die Mocks sollten nicht aufgerufen worden sein
            // (Nehme an, der echte update/render wird im GameController/Renderer Mock nicht aufgerufen)
            expect(GameController.prototype.update).not.toHaveBeenCalled();
            expect(mockRenderer.render).not.toHaveBeenCalled(); // Prüfe den Mock Renderer direkt
            expect(requestAnimationFrame).toHaveBeenCalled(); // rAF sollte immer noch aufgerufen werden
        });
    });

    describe('onWindowResize', () => {
        beforeEach(() => {
            game.camera = mockCamera;
            game.renderer = mockRenderer;
            game.gameController = new GameController(); // Weise Mock-Instanz zu
        });

        it('should update camera aspect ratio and projection matrix', () => {
            game.onWindowResize();
            expect(game.camera.aspect).toBe(window.innerWidth / window.innerHeight);
            expect(game.camera.updateProjectionMatrix).toHaveBeenCalledTimes(1);
        });

        it('should update renderer size', () => {
            game.onWindowResize();
            expect(game.renderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        });

         it('should call gameController.onWindowResize', () => {
             game.onWindowResize();
             expect(game.gameController.onWindowResize).toHaveBeenCalledTimes(1);
         });
    });

    describe('onMouseWheel', () => {
         beforeEach(() => {
             game.camera = mockCamera; 
         });

        it('should zoom in (decrease camera y) on scroll up', () => {
            const initialY = game.camera.position.y;
            game.onMouseWheel({ deltaY: -100, preventDefault: vi.fn() });
            expect(game.camera.position.y).toBeLessThan(initialY);
            expect(game.camera.position.y).toBeGreaterThanOrEqual(5); // Clamp check
        });

        it('should zoom out (increase camera y) on scroll down', () => {
            const initialY = game.camera.position.y;
            game.onMouseWheel({ deltaY: 100, preventDefault: vi.fn() });
            expect(game.camera.position.y).toBeGreaterThan(initialY);
            expect(game.camera.position.y).toBeLessThanOrEqual(25); // Clamp check
        });

        it('should clamp zoom in at minimum y position', () => {
            game.camera.position.y = 5; // Set to min
            game.onMouseWheel({ deltaY: -100, preventDefault: vi.fn() });
            expect(game.camera.position.y).toBe(5);
        });

        it('should clamp zoom out at maximum y position', () => {
            game.camera.position.y = 25; // Set to max
            game.onMouseWheel({ deltaY: 100, preventDefault: vi.fn() });
            expect(game.camera.position.y).toBe(25);
        });

         it('should call preventDefault', () => {
            const mockEvent = { deltaY: 100, preventDefault: vi.fn() };
            game.onMouseWheel(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
        });
    });

     describe('Key Events', () => {
         let mockKeyEventW, mockKeyEventA, mockKeyEventSpace, mockKeyEventOther;
         beforeEach(() => {
             game.gameController = new GameController(); // Weise Mock-Instanz zu
             mockKeyEventW = createMockEvent('w', 'keydown');
             mockKeyEventA = createMockEvent('a', 'keydown');
             mockKeyEventSpace = createMockEvent(' ', 'keydown');
             mockKeyEventOther = createMockEvent('x', 'keydown');
         });

         it('onKeyDown should call gameController.onKeyDown', () => {
             game.onKeyDown(mockKeyEventW);
             expect(game.gameController.onKeyDown).toHaveBeenCalledWith(mockKeyEventW);
             game.onKeyDown(mockKeyEventA);
             expect(game.gameController.onKeyDown).toHaveBeenCalledWith(mockKeyEventA);
             game.onKeyDown(mockKeyEventSpace);
             expect(game.gameController.onKeyDown).toHaveBeenCalledWith(mockKeyEventSpace);
             game.onKeyDown(mockKeyEventOther);
             expect(game.gameController.onKeyDown).toHaveBeenCalledWith(mockKeyEventOther);
         });

         it('onKeyUp should call gameController.onKeyUp', () => {
             const mockKeyUpEvent = createMockEvent('w', 'keyup');
             game.onKeyUp(mockKeyUpEvent);
             expect(game.gameController.onKeyUp).toHaveBeenCalledWith(mockKeyUpEvent);
         });
     });

}); 