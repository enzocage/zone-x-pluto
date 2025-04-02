// Setup-Datei für Tests
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// DOM-Testing-Bibliothek-Matchers erweitern
expect.extend(matchers);

// Automatisches Cleanup nach jedem Test
afterEach(() => {
  cleanup();
});

// Three.js global machen, damit Module funktionieren
global.THREE = {
  BoxGeometry: class BoxGeometry {},
  SphereGeometry: class SphereGeometry {},
  CylinderGeometry: class CylinderGeometry {},
  MeshLambertMaterial: class MeshLambertMaterial {},
  Mesh: class Mesh {
    constructor() {
      this.position = { set: () => {} };
      this.add = () => {};
    }
  },
  PointLight: class PointLight {
    constructor() {
      this.position = { set: () => {} };
    }
  },
  Group: class Group {
    constructor() {
      this.position = { x: 0, z: 0 };
      this.add = () => {};
      this.remove = () => {};
    }
  }
}; 