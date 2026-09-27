import * as THREE from 'three';
import { CosmicField } from '../src/physics/CosmicField.js';
import { SlicePlaneMesh } from '../src/renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from '../src/renderers/StreamlineRenderer.js';

let totalTests = 0;
let passedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (!condition) {
    const err = `❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`;
    console.error(err);
    failures.push({ message, details });
    throw new Error(err);
  }
  passedTests++;
  console.log(`  PASS: ${message}`);
}

console.log('================================================================');
console.log('CHALLENGER M2-2: ADVERSARIAL STRESS TEST SUITE');
console.log('Focus: CosmicField.getShaderData(), SlicePlaneMesh uniforms, Edge Seeds');
console.log('================================================================\n');

try {
  // -------------------------------------------------------------------------
  // SUITE 1: CosmicField.getShaderData() Invariants & Array Dimensions
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 1: CosmicField.getShaderData() Dimensions & Data Alignment');
  const cf = new CosmicField();
  const sd = cf.getShaderData();

  // Check 18 / 6 / 6 array dimensions
  assert(Array.isArray(sd.uAttractorPositions), 'uAttractorPositions is an Array');
  assert(sd.uAttractorPositions.length === 18, 'uAttractorPositions length is exactly 18');
  assert(Array.isArray(sd.uAttractorMasses), 'uAttractorMasses is an Array');
  assert(sd.uAttractorMasses.length === 6, 'uAttractorMasses length is exactly 6');
  assert(Array.isArray(sd.uAttractorSoftenings), 'uAttractorSoftenings is an Array');
  assert(sd.uAttractorSoftenings.length === 6, 'uAttractorSoftenings length is exactly 6');
  assert(sd.uAttractorCount === 5, 'uAttractorCount is 5 (matches registered count)');
  assert(Array.isArray(sd.uBackgroundDrift) && sd.uBackgroundDrift.length === 3, 'uBackgroundDrift is length 3');

  // Verify all elements are finite numbers
  sd.uAttractorPositions.forEach((val, idx) => {
    assert(typeof val === 'number' && Number.isFinite(val), `uAttractorPositions[${idx}] is finite number`, `val: ${val}`);
  });
  sd.uAttractorMasses.forEach((val, idx) => {
    assert(typeof val === 'number' && Number.isFinite(val), `uAttractorMasses[${idx}] is finite number`, `val: ${val}`);
  });
  sd.uAttractorSoftenings.forEach((val, idx) => {
    assert(typeof val === 'number' && Number.isFinite(val), `uAttractorSoftenings[${idx}] is finite number`, `val: ${val}`);
  });

  // Verify exact matching of the 5 active attractors
  for (let i = 0; i < 5; i++) {
    const a = cf.attractors[i];
    assert(sd.uAttractorPositions[i * 3 + 0] === a.position.x, `Attractor ${i} (${a.id}) pos.x matches`);
    assert(sd.uAttractorPositions[i * 3 + 1] === a.position.y, `Attractor ${i} (${a.id}) pos.y matches`);
    assert(sd.uAttractorPositions[i * 3 + 2] === a.position.z, `Attractor ${i} (${a.id}) pos.z matches`);
    assert(sd.uAttractorMasses[i] === a.mass, `Attractor ${i} (${a.id}) mass matches`);
    assert(sd.uAttractorSoftenings[i] === a.softening, `Attractor ${i} (${a.id}) softening matches`);
  }

  // Verify 6th slot padding (index 5)
  assert(sd.uAttractorPositions[15] === 0, 'Padded slot 5 pos.x is 0');
  assert(sd.uAttractorPositions[16] === 0, 'Padded slot 5 pos.y is 0');
  assert(sd.uAttractorPositions[17] === 0, 'Padded slot 5 pos.z is 0');
  assert(sd.uAttractorMasses[5] === 0, 'Padded slot 5 mass is 0');
  assert(sd.uAttractorSoftenings[5] === 1, 'Padded slot 5 softening is default 1');

  // Dynamic mutation test: alter Coma cluster
  const coma = cf.attractors.find(a => a.id === 'coma-cluster');
  coma.position.set(12.5, 48.0, -22.0);
  coma.mass = 3500;
  coma.softening = 15.5;

  const sdMutated = cf.getShaderData();
  const comaIdx = cf.attractors.findIndex(a => a.id === 'coma-cluster');
  assert(sdMutated.uAttractorPositions[comaIdx * 3 + 0] === 12.5, 'Mutated Coma pos.x reflected in getShaderData()');
  assert(sdMutated.uAttractorPositions[comaIdx * 3 + 1] === 48.0, 'Mutated Coma pos.y reflected in getShaderData()');
  assert(sdMutated.uAttractorPositions[comaIdx * 3 + 2] === -22.0, 'Mutated Coma pos.z reflected in getShaderData()');
  assert(sdMutated.uAttractorMasses[comaIdx] === 3500, 'Mutated Coma mass reflected in getShaderData()');
  assert(sdMutated.uAttractorSoftenings[comaIdx] === 15.5, 'Mutated Coma softening reflected in getShaderData()');

  // Restore Coma values
  coma.position.set(5, 45, -25);
  coma.mass = 2600;
  coma.softening = 14.0;

  // Boundary test: Empty attractors array
  const emptyCf = new CosmicField();
  emptyCf.attractors = [];
  const sdEmpty = emptyCf.getShaderData();
  assert(sdEmpty.uAttractorPositions.length === 18, 'Empty attractors yields positions length 18');
  assert(sdEmpty.uAttractorMasses.length === 6, 'Empty attractors yields masses length 6');
  assert(sdEmpty.uAttractorSoftenings.length === 6, 'Empty attractors yields softenings length 6');
  assert(sdEmpty.uAttractorCount === 0, 'Empty attractors yields uAttractorCount = 0');

  // Boundary test: 6 attractors (exact capacity)
  const fullCf = new CosmicField();
  fullCf.attractors.push({
    id: 'sixth-attractor',
    name: 'Sixth Attractor',
    position: new THREE.Vector3(10, 20, 30),
    mass: 999,
    softening: 8.0,
    type: 'attractor'
  });
  const sdFull = fullCf.getShaderData();
  assert(sdFull.uAttractorPositions.length === 18, '6 attractors yields positions length 18');
  assert(sdFull.uAttractorMasses.length === 6, '6 attractors yields masses length 6');
  assert(sdFull.uAttractorPositions[15] === 10 && sdFull.uAttractorPositions[16] === 20 && sdFull.uAttractorPositions[17] === 30, '6th slot populated with exact position');
  assert(sdFull.uAttractorMasses[5] === 999, '6th slot populated with exact mass');
  assert(sdFull.uAttractorSoftenings[5] === 8.0, '6th slot populated with exact softening');
  assert(sdFull.uAttractorCount === 6, '6 attractors yields uAttractorCount = 6');

  // Boundary test: 8 attractors (overflow capacity)
  fullCf.attractors.push({
    id: 'seventh-attractor',
    name: 'Seventh',
    position: new THREE.Vector3(70, 70, 70),
    mass: 100,
    softening: 5.0,
    type: 'attractor'
  });
  fullCf.attractors.push({
    id: 'eighth-attractor',
    name: 'Eighth',
    position: new THREE.Vector3(80, 80, 80),
    mass: 200,
    softening: 6.0,
    type: 'attractor'
  });
  const sdOver = fullCf.getShaderData();
  assert(sdOver.uAttractorPositions.length === 18, 'Over-capacity attractors (8) still caps positions array length to 18');
  assert(sdOver.uAttractorMasses.length === 6, 'Over-capacity attractors (8) still caps masses array length to 6');
  assert(sdOver.uAttractorSoftenings.length === 6, 'Over-capacity attractors (8) still caps softenings array length to 6');

  console.log('>>> SUITE 1 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 2: SlicePlaneMesh.update() Uniform Array Types & Shader Alignment
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 2: SlicePlaneMesh.update() Uniform Array Types & GLSL Alignment');
  const slicePlane = new SlicePlaneMesh(cf);

  // 1. Check GLSL source code contracts
  const fragShader = slicePlane.material.fragmentShader;
  assert(/uniform\s+float\s+uAttractorPositions\[18\];/.test(fragShader), 'Fragment shader declares uniform float uAttractorPositions[18];');
  assert(/uniform\s+float\s+uAttractorMasses\[6\];/.test(fragShader), 'Fragment shader declares uniform float uAttractorMasses[6];');
  assert(/uniform\s+float\s+uAttractorSoftenings\[6\];/.test(fragShader), 'Fragment shader declares uniform float uAttractorSoftenings[6];');
  assert(/uniform\s+int\s+uAttractorCount;/.test(fragShader), 'Fragment shader declares uniform int uAttractorCount;');
  assert(/uniform\s+vec3\s+uBackgroundDrift;/.test(fragShader), 'Fragment shader declares uniform vec3 uBackgroundDrift;');

  // Check GLSL loop bounds
  assert(/for\s*\(\s*int\s+i\s*=\s*0\s*;\s*i\s*<\s*6\s*;\s*i\+\+\s*\)/.test(fragShader), 'Fragment shader loop iterates for (int i = 0; i < 6; i++)');
  assert(/if\s*\(\s*i\s*>=\s*uAttractorCount\s*\)\s*break;/.test(fragShader), 'Fragment shader respects uAttractorCount dynamic break');

  // 2. Uniform values inspection
  assert(Array.isArray(slicePlane.uniforms.uAttractorPositions.value), 'Uniform uAttractorPositions.value is Array');
  assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'Uniform uAttractorPositions.value length is 18');
  assert(Array.isArray(slicePlane.uniforms.uAttractorMasses.value), 'Uniform uAttractorMasses.value is Array');
  assert(slicePlane.uniforms.uAttractorMasses.value.length === 6, 'Uniform uAttractorMasses.value length is 6');
  assert(Array.isArray(slicePlane.uniforms.uAttractorSoftenings.value), 'Uniform uAttractorSoftenings.value is Array');
  assert(slicePlane.uniforms.uAttractorSoftenings.value.length === 6, 'Uniform uAttractorSoftenings.value length is 6');
  assert(typeof slicePlane.uniforms.uAttractorCount.value === 'number', 'Uniform uAttractorCount.value is number');
  assert(slicePlane.uniforms.uAttractorCount.value === 5, 'Uniform uAttractorCount.value is 5');
  assert(slicePlane.uniforms.uBackgroundDrift.value instanceof THREE.Vector3, 'Uniform uBackgroundDrift.value is THREE.Vector3');

  // Verify material.uniforms references the same uniforms
  assert(slicePlane.material.uniforms.uAttractorPositions.value === slicePlane.uniforms.uAttractorPositions.value, 'material.uniforms references instance uniforms');

  // 3. Test SlicePlaneMesh.update() dynamic propagation
  // Mutate field
  cf.attractors[0].position.set(-42, 6, -8);
  cf.attractors[0].mass = 4000;
  slicePlane.update();

  assert(slicePlane.uniforms.uAttractorPositions.value[0] === -42, 'update() propagated modified pos.x');
  assert(slicePlane.uniforms.uAttractorPositions.value[1] === 6, 'update() propagated modified pos.y');
  assert(slicePlane.uniforms.uAttractorPositions.value[2] === -8, 'update() propagated modified pos.z');
  assert(slicePlane.uniforms.uAttractorMasses.value[0] === 4000, 'update() propagated modified mass');
  assert(slicePlane.material.uniforms.uAttractorMasses.value[0] === 4000, 'material.uniforms reflected update()');

  // Restore GA
  cf.attractors[0].position.set(-38, 2, -5);
  cf.attractors[0].mass = 3200;
  slicePlane.update();

  // 4. Performance & memory stress: 10,000 rapid update() calls
  const t0 = performance.now();
  for (let i = 0; i < 10000; i++) {
    slicePlane.update();
  }
  const t1 = performance.now();
  assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'Positions length invariant holds after 10,000 updates');
  console.log(`  10,000 update() calls executed in ${(t1 - t0).toFixed(2)} ms (${(10000 / ((t1 - t0) / 1000)).toFixed(0)} calls/sec)`);

  // 5. Test setter methods: setSliceY and setOpacity
  slicePlane.setSliceY(25.0);
  assert(slicePlane.sliceY === 25.0, 'setSliceY updates sliceY');
  assert(slicePlane.planeMesh.position.y === 25.0, 'planeMesh position.y updated');
  assert(slicePlane.border.position.y === 25.05, 'border position.y updated with offset');

  slicePlane.setOpacity(0.45);
  assert(slicePlane.uniforms.uOpacity.value === 0.45, 'setOpacity updates uOpacity uniform');

  console.log('>>> SUITE 2 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 3: Numerical Integration Edge Case Seeds: Attractor Cores
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 3: Edge Case Seeds: Exact Attractor Cores & Core Threshold Boundaries');

  // 1. Seeds placed EXACTLY at each attractor position
  for (const attractor of cf.attractors) {
    const seed = attractor.position.clone();
    const trace = cf.traceStreamline(seed, 60, 0.5);

    // Verify no NaNs
    for (let pIdx = 0; pIdx < trace.points.length; pIdx++) {
      const p = trace.points[pIdx];
      assert(!isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z), `No NaN in streamline for seed at core of ${attractor.id}`);
      assert(isFinite(p.x) && isFinite(p.y) && isFinite(p.z), `Finite coords in streamline for seed at core of ${attractor.id}`);
    }

    if (attractor.mass > 0) {
      assert(trace.destination === attractor.id, `Seed at core of ${attractor.id} terminates at itself`);
      assert(trace.points.length <= 4, `Seed at core of ${attractor.id} terminates within <= 4 steps`);
    } else {
      // Repeller pushes seed away, so destination should NOT be the repeller
      assert(trace.destination !== attractor.id, `Seed at repeller core (${attractor.id}) does not terminate at repeller`);
      assert(trace.points.length > 1, `Seed at repeller moves away (points count: ${trace.points.length})`);
    }
  }

  // 2. Seeds placed at various radii around Coma core (5, 45, -25)
  const comaPos = new THREE.Vector3(5, 45, -25);
  const coreTestRadii = [0.001, 0.1, 0.5, 1.0, 2.0, 2.5, 2.79, 2.81, 3.5];

  for (const r of coreTestRadii) {
    // Seed displaced along +Y
    const seed = comaPos.clone().add(new THREE.Vector3(0, -r, 0));
    const trace = cf.traceStreamline(seed, 80, 0.4);

    for (const p of trace.points) {
      assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), `Finite coordinates at radius ${r}`);
    }

    if (r < 2.8) {
      assert(trace.destination === 'coma-cluster', `Seed at radius ${r} (< 2.8) terminates cleanly at coma-cluster`);
      assert(trace.points.length <= 5, `Seed at radius ${r} terminates quickly`);
    } else {
      // Should still be drawn into Coma since it is close and mass is 2600
      assert(trace.destination === 'coma-cluster', `Seed at radius ${r} (>= 2.8) flows into coma-cluster`);
    }
  }

  // 3. Seeds placed around Great Attractor core (-38, 2, -5)
  const gaPos = new THREE.Vector3(-38, 2, -5);
  for (const r of [0.05, 1.5, 2.75]) {
    const seed = gaPos.clone().add(new THREE.Vector3(r, 0, 0));
    const trace = cf.traceStreamline(seed, 60, 0.5);
    assert(trace.destination === 'great-attractor', `Seed near GA core (r=${r}) terminates at great-attractor`);
    assert(trace.points.length <= 4, `Seed near GA core terminates without singularity`);
  }

  console.log('>>> SUITE 3 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 4: Numerical Integration Edge Case Seeds: Outer Boundaries
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 4: Edge Case Seeds: Far Outside Boundary & Boundary Crossings');

  const outsideSeeds = [
    { name: 'Distant positive (+500, +500, +500)', pos: new THREE.Vector3(500, 500, 500) },
    { name: 'Distant negative (-1000, -200, -800)', pos: new THREE.Vector3(-1000, -200, -800) },
    { name: 'Extreme X (+115, 0, 0)', pos: new THREE.Vector3(115, 0, 0) },
    { name: 'Extreme negative X (-115, 0, 0)', pos: new THREE.Vector3(-115, 0, 0) },
    { name: 'Extreme Y (+80, > 77 threshold)', pos: new THREE.Vector3(0, 80, 0) },
    { name: 'Extreme negative Y (-80)', pos: new THREE.Vector3(0, -80, 0) },
    { name: 'Extreme Z (+115)', pos: new THREE.Vector3(0, 0, 115) },
    { name: 'Extreme negative Z (-115)', pos: new THREE.Vector3(0, 0, -115) },
    { name: 'Diagonal outside (120, 85, 120)', pos: new THREE.Vector3(120, 85, 120) }
  ];

  for (const item of outsideSeeds) {
    const trace = cf.traceStreamline(item.pos, 100, 1.0);
    assert(trace.destination === 'boundary', `Seed ${item.name} destination is 'boundary'`);
    assert(trace.points.length === 1, `Seed ${item.name} halts on step 0 (points length 1)`);
    assert(trace.totalLength === 0, `Seed ${item.name} has totalLength = 0`);
    assert(trace.points[0].x === item.pos.x && trace.points[0].y === item.pos.y && trace.points[0].z === item.pos.z, `Point is exactly seed`);
  }

  // Streamline starting near boundary (e.g. at 108, 0, 0) is gravitationally bound
  const nearBoundarySeed = new THREE.Vector3(108, 0, 0);
  const nearBoundaryTrace = cf.traceStreamline(nearBoundarySeed, 100, 1.5);
  assert(nearBoundaryTrace.destination === 'coma-cluster', 'Seed starting at (108, 0, 0) is gravitationally bound and funneled into coma-cluster');
  assert(nearBoundaryTrace.points.length >= 10, 'Near-boundary trace generates full streamline');

  console.log('>>> SUITE 4 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 5: Zero Mass Attractors & Field Stability
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 5: Zero Mass Attractors & Physical Field Evaluation');

  // Test potential and velocity with a zero-mass attractor added
  const testCf = new CosmicField();
  testCf.attractors.push({
    id: 'zero-mass-node',
    name: 'Zero Mass Test Node',
    position: new THREE.Vector3(10, 15, -10),
    mass: 0,
    softening: 10.0,
    type: 'attractor'
  });

  const pot = testCf.getPotential(10, 15, -10);
  assert(Number.isFinite(pot), 'Potential at zero-mass attractor position is finite number', `pot: ${pot}`);

  const vel = new THREE.Vector3();
  testCf.getVelocity(10, 15, -10, vel);
  assert(Number.isFinite(vel.x) && Number.isFinite(vel.y) && Number.isFinite(vel.z), 'Velocity at zero-mass position is finite vector');

  // Streamline starting near zero-mass attractor
  const zeroMassSeed = new THREE.Vector3(10, 15.5, -10);
  const zeroMassTrace = testCf.traceStreamline(zeroMassSeed, 60, 0.5);
  assert(zeroMassTrace.destination !== 'zero-mass-node', 'Zero-mass attractor does NOT trigger core termination (a.mass > 0 guard holds)');

  // Verify getShaderData handles mass: 0 correctly
  const zeroMassSd = testCf.getShaderData();
  assert(zeroMassSd.uAttractorMasses[5] === 0, 'Zero-mass attractor exports mass = 0 in shader data');

  console.log('>>> SUITE 5 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 6: Step Size Edge Cases: Negative, Zero, and Micro/Macro Step Sizes
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 6: Step Size Edge Cases: Negative, Zero, Micro, and Macro dt');

  const testSeed = new THREE.Vector3(0, 10, 0);

  // 1. Zero step size: dt = 0
  const zeroStepTrace = cf.traceStreamline(testSeed, 50, 0.0);
  assert(zeroStepTrace.destination === 'stagnation', 'dt = 0 immediately terminates with destination "stagnation"');
  assert(zeroStepTrace.points.length === 1, 'dt = 0 terminates with points length 1 without hanging');

  // 2. Micro step size: dt = 0.0001
  const microStepTrace = cf.traceStreamline(testSeed, 50, 0.0001);
  assert(microStepTrace.destination === 'stagnation', 'dt = 0.0001 terminates with stagnation');
  assert(microStepTrace.points.length === 1, 'dt = 0.0001 terminates on first step without freezing');

  // 3. Negative step sizes: dt = -0.5, -1.0
  const negTrace1 = cf.traceStreamline(testSeed, 80, -0.5);
  assert(Array.isArray(negTrace1.points) && negTrace1.points.length > 0, 'Negative step size dt = -0.5 produces points array');
  for (const p of negTrace1.points) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), 'Negative step size produces finite coordinates');
  }
  assert(['boundary', 'stagnation', 'great-attractor', 'shapley-basin', 'dipole-repeller', 'perseus-pisces', 'coma-cluster'].includes(negTrace1.destination),
    `Negative step size destination is valid (${negTrace1.destination})`);

  const negTrace2 = cf.traceStreamline(new THREE.Vector3(30, -2, 16), 80, -0.8);
  for (const p of negTrace2.points) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), 'Reverse trace near repeller is finite');
  }

  // 4. Large step size: dt = 25.0, 50.0
  const largeStepTrace = cf.traceStreamline(testSeed, 20, 25.0);
  for (const p of largeStepTrace.points) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), 'Large step size dt = 25.0 produces finite coordinates');
  }
  assert(largeStepTrace.destination === 'boundary' || largeStepTrace.destination !== '', 'Large step terminates cleanly');

  // 5. Large maxSteps: 5000 steps stress test
  const saddleSeed = new THREE.Vector3(-10, 5, -15);
  const deepTrace = cf.traceStreamline(saddleSeed, 5000, 0.8);
  assert(deepTrace.points.length < 5000, `Streamline terminates in ${deepTrace.points.length} < 5000 steps`);
  assert(deepTrace.destination !== '', 'Streamline reaches a definitive destination');

  console.log('>>> SUITE 6 PASSED.\n');

  // -------------------------------------------------------------------------
  // SUITE 7: Random Coordinate Fuzzing & StreamlineRenderer Robustness
  // -------------------------------------------------------------------------
  console.log('>>> SUITE 7: Coordinate Fuzzing (500 Seeds) & StreamlineRenderer Invariants');

  let fuzzPassed = 0;
  for (let f = 0; f < 500; f++) {
    const rx = (Math.random() - 0.5) * 240;
    const ry = (Math.random() - 0.5) * 160;
    const rz = (Math.random() - 0.5) * 240;
    const seed = new THREE.Vector3(rx, ry, rz);

    const trace = cf.traceStreamline(seed, 120, 0.9);

    let valid = true;
    for (const p of trace.points) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
        valid = false;
        break;
      }
    }
    if (valid && typeof trace.totalLength === 'number' && Number.isFinite(trace.totalLength)) {
      fuzzPassed++;
    }
  }
  assert(fuzzPassed === 500, '500 random fuzzed seeds across [-120, 120]^3 all produced valid, finite streamlines');

  // StreamlineRenderer robustness
  const sr = new StreamlineRenderer(cf, { streamlineCount: 150 });
  assert(sr.streamlineData.length > 0, 'StreamlineRenderer generates valid streamlineData');
  assert(sr.lineSegmentsMesh instanceof THREE.LineSegments, 'StreamlineRenderer creates LineSegments');

  // Test setStreamlineCount to small and large values
  sr.setStreamlineCount(20);
  assert(sr.streamlineCount === 20, 'setStreamlineCount(20) succeeds');
  sr.setStreamlineCount(350);
  assert(sr.streamlineCount === 350, 'setStreamlineCount(350) succeeds');

  // Color ramp extreme inputs
  const cLow = sr.sampleColor(-5.0, false);
  const cHigh = sr.sampleColor(5.0, false);
  const cLowComa = sr.sampleColor(-1.0, true);
  const cHighComa = sr.sampleColor(2.0, true);

  assert(cLow.r >= 0 && cLow.r <= 1, 'sampleColor clamped on low t');
  assert(cHigh.r >= 0 && cHigh.r <= 1, 'sampleColor clamped on high t');
  assert(cLowComa.r >= 0 && cLowComa.r <= 1, 'sampleColor clamped on low t for Coma');
  assert(cHighComa.r >= 0 && cHighComa.r <= 1, 'sampleColor clamped on high t for Coma');

  console.log('>>> SUITE 7 PASSED.\n');

  console.log('================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified.`);
  console.log('================================================================');
} catch (err) {
  console.error('\nADVERSARIAL STRESS TEST SUITE ENCOUNTERED A FAILURE:');
  console.error(err);
  process.exit(1);
}
