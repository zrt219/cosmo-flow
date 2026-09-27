import * as THREE from 'three';
import { CosmicField } from '../src/physics/CosmicField.js';
import { SlicePlaneMesh } from '../src/renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from '../src/renderers/StreamlineRenderer.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (!condition) {
    failedTests++;
    const errMsg = `❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`;
    console.error(errMsg);
    failures.push({ message, details });
    return false;
  }
  passedTests++;
  console.log(`  ✅ PASS: ${message}`);
  return true;
}

function approxEqual(a, b, eps = 1e-4) {
  return Math.abs(a - b) <= eps;
}

console.log('================================================================');
console.log('CHALLENGER M2-1: EMPIRICAL ADVERSARIAL STRESS SUITE (MILESTONE M2)');
console.log('================================================================\n');

// ====================================================================
// SUITE 1: Coma Attractor Registration, Gravitational Potential & Field Invariants
// ====================================================================
console.log('--- SUITE 1: Coma Attractor Registration, Field Potential & Invariants ---');
{
  const field = new CosmicField();

  // Test 1.1: Verify Coma cluster properties
  const coma = field.attractors.find(a => a.id === 'coma-cluster');
  assert(!!coma, 'Coma cluster is present in attractors registry');
  assert(coma && coma.position.x === 5 && coma.position.y === 45 && coma.position.z === -25,
    'Coma position is exactly (5, 45, -25) matching R2 specification',
    `got (${coma?.position.x}, ${coma?.position.y}, ${coma?.position.z})`);
  assert(coma && coma.mass === 2600, 'Coma mass is 2600 (strong positive attractor)', `got ${coma?.mass}`);
  assert(coma && coma.softening === 14.0, 'Coma softening is 14.0', `got ${coma?.softening}`);
  assert(coma && coma.type === 'attractor', 'Coma type is attractor', `got ${coma?.type}`);

  // Test 1.2: Potential and Acceleration Invariant toward Coma
  const probePoint = new THREE.Vector3(5, 10, -25);
  const vel = field.getVelocity(probePoint.x, probePoint.y, probePoint.z);
  assert(vel.y > 0, 'Vertical peculiar velocity Vy is strongly positive below Coma', `Vy = ${vel.y.toFixed(4)}`);
  assert(Number.isFinite(vel.x) && Number.isFinite(vel.y) && Number.isFinite(vel.z),
    'Velocity vector components are strictly finite numbers at probe point');

  // Test 1.3: Potential decreases as we approach Coma from below along Y
  const phiLower = field.getPotential(5, 10, -25);
  const phiMid = field.getPotential(5, 25, -25);
  const phiNear = field.getPotential(5, 40, -25);
  const phiAtCore = field.getPotential(5, 45, -25);
  assert(phiMid < phiLower, 'Potential decreases ascending toward Coma (Phi(Y=25) < Phi(Y=10))',
    `Phi(25)=${phiMid.toFixed(2)} vs Phi(10)=${phiLower.toFixed(2)}`);
  assert(phiNear < phiMid, 'Potential decreases ascending toward Coma (Phi(Y=40) < Phi(Y=25))',
    `Phi(40)=${phiNear.toFixed(2)} vs Phi(25)=${phiMid.toFixed(2)}`);
  assert(phiAtCore < phiNear, 'Potential well reaches minimum at Coma core (Phi(Y=45) < Phi(Y=40))',
    `Phi(45)=${phiAtCore.toFixed(2)} vs Phi(40)=${phiNear.toFixed(2)}`);

  // Test 1.4: Strict Gradient Invariant along RK4 streamline (Physical Invariant: dPhi/dt <= 0)
  const testSeed = new THREE.Vector3(10, 5, -20);
  const traceResult = field.traceStreamline(testSeed, 100, 0.8);
  let potentialViolations = 0;
  let maxPotentialIncrease = 0;
  for (let i = 1; i < traceResult.points.length; i++) {
    const pPrev = traceResult.points[i - 1];
    const pCurr = traceResult.points[i];
    const phiPrev = field.getPotential(pPrev.x, pPrev.y, pPrev.z);
    const phiCurr = field.getPotential(pCurr.x, pCurr.y, pCurr.z);
    if (phiCurr > phiPrev + 1e-2) {
      potentialViolations++;
      const inc = phiCurr - phiPrev;
      if (inc > maxPotentialIncrease) maxPotentialIncrease = inc;
    }
  }
  assert(potentialViolations === 0,
    'Potential is strictly non-increasing along RK4 streamline (Physical Gradient Invariant)',
    `violations: ${potentialViolations}, maxIncrease: ${maxPotentialIncrease}`);

  // Test 1.5: Core termination across all attractors
  for (const att of field.attractors) {
    if (att.mass > 0) {
      const nearPos = att.position.clone().add(new THREE.Vector3(1.0, 0.5, 0.5));
      const res = field.traceStreamline(nearPos, 20, 0.5);
      assert(res.destination === att.id,
        `Core termination identifies correct attractor: ${att.id}`,
        `destination: ${res.destination}`);
    }
  }
}

// ====================================================================
// SUITE 2: Empirical Trajectory Stress Testing for Coma Fountain Loops
// ====================================================================
console.log('\n--- SUITE 2: Empirical Trajectory Stress Testing for Coma Fountain Loops ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field, { streamlineCount: 300, showComaLoops: true });

  // Test 2.1: Verify seeds in Northern Coma launch corridor
  const seeds = renderer.generateSeeds();
  assert(seeds.length === 300, 'generateSeeds produces exactly requested count (300)');
  const comaSeeds = seeds.filter(s => s.x >= 2 && s.x <= 22 && s.y >= -2 && s.y <= 10 && s.z >= -32 && s.z <= -10);
  assert(comaSeeds.length >= 60, 'Coma corridor holds at least 20% of seeds (>= 60/300)', `got ${comaSeeds.length}`);

  // Test 2.2: Systematic grid sampling of Northern Launch Corridor to verify Y > 40 reach
  let totalGridSeeds = 0;
  let comaDestCount = 0;
  let reachedHighYCount = 0;
  let absoluteMaxY = -Infinity;
  let minComaMaxY = Infinity;

  for (let x = 4; x <= 20; x += 4) {
    for (let y = 0; y <= 8; y += 4) {
      for (let z = -30; z <= -12; z += 4) {
        totalGridSeeds++;
        const pt = new THREE.Vector3(x, y, z);
        const res = field.traceStreamline(pt, 200, 0.92);
        let maxY = -Infinity;
        for (const p of res.points) {
          if (p.y > maxY) maxY = p.y;
        }
        if (maxY > absoluteMaxY) absoluteMaxY = maxY;
        if (maxY >= 40.0) reachedHighYCount++;
        if (res.destination === 'coma-cluster') {
          comaDestCount++;
          if (maxY < minComaMaxY) minComaMaxY = maxY;
        }
      }
    }
  }

  assert(absoluteMaxY > 40.0,
    `Coma fountain trajectories achieve peak Y > 40.0 (max Y = ${absoluteMaxY.toFixed(2)} > 40.0)`);
  assert(reachedHighYCount / totalGridSeeds >= 0.50,
    `Majority of Northern corridor seeds reach Y >= 40.0 (${reachedHighYCount}/${totalGridSeeds} = ${(reachedHighYCount / totalGridSeeds * 100).toFixed(1)}%)`);
  assert(comaDestCount > 0,
    `Streams cleanly terminate in 'coma-cluster' destination (${comaDestCount}/${totalGridSeeds} terminated at Coma core)`);
  assert(minComaMaxY >= 42.0,
    `All Coma-terminating streams reach at least Y >= 42.0 before core cutoff (min peak Y = ${minComaMaxY.toFixed(2)})`);

  // Test 2.3: Verification of streamlineData in StreamlineRenderer
  let renderedComaCount = 0;
  let maxRenderedY = -Infinity;
  let comaDestinationsInRenderer = 0;
  for (const s of renderer.streamlineData) {
    if (s.isComaLoop) {
      renderedComaCount++;
      if (s.destination === 'coma-cluster') comaDestinationsInRenderer++;
      for (const p of s.points) {
        if (p.y > maxRenderedY) maxRenderedY = p.y;
      }
    }
  }
  assert(renderedComaCount >= 40,
    `StreamlineRenderer generates substantial Coma fountain loops (${renderedComaCount} loops)`);
  assert(maxRenderedY > 44.0,
    `StreamlineRenderer Coma loops arch high above core (peak Y = ${maxRenderedY.toFixed(2)} > 44.0)`);
  assert(comaDestinationsInRenderer > 0,
    `StreamlineRenderer Coma loops terminate at coma-cluster core (${comaDestinationsInRenderer} loops)`);

  // Test 2.4: Arc length consistency along streamlines
  let arcLengthMonotonic = true;
  let arcLengthMatchesTotal = true;
  for (const s of renderer.streamlineData) {
    for (let k = 1; k < s.arcLengths.length; k++) {
      if (s.arcLengths[k] < s.arcLengths[k - 1]) {
        arcLengthMonotonic = false;
        break;
      }
    }
    const lastArc = s.arcLengths[s.arcLengths.length - 1];
    if (Math.abs(lastArc - s.totalLength) > 1e-3) {
      arcLengthMatchesTotal = false;
    }
  }
  assert(arcLengthMonotonic, 'All streamline arc lengths are strictly monotonically increasing');
  assert(arcLengthMatchesTotal, 'Final cumulative arc length exactly matches totalLength for all streamlines');
}

// ====================================================================
// SUITE 3: 8-Stop Scientific Color Ramp Verification & Color Science
// ====================================================================
console.log('\n--- SUITE 3: 8-Stop Scientific Color Ramp Verification & Color Science ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field);

  // Exact reference color stops:
  const expectedStops = [
    { t: 0.00, hex: '0033cc', name: 'Deep royal blue' },
    { t: 0.14, hex: '0080ff', name: 'Azure blue' },
    { t: 0.28, hex: '00d4ff', name: 'Electric cyan' },
    { t: 0.42, hex: 'cce8ff', name: 'Ice white' },
    { t: 0.55, hex: 'ffffff', name: 'Crisp silvery-white' },
    { t: 0.70, hex: 'ffc233', name: 'Warm radiant gold' },
    { t: 0.85, hex: 'ff6600', name: 'Deep glowing amber' },
    { t: 1.00, hex: 'dc1400', name: 'Crimson red' }
  ];

  for (const stop of expectedStops) {
    const col = renderer.sampleColor(stop.t, false);
    const hex = col.getHexString();
    assert(hex === stop.hex,
      `Stop at t=${stop.t.toFixed(2)} (${stop.name}) matches exact hex #${stop.hex}`,
      `actual: #${hex}`);
  }

  // Test 3.2: Coma Loop Color Stops
  const expectedComaStops = [
    { t: 0.00, hex: 'dceeff', name: 'Pale silvery blue-white base' },
    { t: 0.20, hex: 'f4f9ff', name: 'Silvery-white ascent' },
    { t: 0.65, hex: 'ffffff', name: 'Brilliant silvery-white arch' },
    { t: 0.85, hex: 'ffdd66', name: 'Warm luminous gold transition' },
    { t: 1.00, hex: 'ffc233', name: 'Warm radiant gold cap' }
  ];

  for (const stop of expectedComaStops) {
    const col = renderer.sampleColor(stop.t, true);
    const hex = col.getHexString();
    assert(hex === stop.hex,
      `Coma stop at t=${stop.t.toFixed(2)} (${stop.name}) matches exact hex #${stop.hex}`,
      `actual: #${hex}`);
  }

  // Test 3.3: High-resolution continuity test across 1000 sample points
  let maxColorDelta = 0;
  const numSteps = 1000;
  let prevColor = renderer.sampleColor(0, false);
  let isContinuous = true;

  for (let s = 1; s <= numSteps; s++) {
    const t = s / numSteps;
    const currColor = renderer.sampleColor(t, false);
    const delta = Math.sqrt(
      (currColor.r - prevColor.r) ** 2 +
      (currColor.g - prevColor.g) ** 2 +
      (currColor.b - prevColor.b) ** 2
    );
    if (delta > maxColorDelta) maxColorDelta = delta;
    if (delta > 0.02) {
      isContinuous = false;
    }
    prevColor = currColor;
  }
  assert(isContinuous, 'Scientific color ramp is smooth and continuous across 1000 steps',
    `max step delta: ${maxColorDelta.toFixed(5)}`);

  // Test 3.4: Boundary Clamping & Fuzzing on sampleColor
  const colNeg = renderer.sampleColor(-1.0, false);
  assert(colNeg.getHexString() === '0033cc', 'Negative t clamps to t=0 (#0033cc)');
  const colAbove = renderer.sampleColor(2.5, false);
  assert(colAbove.getHexString() === 'dc1400', 't > 1 clamps to t=1 (#dc1400)');
  const colNaN = renderer.sampleColor(NaN, false);
  assert(Number.isFinite(colNaN.r) && Number.isFinite(colNaN.g) && Number.isFinite(colNaN.b),
    'NaN input to sampleColor does not yield NaN color components');

  // Test 3.5: Geometry Vertex Colors Inspection
  const colAttr = renderer.lineSegmentsMesh.geometry.attributes.color;
  assert(colAttr.count > 0, `LineSegments mesh has ${colAttr.count} colored vertices`);
  let allFiniteColors = true;
  let minComponent = Infinity;
  let maxComponent = -Infinity;
  for (let i = 0; i < colAttr.array.length; i++) {
    const val = colAttr.array[i];
    if (!Number.isFinite(val) || val < 0.0 || val > 1.0) {
      allFiniteColors = false;
      break;
    }
    if (val < minComponent) minComponent = val;
    if (val > maxComponent) maxComponent = val;
  }
  assert(allFiniteColors, 'All vertex color buffer values are finite and strictly bounded in [0.0, 1.0]',
    `min: ${minComponent.toFixed(3)}, max: ${maxComponent.toFixed(3)}`);
}

// ====================================================================
// SUITE 4: Flow Cone Arrowhead Animation & 3D Transform Verification
// ====================================================================
console.log('\n--- SUITE 4: Flow Cone Arrowhead Animation & 3D Transform Verification ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field, { streamlineCount: 250 });

  assert(renderer.arrowMesh instanceof THREE.InstancedMesh, 'arrowMesh is THREE.InstancedMesh');
  assert(renderer.arrowCount > 0, `arrowCount is positive (${renderer.arrowCount})`);

  // Test 4.1: Inspect Arrow Instance Matrices for Validity
  renderer.updateArrowTransforms(0.0);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  let matrixErrors = 0;
  let upwardComaCones = 0;

  for (let i = 0; i < renderer.arrowCount; i++) {
    renderer.arrowMesh.getMatrixAt(i, matrix);

    const elements = matrix.elements;
    let hasNaN = false;
    for (let e = 0; e < 16; e++) {
      if (!Number.isFinite(elements[e])) {
        hasNaN = true;
        break;
      }
    }
    if (hasNaN) {
      matrixErrors++;
      continue;
    }

    matrix.decompose(position, quaternion, scale);

    const qLenSq = quaternion.lengthSq();
    if (Math.abs(qLenSq - 1.0) > 1e-3) {
      matrixErrors++;
    }

    if (Math.abs(scale.x - renderer.arrowScale) > 1e-4) {
      matrixErrors++;
    }

    if (position.y > 35.0) {
      const worldDir = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
      if (worldDir.y > 0.1) {
        upwardComaCones++;
      }
    }
  }

  assert(matrixErrors === 0, 'All arrow instance matrices are valid (finite, unit quaternions, correct scale)');
  assert(upwardComaCones > 0,
    `Flow cones on high-latitude Coma arches point upward along trajectory (${upwardComaCones} ascending cones verified)`);

  // Test 4.2: Animation Scrubbing and Forward Flow Propagation
  renderer.updateArrowTransforms(0.0);
  renderer.arrowMesh.getMatrixAt(0, matrix);
  matrix.decompose(position, quaternion, scale);
  const posAt0 = position.clone();

  renderer.updateArrowTransforms(5.0);
  renderer.arrowMesh.getMatrixAt(0, matrix);
  matrix.decompose(position, quaternion, scale);
  const posAt5 = position.clone();

  const distTraveled = posAt0.distanceTo(posAt5);
  assert(distTraveled > 0.05,
    'Flow cones physically advance along streamlines under animation',
    `distance moved = ${distTraveled.toFixed(3)} units`);

  // Test 4.3: Robustness under extreme time offsets
  let extremeOffsetsSurvives = true;
  try {
    renderer.updateArrowTransforms(-100.0);
    renderer.updateArrowTransforms(0.0);
    renderer.updateArrowTransforms(1e6);
  } catch (err) {
    extremeOffsetsSurvives = false;
  }
  assert(extremeOffsetsSurvives, 'updateArrowTransforms handles negative and extreme time offsets without crashing');

  renderer.arrowMesh.getMatrixAt(0, matrix);
  let finiteAfterExtreme = true;
  for (let e = 0; e < 16; e++) {
    if (!Number.isFinite(matrix.elements[e])) finiteAfterExtreme = false;
  }
  assert(finiteAfterExtreme, 'Instance matrices remain strictly finite after extreme time offset execution');
}

// ====================================================================
// SUITE 5: SlicePlaneMesh Shader Uniforms & Data Packing Stress
// ====================================================================
console.log('\n--- SUITE 5: SlicePlaneMesh Shader Uniforms & Data Packing ---');
{
  const field = new CosmicField();
  const slicePlane = new SlicePlaneMesh(field);

  // Test 5.1: Uniform data length and packing
  const uPos = slicePlane.uniforms.uAttractorPositions.value;
  const uMass = slicePlane.uniforms.uAttractorMasses.value;
  const uSoft = slicePlane.uniforms.uAttractorSoftenings.value;
  const uCount = slicePlane.uniforms.uAttractorCount.value;

  assert(uPos.length === 18, 'uAttractorPositions length is 18 (6 attractors * 3 floats)');
  assert(uMass.length === 6, 'uAttractorMasses length is 6');
  assert(uSoft.length === 6, 'uAttractorSoftenings length is 6');
  assert(uCount === 5, 'uAttractorCount matches registered attractors (5)');

  // Test 5.2: Verify Coma is correctly encoded in uniform arrays at index 4 (stride 3)
  const comaX = uPos[4 * 3 + 0];
  const comaY = uPos[4 * 3 + 1];
  const comaZ = uPos[4 * 3 + 2];
  const comaM = uMass[4];
  const comaS = uSoft[4];

  assert(comaX === 5 && comaY === 45 && comaZ === -25,
    'Coma position in shader uniform matches (5, 45, -25)',
    `got (${comaX}, ${comaY}, ${comaZ})`);
  assert(comaM === 2600, 'Coma mass in shader uniform is 2600', `got ${comaM}`);
  assert(comaS === 14.0, 'Coma softening in shader uniform is 14.0', `got ${comaS}`);

  // Test 5.3: Dummy slot 5 is zeroed to prevent ghost attractors
  assert(uMass[5] === 0, 'Unused 6th attractor slot has mass 0', `got ${uMass[5]}`);

  // Test 5.4: update() and setSliceY() methods
  slicePlane.setSliceY(45.0);
  assert(slicePlane.planeMesh.position.y === 45.0, 'setSliceY(45.0) sets plane position to Y=45.0');
  assert(approxEqual(slicePlane.border.position.y, 45.05), 'Border position correctly tracks plane Y + 0.05');

  slicePlane.update();
  assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'update() maintains length 18 array');
}

// ====================================================================
// SUITE 6: Adversarial Edge Cases & Fuzzing
// ====================================================================
console.log('\n--- SUITE 6: Adversarial Edge Cases & Dynamic Toggles ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field, { streamlineCount: 150 });

  // Test 6.1: Rapid dynamic toggle of Coma loops
  let toggleSuccess = true;
  for (let cycle = 0; cycle < 10; cycle++) {
    renderer.setShowComaLoops(false);
    if (renderer.showComaLoops !== false) toggleSuccess = false;
    renderer.setShowComaLoops(true);
    if (renderer.showComaLoops !== true) toggleSuccess = false;
  }
  assert(toggleSuccess, 'Rapid dynamic toggling of showComaLoops is 100% stable');

  // Test 6.2: Low and high streamline counts
  renderer.setStreamlineCount(20);
  assert(renderer.streamlineData.length > 0, 'Renderer succeeds with minimal streamlineCount (20)');
  renderer.setStreamlineCount(400);
  assert(renderer.streamlineData.length > 200, 'Renderer scales cleanly to high streamlineCount (400)');

  // Test 6.3: Arrow visibility toggles
  renderer.setShowArrows(false);
  assert(renderer.arrowMesh.visible === false, 'setShowArrows(false) hides arrowMesh');
  renderer.setShowArrows(true);
  assert(renderer.arrowMesh.visible === true, 'setShowArrows(true) shows arrowMesh');

  // Test 6.4: Line opacity bounds
  renderer.setLineOpacity(0.4);
  assert(renderer.lineMaterial.opacity === 0.4, 'setLineOpacity(0.4) updates material opacity');

  // Test 6.5: animate() with 1,000 rapid calls
  let animSurvived = true;
  try {
    for (let frame = 0; frame < 1000; frame++) {
      renderer.animate(0.016, frame * 0.016);
    }
  } catch (err) {
    animSurvived = false;
  }
  assert(animSurvived, '1,000 rapid animation frames executed with zero errors');
}

// ====================================================================
// SUITE 7: Singularity, Extreme Boundary & Mutability Attacks
// ====================================================================
console.log('\n--- SUITE 7: Singularity, Extreme Boundary & Mutability Attacks ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field, { streamlineCount: 50 });

  // Test 7.1: Mutability attack on sampleColor
  // Verify mutating the returned color object does not corrupt subsequent samples
  const c1 = renderer.sampleColor(0.55, false);
  c1.setRGB(0, 0, 0); // Mutate returned instance
  const c2 = renderer.sampleColor(0.55, false);
  assert(c2.getHexString() === 'ffffff', 'sampleColor returns independent copy; stop array is immutable to caller mutations');

  const cComa1 = renderer.sampleColor(1.0, true);
  cComa1.setRGB(0, 0, 0);
  const cComa2 = renderer.sampleColor(1.0, true);
  assert(cComa2.getHexString() === 'ffc233', 'Coma sampleColor returns independent copy; stop array is immutable');

  // Test 7.2: Seeding directly on attractor core singularities
  for (const att of field.attractors) {
    const res = field.traceStreamline(att.position.clone(), 50, 0.5);
    assert(res.points.length >= 1, `Streamline seeded at ${att.id} core initializes safely`);
    assert(Number.isFinite(res.points[0].x) && Number.isFinite(res.points[0].y) && Number.isFinite(res.points[0].z),
      `Coordinates at ${att.id} core are finite`);
    if (att.mass > 0) {
      assert(res.destination === att.id, `Seed at ${att.id} immediately flags destination as ${att.id}`);
    }
  }

  // Test 7.3: Extreme initial positions (10,000 units away)
  const farSeed = new THREE.Vector3(10000, 10000, 10000);
  const farRes = field.traceStreamline(farSeed, 50, 1.0);
  assert(farRes.destination === 'boundary', 'Streamline seeded outside domain exits immediately with destination: boundary');
  assert(farRes.points.length === 1, 'Far seed produces exactly 1 point without infinite loop');

  // Test 7.4: Zero and negative stepSize robustness
  const zeroStepRes = field.traceStreamline(new THREE.Vector3(10, 0, 10), 10, 0.0);
  assert(zeroStepRes.destination === 'stagnation', 'Streamline with dt=0 halts safely with destination: stagnation');

  // Test 7.5: maxSteps = 0
  const zeroMaxSteps = field.traceStreamline(new THREE.Vector3(10, 0, 10), 0, 1.0);
  assert(zeroMaxSteps.points.length === 1, 'maxSteps=0 terminates cleanly returning initial seed');
}

// ====================================================================
// SUITE 8: Rebuild & Resource Lifecycle Attacks
// ====================================================================
console.log('\n--- SUITE 8: Rebuild & Resource Lifecycle Attacks ---');
{
  const field = new CosmicField();
  const renderer = new StreamlineRenderer(field, { streamlineCount: 60 });

  // Test 8.1: Continuous rapid rebuilds (simulating dynamic GUI slider dragging)
  let rebuildSuccess = true;
  try {
    for (let i = 0; i < 20; i++) {
      renderer.setStreamlineCount(30 + i * 2);
    }
  } catch (err) {
    rebuildSuccess = false;
  }
  assert(rebuildSuccess, '20 sequential rebuild cycles succeed without throwing or crashing');
  assert(renderer.lineSegmentsMesh.geometry.attributes.position.count > 0, 'Post-rebuild LineSegments geometry is fully populated');
  assert(renderer.arrowMesh.count === renderer.arrowCount, 'Post-rebuild InstancedMesh count matches arrowCount');

  // Test 8.2: Arrow scale adjustments
  renderer.setArrowScale(2.5);
  assert(renderer.arrowScale === 2.5, 'setArrowScale(2.5) updates scale property');
  assert(renderer.arrowMesh instanceof THREE.InstancedMesh, 'arrowMesh successfully recreated after scale change');
}

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n================================================================');
console.log(`CHALLENGER M2-1 SUMMARY: ${passedTests} / ${totalTests} assertions PASSED`);
if (failedTests > 0) {
  console.log(`⚠️ FAILURES: ${failedTests}`);
  for (const f of failures) {
    console.log(`  - ${f.message}: ${f.details}`);
  }
} else {
  console.log('🌟 ALL EMPIRICAL CHALLENGES PASSED WITH ZERO FAILURES!');
}
console.log('================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);

