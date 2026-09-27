import * as THREE from 'three';
import { CosmicLabels } from '../src/renderers/CosmicLabels.js';

class MockCanvasContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.font = '';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.lineJoin = 'miter';
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
  }
  save() {}
  restore() {}
  strokeText() {}
  fillText() {}
  measureText(text) {
    const match = this.font ? this.font.match(/(\d+)px/) : null;
    const px = match ? parseInt(match[1], 10) : 28;
    return {
      width: text.length * (px * 0.58),
      actualBoundingBoxAscent: px * 0.8,
      actualBoundingBoxDescent: px * 0.2
    };
  }
}

class MockCanvas {
  constructor() {
    this.width = 300;
    this.height = 150;
    this._ctx = new MockCanvasContext(this);
  }
  getContext(type) {
    if (type === '2d') return this._ctx;
    return null;
  }
}

globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') return new MockCanvas();
    return {
      tagName: tag.toUpperCase(),
      style: {},
      children: [],
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) {
        const i = this.children.indexOf(c);
        if (i !== -1) this.children.splice(i, 1);
        return c;
      },
      querySelector() { return null; },
      remove() {}
    };
  },
  body: {
    appendChild() {},
    removeChild() {},
    querySelector() { return null; }
  }
};

console.log('--- RUNNING HIGH-INTENSITY ADVERSARIAL STRESS HARNESS ---');

const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 1000);
camera.position.set(-12, 100, 135);

const cosmicLabels = new CosmicLabels({}, camera, document.body);

// 1. Rapid 10,000-frame animation loop simulation
console.log('Testing 10,000 rapid animation frames...');
const t0 = performance.now();
for (let frame = 0; frame < 10000; frame++) {
  const elapsed = frame * 0.016;
  // Move camera along an orbital path
  camera.position.set(
    -12 + Math.cos(elapsed) * 50,
    100 + Math.sin(elapsed * 0.5) * 20,
    135 + Math.sin(elapsed) * 50
  );
  cosmicLabels.update(elapsed);
}
const elapsedMs = performance.now() - t0;
console.log(`10,000 update() frames completed in ${elapsedMs.toFixed(2)} ms (${(10000 / (elapsedMs / 1000)).toFixed(0)} updates/sec)`);

// 2. Fuzzing update() with malicious / chaotic arguments
console.log('Fuzzing update() with corrupted & adversarial inputs...');
const adversarialInputs = [
  null,
  undefined,
  NaN,
  Infinity,
  -Infinity,
  'string',
  {},
  [],
  { isCamera: false },
  { isCamera: true, position: { distanceTo: () => NaN } },
  { isCamera: true, position: { distanceTo: () => -Infinity } },
  { isCamera: true, position: { distanceTo: () => Infinity } },
  { isCamera: true, position: { distanceTo: () => 0 } },
  { isCamera: true, position: { distanceTo: () => 1e9 } }
];

let fuzzFailures = 0;
for (const input of adversarialInputs) {
  try {
    cosmicLabels.update(input, NaN);
  } catch (err) {
    console.error(`Fuzz crash with input:`, input, err);
    fuzzFailures++;
  }
}
if (fuzzFailures === 0) {
  console.log(`✅ Fuzzing passed: 0 unhandled exceptions across all ${adversarialInputs.length} adversarial inputs.`);
} else {
  console.error(`❌ Fuzzing failed with ${fuzzFailures} crashes.`);
  process.exit(1);
}

// 3. Fuzzing control methods
console.log('Fuzzing control methods with out-of-range inputs...');
const controlInputs = [
  -Infinity,
  Infinity,
  NaN,
  null,
  undefined,
  'not a number',
  -9999,
  9999,
  0,
  1
];

for (const val of controlInputs) {
  cosmicLabels.setOpacity(val);
  cosmicLabels.setScale(val);
  cosmicLabels.setLeaderOpacity(val);
  cosmicLabels.setVisible(val);
  cosmicLabels.setLeaderLinesVisible(val);
}
console.log('✅ Control methods survived extreme inputs without crashing.');

// 4. Memory / Disposal check
console.log('Testing dispose() and post-disposal robustness...');
cosmicLabels.dispose();
// Re-calling update() after disposal should not throw
try {
  cosmicLabels.update(1.0);
  console.log('✅ update() after dispose() did not throw.');
} catch (err) {
  console.error('❌ update() after dispose() threw:', err);
  process.exit(1);
}

console.log('All adversarial stress tests PASSED successfully!');
