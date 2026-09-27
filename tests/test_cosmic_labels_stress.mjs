import * as THREE from 'three';
import { CosmicLabels } from '../src/renderers/CosmicLabels.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  } else {
    passed++;
    console.log(`  PASS: ${message}`);
  }
}

function suite(name, fn) {
  console.log(`\n========================================`);
  console.log(`SUITE: ${name}`);
  console.log(`========================================`);
  try {
    fn();
  } catch (err) {
    failed++;
    failures.push(`Suite "${name}" threw exception: ${err.message}\n${err.stack}`);
    console.error(`  EXCEPTION: ${err.message}\n${err.stack}`);
  }
}

// ---------------------------------------------------------------------------
// SUITE 1: Constructor boundaries & initial state (Headless / Node mode)
// ---------------------------------------------------------------------------
suite('Suite 1: Constructor boundaries & initial state', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  camera.position.set(-10, 105, 125);

  // Test 1.1: Standard initialization
  const cl = new CosmicLabels({}, camera, null);
  assert(cl.group instanceof THREE.Group, 'cl.group is THREE.Group');
  assert(cl.group.name === 'CosmicLabelsGroup', 'cl.group.name matches');
  assert(cl.visible === true, 'cl.visible is initially true');
  assert(cl.group.visible === true, 'cl.group.visible is initially true');
  assert(cl.labels.length === 12, '12 authentic labels initialized');
  assert(cl.markers.length === 12, '12 markers initialized');
  assert(cl.leaderLines instanceof THREE.LineSegments, 'leaderLines is THREE.LineSegments');
  assert(cl.centroidDots instanceof THREE.Group, 'centroidDots is THREE.Group');
  assert(cl.centroidDots.children.length === 11, '11 centroid dots for structures with leaders');

  // Test 1.2: Null / undefined arguments to constructor
  let clNull = null;
  try {
    clNull = new CosmicLabels(null, null, null);
    assert(true, 'new CosmicLabels(null, null, null) executes without throwing');
  } catch (e) {
    assert(false, `new CosmicLabels(null, null, null) threw: ${e.message}`);
  }
  if (clNull) {
    assert(clNull.labels.length === 12, 'Null-param instance still initializes labels');
  }
});

// ---------------------------------------------------------------------------
// SUITE 2: update() signature variations & edge cases
// ---------------------------------------------------------------------------
suite('Suite 2: update() signatures (update(camera, elapsed) vs legacy update(elapsed))', () => {
  const cameraA = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  cameraA.position.set(-10, 105, 125);

  const cl = new CosmicLabels({}, cameraA, null);

  // Test 2.1: Legacy signature update(elapsed) using constructor camera
  let threwLegacy = false;
  try {
    cl.update(1.25);
  } catch (e) {
    threwLegacy = true;
    console.error(e);
  }
  assert(!threwLegacy, 'cl.update(1.25) executes cleanly');

  // Verify scale and opacity got computed
  const ga = cl.labels.find(l => l.name === 'The Great Attractor');
  assert(ga.sprite.scale.x > 0 && ga.sprite.scale.y > 0, 'GA sprite scale updated');
  assert(ga.sprite.material.opacity > 0 && ga.sprite.material.opacity <= 1.0, 'GA sprite opacity in [0, 1]');

  // Test 2.2: New signature update(camera, elapsed)
  const cameraB = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  cameraB.position.set(-30, 20, 10);
  let threwTwoArg = false;
  try {
    cl.update(cameraB, 2.5);
  } catch (e) {
    threwTwoArg = true;
    console.error(e);
  }
  assert(!threwTwoArg, 'cl.update(cameraB, 2.5) executes cleanly');
  assert(cl.camera === cameraB, 'cl.camera updated to cameraB');

  // Test 2.3: update() with edge case arguments
  const edgeCalls = [
    { desc: 'update() with no args', fn: () => cl.update() },
    { desc: 'update(0)', fn: () => cl.update(0) },
    { desc: 'update(cameraB, 0)', fn: () => cl.update(cameraB, 0) },
    { desc: 'update(null, null)', fn: () => cl.update(null, null) },
    { desc: 'update(undefined, undefined)', fn: () => cl.update(undefined, undefined) },
    { desc: 'update(-100.5)', fn: () => cl.update(-100.5) },
    { desc: 'update(1e9)', fn: () => cl.update(1e9) },
    { desc: 'update(cameraB, -50)', fn: () => cl.update(cameraB, -50) },
    { desc: 'update(cameraB, 1e8)', fn: () => cl.update(cameraB, 1e8) },
    { desc: 'update({}, 10)', fn: () => cl.update({}, 10) },
    { desc: 'update(cameraB, undefined)', fn: () => cl.update(cameraB, undefined) }
  ];

  for (const c of edgeCalls) {
    let err = null;
    try {
      c.fn();
    } catch (e) {
      err = e;
    }
    assert(err === null, `${c.desc} handled without error`);
  }

  // Test 2.4: update() when camera is null
  const clNoCam = new CosmicLabels({}, null, null);
  let noCamThrew = false;
  try {
    clNoCam.update(10);
  } catch (e) {
    noCamThrew = true;
  }
  assert(!noCamThrew, 'update(10) when constructor camera is null returns cleanly');

  // Test 2.5: update() when group.visible is false
  cl.setVisible(false);
  const mw = cl.labels.find(l => l.name === 'Milky Way');
  const prevScaleX = mw.sprite.scale.x;
  cl.camera.position.set(1000, 1000, 1000); // move camera far away
  cl.update(1.0);
  assert(mw.sprite.scale.x === prevScaleX, 'update() early-returns without modifying sprites when group is invisible');
  cl.setVisible(true);
});

// ---------------------------------------------------------------------------
// SUITE 3: Distance attenuation & scale clamping
// ---------------------------------------------------------------------------
suite('Suite 3: Distance attenuation & scale clamping boundaries', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);
  const ga = cl.labels.find(l => l.name === 'The Great Attractor');

  // Nominal scale factor: Math.min(Math.max(dist / 140.0, 0.55), 2.2) * userScale
  // Test 3.1: Camera directly on top of anchor (dist = 0)
  camera.position.copy(ga.anchor);
  cl.update(camera, 1.0);
  const scaleAtDist0 = ga.sprite.scale.x;
  const expectedMinScale = ga.baseW * 0.55 * cl.userScale;
  assert(Math.abs(scaleAtDist0 - expectedMinScale) < 1e-4, `Scale at dist=0 clamped to min 0.55 (${scaleAtDist0} vs ${expectedMinScale})`);
  assert(ga.sprite.material.opacity === 0, `Opacity at dist=0 is 0 (near fade triggered)`);

  // Test 3.2: Camera in near-fade transition zone (dist = 14)
  camera.position.set(ga.anchor.x, ga.anchor.y + 14.0, ga.anchor.z);
  cl.update(camera, 1.0);
  // fade = (14 - 6) / 16 = 8 / 16 = 0.5
  const expectedNearFade = 0.5 * cl.baseOpacity;
  assert(Math.abs(ga.sprite.material.opacity - expectedNearFade) < 1e-3, `Near-fade opacity at dist=14 is 0.5 * baseOpacity (${ga.sprite.material.opacity.toFixed(4)})`);

  // Test 3.3: Nominal distance (dist = 140)
  camera.position.set(ga.anchor.x, ga.anchor.y + 140.0, ga.anchor.z);
  cl.update(camera, 1.0);
  // distScale = 140 / 140 = 1.0; fade = 1.0
  const expectedNominalScale = ga.baseW * 1.0 * cl.userScale;
  assert(Math.abs(ga.sprite.scale.x - expectedNominalScale) < 1e-4, `Scale at dist=140 is exactly 1.0 * baseW (${ga.sprite.scale.x})`);
  assert(Math.abs(ga.sprite.material.opacity - cl.baseOpacity) < 1e-3, `Opacity at dist=140 is full baseOpacity`);

  // Test 3.4: Extreme distance clamping (dist = 1000)
  camera.position.set(ga.anchor.x, ga.anchor.y + 1000.0, ga.anchor.z);
  cl.update(camera, 1.0);
  const expectedMaxScale = ga.baseW * 2.2 * cl.userScale;
  assert(Math.abs(ga.sprite.scale.x - expectedMaxScale) < 1e-4, `Scale at dist=1000 clamped to max 2.2 * baseW (${ga.sprite.scale.x})`);
  assert(ga.sprite.material.opacity === 0, `Opacity at dist=1000 is 0 (far fade triggered: dist > 420)`);

  // Test 3.5: Dynamic pulsing on Flow Annotation (hasLeader === false)
  const flow = cl.labels.find(l => l.name === 'Bulk flow toward Antlia-Centaurus');
  camera.position.set(flow.anchor.x, flow.anchor.y + 140.0, flow.anchor.z);
  cl.update(camera, 0.0);
  const op0 = flow.sprite.material.opacity;
  // At elapsed = PI / 4.4, sin(2.2 * t) = 1.0 -> flowMod = 0.88 + 0.12 * 1 = 1.0
  cl.update(camera, Math.PI / 4.4);
  const opPeak = flow.sprite.material.opacity;
  // At elapsed = -PI / 4.4, sin(2.2 * t) = -1.0 -> flowMod = 0.88 - 0.12 = 0.76
  cl.update(camera, -Math.PI / 4.4);
  const opTrough = flow.sprite.material.opacity;
  assert(opPeak > opTrough, `Flow annotation pulses with elapsed time: peak=${opPeak.toFixed(3)}, trough=${opTrough.toFixed(3)}`);
});

// ---------------------------------------------------------------------------
// SUITE 4: setVisible(bool) toggling
// ---------------------------------------------------------------------------
suite('Suite 4: setVisible(bool) state and toggle verification', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);

  // Test 4.1: Toggle false
  cl.setVisible(false);
  assert(cl.visible === false, 'cl.visible is false after setVisible(false)');
  assert(cl.group.visible === false, 'cl.group.visible is false');

  // Test 4.2: Toggle true
  cl.setVisible(true);
  assert(cl.visible === true, 'cl.visible is true after setVisible(true)');
  assert(cl.group.visible === true, 'cl.group.visible is true');

  // Test 4.3: Truthy & falsy inputs
  cl.setVisible(0);
  assert(cl.visible === false && cl.group.visible === false, 'setVisible(0) coerces to false');
  cl.setVisible(1);
  assert(cl.visible === true && cl.group.visible === true, 'setVisible(1) coerces to true');
  cl.setVisible(null);
  assert(cl.visible === false && cl.group.visible === false, 'setVisible(null) coerces to false');
  cl.setVisible('yes');
  assert(cl.visible === true && cl.group.visible === true, 'setVisible("yes") coerces to true');
});

// ---------------------------------------------------------------------------
// SUITE 5: setOpacity(val) edge cases (0, 1, 0.5, -1, 2, and others)
// ---------------------------------------------------------------------------
suite('Suite 5: setOpacity(val) edge cases (0, 1, 0.5, -1, 2)', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);

  const testCases = [
    { input: 0, expected: 0.0, desc: 'setOpacity(0) clamped to 0.0' },
    { input: 1, expected: 1.0, desc: 'setOpacity(1) clamped to 1.0' },
    { input: 0.5, expected: 0.5, desc: 'setOpacity(0.5) sets 0.5' },
    { input: -1, expected: 0.0, desc: 'setOpacity(-1) clamped to 0.0' },
    { input: 2, expected: 1.0, desc: 'setOpacity(2) clamped to 1.0' },
    { input: -999, expected: 0.0, desc: 'setOpacity(-999) clamped to 0.0' },
    { input: 999, expected: 1.0, desc: 'setOpacity(999) clamped to 1.0' },
    { input: '0.75', expected: 0.75, desc: 'setOpacity("0.75") string coerced to 0.75' },
    { input: null, expected: 0.0, desc: 'setOpacity(null) coerces to 0.0' }
  ];

  for (const tc of testCases) {
    cl.setOpacity(tc.input);
    assert(cl.baseOpacity === tc.expected, `${tc.desc}: baseOpacity is ${cl.baseOpacity}`);

    let allSpritesMatch = true;
    for (const item of cl.labels) {
      if (item.sprite && item.sprite.material && item.sprite.material.opacity !== tc.expected) {
        allSpritesMatch = false;
        break;
      }
    }
    assert(allSpritesMatch, `${tc.desc}: all sprite materials set to ${tc.expected}`);
  }

  // Non-numeric edge cases: NaN, undefined
  let nanThrew = false;
  try {
    cl.setOpacity(NaN);
    cl.setOpacity(undefined);
  } catch (e) {
    nanThrew = true;
  }
  assert(!nanThrew, 'setOpacity with NaN / undefined does not throw exception');
});

// ---------------------------------------------------------------------------
// SUITE 6: setLeaderLinesVisible(bool) & setLeaderOpacity(val)
// ---------------------------------------------------------------------------
suite('Suite 6: setLeaderLinesVisible(bool) & setLeaderOpacity(val)', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);

  // Test 6.1: setLeaderLinesVisible(false)
  cl.setLeaderLinesVisible(false);
  assert(cl.leaderLinesVisible === false, 'cl.leaderLinesVisible is false');
  assert(cl.leaderLines.visible === false, 'cl.leaderLines.visible is false');
  assert(cl.centroidDots.visible === false, 'cl.centroidDots.visible is false');

  // Test 6.2: setLeaderLinesVisible(true)
  cl.setLeaderLinesVisible(true);
  assert(cl.leaderLinesVisible === true, 'cl.leaderLinesVisible is true');
  assert(cl.leaderLines.visible === true, 'cl.leaderLines.visible is true');
  assert(cl.centroidDots.visible === true, 'cl.centroidDots.visible is true');

  // Test 6.3: Falsy and truthy non-booleans
  cl.setLeaderLinesVisible(0);
  assert(cl.leaderLines.visible === false, 'setLeaderLinesVisible(0) hides leader lines');
  cl.setLeaderLinesVisible(1);
  assert(cl.leaderLines.visible === true, 'setLeaderLinesVisible(1) shows leader lines');

  // Test 6.4: setLeaderOpacity edge cases
  cl.setLeaderOpacity(0.4);
  assert(cl.baseLeaderOpacity === 0.4, 'setLeaderOpacity(0.4) sets baseLeaderOpacity 0.4');
  assert(cl.leaderMaterial.opacity === 0.4, 'leaderMaterial.opacity matches 0.4');

  cl.setLeaderOpacity(-0.5);
  assert(cl.baseLeaderOpacity === 0.0, 'setLeaderOpacity(-0.5) clamps to 0.0');

  cl.setLeaderOpacity(1.5);
  assert(cl.baseLeaderOpacity === 1.0, 'setLeaderOpacity(1.5) clamps to 1.0');
});

// ---------------------------------------------------------------------------
// SUITE 7: setScale(val) boundaries
// ---------------------------------------------------------------------------
suite('Suite 7: setScale(val) boundaries [0.2, 4.0]', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);
  const ga = cl.labels.find(l => l.name === 'The Great Attractor');

  cl.setScale(2.0);
  assert(cl.userScale === 2.0, 'setScale(2.0) sets userScale = 2.0');
  assert(Math.abs(ga.sprite.scale.x - ga.baseW * 2.0) < 1e-4, 'Sprite scale reflects userScale');

  // Clamping to minimum 0.2
  cl.setScale(0.05);
  assert(cl.userScale === 0.2, 'setScale(0.05) clamped to min 0.2');

  // Clamping to maximum 4.0
  cl.setScale(10.0);
  assert(cl.userScale === 4.0, 'setScale(10.0) clamped to max 4.0');
});

// ---------------------------------------------------------------------------
// SUITE 8: dispose() lifecycle & resource cleanup
// ---------------------------------------------------------------------------
suite('Suite 8: dispose() lifecycle & resource cleanup', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);

  // Track dispose event dispatches
  let texturesDisposed = 0;
  let materialsDisposed = 0;
  let geometriesDisposed = 0;

  for (const item of cl.labels) {
    if (item.texture) {
      item.texture.addEventListener('dispose', () => texturesDisposed++);
    }
    if (item.sprite && item.sprite.material) {
      item.sprite.material.addEventListener('dispose', () => materialsDisposed++);
    }
  }

  if (cl.leaderLines) {
    if (cl.leaderLines.geometry) {
      cl.leaderLines.geometry.addEventListener('dispose', () => geometriesDisposed++);
    }
    if (cl.leaderLines.material) {
      cl.leaderLines.material.addEventListener('dispose', () => materialsDisposed++);
    }
  }

  if (cl.centroidDots) {
    cl.centroidDots.traverse(child => {
      if (child.geometry) {
        child.geometry.addEventListener('dispose', () => geometriesDisposed++);
      }
      if (child.material) {
        child.material.addEventListener('dispose', () => materialsDisposed++);
      }
    });
  }

  // Test 8.1: Clean disposal
  let threwDispose = false;
  try {
    cl.dispose();
  } catch (e) {
    threwDispose = true;
    console.error(e);
  }
  assert(!threwDispose, 'cl.dispose() executes cleanly without exception');
  assert(materialsDisposed >= 12, `At least 12 materials disposed (actual: ${materialsDisposed})`);
  assert(geometriesDisposed >= 1, `At least 1 geometry disposed (actual: ${geometriesDisposed})`);

  // Test 8.2: Double dispose idempotency
  let threwSecondDispose = false;
  try {
    cl.dispose();
  } catch (e) {
    threwSecondDispose = true;
    console.error(e);
  }
  assert(!threwSecondDispose, 'Second cl.dispose() call is idempotent and does not throw');

  // Test 8.3: Post-dispose calls
  let threwPostDisposeUpdate = false;
  try {
    cl.update(camera, 1.0);
  } catch (e) {
    threwPostDisposeUpdate = true;
  }
  assert(!threwPostDisposeUpdate, 'update() call after dispose() does not crash');

  let threwPostDisposeSetVisible = false;
  try {
    cl.setVisible(false);
    cl.setVisible(true);
  } catch (e) {
    threwPostDisposeSetVisible = true;
  }
  assert(!threwPostDisposeSetVisible, 'setVisible() after dispose() does not crash');
});

// ---------------------------------------------------------------------------
// SUITE 9: DOM Environment & Canvas Texture Generation
// ---------------------------------------------------------------------------
suite('Suite 9: DOM & 2D Canvas Mocking (High-DPI Canvas & Overlay cleanup)', () => {
  // Setup mock DOM
  const mockContext = {
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    strokeStyle: '',
    lineWidth: 0,
    fillStyle: '',
    lineJoin: '',
    measureText: (text) => ({ width: text.length * 14 }),
    save: () => {},
    restore: () => {},
    strokeText: () => {},
    fillText: () => {}
  };

  const createdCanvases = [];
  const createdDivs = [];

  const mockDocument = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        const c = {
          width: 0,
          height: 0,
          getContext: (type) => (type === '2d' ? mockContext : null)
        };
        createdCanvases.push(c);
        return c;
      }
      if (tag === 'div') {
        const d = {
          className: '',
          style: { display: 'block' },
          parentNode: null,
          remove: function () {
            if (this.parentNode && this.parentNode.removeChild) {
              this.parentNode.removeChild(this);
            }
          }
        };
        createdDivs.push(d);
        return d;
      }
      return {};
    }
  };

  const mockContainer = {
    children: [],
    querySelector: () => null,
    appendChild: function (child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild: function (child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }
  };

  // Temporarily set globalThis.document
  const originalDocument = globalThis.document;
  globalThis.document = mockDocument;

  try {
    const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
    camera.position.set(-10, 105, 125);

    const clDom = new CosmicLabels({}, camera, mockContainer);

    assert(createdCanvases.length === 12, '12 offscreen 2D canvases created for 12 labels');
    assert(clDom.overlay !== null, 'HTML overlay created in container');
    assert(mockContainer.children.length === 1, 'mockContainer received overlay element');

    // Check canvas dimensions are calculated (> 0)
    const allCanvasesSized = createdCanvases.every(c => c.width > 0 && c.height > 0);
    assert(allCanvasesSized, 'All 12 label canvases have width > 0 and height > 0');

    // Check textures are CanvasTexture
    const allTexturesCreated = clDom.labels.every(l => l.texture instanceof THREE.CanvasTexture);
    assert(allTexturesCreated, 'All 12 labels received THREE.CanvasTexture instances');

    // Check setVisible toggles overlay display style
    clDom.setVisible(false);
    assert(clDom.overlay.style.display === 'none', 'setVisible(false) sets overlay style display: none');
    clDom.setVisible(true);
    assert(clDom.overlay.style.display === 'block', 'setVisible(true) sets overlay style display: block');

    // Dispose should remove overlay from container
    clDom.dispose();
    assert(mockContainer.children.length === 0, 'clDom.dispose() removed overlay from container');
    assert(clDom.overlay.parentNode === null, 'overlay.parentNode is null after dispose');

  } finally {
    globalThis.document = originalDocument;
  }
});

// ---------------------------------------------------------------------------
// SUITE 10: High-load Rapid Update Stress & Scene Integration
// ---------------------------------------------------------------------------
suite('Suite 10: High-load 1,000-frame rapid update & scene attachment', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  camera.position.set(-10, 105, 125);

  const cl = new CosmicLabels({}, camera, null);
  scene.add(cl.group);

  assert(scene.children.includes(cl.group), 'cl.group successfully added to THREE.Scene');

  // Run 1,000 simulated frames with orbiting camera and varying elapsed
  let rapidThrew = false;
  try {
    for (let frame = 0; frame < 1000; frame++) {
      const angle = (frame / 1000) * Math.PI * 4;
      const radius = 120 + 50 * Math.sin(frame * 0.02);
      camera.position.set(
        Math.cos(angle) * radius,
        50 + 40 * Math.sin(angle * 0.5),
        Math.sin(angle) * radius
      );
      cl.update(frame * 0.016);
    }
  } catch (e) {
    rapidThrew = true;
    console.error(e);
  }
  assert(!rapidThrew, '1,000 consecutive update() frames executed cleanly at variable camera poses');

  scene.remove(cl.group);
  assert(!scene.children.includes(cl.group), 'cl.group cleanly removed from scene');
  cl.dispose();
});

// ---------------------------------------------------------------------------
// SUITE 11: Leader line geometry buffer coordinate audit
// ---------------------------------------------------------------------------
suite('Suite 11: Leader line geometry buffer coordinate audit', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  const cl = new CosmicLabels({}, camera, null);

  const posAttr = cl.leaderLines.geometry.getAttribute('position');
  assert(posAttr !== undefined, 'leaderLines geometry has position attribute');
  assert(posAttr.itemSize === 3, 'position attribute itemSize is 3');
  // 11 structures have leaders, each has 2 vertices = 22 vertices = 66 floats
  assert(posAttr.count === 22, `position attribute vertex count is 22 (actual: ${posAttr.count})`);

  const leaderItems = cl.labels.filter(l => l.hasLeader);
  assert(leaderItems.length === 11, '11 items have hasLeader = true');

  for (let i = 0; i < leaderItems.length; i++) {
    const item = leaderItems[i];
    const v0Index = i * 2;
    const v1Index = i * 2 + 1;

    // Centroid vertex
    const cx = posAttr.getX(v0Index);
    const cy = posAttr.getY(v0Index);
    const cz = posAttr.getZ(v0Index);
    assert(
      cx === item.centroid.x && cy === item.centroid.y && cz === item.centroid.z,
      `Segment ${i} (${item.name}) start vertex matches centroid (${cx}, ${cy}, ${cz})`
    );

    // Anchor vertex (top border of leader line)
    const ax = posAttr.getX(v1Index);
    const ay = posAttr.getY(v1Index);
    const az = posAttr.getZ(v1Index);
    const expectedTopY = item.anchor.y - item.baseH * 0.45;
    assert(
      ax === item.anchor.x && Math.abs(ay - expectedTopY) < 1e-4 && az === item.anchor.z,
      `Segment ${i} (${item.name}) end vertex matches anchor top-Y (${ax}, ${ay}, ${az})`
    );
  }
});

// ---------------------------------------------------------------------------
// SUITE 12: Memory lifecycle & Repeated instantiation churn (100 cycles)
// ---------------------------------------------------------------------------
suite('Suite 12: Repeated instantiation & dispose churn (100 cycles)', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.0, 1, 1000);
  let churnThrew = false;
  try {
    for (let cycle = 0; cycle < 100; cycle++) {
      const cl = new CosmicLabels({}, camera, null);
      cl.update(cycle * 0.1);
      cl.setOpacity(0.5);
      cl.setScale(1.5);
      cl.setLeaderLinesVisible(cycle % 2 === 0);
      cl.dispose();
    }
  } catch (e) {
    churnThrew = true;
    console.error(e);
  }
  assert(!churnThrew, '100 cycles of create -> update -> toggle -> dispose ran cleanly without leak or error');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`STRESS TEST SUMMARY`);
console.log(`========================================`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`Failures:`);
  for (const f of failures) {
    console.log(` - ${f}`);
  }
  process.exit(1);
} else {
  console.log(`ALL EMPIRICAL STRESS TESTS PASSED!`);
  process.exit(0);
}
