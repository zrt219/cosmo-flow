import * as THREE from 'three';
import { CosmicField } from '../src/physics/CosmicField.js';
import { SlicePlaneMesh } from '../src/renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from '../src/renderers/StreamlineRenderer.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`  PASS: ${message}`);
}

console.log('========================================');
console.log('SUITE 1: CosmicField Attractor & Potential Tests');
console.log('========================================');

const cf = new CosmicField();
assert(cf.attractors.length === 5, 'CosmicField has 5 attractors registered');

const coma = cf.attractors.find(a => a.id === 'coma-cluster');
assert(!!coma, 'coma-cluster attractor is registered in CosmicField');
assert(coma.position.x === 5 && coma.position.y === 45 && coma.position.z === -25, 'Coma position is exactly (5, 45, -25)');
assert(coma.mass === 2600, 'Coma mass is 2600');
assert(coma.softening === 14.0, 'Coma softening is 14.0');
assert(coma.type === 'attractor', 'Coma type is attractor');
assert(coma.color === 0xb0d0ff, 'Coma color is 0xb0d0ff');

const shaderData = cf.getShaderData();
assert(shaderData.uAttractorPositions.length === 18, 'Shader data positions array length is exactly 18 (6 attractors * 3 floats)');
assert(shaderData.uAttractorMasses.length === 6, 'Shader data masses array length is exactly 6');
assert(shaderData.uAttractorSoftenings.length === 6, 'Shader data softenings array length is exactly 6');
assert(shaderData.uAttractorCount === 5, 'Shader data uAttractorCount is 5');
assert(shaderData.uBackgroundDrift.length === 3, 'Shader data background drift length is 3');

// Test RK4 termination condition near Coma
const seedNearComa = new THREE.Vector3(5, 42.5, -25);
const traceNearComa = cf.traceStreamline(seedNearComa, 50, 0.5);
assert(traceNearComa.destination === 'coma-cluster', 'Streamline starting near Coma terminates cleanly at coma-cluster');
assert(traceNearComa.points.length <= 5, 'Streamline near Coma core terminates within a few steps without singularity collapse');

// Test RK4 termination near Great Attractor
const seedNearGA = new THREE.Vector3(-38, 4.5, -5);
const traceNearGA = cf.traceStreamline(seedNearGA, 50, 0.5);
assert(traceNearGA.destination === 'great-attractor', 'Streamline starting near GA terminates cleanly at great-attractor');

console.log('========================================');
console.log('SUITE 2: SlicePlaneMesh Shader & Uniform Expansion');
console.log('========================================');

const slicePlane = new SlicePlaneMesh(cf);
assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'SlicePlaneMesh uAttractorPositions length is 18');
assert(slicePlane.uniforms.uAttractorMasses.value.length === 6, 'SlicePlaneMesh uAttractorMasses length is 6');
assert(slicePlane.uniforms.uAttractorSoftenings.value.length === 6, 'SlicePlaneMesh uAttractorSoftenings length is 6');
assert(slicePlane.uniforms.uAttractorCount.value === 5, 'SlicePlaneMesh uAttractorCount value is 5');

// Verify fragment shader source contains 6-attractor array declarations and loop bounds
const fragSrc = slicePlane.material.fragmentShader;
assert(fragSrc.includes('uniform float uAttractorPositions[18];'), 'Fragment shader defines uAttractorPositions[18]');
assert(fragSrc.includes('uniform float uAttractorMasses[6];'), 'Fragment shader defines uAttractorMasses[6]');
assert(fragSrc.includes('uniform float uAttractorSoftenings[6];'), 'Fragment shader defines uAttractorSoftenings[6]');
assert(fragSrc.includes('for (int i = 0; i < 6; i++)'), 'Fragment shader loop iterates up to 6 attractors');

// Test update() and updateUniforms()
slicePlane.update();
assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'update() maintains length 18 array');
slicePlane.updateUniforms();
assert(slicePlane.uniforms.uAttractorPositions.value.length === 18, 'updateUniforms() maintains length 18 array');

console.log('========================================');
console.log('SUITE 3: StreamlineRenderer Seeds & Coma Fountain Loops');
console.log('========================================');

const renderer = new StreamlineRenderer(cf, { streamlineCount: 280, showComaLoops: true });
const seeds = renderer.generateSeeds();
assert(seeds.length === 280, 'generateSeeds produces exact streamlineCount (280)');

// Count seeds in Coma corridor: X in [2, 22], Y in [-2, 10], Z in [-32, -10]
let comaSeeds = 0;
for (const s of seeds) {
  if (s.x >= 2 && s.x <= 22 && s.y >= -2 && s.y <= 10 && s.z >= -32 && s.z <= -10) {
    comaSeeds++;
  }
}
assert(comaSeeds >= 50, `Coma launch corridor contains ~20% of seeds (actual: ${comaSeeds} / 280)`);

// Check Coma loops in generated streamlines
let comaLoopCount = 0;
let maxComaY = -Infinity;
for (const s of renderer.streamlineData) {
  if (s.isComaLoop) {
    comaLoopCount++;
    for (const p of s.points) {
      if (p.y > maxComaY) maxComaY = p.y;
    }
  }
}
assert(comaLoopCount > 0, `Coma fountain loops are generated (count: ${comaLoopCount})`);
assert(maxComaY >= 43.0, `Coma fountain loops arch high into Coma cluster (peak Y: ${maxComaY.toFixed(2)} >= 43.0)`);

// Test toggle showComaLoops
renderer.setShowComaLoops(false);
const seedsNoComa = renderer.generateSeeds();
let comaSeedsNoComa = 0;
for (const s of seedsNoComa) {
  if (s.x >= 2 && s.x <= 22 && s.y >= -2 && s.y <= 10 && s.z >= -32 && s.z <= -10) {
    comaSeedsNoComa++;
  }
}
assert(comaSeedsNoComa === 0, 'Disabling showComaLoops zeroes the Coma launch corridor seeds');

renderer.setShowComaLoops(true);
assert(renderer.showComaLoops === true, 'Restoring showComaLoops succeeds');

console.log('========================================');
console.log('SUITE 4: 8-Stop Scientific Color Ramp Verification');
console.log('========================================');

assert(renderer.lineSegmentsMesh instanceof THREE.LineSegments, 'Line segments mesh is created');
const posAttr = renderer.lineSegmentsMesh.geometry.attributes.position;
const colAttr = renderer.lineSegmentsMesh.geometry.attributes.color;
assert(posAttr.count > 0, `Line segments position count is positive (${posAttr.count})`);
assert(colAttr.count === posAttr.count, 'Position and color attribute counts match exactly');

// Check color bounds and non-NaN
for (let i = 0; i < colAttr.array.length; i++) {
  const v = colAttr.array[i];
  if (isNaN(v) || v < 0 || v > 1) {
    throw new Error(`Color attribute component at ${i} is out of bounds: ${v}`);
  }
}
assert(true, 'All vertex color components are finite and in [0, 1]');

// Verify color ramp sample behavior
const sampleStart = renderer.sampleColor(0.00, false);
assert(sampleStart.getHexString() === '0033cc', `Ramp at t=0.00 is #0033cc (actual: #${sampleStart.getHexString()})`);

const sampleEnd = renderer.sampleColor(1.00, false);
assert(sampleEnd.getHexString() === 'dc1400', `Ramp at t=1.00 is #dc1400 (actual: #${sampleEnd.getHexString()})`);

const sampleGold = renderer.sampleColor(0.70, false);
assert(sampleGold.getHexString() === 'ffc233', `Ramp at t=0.70 is #ffc233 (actual: #${sampleGold.getHexString()})`);

const sampleWhite = renderer.sampleColor(0.55, false);
assert(sampleWhite.getHexString() === 'ffffff', `Ramp at t=0.55 is #ffffff (actual: #${sampleWhite.getHexString()})`);

const sampleComaApex = renderer.sampleColor(1.00, true);
assert(sampleComaApex.getHexString() === 'ffc233', `Coma ramp apex at t=1.00 is #ffc233 (actual: #${sampleComaApex.getHexString()})`);

console.log('========================================');
console.log('SUITE 5: Arrow Mesh & Transform Animation');
console.log('========================================');

assert(renderer.arrowMesh instanceof THREE.InstancedMesh, 'Arrow mesh is THREE.InstancedMesh');
assert(renderer.arrowCount > 0, `Arrow count is positive (${renderer.arrowCount})`);
assert(renderer.arrowMesh.count === renderer.arrowCount, 'InstancedMesh count matches arrowCount');

// Test updating arrow transforms with animation time offsets
renderer.updateArrowTransforms(0.0);
renderer.updateArrowTransforms(1.5);
renderer.updateArrowTransforms(100.0);
assert(true, 'updateArrowTransforms executes smoothly across time offsets without error');

// Test rebuild
renderer.setStreamlineCount(200);
assert(renderer.streamlineCount === 200, 'setStreamlineCount updates count to 200');

console.log('========================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed successfully!`);
console.log('========================================');
