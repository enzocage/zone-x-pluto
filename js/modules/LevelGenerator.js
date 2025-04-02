/**
 * Level-Generator-Modul
 * Verantwortlich für die Generierung von Spielleveln
 */

import { GRID_WIDTH, GRID_HEIGHT, WALL_RATIO } from '../config/config.js';
import { Wall } from '../entities/Wall.js';
import { Enemy } from '../entities/Enemy.js';
import { Plutonium, Barrel, CollectibleBlock } from '../entities/Item.js';

export class LevelGenerator {
    constructor(gameWorld) {
        this.gameWorld = gameWorld;
    }
    
    /**
     * Erstellt ein neues Level mit allen Elementen
     */
    generateLevel(level, walls, enemies, plutoniumItems, barrels, collectibleBlocks) {
        // Parameter basierend auf Level anpassen
        const enemyCount = Math.floor(7 * Math.pow(0.2  , level - 1));
        const wallRatio = WALL_RATIO * Math.pow(0.2, level - 1);
        
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
     * Erstellt die Außenwände des Spielfelds
     */
    createBorder(walls) {
        // Horizontale Wände (oben und unten)
        for (let x = 0; x < GRID_WIDTH; x++) {
            // Obere Wand
            walls.push(new Wall(this.gameWorld, x, 0));
            
            // Untere Wand
            walls.push(new Wall(this.gameWorld, x, GRID_HEIGHT - 1));
        }
        
        // Vertikale Wände (links und rechts)
        for (let z = 1; z < GRID_HEIGHT - 1; z++) {
            // Linke Wand
            walls.push(new Wall(this.gameWorld, 0, z));
            
            // Rechte Wand
            walls.push(new Wall(this.gameWorld, GRID_WIDTH - 1, z));
        }
    }
    
    /**
     * Generiert die inneren Wände des Spielfelds
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
                        
                        // Mit einer gewissen Wahrscheinlichkeit lange Linien bilden
                        if (Math.random() < 0.3) {
                            const direction = Math.floor(Math.random() * 4); // 0: rechts, 1: links, 2: unten, 3: oben
                            const length = Math.floor(Math.random() * 5) + 3; // 3-7 Einheiten lang
                            
                            for (let i = 1; i <= length; i++) {
                                let nx = x, nz = z;
                                
                                if (direction === 0) nx = x + i;
                                else if (direction === 1) nx = x - i;
                                else if (direction === 2) nz = z + i;
                                else if (direction === 3) nz = z - i;
                                
                                // Prüfen, ob Position gültig ist und nicht bereits belegt
                                if (nx > 0 && nx < GRID_WIDTH - 1 && 
                                    nz > 0 && nz < GRID_HEIGHT - 1 && 
                                    !this.isPositionOccupiedByWalls(nx, nz, walls)) {
                                    
                                    // Wand temporär hinzufügen und prüfen
                                    grid[nx][nz] = true;
                                    if (this.isLevelFullyAccessible(grid, startX, startZ)) {
                                        walls.push(new Wall(this.gameWorld, nx, nz));
                                    } else {
                                        // Wand wieder entfernen, wenn sie Bereiche unzugänglich macht
                                        grid[nx][nz] = false;
                                    }
                                }
                            }
                        }
                    } else {
                        // Wand wieder entfernen, wenn sie Bereiche unzugänglich macht
                        grid[x][z] = false;
                    }
                }
            }
        }
    }
    
    /**
     * Prüft, ob alle freien Felder vom Startpunkt aus erreichbar sind
     * Verwendet einen Floodfill-Algorithmus
     */
    isLevelFullyAccessible(grid, startX, startZ) {
        // Kopieren des Grids, damit wir es verändern können
        const tempGrid = grid.map(row => [...row]);
        
        // Zähle alle freien Felder im Level
        let totalFreeSpaces = 0;
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            for (let z = 1; z < GRID_HEIGHT - 1; z++) {
                if (!tempGrid[x][z]) {
                    totalFreeSpaces++;
                }
            }
        }
        
        // Führe Floodfill vom Startpunkt aus
        let stack = [{x: startX, z: startZ}];
        let visitedSpaces = 0;
        
        // Startpunkt als besucht markieren
        tempGrid[startX][startZ] = true;
        visitedSpaces++;
        
        // Richtungsvektoren für die vier Nachbarzellen
        const directions = [
            {x: 1, z: 0},  // rechts
            {x: -1, z: 0}, // links
            {x: 0, z: 1},  // unten
            {x: 0, z: -1}  // oben
        ];
        
        while (stack.length > 0) {
            const current = stack.pop();
            
            // Alle vier Nachbarn prüfen
            for (const dir of directions) {
                const nextX = current.x + dir.x;
                const nextZ = current.z + dir.z;
                
                // Innerhalb der Grenzen und noch nicht besucht oder eine Wand
                if (nextX > 0 && nextX < GRID_WIDTH - 1 && 
                    nextZ > 0 && nextZ < GRID_HEIGHT - 1 && 
                    !tempGrid[nextX][nextZ]) {
                    
                    // Als besucht markieren
                    tempGrid[nextX][nextZ] = true;
                    visitedSpaces++;
                    
                    // Zur Warteschlange hinzufügen
                    stack.push({x: nextX, z: nextZ});
                }
            }
        }
        
        // Vergleiche die Anzahl der besuchten Felder mit der Gesamtanzahl freier Felder
        return visitedSpaces === totalFreeSpaces;
    }
    
    /**
     * Prüft, ob eine Position von einem Objekt belegt ist
     */
    isPositionOccupied(x, z, player, walls, barrels, blocks) {
        // Spieler prüfen
        if (player && player.gridX === x && player.gridZ === z) {
            return true;
        }
        
        // Wände prüfen
        for (const wall of walls) {
            if (wall.gridX === x && wall.gridZ === z) {
                return true;
            }
        }
        
        // Tonnen nicht mehr prüfen, damit Spieler Tonnen betreten kann
        // for (const barrel of barrels) {
        //    if (barrel.gridX === x && barrel.gridZ === z) {
        //        return true;
        //    }
        // }
        
        // Platzierte Blocks prüfen
        for (const block of blocks) {
            if (block.gridX === x && block.gridZ === z) {
                return true;
            }
        }
        
        // Position ist frei
        return false;
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
    
    /**
     * Prüft, ob eine Position von einer Wand belegt ist
     */
    isPositionOccupiedByWalls(x, z, walls) {
        for (const wall of walls) {
            if (wall.gridX === x && wall.gridZ === z) {
                return true;
            }
        }
        return false;
    }
} 