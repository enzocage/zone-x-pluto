/**
 * Spielkonfiguration
 * Enthält alle Konstanten und Konfigurationswerte für das Spiel
 */

// Spielfeld-Konfiguration
export const GRID_WIDTH = 30;
export const GRID_HEIGHT = 30;
export const CELL_SIZE = 1;

// Spieler-Konfiguration
export const PLAYER_START_LIVES = 5;
export const PLAYER_START_BLOCKS = 15;
export const PLAYER_START_POSITION = { x: 15, z: 15 };
export const PLAYER_MOVE_SPEED = 0.13;

// Gegner-Konfiguration
export const INITIAL_ENEMIES = 0;
export const ENEMY_MIN_SPEED = 0.03;
export const ENEMY_SPEED_VARIATION = 0.06;
export const ENEMY_COLLISION_THRESHOLD = 0.8; // Kollisionsbereich für Gegner (als Anteil von CELL_SIZE)

// Level-Konfiguration
export const WALL_RATIO = 0.1; // 1:4 Wände zu freien Feldern
export const WALL_COLOR = 0x888888;
export const WALL_OPACITY = 0.5;

// Item-Konfiguration
export const PLUTONIUM_COUNT = 5;
export const PLUTONIUM_TIMER = 20; // Sekunden
export const PLUTONIUM_COLOR = 0x00ffff;
export const BARREL_COUNT = 3;
export const BARREL_COLOR = 0xffaa00;

// UI-Konfiguration
export const UI_UPDATE_INTERVAL = 1000; // ms 

// Audio-Konfiguration
export const AUDIO_ENABLED = true;
export const AUDIO_VOLUME_MASTER = 0.8;
export const AUDIO_VOLUME_SFX = 0.7;
export const AUDIO_VOLUME_MUSIC = 0.5; 