/**
 * Level-Generator-2-Modul
 * Dynamische Generierung von Spielleveln basierend auf aufsteigender Schwierigkeit
 * Erstellt Levels mit unterschiedlichen Größen und Komplexitätsgraden
 */

import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock } from '../entities/Item.js';
import { Wall } from '../entities/Wall.js';

export class LevelGenerator2 {
    /**
     * Erstellt einen neuen Level-Generator 2
     * @param {Object} gameWorld - Die Spielwelt-Gruppe, in der die Level-Objekte platziert werden
     */
    constructor(gameWorld) {
        this.gameWorld = gameWorld;
        this.maxLevels = 25;
        this.baseGridWidth = 16;
        this.baseGridHeight = 9;
    }
    
    /**
     * Berechnet die Spielfeldgröße für das aktuelle Level
     * @param {number} level - Die aktuelle Levelnummer
     * @returns {Object} - Ein Objekt mit gridWidth und gridHeight Eigenschaften
     */
    calculateGridSize(level) {
        // Beginnt mit 16x9 und erhöht sich mit jedem Level um 10%
        const scaleFactor = 1 + (level - 1) * 0.1;
        const gridWidth = Math.round(this.baseGridWidth * scaleFactor);
        const gridHeight = Math.round(this.baseGridHeight * scaleFactor);
        
        return { gridWidth, gridHeight };
    }
    
    /**
     * Erstellt ein neues Level mit allen Elementen
     * @param {number} level - Die Levelnummer, beeinflusst die Schwierigkeit
     * @param {Array} walls - Array zum Speichern der generierten Wände
     * @param {Array} enemies - Array zum Speichern der generierten Gegner
     * @param {Array} plutoniumItems - Array zum Speichern der generierten Plutonium-Items
     * @param {Array} barrels - Array zum Speichern der generierten Tonnen
     * @param {Array} collectibleBlocks - Array zum Speichern der generierten sammelbaren Blöcke
     */
    generateLevel(level, walls, enemies, plutoniumItems, barrels, collectibleBlocks) {
        console.log(`Erzeuge Level ${level} mit LevelGenerator2`);
        
        // Spielfeldgröße für das aktuelle Level berechnen
        const { gridWidth, gridHeight } = this.calculateGridSize(level);
        console.log(`Spielfeldgröße: ${gridWidth}x${gridHeight}`);
        
        // Grid erstellen und mit false initialisieren (false = kein Wandelement)
        const grid = Array(gridWidth).fill().map(() => Array(gridHeight).fill(false));
        
        // Spielfeldbegrenzung erstellen
        this.createBorder(gridWidth, gridHeight, walls, grid);
        
        // Anzahl der internen Wandelemente berechnen
        const gridSize = gridWidth * gridHeight;
        const wallCount = Math.round(gridSize / (25 / level));
        console.log(`Anzahl der internen Wandelemente: ${wallCount}`);
        
        // Wandelemente erstellen
        this.generateWalls(gridWidth, gridHeight, wallCount, walls, grid);
        
        // Startposition (wird nicht als eigenes Element gesetzt, nur für Berechnung)
        const startX = 1;
        const startZ = 1;
        
        // Spielelemente erstellen
        
        // Gegner
        const enemyCount = Math.round(5 * Math.pow(1.2, level - 1));
        this.createEnemies(gridWidth, gridHeight, enemyCount, enemies, grid);
        
        // Plutonium
        const plutoniumCount = Math.round(5 * Math.pow(1.15, level - 1));
        this.createPlutonium(gridWidth, gridHeight, plutoniumCount, plutoniumItems, grid);
        
        // Sammelbare Blöcke (Mats)
        const matsCount = Math.round(5 * Math.pow(1.2, level - 1));
        this.createCollectibleBlocks(gridWidth, gridHeight, matsCount, collectibleBlocks, grid);
        
        // Tonnen - konstant 5
        this.createBarrels(gridWidth, gridHeight, 5, barrels, grid);
    }
    
    /**
     * Erstellt eine Begrenzung um das Spielfeld
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {Array} walls - Array zum Speichern der generierten Wände
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    createBorder(gridWidth, gridHeight, walls, grid) {
        // Obere und untere Grenzen
        for (let x = 0; x < gridWidth; x++) {
            walls.push(new Wall(this.gameWorld, x, 0));
            walls.push(new Wall(this.gameWorld, x, gridHeight - 1));
            grid[x][0] = true;
            grid[x][gridHeight - 1] = true;
        }
        
        // Linke und rechte Grenzen
        for (let z = 1; z < gridHeight - 1; z++) {
            walls.push(new Wall(this.gameWorld, 0, z));
            walls.push(new Wall(this.gameWorld, gridWidth - 1, z));
            grid[0][z] = true;
            grid[gridWidth - 1][z] = true;
        }
    }
    
    /**
     * Generiert die inneren Wände des Spielfelds
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {number} wallCount - Anzahl der zu erzeugenden Wände
     * @param {Array} walls - Array zum Speichern der generierten Wände
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    generateWalls(gridWidth, gridHeight, wallCount, walls, grid) {
        // 20% der Wände zufällig platzieren
        const randomWallCount = Math.floor(wallCount * 0.2);
        let placedRandomWalls = 0;
        
        while (placedRandomWalls < randomWallCount) {
            const x = Math.floor(Math.random() * (gridWidth - 2)) + 1;
            const z = Math.floor(Math.random() * (gridHeight - 2)) + 1;
            
            // Prüfen, ob Position frei ist
            if (!grid[x][z]) {
                walls.push(new Wall(this.gameWorld, x, z));
                grid[x][z] = true;
                placedRandomWalls++;
            }
        }
        
        // 80% der Wände angrenzend an vorhandene Wände platzieren
        let remainingWalls = wallCount - randomWallCount;
        let iterationCount = 0;
        const maxIterations = 1000; // Sicherheits-Abbruchbedingung
        
        while (remainingWalls > 0 && iterationCount < maxIterations) {
            iterationCount++;
            
            // Finde alle vorhandenen nicht-Rand-Wände
            const internalWalls = [];
            for (let x = 1; x < gridWidth - 1; x++) {
                for (let z = 1; z < gridHeight - 1; z++) {
                    if (grid[x][z]) {
                        internalWalls.push({ x, z });
                    }
                }
            }
            
            if (internalWalls.length === 0) {
                break; // Keine internen Wände gefunden
            }
            
            // Wähle zufällig eine Wand aus
            const randomWall = internalWalls[Math.floor(Math.random() * internalWalls.length)];
            
            // Finde alle freien angrenzenden Positionen
            const adjacentPositions = [
                { x: randomWall.x + 1, z: randomWall.z },
                { x: randomWall.x - 1, z: randomWall.z },
                { x: randomWall.x, z: randomWall.z + 1 },
                { x: randomWall.x, z: randomWall.z - 1 }
            ];
            
            // Filtere gültige Positionen
            const validPositions = adjacentPositions.filter(pos => {
                // Position im Grid
                if (pos.x <= 0 || pos.x >= gridWidth - 1 || pos.z <= 0 || pos.z >= gridHeight - 1) {
                    return false;
                }
                
                // Position bereits belegt
                if (grid[pos.x][pos.z]) {
                    return false;
                }
                
                // Prüfen, wie viele Wandelemente angrenzend sind
                const neighborCount = this.countAdjacentWalls(pos.x, pos.z, grid);
                if (neighborCount > 4) {
                    return false;
                }
                
                // Prüfen, ob das Level nach Platzierung noch vollständig zugänglich wäre
                const tempGrid = JSON.parse(JSON.stringify(grid));
                tempGrid[pos.x][pos.z] = true;
                
                return this.isLevelFullyAccessible(tempGrid, 1, 1, gridWidth, gridHeight);
            });
            
            // Wenn gültige Positionen gefunden wurden, eine auswählen und Wand platzieren
            if (validPositions.length > 0) {
                const newWallPos = validPositions[Math.floor(Math.random() * validPositions.length)];
                walls.push(new Wall(this.gameWorld, newWallPos.x, newWallPos.z));
                grid[newWallPos.x][newWallPos.z] = true;
                remainingWalls--;
            } else {
                // Wenn keine gültige Position gefunden wurde, einen Versuch überspringen
                if (iterationCount % 10 === 0) {
                    remainingWalls--;
                }
            }
        }
    }
    
    /**
     * Zählt angrenzende Wandelemente
     * @param {number} x - X-Koordinate
     * @param {number} z - Z-Koordinate
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     * @returns {number} - Anzahl angrenzender Wandelemente
     */
    countAdjacentWalls(x, z, grid) {
        let count = 0;
        
        // Alle 8 möglichen Nachbarpositionen überprüfen
        const neighbors = [
            { x: x+1, z: z },   // rechts
            { x: x-1, z: z },   // links
            { x: x, z: z+1 },   // unten
            { x: x, z: z-1 },   // oben
            { x: x+1, z: z+1 }, // rechts unten
            { x: x+1, z: z-1 }, // rechts oben
            { x: x-1, z: z+1 }, // links unten
            { x: x-1, z: z-1 }  // links oben
        ];
        
        for (const neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.x < grid.length && 
                neighbor.z >= 0 && neighbor.z < grid[0].length && 
                grid[neighbor.x][neighbor.z]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Prüft, ob das Level vollständig zugänglich ist
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     * @param {number} startX - X-Koordinate des Startpunkts
     * @param {number} startZ - Z-Koordinate des Startpunkts
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @returns {boolean} - true, wenn alle Bereiche erreichbar sind
     */
    isLevelFullyAccessible(grid, startX, startZ, gridWidth, gridHeight) {
        // Erreichbarkeits-Grid erstellen
        let accessGrid = Array(gridWidth).fill().map(() => Array(gridHeight).fill(false));
        
        // Floodfill-Algorithmus
        let queue = [{x: startX, z: startZ}];
        accessGrid[startX][startZ] = true;
        
        while (queue.length > 0) {
            let {x, z} = queue.shift();
            
            // Alle vier Nachbarn prüfen (nur horizontal und vertikal)
            let neighbors = [
                {x: x+1, z},
                {x: x-1, z},
                {x, z: z+1},
                {x, z: z-1}
            ];
            
            for (let neighbor of neighbors) {
                if (neighbor.x > 0 && neighbor.x < gridWidth - 1 &&
                    neighbor.z > 0 && neighbor.z < gridHeight - 1 &&
                    !grid[neighbor.x][neighbor.z] &&
                    !accessGrid[neighbor.x][neighbor.z]) {
                    
                    accessGrid[neighbor.x][neighbor.z] = true;
                    queue.push(neighbor);
                }
            }
        }
        
        // Prüfen, ob alle freien Zellen erreichbar sind
        for (let x = 1; x < gridWidth - 1; x++) {
            for (let z = 1; z < gridHeight - 1; z++) {
                if (!grid[x][z] && !accessGrid[x][z]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Erstellt die Gegner im Spielfeld
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {number} count - Anzahl zu erstellender Gegner
     * @param {Array} enemies - Array zum Speichern der generierten Gegner
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    createEnemies(gridWidth, gridHeight, count, enemies, grid) {
        for (let i = 0; i < count; i++) {
            this.placeEntityRandomly(gridWidth, gridHeight, grid, (x, z) => {
                enemies.push(new Enemy(this.gameWorld, x, z));
            });
        }
    }
    
    /**
     * Erstellt Plutonium-Items im Spielfeld
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {number} count - Anzahl zu erstellender Plutonium-Items
     * @param {Array} plutoniumItems - Array zum Speichern der generierten Plutonium-Items
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    createPlutonium(gridWidth, gridHeight, count, plutoniumItems, grid) {
        for (let i = 0; i < count; i++) {
            this.placeEntityRandomly(gridWidth, gridHeight, grid, (x, z) => {
                plutoniumItems.push(new Plutonium(this.gameWorld, x, z));
            });
        }
    }
    
    /**
     * Erstellt Tonnen im Spielfeld
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {number} count - Anzahl zu erstellender Tonnen
     * @param {Array} barrels - Array zum Speichern der generierten Tonnen
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    createBarrels(gridWidth, gridHeight, count, barrels, grid) {
        for (let i = 0; i < count; i++) {
            this.placeEntityRandomly(gridWidth, gridHeight, grid, (x, z) => {
                barrels.push(new Barrel(this.gameWorld, x, z));
            });
        }
    }
    
    /**
     * Erstellt sammelbare Blöcke im Spielfeld
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {number} count - Anzahl zu erstellender sammelbarer Blöcke
     * @param {Array} collectibleBlocks - Array zum Speichern der generierten sammelbaren Blöcke
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     */
    createCollectibleBlocks(gridWidth, gridHeight, count, collectibleBlocks, grid) {
        for (let i = 0; i < count; i++) {
            this.placeEntityRandomly(gridWidth, gridHeight, grid, (x, z) => {
                collectibleBlocks.push(new CollectibleBlock(this.gameWorld, x, z));
            });
        }
    }
    
    /**
     * Platziert eine Entität an einer zufälligen freien Position
     * @param {number} gridWidth - Breite des Spielfelds
     * @param {number} gridHeight - Höhe des Spielfelds
     * @param {Array} grid - Zweidimensionales Array zur Darstellung des Spielfelds
     * @param {Function} createEntity - Callback-Funktion zum Erstellen der Entität
     */
    placeEntityRandomly(gridWidth, gridHeight, grid, createEntity) {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * (gridWidth - 2)) + 1;
            const z = Math.floor(Math.random() * (gridHeight - 2)) + 1;
            
            // Prüfen, ob Position frei ist
            if (!grid[x][z]) {
                createEntity(x, z);
                // Markiert die Zelle als belegt (nicht für Wände, aber für Entities)
                // Für die Platzierung weiterer Elemente
                grid[x][z] = 'entity';
                return;
            }
            
            attempts++;
        }
        
        console.warn("Konnte keine freie Position für eine Entität finden");
    }
} 