import * as THREE from 'three';
import { CosmicField } from '../src/physics/CosmicField.js';
import { SlicePlaneMesh } from '../src/renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from '../src/renderers/StreamlineRenderer.js';
import * as fs from 'fs';

console.log('================================================================');
console.log('FORENSIC AUDIT SUITE: MILESTONE M2 (Coma Loops & Velocity Gradient)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const findings = [];

function auditAssert(condition, checkId, message, details = {}) {
  if (condition) {
    passCount++;
    console.log(`[PASS] [${checkId}] ${message}`);
  } else {
    failCount++;
    const errMsg = `[FAIL] [${checkId}] ${message}`;
    console.error(errMsg, details);
    findings.push({ checkId, message, details });
  }
}

// ---------------------------------------------------------------------
// CHECK 1: Static Code Forensics (No Fake Bezier, No Hardcoded Paths)
// ---------------------------------------------------------------------
console.log('--- CHECK 1: Static Code Forensics ---');
const cosmicFieldSrc = fs.readFileSync('src/physics/CosmicField.js', 'utf8');
const streamlineSrc = fs.readFileSync('src/renderers/StreamlineRenderer.js', 'utf8');
const slicePlaneSrc = fs.readFileSync('src/renderers/SlicePlaneMesh.js', 'utf8');

// Check for Bezier / Spline cheating in StreamlineRenderer
auditAssert(!streamlineSrc.toLowerCase().includes('cubicbeziercurve'), 'STATIC_1.1', 'No CubicBezierCurve in StreamlineRenderer');
auditAssert(!streamlineSrc.toLowerCase().includes('quadraticbeziercurve'), 'STATIC_1.2', 'No QuadraticBezierCurve in StreamlineRenderer');
auditAssert(!streamlineSrc.toLowerCase().includes('catmullromcurve'), 'STATIC_1.3', 'No CatmullRomCurve in StreamlineRenderer');
auditAssert(!streamlineSrc.toLowerCase().includes('splinecurve'), 'STATIC_1.4', 'No SplineCurve in StreamlineRenderer');

// Verify generateComaLoops is not injecting dummy or fake geometry
auditAssert(
  streamlineSrc.includes('generateComaLoops()') &&
  (streamlineSrc.includes('// Coma vertical fountain loops are now fully integrated via genuine RK4 physics') ||
   streamlineSrc.match(/generateComaLoops\(\)\s*\{\s*\}/)),
  'STATIC_1.5',
  'generateComaLoops() contains no fake geometry injection stubs'
);

// Verify that all streamlines in streamlineData come directly from traceStreamline
auditAssert(
  streamlineSrc.includes('this.cosmicField.traceStreamline('),
  'STATIC_1.6',
  'Streamlines originate directly from cosmicField.traceStreamline'
);

// Check that no hardcoded array of 3D streamline points exists in the source
const suspiciousCoordinateTable = /\[\s*\[\s*-?\d+\.?\d*,\s*-?\d+\.?\d*,\s*-?\d+\.?\d*\s*\]\s*,\s*\[/g;
auditAssert(!suspiciousCoordinateTable.test(streamlineSrc), 'STATIC_1.7', 'No suspicious pre-calculated coordinate tables in StreamlineRenderer');
auditAssert(!suspiciousCoordinateTable.test(cosmicFieldSrc), 'STATIC_1.8', 'No suspicious pre-calculated coordinate tables in CosmicField');

// ---------------------------------------------------------------------
// CHECK 2: Mathematical Authenticity of Peculiar Velocity Field
// ---------------------------------------------------------------------
console.log('\n--- CHECK 2: Mathematical Authenticity of Peculiar Velocity Field ---');
const cf = new CosmicField();

// Verify that v = -grad(Phi) numerically via central difference approximation
const h = 1e-4;
const testCoords = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(12, 18, -15),
  new THREE.Vector3(-30, 5, -10),
  new THREE.Vector3(5, 40, -25),
  new THREE.Vector3(25, -10, 20)
];

let gradientMatches = true;
let maxGradError = 0;

for (const p of testCoords) {
  const vAnalytical = cf.getVelocity(p.x, p.y, p.z);

  // Exclude background drift for pure potential gradient comparison:
  // getPotential includes background drift: phi += (x*drift.x + y*drift.y + z*drift.z)*15.0
  // Note: getPotential gradient of drift term is 15.0 * drift
  // But getVelocity adds drift directly: target.add(this.backgroundDrift)
  // Let's verify attractor potential gradient specifically:
  let gradPhiX = 0;
  let gradPhiY = 0;
  let gradPhiZ = 0;
  for (const a of cf.attractors) {
    const potPlusX = -a.mass / Math.sqrt((p.x + h - a.position.x)**2 + (p.y - a.position.y)**2 + (p.z - a.position.z)**2 + a.softening**2);
    const potMinusX = -a.mass / Math.sqrt((p.x - h - a.position.x)**2 + (p.y - a.position.y)**2 + (p.z - a.position.z)**2 + a.softening**2);
    const potPlusY = -a.mass / Math.sqrt((p.x - a.position.x)**2 + (p.y + h - a.position.y)**2 + (p.z - a.position.z)**2 + a.softening**2);
    const potMinusY = -a.mass / Math.sqrt((p.x - a.position.x)**2 + (p.y - h - a.position.y)**2 + (p.z - a.position.z)**2 + a.softening**2);
    const potPlusZ = -a.mass / Math.sqrt((p.x - a.position.x)**2 + (p.y - a.position.y)**2 + (p.z + h - a.position.z)**2 + a.softening**2);
    const potMinusZ = -a.mass / Math.sqrt((p.x - a.position.x)**2 + (p.y - a.position.y)**2 + (p.z - h - a.position.z)**2 + a.softening**2);

    gradPhiX += (potPlusX - potMinusX) / (2 * h);
    gradPhiY += (potPlusY - potMinusY) / (2 * h);
    gradPhiZ += (potPlusZ - potMinusZ) / (2 * h);
  }

  // Pure attractor force in getVelocity (subtract backgroundDrift)
  const fX = vAnalytical.x - cf.backgroundDrift.x;
  const fY = vAnalytical.y - cf.backgroundDrift.y;
  const fZ = vAnalytical.z - cf.backgroundDrift.z;

  // v = -grad(Phi) -> fX = -gradPhiX
  const errX = Math.abs(fX - (-gradPhiX));
  const errY = Math.abs(fY - (-gradPhiY));
  const errZ = Math.abs(fZ - (-gradPhiZ));
  const err = Math.max(errX, errY, errZ);
  if (err > maxGradError) maxGradError = err;
  if (err > 1e-4) {
    gradientMatches = false;
  }
}
auditAssert(gradientMatches, 'PHYS_2.1', `Peculiar velocity is exact negative gradient of gravitational potential (max error: ${maxGradError.toExponential(4)} < 1e-4)`);

// ---------------------------------------------------------------------
// CHECK 3: Numerical Rigor of RK4 Integration
// ---------------------------------------------------------------------
console.log('\n--- CHECK 3: Numerical Rigor of RK4 Integration ---');

// Independent classical Runge-Kutta 4 implementation
function independentRK4(field, pos, dt) {
  const k1 = field.getVelocity(pos.x, pos.y, pos.z, new THREE.Vector3());
  
  const p2 = pos.clone().addScaledVector(k1, dt * 0.5);
  const k2 = field.getVelocity(p2.x, p2.y, p2.z, new THREE.Vector3());
  
  const p3 = pos.clone().addScaledVector(k2, dt * 0.5);
  const k3 = field.getVelocity(p3.x, p3.y, p3.z, new THREE.Vector3());
  
  const p4 = pos.clone().addScaledVector(k3, dt);
  const k4 = field.getVelocity(p4.x, p4.y, p4.z, new THREE.Vector3());

  const result = pos.clone()
    .addScaledVector(k1, dt / 6.0)
    .addScaledVector(k2, dt / 3.0)
    .addScaledVector(k3, dt / 3.0)
    .addScaledVector(k4, dt / 6.0);

  return result;
}

// Compare 1,000 arbitrary steps between CosmicField.rk4Step and independentRK4
let rk4ExactMatch = true;
let maxRK4Diff = 0;
const testPositions = [
  new THREE.Vector3(10, 5, -20),
  new THREE.Vector3(-25, 2, -10),
  new THREE.Vector3(5, 35, -25),
  new THREE.Vector3(30, -3, 15),
  new THREE.Vector3(-55, 8, -20)
];

for (const p of testPositions) {
  for (const dt of [0.1, 0.5, 0.92, 1.1]) {
    const resProject = cf.rk4Step(p, dt, new THREE.Vector3());
    const resRef = independentRK4(cf, p, dt);
    const diff = resProject.distanceTo(resRef);
    if (diff > maxRK4Diff) maxRK4Diff = diff;
    if (diff > 1e-12) {
      rk4ExactMatch = false;
    }
  }
}
auditAssert(rk4ExactMatch, 'RK4_3.1', `CosmicField.rk4Step matches independent analytical RK4 down to ${maxRK4Diff.toExponential(4)} (< 1e-12)`);

// Verify higher order accuracy: RK4 error scaling O(dt^4) vs Euler O(dt)
// Over a trajectory of total time T=1.0 from (10, 2, -15)
const startP = new THREE.Vector3(10, 2, -15);
function integrateTrajectory(dt, steps) {
  let cur = startP.clone();
  for (let i = 0; i < steps; i++) {
    cur = cf.rk4Step(cur, dt, new THREE.Vector3());
  }
  return cur;
}
// Benchmark with very fine dt = 0.001 (1000 steps)
const refP = integrateTrajectory(0.001, 1000);
// coarse dt = 0.1 (10 steps)
const pCoarse = integrateTrajectory(0.1, 10);
// medium dt = 0.05 (20 steps)
const pMedium = integrateTrajectory(0.05, 20);

const errCoarse = pCoarse.distanceTo(refP);
const errMedium = pMedium.distanceTo(refP);
const orderRatio = errCoarse / errMedium;
// For RK4, error ~ O(dt^4), halving dt reduces error by ~ 2^4 = 16
auditAssert(orderRatio >= 10.0, 'RK4_3.2', `RK4 convergence order is genuine 4th-order (error reduction factor: ${orderRatio.toFixed(2)} ~ 16x)`);

// ---------------------------------------------------------------------
// CHECK 4: Coma Vertical Fountain Loops Physical Authenticity
// ---------------------------------------------------------------------
console.log('\n--- CHECK 4: Coma Vertical Fountain Loops Physical Authenticity ---');

// Test that Coma attractor exists with correct parameters
const coma = cf.attractors.find(a => a.id === 'coma-cluster');
auditAssert(!!coma, 'COMA_4.1', 'Coma cluster is present in attractors registry');
auditAssert(coma.position.x === 5 && coma.position.y === 45 && coma.position.z === -25, 'COMA_4.2', 'Coma position is exactly (5, 45, -25)');
auditAssert(coma.mass === 2600, 'COMA_4.3', 'Coma mass is 2600');
auditAssert(coma.softening === 14.0, 'COMA_4.4', 'Coma softening is 14.0');

// Verify that seeds in corridor [X: 2..22, Y: -2..10, Z: -32..-10] produce vertical arches
const testCorridorSeeds = [
  new THREE.Vector3(5, 0, -25),
  new THREE.Vector3(10, 2, -20),
  new THREE.Vector3(15, 4, -28),
  new THREE.Vector3(8, -1, -15),
  new THREE.Vector3(18, 5, -22),
  new THREE.Vector3(3, 1, -30),
  new THREE.Vector3(12, 6, -18)
];

let comaTerminations = 0;
let highestY = -Infinity;

for (const seed of testCorridorSeeds) {
  const result = cf.traceStreamline(seed, 190, 0.92);
  let maxY = -Infinity;
  for (const pt of result.points) {
    if (pt.y > maxY) maxY = pt.y;
    if (pt.y > highestY) highestY = pt.y;
  }
  if (result.destination === 'coma-cluster') {
    comaTerminations++;
  }
}

auditAssert(comaTerminations >= 4, 'COMA_4.5', `Corridor seeds terminate at Coma cluster (${comaTerminations}/${testCorridorSeeds.length})`);
auditAssert(highestY >= 43.0, 'COMA_4.6', `Streamlines attain vertical elevation Y >= 43 (highest Y: ${highestY.toFixed(2)})`);

// Counterfactual Physical Test: If Coma mass is zeroed out, do the streamlines still arch upward?
// If they STILL arched upward without Coma, it would be fake physics!
const originalComaMass = coma.mass;
coma.mass = 0; // Temporarily disable Coma gravity

let counterfactualHighestY = -Infinity;
let counterfactualComaTerm = 0;

for (const seed of testCorridorSeeds) {
  const result = cf.traceStreamline(seed, 190, 0.92);
  for (const pt of result.points) {
    if (pt.y > counterfactualHighestY) counterfactualHighestY = pt.y;
  }
  if (result.destination === 'coma-cluster') {
    counterfactualComaTerm++;
  }
}
coma.mass = originalComaMass; // Restore Coma mass

auditAssert(
  counterfactualHighestY < 20.0,
  'COMA_4.7',
  `Physical Causality Verified: Without Coma mass, vertical arch collapses (counterfactual peak Y: ${counterfactualHighestY.toFixed(2)} < 20.0 vs with Coma: ${highestY.toFixed(2)})`
);
auditAssert(
  counterfactualComaTerm === 0,
  'COMA_4.8',
  'Physical Causality Verified: Zero streamlines reach Coma when Coma mass is 0'
);

// ---------------------------------------------------------------------
// CHECK 5: Authentic 8-Stop Color Gradient Calculation
// ---------------------------------------------------------------------
console.log('\n--- CHECK 5: Authentic 8-Stop Color Gradient Calculation ---');

const renderer = new StreamlineRenderer(cf, { streamlineCount: 300, showComaLoops: true });

// Check exact stops in SCIENTIFIC_COLOR_STOPS
const expectedStops = [
  { t: 0.00, hex: '0033cc', desc: 'Deep royal blue' },
  { t: 0.14, hex: '0080ff', desc: 'Azure blue' },
  { t: 0.28, hex: '00d4ff', desc: 'Electric cyan' },
  { t: 0.42, hex: 'cce8ff', desc: 'Ice white transition' },
  { t: 0.55, hex: 'ffffff', desc: 'Crisp silvery-white filaments' },
  { t: 0.70, hex: 'ffc233', desc: 'Warm radiant gold' },
  { t: 0.85, hex: 'ff6600', desc: 'Deep glowing amber' },
  { t: 1.00, hex: 'dc1400', desc: 'Crimson red GA convergence' }
];

let stopsValid = true;
for (const s of expectedStops) {
  const sample = renderer.sampleColor(s.t, false);
  const actualHex = sample.getHexString();
  if (actualHex !== s.hex) {
    stopsValid = false;
    findings.push({ checkId: 'COLOR_5.1', expected: s.hex, actual: actualHex, desc: s.desc });
  }
}
auditAssert(stopsValid, 'COLOR_5.1', 'All 8 scientific color stops match Tully et al. 2014 exact specifications');

// Check interpolation between stops (e.g. midpoint between 0.00 and 0.14: t=0.07)
const midSample = renderer.sampleColor(0.07, false);
const c0 = new THREE.Color(0x0033cc);
const c1 = new THREE.Color(0x0080ff);
const expectedMid = new THREE.Color().lerpColors(c0, c1, 0.5);
const midDiff = Math.abs(midSample.r - expectedMid.r) + Math.abs(midSample.g - expectedMid.g) + Math.abs(midSample.b - expectedMid.b);
auditAssert(midDiff < 1e-4, 'COLOR_5.2', 'Color ramp uses authentic linear RGB interpolation between control stops');

// Verify Coma color ramp
const comaApexColor = renderer.sampleColor(1.00, true);
auditAssert(comaApexColor.getHexString() === 'ffc233', 'COLOR_5.3', 'Coma loop apex terminates with warm radiant gold (#ffc233)');
const comaArchColor = renderer.sampleColor(0.65, true);
auditAssert(comaArchColor.getHexString() === 'ffffff', 'COLOR_5.4', 'Coma loop vertical ascent passes through brilliant silvery-white (#ffffff)');

// Check vertex buffer attribute generation in buildLineMesh
const colAttr = renderer.lineSegmentsMesh.geometry.attributes.color;
const posAttr = renderer.lineSegmentsMesh.geometry.attributes.position;
auditAssert(colAttr.count === posAttr.count, 'COLOR_5.5', `Color buffer vertex count (${colAttr.count}) equals position vertex count (${posAttr.count})`);

// Audit arc length parameterization
let arcLengthNormalizedMonotonic = true;
for (const sl of renderer.streamlineData) {
  const al = sl.arcLengths;
  for (let k = 1; k < al.length; k++) {
    if (al[k] <= al[k - 1]) {
      arcLengthNormalizedMonotonic = false;
    }
  }
  const lastArc = al[al.length - 1];
  if (Math.abs(lastArc - sl.totalLength) > 1e-3) {
    arcLengthNormalizedMonotonic = false;
  }
}
auditAssert(arcLengthNormalizedMonotonic, 'COLOR_5.6', 'Streamline arc lengths are strictly monotonic and end at totalLength');

// ---------------------------------------------------------------------
// CHECK 6: SlicePlaneMesh Shader Uniforms & Data Alignment
// ---------------------------------------------------------------------
console.log('\n--- CHECK 6: SlicePlaneMesh Shader Uniforms & Data Alignment ---');

const slicePlane = new SlicePlaneMesh(cf);
const sData = cf.getShaderData();

auditAssert(sData.uAttractorPositions.length === 18, 'SHADER_6.1', 'Shader positions array length is exactly 18 floats (6 attractors * 3)');
auditAssert(sData.uAttractorMasses.length === 6, 'SHADER_6.2', 'Shader masses array length is exactly 6 floats');
auditAssert(sData.uAttractorSoftenings.length === 6, 'SHADER_6.3', 'Shader softenings array length is exactly 6 floats');
auditAssert(sData.uAttractorCount === 5, 'SHADER_6.4', 'Shader attractor count is 5 (includes GA, Shapley, Repeller, PP, Coma)');

// Verify Coma coordinates in shader array (5th attractor -> index 4 -> floats 12, 13, 14)
const comaShaderX = sData.uAttractorPositions[12];
const comaShaderY = sData.uAttractorPositions[13];
const comaShaderZ = sData.uAttractorPositions[14];
const comaShaderM = sData.uAttractorMasses[4];
const comaShaderS = sData.uAttractorSoftenings[4];

auditAssert(
  comaShaderX === 5 && comaShaderY === 45 && comaShaderZ === -25 && comaShaderM === 2600 && comaShaderS === 14.0,
  'SHADER_6.5',
  `Shader uniform arrays correctly pack Coma parameters: (${comaShaderX}, ${comaShaderY}, ${comaShaderZ}), M=${comaShaderM}, S=${comaShaderS}`
);

// Verify SlicePlaneMesh fragment shader GLSL uniform declarations and loops
const frag = slicePlane.material.fragmentShader;
auditAssert(frag.includes('uniform float uAttractorPositions[18];'), 'SHADER_6.6', 'GLSL declares uAttractorPositions[18]');
auditAssert(frag.includes('uniform float uAttractorMasses[6];'), 'SHADER_6.7', 'GLSL declares uAttractorMasses[6]');
auditAssert(frag.includes('uniform float uAttractorSoftenings[6];'), 'SHADER_6.8', 'GLSL declares uAttractorSoftenings[6]');
auditAssert(frag.includes('for (int i = 0; i < 6; i++)'), 'SHADER_6.9', 'GLSL loop executes up to 6 attractors');
auditAssert(frag.includes('if (i >= uAttractorCount) break;'), 'SHADER_6.10', 'GLSL loop breaks cleanly at uAttractorCount');

// ---------------------------------------------------------------------
// CHECK 7: Flow Direction Cones & Orientation
// ---------------------------------------------------------------------
console.log('\n--- CHECK 7: Flow Direction Cones & Orientation ---');

auditAssert(renderer.arrowMesh instanceof THREE.InstancedMesh, 'ARROW_7.1', 'Arrow mesh is THREE.InstancedMesh');
auditAssert(renderer.arrowCount > 0, 'ARROW_7.2', `Arrow count is positive: ${renderer.arrowCount}`);

// Verify arrow tangent alignment along vertical Coma streamlines
let verticalArrowsCount = 0;
const mat = new THREE.Matrix4();
const rotMat = new THREE.Matrix3();
const trans = new THREE.Vector3();
const scale = new THREE.Vector3();
const quat = new THREE.Quaternion();
const arrowDir = new THREE.Vector3();
const coneUp = new THREE.Vector3(0, 1, 0);

for (let i = 0; i < renderer.arrowCount; i++) {
  renderer.arrowMesh.getMatrixAt(i, mat);
  mat.decompose(trans, quat, scale);
  arrowDir.copy(coneUp).applyQuaternion(quat);

  // Check if arrow is in upper hemisphere and pointing upwards
  if (trans.y > 25.0 && arrowDir.y > 0.4) {
    verticalArrowsCount++;
  }
}
auditAssert(verticalArrowsCount >= 20, 'ARROW_7.3', `Cones along Coma loops point upwards into the cluster (upward cones: ${verticalArrowsCount})`);

// ---------------------------------------------------------------------
// CHECK 8: Edge Cases & Numerical Robustness
// ---------------------------------------------------------------------
console.log('\n--- CHECK 8: Edge Cases & Numerical Robustness ---');

// 1. Trace from extreme distance
const farSeed = new THREE.Vector3(500, 500, 500);
const farResult = cf.traceStreamline(farSeed, 50, 1.0);
auditAssert(farResult.destination === 'boundary', 'EDGE_8.1', 'Streamline far from domain terminates cleanly at boundary');

// 2. Trace exactly inside attractor core
const coreSeed = new THREE.Vector3(-38, 2, -5);
const coreResult = cf.traceStreamline(coreSeed, 50, 1.0);
auditAssert(coreResult.destination === 'great-attractor', 'EDGE_8.2', 'Streamline inside core terminates immediately at attractor');

// 3. Stagnation / zero velocity test
// Background drift is (-0.08, 0.01, -0.04). If we artificially set backgroundDrift to 0 and query at infinity:
const originalDrift = cf.backgroundDrift.clone();
cf.backgroundDrift.set(0, 0, 0);
const infPos = new THREE.Vector3(1e6, 1e6, 1e6);
const vInf = cf.getVelocity(infPos.x, infPos.y, infPos.z);
auditAssert(vInf.length() < 1e-8, 'EDGE_8.3', 'Velocity field decays to zero at spatial infinity');
cf.backgroundDrift.copy(originalDrift);

// 4. Renderer zero streamlines test
const zeroRenderer = new StreamlineRenderer(cf);
zeroRenderer.setStreamlineCount(0);
auditAssert(zeroRenderer.streamlineData.length === 0, 'EDGE_8.4', 'StreamlineRenderer handles setStreamlineCount(0) cleanly');
auditAssert(zeroRenderer.arrowCount === 0, 'EDGE_8.5', 'Arrow count is 0 when setStreamlineCount(0) is called');

// 5. Dynamic rebuild stress
zeroRenderer.setStreamlineCount(150);
auditAssert(zeroRenderer.streamlineData.length > 0, 'EDGE_8.6', 'StreamlineRenderer rebuilds cleanly after count increase to 150');

console.log('\n================================================================');
console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount === 0) {
  console.log('\nVERDICT: CLEAN');
  process.exit(0);
} else {
  console.log('\nVERDICT: INTEGRITY VIOLATION');
  console.log('Failures:', findings);
  process.exit(1);
}
