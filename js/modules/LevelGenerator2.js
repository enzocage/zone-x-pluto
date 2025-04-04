/**
 * Level-Generator-2-Modul
 * Alternative Implementierung für die Generierung von Spielleveln
 * Diese Klasse ist ein Platzhalter für zukünftige Entwicklungen
 */

import { GRID_WIDTH, GRID_HEIGHT, WALL_RATIO } from '../config/config.js';
import { Wall } from '../entities/Wall.js';
import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock } from '../entities/Item.js';

export class LevelGenerator2 {
    /**
     * Erstellt einen neuen Level-Generator 2
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der die Level-Objekte platziert werden
     */
    constructor(gameWorld) {
        this.gameWorld = gameWorld;
    }
    
    /**
     * Erstellt ein neues Level mit allen Elementen
     * Diese Methode bietet die gleiche Schnittstelle wie der erste Level-Generator,
     * kann aber in Zukunft mit einer anderen Implementierung versehen werden.
     * 
     * @param {number} level - Die Levelnummer, beeinflusst die Schwierigkeit
     * @param {Array} walls - Array zum Speichern der generierten Wände
     * @param {Array} enemies - Array zum Speichern der generierten Gegner
     * @param {Array} plutoniumItems - Array zum Speichern der generierten Plutonium-Items
     * @param {Array} barrels - Array zum Speichern der generierten Tonnen
     * @param {Array} collectibleBlocks - Array zum Speichern der generierten sammelbaren Blöcke
     */
    generateLevel(level, walls, enemies, plutoniumItems, barrels, collectibleBlocks) {
        // In dieser Version wird einfach der erste Level-Generator verwendet
        // Eine Nachricht zur Verdeutlichung wird in der Konsole ausgegeben
        console.log("Level-Generator 2 ist nur ein Platzhalter und verwendet aktuell die gleiche Logik wie Level-Generator 1");
        
        // Parameter basierend auf Level anpassen
        // Auch für Level 1 eine angemessene Anzahl von Gegnern und Wanddichte garantieren
        const enemyCount = level === 1 ? 15 : Math.floor(7 * Math.pow(2.2, level - 1));
        const wallRatio = level === 1 ? WALL_RATIO : WALL_RATIO * Math.pow(0.2, level - 1);
        
        // Spielfeld umranden mit Wänden
        this.createBorder(walls);
        
        // Innere Wände generieren
        this.generateWalls(wallRatio, walls);
        
        // Objekte platzieren
        this.createEnemies(enemyCount, enemies, walls);
        this.createPlutonium(5, plutoniumItems, walls);
        this.createBarrels(3, barrels, walls);
        this.createCollectibleBlocks(10 + Math.floor(Math.random() * 6), collectibleBlocks, walls);
    }
    
    /**
     * Erstellt eine Begrenzung um das Spielfeld
     * Eine Wand wird um das gesamte Spielfeld herum platziert
     * @param {Array} walls - Array zum Speichern der generierten Wände
     */
    createBorder(walls) {
        // Obere und untere Grenzen
        for (let x = 0; x < GRID_WIDTH; x++) {
            walls.push(new Wall(this.gameWorld, x, 0));
            walls.push(new Wall(this.gameWorld, x, GRID_HEIGHT - 1));
        }
        
        // Linke und rechte Grenzen
        for (let z = 1; z < GRID_HEIGHT - 1; z++) {
            walls.push(new Wall(this.gameWorld, 0, z));
            walls.push(new Wall(this.gameWorld, GRID_WIDTH - 1, z));
        }
    }
    
    /**
     * Prüft, ob eine Position von einer Wand belegt ist
     * @param {number} x - X-Koordinate
     * @param {number} z - Z-Koordinate
     * @param {Array} walls - Array mit allen Wänden
     * @returns {boolean} - true, wenn die Position von einer Wand belegt ist
     */
    isPositionOccupiedByWalls(x, z, walls) {
        return walls.some(wall => wall.gridX === x && wall.gridZ === z);
    }
    
    /**
     * Prüft, ob das Level vollständig zugänglich ist
     * Verwendet einen Floodfill-Algorithmus, um sicherzustellen, dass alle Bereiche erreichbar sind
     * @param {Array} grid - Zweidimensionales Array, das den Zustand des Spielfelds darstellt
     * @param {number} startX - X-Koordinate des Startpunkts
     * @param {number} startZ - Z-Koordinate des Startpunkts
     * @returns {boolean} - true, wenn alle Bereiche erreichbar sind
     */
    isLevelFullyAccessible(grid, startX, startZ) {
        // Erreichbarkeits-Grid erstellen
        let accessGrid = Array(GRID_WIDTH).fill().map(() => Array(GRID_HEIGHT).fill(false));
        
        // Floodfill-Algorithmus
        let queue = [{x: startX, z: startZ}];
        accessGrid[startX][startZ] = true;
        
        while (queue.length > 0) {
            let {x, z} = queue.shift();
            
            // Alle vier Nachbarn prüfen
            let neighbors = [
                {x: x+1, z},
                {x: x-1, z},
                {x, z: z+1},
                {x, z: z-1}
            ];
            
            for (let neighbor of neighbors) {
                if (neighbor.x > 0 && neighbor.x < GRID_WIDTH - 1 &&
                    neighbor.z > 0 && neighbor.z < GRID_HEIGHT - 1 &&
                    !grid[neighbor.x][neighbor.z] &&
                    !accessGrid[neighbor.x][neighbor.z]) {
                    
                    accessGrid[neighbor.x][neighbor.z] = true;
                    queue.push(neighbor);
                }
            }
        }
        
        // Prüfen, ob alle freien Zellen erreichbar sind
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            for (let z = 1; z < GRID_HEIGHT - 1; z++) {
                if (!grid[x][z] && !accessGrid[x][z]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Generiert die inneren Wände des Spielfelds
     * Erstellt Hindernisse und Labyrinthe im Spielfeld
     * Stellt sicher, dass alle Bereiche des Spielfelds erreichbar bleiben
     * @param {number} ratio - Die Wahrscheinlichkeit für Wandplatzierung (0-1)
     * @param {Array} walls - Array zum Speichern der generierten Wände
     */
    generateWalls(ratio, walls) {
        // Zweidimensionales Array zur Darstellung des Spielfelds
        let grid = Array(GRID_WIDTH).fill().map(() => Array(GRID_HEIGHT).fill(false));
        
        // Bestehende Wände in das Raster eintragen
        for (const wall of walls) {
            grid[wall.gridX][wall.gridZ] = true;
        }
        
        // Spieler-Startpunkt markieren
        const startX = 2;
        const startZ = 2;
        
        for (let x = 2; x < GRID_WIDTH - 2; x++) {
            for (let z = 2; z < GRID_HEIGHT - 2; z++) {
                // Prüfen, ob die Position bereits von einer Wand belegt ist
                if (!this.isPositionOccupiedByWalls(x, z, walls) && 
                    Math.random() < ratio && 
                    // Keine Wand am Spieler-Startpunkt
                    !(x === startX && z === startZ)) {
                    
                    // Wand temporär hinzufügen
                    grid[x][z] = true;
                    
                    // Prüfen, ob noch alle Bereiche erreichbar sind
                    if (this.isLevelFullyAccessible(grid, startX, startZ)) {
                        walls.push(new Wall(this.gameWorld, x, z));
                    } else {
                        // Wand wieder entfernen, wenn sie Bereiche unzugänglich macht
                        grid[x][z] = false;
                    }
                }
            }
        }
    }
    
    /**
     * Erstellt die Gegner im Spielfeld
     */
    createEnemies(count, enemies, walls) {
        for (let i = 0; i < count; i++) {
            let x, z;
            let validPosition = false;
            
            // Gültige Position finden (nicht auf Wänden oder anderen Objekten)
            while (!validPosition) {
                x = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
                z = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
                
                validPosition = !this.isPositionOccupiedByWalls(x, z, walls);
            }
            
            enemies.push(new Enemy(this.gameWorld, x, z));
        }
    }
    
    /**
     * Erstellt Plutonium-Items im Spielfeld
     */
    createPlutonium(count, plutoniumItems, walls) {
        for (let i = 0; i < count; i++) {
            let x, z;
            let validPosition = false;
            
            while (!validPosition) {
                x = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
                z = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
                
                validPosition = !this.isPositionOccupiedByWalls(x, z, walls);
            }
            
            plutoniumItems.push(new Plutonium(this.gameWorld, x, z));
        }
    }
    
    /**
     * Erstellt Tonnen im Spielfeld
     */
    createBarrels(count, barrels, walls) {
        for (let i = 0; i < count; i++) {
            let x, z;
            let validPosition = false;
            
            while (!validPosition) {
                x = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
                z = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
                
                validPosition = !this.isPositionOccupiedByWalls(x, z, walls);
            }
            
            barrels.push(new Barrel(this.gameWorld, x, z));
        }
    }
    
    /**
     * Erstellt sammelbare Blöcke im Spielfeld
     */
    createCollectibleBlocks(count, collectibleBlocks, walls) {
        for (let i = 0; i < count; i++) {
            let x, z;
            let validPosition = false;
            
            while (!validPosition) {
                x = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
                z = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
                
                validPosition = !this.isPositionOccupiedByWalls(x, z, walls);
            }
            
            collectibleBlocks.push(new CollectibleBlock(this.gameWorld, x, z));
        }
    }
} 