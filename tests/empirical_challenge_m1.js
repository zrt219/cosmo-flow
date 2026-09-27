import * as THREE from 'three';
import { CosmicLabels } from '../src/renderers/CosmicLabels.js';

/**
 * EMPIRICAL CHALLENGER M1-1: STRESS TEST HARNESS
 * Target: src/renderers/CosmicLabels.js
 *
 * Verification Areas:
 * 1. 12 required structures catalog, naming, and 3D coordinates.
 * 2. High-DPI canvas sprite generation, dimensions, aspect ratios, and texture configurations.
 * 3. Batched 3D leader lines and centroid locator markers geometry and float alignment.
 * 4. Distance scaling, near/far fading, and extreme camera distance stress test (0, 0.001, 10000, NaN, negative, Infinity).
 * 5. Control methods (setVisible, setOpacity, setScale, setLeaderLinesVisible, setLeaderOpacity, dispose).
 * 6. Update signature compatibility: update(elapsed) vs update(camera, elapsed).
 */

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
    this.calls = [];
  }

  save() {
    this.calls.push({ method: 'save' });
  }

  restore() {
    this.calls.push({ method: 'restore' });
  }

  strokeText(text, x, y) {
    this.calls.push({
      method: 'strokeText',
      text,
      x,
      y,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur
    });
  }

  fillText(text, x, y) {
    this.calls.push({
      method: 'fillText',
      text,
      x,
      y,
      fillStyle: this.fillStyle
    });
  }

  measureText(text) {
    // Return realistic proportional text width based on length and font size
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

class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.style = {};
    this.children = [];
    this.parentNode = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.children.find(c => c.className === cls) || null;
    }
    return null;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }
}

function setupMockDOM() {
  const body = new MockElement('body');
  const mockDoc = {
    createElement(tag) {
      if (tag === 'canvas') return new MockCanvas();
      return new MockElement(tag);
    },
    body
  };
  globalThis.document = mockDoc;
  return { document: mockDoc, body };
}

function teardownMockDOM() {
  delete globalThis.document;
}

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, message, details = {}) {
  if (!condition) {
    results.failed++;
    results.tests.push({ status: 'FAIL', message, details });
    console.error(`❌ [FAIL] ${message}`, details);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    results.passed++;
    results.tests.push({ status: 'PASS', message });
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runEmpiricalSuite() {
  console.log('================================================================');
  console.log('EMPIRICAL CHALLENGE SUITE: Milestone M1 (CosmicLabels.js)');
  console.log('================================================================\n');

  setupMockDOM();

  const dummyCosmicField = {};
  const dummyCamera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 1000);
  dummyCamera.position.set(-12, 100, 135);
  dummyCamera.lookAt(-10, 4, -8);

  const container = document.body;
  const labelsInstance = new CosmicLabels(dummyCosmicField, dummyCamera, container);

  // --------------------------------------------------------------------------
  // TEST SUITE 1: 12 Structures Catalog & Precise Coordinates
  // --------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: 12 Structures Catalog & Astronomical Coordinates ---');

  const expectedStructures = {
    'The Great Attractor': {
      centroid: [-38, 2, -5],
      anchor: [-38, 8.5, -5],
      hasLeader: true,
      category: 'Core Hub'
    },
    'Centaurus': {
      centroid: [-34, 6, 2],
      anchor: [-34, 12.0, 2],
      hasLeader: true,
      category: 'Supercluster Hub'
    },
    'Virgo': {
      centroid: [-8, 3, 0],
      anchor: [-8, 8.5, 0],
      hasLeader: true,
      category: 'Supercluster'
    },
    'Milky Way': {
      centroid: [-10, -1, 4],
      anchor: [-10, 3.5, 4],
      hasLeader: true,
      category: 'Local Group'
    },
    'Coma': {
      centroid: [5, 45, -25],
      anchor: [5, 51.5, -25],
      hasLeader: true,
      category: 'Supercluster'
    },
    'Hydra': {
      centroid: [-24, 8, 18],
      anchor: [-24, 13.0, 18],
      hasLeader: true,
      category: 'Galaxy Cluster'
    },
    'Antlia': {
      centroid: [-18, 5, 22],
      anchor: [-18, 9.5, 22],
      hasLeader: true,
      category: 'Galaxy Cluster'
    },
    'NGC 5016 Cluster': {
      centroid: [-16, 22, -12],
      anchor: [-16, 26.5, -12],
      hasLeader: true,
      category: 'Cluster Group'
    },
    'Abell 3574': {
      centroid: [-28, 14, 12],
      anchor: [-28, 18.0, 12],
      hasLeader: true,
      category: 'Abell Cluster'
    },
    'Abell 3565': {
      centroid: [-32, 10, 16],
      anchor: [-32, 14.0, 16],
      hasLeader: true,
      category: 'Abell Cluster'
    },
    'Abell 50753': {
      centroid: [-44, 8, -18],
      anchor: [-44, 12.0, -18],
      hasLeader: true,
      category: 'Abell Cluster'
    },
    'Bulk flow toward Antlia-Centaurus': {
      centroid: [-22, -2, 14],
      anchor: [-22, -2, 14],
      hasLeader: false,
      category: 'Flow Annotation'
    }
  };

  assert(labelsInstance.labels.length === 12, 'Catalog contains exactly 12 items', {
    actualCount: labelsInstance.labels.length
  });

  const centroidsFound = new Set();
  const anchorsFound = new Set();

  for (const [name, expected] of Object.entries(expectedStructures)) {
    const item = labelsInstance.labels.find(l => l.name === name);
    assert(item !== undefined, `Structure "${name}" is present in labels array`);
    assert(
      item.centroid.x === expected.centroid[0] &&
      item.centroid.y === expected.centroid[1] &&
      item.centroid.z === expected.centroid[2],
      `Structure "${name}" centroid equals [${expected.centroid.join(', ')}]`,
      { actual: [item.centroid.x, item.centroid.y, item.centroid.z] }
    );
    assert(
      item.anchor.x === expected.anchor[0] &&
      item.anchor.y === expected.anchor[1] &&
      item.anchor.z === expected.anchor[2],
      `Structure "${name}" anchor equals [${expected.anchor.join(', ')}]`,
      { actual: [item.anchor.x, item.anchor.y, item.anchor.z] }
    );
    assert(
      item.hasLeader === expected.hasLeader,
      `Structure "${name}" hasLeader matches expected (${expected.hasLeader})`
    );

    // Collision check
    const cKey = `${item.centroid.x},${item.centroid.y},${item.centroid.z}`;
    assert(!centroidsFound.has(cKey), `Centroid ${cKey} for "${name}" is unique`);
    centroidsFound.add(cKey);

    const aKey = `${item.anchor.x},${item.anchor.y},${item.anchor.z}`;
    assert(!anchorsFound.has(aKey), `Anchor ${aKey} for "${name}" is unique`);
    anchorsFound.add(aKey);

    // Finiteness check
    assert(Number.isFinite(item.centroid.x) && Number.isFinite(item.centroid.y) && Number.isFinite(item.centroid.z), `Centroid for "${name}" has finite coordinates`);
    assert(Number.isFinite(item.anchor.x) && Number.isFinite(item.anchor.y) && Number.isFinite(item.anchor.z), `Anchor for "${name}" has finite coordinates`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: High-DPI Canvas & Sprite Generation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: High-DPI Canvas & Sprite Generation ---');

  for (const item of labelsInstance.labels) {
    assert(item.sprite instanceof THREE.Sprite, `Item "${item.name}" has an instantiated THREE.Sprite`);
    assert(item.sprite.material instanceof THREE.SpriteMaterial, `Item "${item.name}" sprite uses THREE.SpriteMaterial`);
    assert(item.sprite.material.transparent === true, `Item "${item.name}" material is transparent`);
    assert(item.sprite.material.depthTest === false, `Item "${item.name}" depthTest is false`);
    assert(item.sprite.material.depthWrite === false, `Item "${item.name}" depthWrite is false`);

    assert(item.baseW > 0 && Number.isFinite(item.baseW), `Item "${item.name}" baseW is positive and finite (${item.baseW})`);
    assert(item.baseH > 0 && Number.isFinite(item.baseH), `Item "${item.name}" baseH is positive and finite (${item.baseH})`);
    const aspect = item.baseW / item.baseH;
    assert(aspect >= 1.0 && aspect <= 15.0, `Item "${item.name}" aspect ratio is realistic (${aspect.toFixed(2)})`);

    assert(item.canvas.width > 0 && item.canvas.height > 0, `Item "${item.name}" canvas dimensions are positive (${item.canvas.width}x${item.canvas.height})`);

    // Verify canvas context calls included dark outline and fill text
    const ctx = item.canvas.getContext('2d');
    const strokeCalls = ctx.calls.filter(c => c.method === 'strokeText');
    const fillCalls = ctx.calls.filter(c => c.method === 'fillText');
    assert(strokeCalls.length >= 1, `Item "${item.name}" canvas drew contrast/glow outline`);
    assert(fillCalls.length === 1, `Item "${item.name}" canvas drew foreground text fill`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Batched 3D Leader Lines & Centroid Dots
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Batched 3D Leader Lines & Centroid Dots ---');

  assert(labelsInstance.leaderLines instanceof THREE.LineSegments, 'leaderLines is a THREE.LineSegments instance');
  assert(labelsInstance.leaderLines.parent === labelsInstance.group, 'leaderLines is attached to group');

  const lineGeo = labelsInstance.leaderLines.geometry;
  const posAttr = lineGeo.getAttribute('position');
  assert(posAttr !== undefined, 'leaderLines geometry has position attribute');

  // 11 items have hasLeader = true, each has 2 vertices of 3 floats => 66 floats
  const expectedVertexCount = 11 * 2;
  const expectedFloatCount = expectedVertexCount * 3;
  assert(posAttr.count === expectedVertexCount, `Leader line vertex count is exactly ${expectedVertexCount} (actual: ${posAttr.count})`);
  assert(posAttr.array.length === expectedFloatCount, `Leader line float count is exactly ${expectedFloatCount}`);

  // Verify leader line coordinates connect centroid directly to bottom of anchor
  const itemsWithLeader = labelsInstance.labels.filter(l => l.hasLeader);
  for (let i = 0; i < itemsWithLeader.length; i++) {
    const item = itemsWithLeader[i];
    const baseIdx = i * 6;

    const startX = posAttr.array[baseIdx];
    const startY = posAttr.array[baseIdx + 1];
    const startZ = posAttr.array[baseIdx + 2];

    const endX = posAttr.array[baseIdx + 3];
    const endY = posAttr.array[baseIdx + 4];
    const endZ = posAttr.array[baseIdx + 5];

    // Start must match centroid exactly
    assert(
      Math.abs(startX - item.centroid.x) < 1e-5 &&
      Math.abs(startY - item.centroid.y) < 1e-5 &&
      Math.abs(startZ - item.centroid.z) < 1e-5,
      `Leader segment ${i} ("${item.name}") start matches centroid [${item.centroid.x}, ${item.centroid.y}, ${item.centroid.z}]`,
      { actual: [startX, startY, startZ] }
    );

    // End must match anchor in X and Z, and lineTopY = anchor.y - (item.baseH * 0.45)
    const expectedTopY = item.anchor.y - (item.baseH * 0.45);
    assert(
      Math.abs(endX - item.anchor.x) < 1e-5 &&
      Math.abs(endZ - item.anchor.z) < 1e-5,
      `Leader segment ${i} ("${item.name}") end matches anchor X/Z [${item.anchor.x}, ${item.anchor.z}]`
    );
    assert(
      Math.abs(endY - expectedTopY) < 1e-4,
      `Leader segment ${i} ("${item.name}") end Y matches expected top connection point (${expectedTopY.toFixed(3)})`,
      { actualEndY: endY, expectedTopY }
    );
    assert(endY > startY, `Leader segment ${i} ("${item.name}") points upward (endY ${endY} > startY ${startY})`);
  }

  // Centroid locator dots check
  assert(labelsInstance.centroidDots instanceof THREE.Group, 'centroidDots is a THREE.Group');
  assert(labelsInstance.centroidDots.children.length === 11, `centroidDots contains 11 meshes (actual: ${labelsInstance.centroidDots.children.length})`);
  for (let i = 0; i < itemsWithLeader.length; i++) {
    const item = itemsWithLeader[i];
    const dot = labelsInstance.centroidDots.children[i];
    assert(
      Math.abs(dot.position.x - item.centroid.x) < 1e-5 &&
      Math.abs(dot.position.y - item.centroid.y) < 1e-5 &&
      Math.abs(dot.position.z - item.centroid.z) < 1e-5,
      `Centroid dot ${i} is positioned exactly at "${item.name}" centroid`
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Distance Scaling, Near/Far Fading & Extreme Boundary Stress
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Distance Scaling & Extreme Camera Distances ---');

  const testCamera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 1000);
  const gaItem = labelsInstance.labels.find(l => l.name === 'The Great Attractor');
  const anchor = gaItem.anchor.clone();

  // Test Case A: Extreme close-up (dist = 0, camera at anchor)
  testCamera.position.copy(anchor);
  labelsInstance.update(testCamera, 0);
  assert(Number.isFinite(gaItem.sprite.scale.x) && gaItem.sprite.scale.x > 0, 'dist=0: scale.x is finite and positive', { scaleX: gaItem.sprite.scale.x });
  assert(gaItem.sprite.material.opacity === 0, 'dist=0: opacity is exactly 0 (fully faded near camera)', { opacity: gaItem.sprite.material.opacity });

  // Test Case B: Very small distance (dist = 0.001)
  testCamera.position.set(anchor.x, anchor.y + 0.001, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(gaItem.sprite.material.opacity === 0, 'dist=0.001: opacity is 0');
  assert(gaItem.sprite.scale.x > 0, 'dist=0.001: scale is clamped to minimum 0.55');

  // Test Case C: Partial near-fade (dist = 14.0, between 6 and 22)
  // fade = (14 - 6) / 16 = 8 / 16 = 0.5
  testCamera.position.set(anchor.x, anchor.y + 14.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  const expectedFadeMid = 0.5;
  const expectedOpacityMid = labelsInstance.baseOpacity * expectedFadeMid;
  assert(
    Math.abs(gaItem.sprite.material.opacity - expectedOpacityMid) < 1e-4,
    `dist=14.0: partial near-fade opacity matches ${expectedOpacityMid}`,
    { actual: gaItem.sprite.material.opacity, expected: expectedOpacityMid }
  );

  // Test Case D: Standard viewing distance (dist = 140.0)
  testCamera.position.set(anchor.x, anchor.y + 140.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(
    Math.abs(gaItem.sprite.material.opacity - labelsInstance.baseOpacity) < 1e-4,
    `dist=140.0: full opacity (${labelsInstance.baseOpacity})`,
    { actual: gaItem.sprite.material.opacity }
  );
  assert(
    Math.abs(gaItem.sprite.scale.y - gaItem.baseH * 1.0) < 1e-4,
    `dist=140.0: scale multiplier is exactly 1.0 (baseH = ${gaItem.baseH})`,
    { actualScaleY: gaItem.sprite.scale.y }
  );

  // Test Case E: Far boundary start (dist = 280.0)
  testCamera.position.set(anchor.x, anchor.y + 280.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(
    Math.abs(gaItem.sprite.material.opacity - labelsInstance.baseOpacity) < 1e-4,
    `dist=280.0: still full opacity before far-fade`,
    { actual: gaItem.sprite.material.opacity }
  );
  assert(
    Math.abs(gaItem.sprite.scale.y - gaItem.baseH * 2.0) < 1e-4,
    `dist=280.0: scale multiplier is 2.0 (280/140)`
  );

  // Test Case F: Partial far-fade (dist = 350.0, between 280 and 420)
  // fade = (420 - 350) / 140 = 70 / 140 = 0.5
  testCamera.position.set(anchor.x, anchor.y + 350.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(
    Math.abs(gaItem.sprite.material.opacity - expectedOpacityMid) < 1e-4,
    `dist=350.0: partial far-fade opacity matches 0.5 multiplier`,
    { actual: gaItem.sprite.material.opacity }
  );
  // scale is clamped to max 2.2
  assert(
    Math.abs(gaItem.sprite.scale.y - gaItem.baseH * 2.2) < 1e-4,
    `dist=350.0: scale is clamped to max multiplier 2.2`,
    { actualScaleY: gaItem.sprite.scale.y }
  );

  // Test Case G: Far distance cutoff (dist = 420.0)
  testCamera.position.set(anchor.x, anchor.y + 420.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(gaItem.sprite.material.opacity === 0, 'dist=420.0: opacity is 0');

  // Test Case H: Extreme far distance (dist = 10000.0)
  testCamera.position.set(anchor.x, anchor.y + 10000.0, anchor.z);
  labelsInstance.update(testCamera, 0);
  assert(gaItem.sprite.material.opacity === 0, 'dist=10000.0: opacity is clamped to 0 (no negative opacity)', { opacity: gaItem.sprite.material.opacity });
  assert(
    Math.abs(gaItem.sprite.scale.y - gaItem.baseH * 2.2) < 1e-4,
    'dist=10000.0: scale remains clamped to 2.2 (no overflow)'
  );

  // Test Case I: Mock negative distance (adversarial distanceTo)
  const mockCameraNeg = {
    isCamera: true,
    position: {
      distanceTo: () => -50.0
    }
  };
  labelsInstance.update(mockCameraNeg, 0);
  assert(gaItem.sprite.material.opacity === 0, 'dist < 0: opacity clamped to 0 (no negative opacity)');
  assert(gaItem.sprite.scale.x > 0 && Number.isFinite(gaItem.sprite.scale.x), 'dist < 0: scale remains clamped to 0.55');

  // Test Case J: NaN camera position (adversarial input)
  const mockCameraNaN = {
    isCamera: true,
    position: {
      distanceTo: () => NaN
    }
  };
  let errorCaught = false;
  try {
    labelsInstance.update(mockCameraNaN, 0);
  } catch (err) {
    errorCaught = true;
  }
  assert(!errorCaught, 'update() does not throw uncaught exception when distanceTo returns NaN');

  // Test Case K: Single-argument invocation update(elapsed)
  labelsInstance.camera = testCamera;
  testCamera.position.set(-12, 100, 135);
  labelsInstance.update(5.0);
  assert(gaItem.sprite.material.opacity > 0, 'update(elapsed) successfully updates using constructor camera');

  // Test Case L: Dynamic flow pulsation on Bulk Flow Annotation
  const flowItem = labelsInstance.labels.find(l => l.name === 'Bulk flow toward Antlia-Centaurus');
  labelsInstance.update(testCamera, 0.0);
  const flowOpacity0 = flowItem.sprite.material.opacity;
  labelsInstance.update(testCamera, Math.PI / (2 * 2.2)); // peak sin = 1.0
  const flowOpacityPeak = flowItem.sprite.material.opacity;
  labelsInstance.update(testCamera, (3 * Math.PI) / (2 * 2.2)); // trough sin = -1.0
  const flowOpacityTrough = flowItem.sprite.material.opacity;

  assert(flowOpacityPeak > flowOpacityTrough, 'Bulk flow annotation modulates opacity dynamically with elapsed time', {
    flowOpacityPeak,
    flowOpacityTrough
  });
  // Check that cluster labels DO NOT modulate with elapsed time
  labelsInstance.update(testCamera, 0.0);
  const gaOpacity0 = gaItem.sprite.material.opacity;
  labelsInstance.update(testCamera, 10.0);
  const gaOpacity10 = gaItem.sprite.material.opacity;
  assert(Math.abs(gaOpacity0 - gaOpacity10) < 1e-5, 'Astronomical cluster labels have stable non-pulsating opacity');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Public API & State Transitions Stress Test
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Public API & State Transitions ---');

  // 1. setVisible
  labelsInstance.setVisible(false);
  assert(labelsInstance.visible === false && labelsInstance.group.visible === false, 'setVisible(false) sets visible = false');
  labelsInstance.setVisible(true);
  assert(labelsInstance.visible === true && labelsInstance.group.visible === true, 'setVisible(true) sets visible = true');

  // 2. setOpacity
  labelsInstance.setOpacity(0.5);
  assert(labelsInstance.baseOpacity === 0.5, 'setOpacity(0.5) sets baseOpacity to 0.5');
  assert(Math.abs(gaItem.sprite.material.opacity - 0.5) < 1e-4, 'setOpacity updates sprite material opacity immediately');

  // Opacity clamping
  labelsInstance.setOpacity(-0.5);
  assert(labelsInstance.baseOpacity === 0.0, 'setOpacity(-0.5) clamps to 0.0');
  labelsInstance.setOpacity(2.5);
  assert(labelsInstance.baseOpacity === 1.0, 'setOpacity(2.5) clamps to 1.0');
  labelsInstance.setOpacity(0.95);

  // 3. setScale
  labelsInstance.setScale(2.0);
  assert(labelsInstance.userScale === 2.0, 'setScale(2.0) sets userScale to 2.0');
  // Scale clamping
  labelsInstance.setScale(0.01);
  assert(labelsInstance.userScale === 0.2, 'setScale(0.01) clamps to min 0.2');
  labelsInstance.setScale(100.0);
  assert(labelsInstance.userScale === 4.0, 'setScale(100.0) clamps to max 4.0');
  labelsInstance.setScale(1.0);

  // 4. setLeaderLinesVisible
  labelsInstance.setLeaderLinesVisible(false);
  assert(labelsInstance.leaderLines.visible === false, 'setLeaderLinesVisible(false) sets leaderLines.visible = false');
  assert(labelsInstance.centroidDots.visible === false, 'setLeaderLinesVisible(false) sets centroidDots.visible = false');
  labelsInstance.setLeaderLinesVisible(true);
  assert(labelsInstance.leaderLines.visible === true, 'setLeaderLinesVisible(true) restores leaderLines.visible = true');
  assert(labelsInstance.centroidDots.visible === true, 'setLeaderLinesVisible(true) restores centroidDots.visible = true');

  // 5. setLeaderOpacity
  labelsInstance.setLeaderOpacity(0.3);
  assert(labelsInstance.leaderMaterial.opacity === 0.3, 'setLeaderOpacity(0.3) sets leaderMaterial.opacity to 0.3');
  labelsInstance.setLeaderOpacity(-1.0);
  assert(labelsInstance.leaderMaterial.opacity === 0.0, 'setLeaderOpacity(-1.0) clamps to 0.0');
  labelsInstance.setLeaderOpacity(5.0);
  assert(labelsInstance.leaderMaterial.opacity === 1.0, 'setLeaderOpacity(5.0) clamps to 1.0');

  // 6. dispose
  let disposeError = false;
  try {
    labelsInstance.dispose();
  } catch (err) {
    disposeError = true;
    console.error('dispose threw error:', err);
  }
  assert(!disposeError, 'dispose() cleans up GPU resources without error');

  // --------------------------------------------------------------------------
  // TEST SUITE 6: Headless / SSR Fallback (No DOM)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Headless / SSR Fallback (document undefined) ---');
  teardownMockDOM();

  let headlessInstance = null;
  let headlessError = null;
  try {
    headlessInstance = new CosmicLabels(dummyCosmicField, dummyCamera, null);
  } catch (err) {
    headlessError = err;
  }
  assert(headlessError === null, 'CosmicLabels initializes without error when document is undefined');
  assert(headlessInstance.labels.length === 12, 'Headless instance creates all 12 label items');
  assert(headlessInstance.leaderLines instanceof THREE.LineSegments, 'Headless instance creates leader lines');

  console.log('\n================================================================');
  console.log(`EMPRICIAL TEST SUITE COMPLETED: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('================================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runEmpiricalSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
