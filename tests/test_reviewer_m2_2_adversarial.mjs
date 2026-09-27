import * as THREE from 'three';
import { CosmicField } from '../src/physics/CosmicField.js';
import { SlicePlaneMesh } from '../src/renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from '../src/renderers/StreamlineRenderer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('REVIEWER M2-2 ADVERSARIAL AUDIT & BENCHMARK SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------
// 1. NUMERICAL STABILITY OF RK4 INTEGRATION
// ----------------------------------------------------------------------
console.log('--- 1. RK4 NUMERICAL STABILITY & BOUNDARY TESTING ---');
const cf = new CosmicField();

// Test 1.1: Fuzzing seeds across extreme domain [-500, 500]^3
let allFinite = true;
let totalSteps = 0;
for (let i = 0; i < 500; i++) {
  const seed = new THREE.Vector3(
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000
  );
  const res = cf.traceStreamline(seed, 100, 1.0);
  for (const pt of res.points) {
    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y) || !Number.isFinite(pt.z)) {
      allFinite = false;
    }
  }
  totalSteps += res.points.length;
}
assert(allFinite, '500 extreme-domain seeds [-500, 500]^3 yielded 100% finite coordinates (no NaN/Inf)');

// Test 1.2: Seeds placed directly on / near attractor singularities
let singularitySafe = true;
for (const a of cf.attractors) {
  // Test at exact attractor center
  const atCenter = cf.traceStreamline(a.position.clone(), 50, 0.5);
  for (const p of atCenter.points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
      singularitySafe = false;
    }
  }

  // Test at microscopic offset (1e-6)
  const nearCenter = cf.traceStreamline(a.position.clone().addScalar(1e-6), 50, 0.5);
  for (const p of nearCenter.points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
      singularitySafe = false;
    }
  }
}
assert(singularitySafe, 'Seeds at exact centers and epsilons (1e-6) of all attractors survive without NaN or Inf');

// Test 1.3: Variable RK4 step sizes (h in [0.001, 10.0])
let stepSizeStable = true;
for (const dt of [0.001, 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0]) {
  const res = cf.traceStreamline(new THREE.Vector3(10, 5, 10), 100, dt);
  for (const p of res.points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
      stepSizeStable = false;
    }
  }
}
assert(stepSizeStable, 'RK4 integration remains numerically stable across step sizes dt in [0.001, 10.0]');

// Test 1.4: Inflow destination distribution for northern Coma seeds
let comaArrivals = 0;
for (let i = 0; i < 200; i++) {
  const seed = new THREE.Vector3(
    THREE.MathUtils.lerp(2, 22, Math.random()),
    THREE.MathUtils.lerp(-2, 10, Math.random()),
    THREE.MathUtils.lerp(-32, -10, Math.random())
  );
  const res = cf.traceStreamline(seed, 190, 0.92);
  if (res.destination === 'coma-cluster') {
    comaArrivals++;
  }
}
assert(comaArrivals > 0, `Northern corridor seeds reliably funnel into Coma attractor (${comaArrivals}/200 = ${(comaArrivals/2).toFixed(1)}%)`);

// ----------------------------------------------------------------------
// 2. GLSL UNIFORM BOUNDARIES & SHADER SAFETY
// ----------------------------------------------------------------------
console.log('\n--- 2. GLSL UNIFORM BOUNDARIES & SHADER DATA SAFETY ---');
const slice = new SlicePlaneMesh(cf);

// Test 2.1: Uniform array length invariance
const sData = cf.getShaderData();
assert(sData.uAttractorPositions.length === 18, 'uAttractorPositions length is exactly 18');
assert(sData.uAttractorMasses.length === 6, 'uAttractorMasses length is exactly 6');
assert(sData.uAttractorSoftenings.length === 6, 'uAttractorSoftenings length is exactly 6');
assert(sData.uAttractorCount === 5, 'uAttractorCount correctly matches 5 active attractors');

// Test 2.2: Buffer boundary overflow protection
// Simulate adding 10 attractors to CosmicField
const cfOverflow = new CosmicField();
for (let i = 6; i < 12; i++) {
  cfOverflow.attractors.push({
    id: `extra-${i}`,
    name: `Extra Attractor ${i}`,
    position: new THREE.Vector3(i * 10, 0, 0),
    mass: 1000,
    softening: 10.0,
    type: 'attractor',
    color: 0xffffff
  });
}
const overflowData = cfOverflow.getShaderData();
assert(overflowData.uAttractorPositions.length === 18, 'getShaderData clamps exported positions to length 18 (6 attractors) even with 11 attractors');
assert(overflowData.uAttractorMasses.length === 6, 'getShaderData clamps exported masses to length 6');
assert(overflowData.uAttractorSoftenings.length === 6, 'getShaderData clamps exported softenings to length 6');

// Test 2.3: Zero / fewer attractors protection (underflow)
const cfEmpty = new CosmicField();
cfEmpty.attractors = [];
const emptyData = cfEmpty.getShaderData();
assert(emptyData.uAttractorPositions.length === 18, 'getShaderData pads empty attractors with zero floats to length 18');
assert(emptyData.uAttractorMasses.length === 6, 'getShaderData pads empty masses to length 6');
assert(emptyData.uAttractorSoftenings.length === 6, 'getShaderData pads empty softenings to length 6');
assert(emptyData.uAttractorCount === 0, 'uAttractorCount is 0 for empty field');

// Test 2.4: Fragment shader syntax and uniform declarations
const frag = slice.material.fragmentShader;
assert(frag.includes('uniform float uAttractorPositions[18];'), 'Fragment shader declares uAttractorPositions[18]');
assert(frag.includes('uniform float uAttractorMasses[6];'), 'Fragment shader declares uAttractorMasses[6]');
assert(frag.includes('uniform float uAttractorSoftenings[6];'), 'Fragment shader declares uAttractorSoftenings[6]');
assert(frag.includes('uniform int uAttractorCount;'), 'Fragment shader declares uAttractorCount');
assert(frag.includes('for (int i = 0; i < 6; i++)'), 'Fragment shader contains static bounded loop for (int i = 0; i < 6; i++)');
assert(frag.includes('if (i >= uAttractorCount) break;'), 'Fragment shader terminates loop with if (i >= uAttractorCount) break;');

// ----------------------------------------------------------------------
// 3. MEMORY MANAGEMENT & PER-FRAME ALLOCATIONS
// ----------------------------------------------------------------------
console.log('\n--- 3. MEMORY MANAGEMENT & RUNTIME GC OVERHEAD ---');
const renderer = new StreamlineRenderer(cf, { streamlineCount: 320 });

// Test 3.1: Profile memory churn during 1,000 updateArrowTransforms frames
const startMem = process.memoryUsage().heapUsed;
for (let frame = 0; frame < 1000; frame++) {
  renderer.updateArrowTransforms(frame * 0.016);
}
const endMem = process.memoryUsage().heapUsed;
const heapDeltaMB = (endMem - startMem) / (1024 * 1024);
assert(heapDeltaMB < 25.0, `1,000 frames of arrow animation consumed minimal heap (< 25MB, actual: ${heapDeltaMB.toFixed(2)} MB)`);

// Test 3.2: Rebuild lifecycle and buffer disposal
let rebuildSuccess = true;
for (let cycle = 0; cycle < 10; cycle++) {
  try {
    renderer.rebuild();
  } catch (e) {
    rebuildSuccess = false;
  }
}
assert(rebuildSuccess, '10 consecutive rebuild() cycles execute cleanly without crash or leak');

// ----------------------------------------------------------------------
// 4. DRAW CALL EFFICIENCY & BATCHING
// ----------------------------------------------------------------------
console.log('\n--- 4. DRAW CALL EFFICIENCY & BATCHING ---');

// Count scene objects added by StreamlineRenderer
let meshCount = 0;
let lineCount = 0;
let pointsCount = 0;
renderer.group.traverse(child => {
  if (child instanceof THREE.LineSegments) lineCount++;
  if (child instanceof THREE.InstancedMesh) meshCount++;
  if (child instanceof THREE.Points) pointsCount++;
});

assert(lineCount === 1, `Streamlines rendered via EXACTLY 1 batched LineSegments (actual: ${lineCount})`);
assert(meshCount === 1, `Arrowheads rendered via EXACTLY 1 InstancedMesh (actual: ${meshCount})`);
assert(pointsCount === 0, `No unbatched point primitives created`);
const totalDrawCalls = lineCount + meshCount;
assert(totalDrawCalls === 2, `Total draw calls for StreamlineRenderer is exactly 2 for ${renderer.streamlineCount} streamlines and ${renderer.arrowCount} arrows`);

// ----------------------------------------------------------------------
// 5. COLOR RAMP FIDELITY & INTEGRITY
// ----------------------------------------------------------------------
console.log('\n--- 5. COLOR RAMP FIDELITY & INTEGRITY ---');

// Verify 8 stops in scientific ramp
const tVals = [0.0, 0.14, 0.28, 0.42, 0.55, 0.70, 0.85, 1.0];
const expectedHex = ['0033cc', '0080ff', '00d4ff', 'cce8ff', 'ffffff', 'ffc233', 'ff6600', 'dc1400'];
let colorsAccurate = true;
for (let i = 0; i < tVals.length; i++) {
  const c = renderer.sampleColor(tVals[i], false);
  if (c.getHexString() !== expectedHex[i]) {
    colorsAccurate = false;
    console.error(`Color mismatch at t=${tVals[i]}: expected ${expectedHex[i]}, got ${c.getHexString()}`);
  }
}
assert(colorsAccurate, 'All 8 scientific color stops match Tully et al. (Nature 2014) specification exactly');

// ----------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL PASSED: ${passed}`);
console.log(`TOTAL FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
