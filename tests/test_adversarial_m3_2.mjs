import * as THREE from 'three';
import { GalaxyClusters } from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message, details = null) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    const detailMsg = details ? ` | Details: ${JSON.stringify(details)}` : '';
    failures.push(`${message}${detailMsg}`);
    console.error(`  FAIL: ${message}${detailMsg}`);
  }
}

function suite(title, fn) {
  console.log(`\n================================================================`);
  console.log(`SUITE: ${title}`);
  console.log(`================================================================`);
  try {
    fn();
  } catch (err) {
    failed++;
    failures.push(`Suite '${title}' threw unhandled exception: ${err.message}`);
    console.error(`  EXCEPTION: ${err.message}\n${err.stack}`);
  }
}

console.log('################################################################');
console.log('CHALLENGER M3-2 EMPIRICAL ADVERSARIAL STRESS HARNESS');
console.log('Targeting: GalaxyClusters & GalaxySwarm API Boundaries & Lifecycle');
console.log('################################################################');

// ====================================================================
// SUITE 1: GalaxyClusters API Boundaries & Setter Clamping
// ====================================================================
suite('1.1 GalaxyClusters: setVisible() truthy/falsy, idempotency & instanced sync', () => {
  const clusters = new GalaxyClusters();

  // Test setVisible(false)
  clusters.setVisible(false);
  assert(clusters.visible === false, 'setVisible(false) sets clusters.visible to false');
  assert(clusters.group.visible === false, 'setVisible(false) sets group.visible to false');

  // Test setVisible(true)
  clusters.setVisible(true);
  assert(clusters.visible === true, 'setVisible(true) sets clusters.visible to true');
  assert(clusters.group.visible === true, 'setVisible(true) sets group.visible to true');

  // Test with instancedMesh instantiated
  const inst = clusters.instancedMesh;
  assert(inst instanceof THREE.InstancedMesh, 'instancedMesh initialized successfully');
  clusters.setVisible(false);
  assert(clusters.visible === false, 'setVisible(false) keeps visible false with instancedMesh');
  assert(clusters.group.visible === false, 'setVisible(false) hides group with instancedMesh');
  assert(inst.visible === false, 'setVisible(false) synchronizes instancedMesh.visible to false');

  clusters.setVisible(true);
  assert(clusters.visible === true, 'setVisible(true) restores visible with instancedMesh');
  assert(clusters.group.visible === true, 'setVisible(true) restores group.visible');
  assert(inst.visible === true, 'setVisible(true) restores instancedMesh.visible');

  // Truthy & Falsy Coercion tests
  const falsyCases = [0, '', null, undefined, false, NaN];
  for (const val of falsyCases) {
    clusters.setVisible(val);
    assert(clusters.visible === false && clusters.group.visible === false && inst.visible === false,
      `setVisible(${String(val)}) coerces cleanly to false`);
  }

  const truthyCases = [1, 'true', {}, [], -1, Infinity];
  for (const val of truthyCases) {
    clusters.setVisible(val);
    assert(clusters.visible === true && clusters.group.visible === true && inst.visible === true,
      `setVisible(${typeof val === 'object' ? JSON.stringify(val) : String(val)}) coerces cleanly to true`);
  }

  // Rapid toggling 1,000 times
  let toggleOk = true;
  for (let i = 0; i < 1000; i++) {
    const expected = (i % 2 === 0);
    clusters.setVisible(expected);
    if (clusters.visible !== expected || clusters.group.visible !== expected) {
      toggleOk = false;
      break;
    }
  }
  assert(toggleOk, '1,000 rapid setVisible toggles maintain consistent state without drift');
  clusters.dispose();
});

suite('1.2 GalaxyClusters: setOpacity() clamping [0, 1] and edge cases (0, 1, -1, 2, NaN)', () => {
  const clusters = new GalaxyClusters();

  // Baseline opacity
  assert(clusters.opacity === 0.95, 'Default opacity is 0.95');
  assert(clusters.material.opacity === 0.95, 'Material opacity initialized to 0.95');

  // Edge Case 1: val = 0 (exact minimum)
  clusters.setOpacity(0);
  assert(clusters.opacity === 0.0, 'setOpacity(0): clusters.opacity is 0.0');
  assert(clusters.material.opacity === 0.0, 'setOpacity(0): material.opacity is 0.0');
  assert(clusters.material.transparent === true, 'setOpacity(0): material.transparent is true');

  // Edge Case 2: val = 1 (exact maximum)
  clusters.setOpacity(1);
  assert(clusters.opacity === 1.0, 'setOpacity(1): clusters.opacity is 1.0');
  assert(clusters.material.opacity === 1.0, 'setOpacity(1): material.opacity is 1.0');
  assert(clusters.material.transparent === false, 'setOpacity(1): material.transparent is false');

  // Edge Case 3: val = -1 (negative overshoot clamp)
  clusters.setOpacity(-1);
  assert(clusters.opacity === 0.0, 'setOpacity(-1): clamped to 0.0');
  assert(clusters.material.opacity === 0.0, 'setOpacity(-1): material.opacity clamped to 0.0');
  assert(clusters.material.transparent === true, 'setOpacity(-1): material.transparent is true');

  // Edge Case 4: val = 2 (positive overshoot clamp)
  clusters.setOpacity(2);
  assert(clusters.opacity === 1.0, 'setOpacity(2): clamped to 1.0');
  assert(clusters.material.opacity === 1.0, 'setOpacity(2): material.opacity clamped to 1.0');
  assert(clusters.material.transparent === false, 'setOpacity(2): material.transparent is false');

  // Edge Case 5: val = -999999 and val = +999999
  clusters.setOpacity(-999999);
  assert(clusters.opacity === 0.0 && clusters.material.opacity === 0.0, 'setOpacity(-999999): clamped to 0.0');
  clusters.setOpacity(999999);
  assert(clusters.opacity === 1.0 && clusters.material.opacity === 1.0, 'setOpacity(999999): clamped to 1.0');

  // Edge Case 6: val = 0.5 (midpoint)
  clusters.setOpacity(0.5);
  assert(clusters.opacity === 0.5, 'setOpacity(0.5): set to 0.5');
  assert(clusters.material.opacity === 0.5, 'setOpacity(0.5): material.opacity is 0.5');
  assert(clusters.material.transparent === true, 'setOpacity(0.5): material.transparent is true');

  // Edge Case 7: val = NaN
  let nanThrew = false;
  try {
    clusters.setOpacity(NaN);
  } catch (e) {
    nanThrew = true;
  }
  assert(!nanThrew, 'setOpacity(NaN) does not throw an unhandled exception');
  assert(Number.isNaN(clusters.opacity), 'setOpacity(NaN) reflects NaN without crash');

  // Edge Case 8: val = undefined and null
  let nullThrew = false;
  try {
    clusters.setOpacity(null);
  } catch (e) {
    nullThrew = true;
  }
  assert(!nullThrew, 'setOpacity(null) executes cleanly');
  assert(clusters.opacity === 0.0, 'setOpacity(null) clamped to 0.0');

  let undefThrew = false;
  try {
    clusters.setOpacity(undefined);
  } catch (e) {
    undefThrew = true;
  }
  assert(!undefThrew, 'setOpacity(undefined) executes cleanly without throwing');

  // Edge Case 9: string inputs
  clusters.setOpacity('0.72');
  assert(Math.abs(clusters.opacity - 0.72) < 1e-4, 'setOpacity("0.72") parses and sets 0.72');

  // Verify material.needsUpdate triggers version increment in Three.js
  const prevVersion = clusters.material.version;
  clusters.setOpacity(0.85);
  assert(clusters.material.version > prevVersion,
    `setOpacity flags material.needsUpdate causing version increment (${clusters.material.version} > ${prevVersion})`);

  clusters.dispose();
});

suite('1.3 GalaxyClusters: setScaleMultiplier() boundary clamping & mesh scaling', () => {
  const clusters = new GalaxyClusters();
  const hydra = clusters.getCluster('Hydra');
  const hydraMesh = hydra.mesh;
  const baseScaleX = hydra.radius * hydra.scale[0];
  const baseScaleY = hydra.radius * hydra.scale[1];
  const baseScaleZ = hydra.radius * hydra.scale[2];

  // Test positive scaling: 2.5x
  clusters.setScaleMultiplier(2.5);
  assert(Math.abs(clusters.scaleMultiplier - 2.5) < 1e-4, 'scaleMultiplier set to 2.5');
  assert(Math.abs(hydraMesh.scale.x - baseScaleX * 2.5) < 1e-4, 'Hydra mesh scale.x updated to 2.5x');
  assert(Math.abs(hydraMesh.scale.y - baseScaleY * 2.5) < 1e-4, 'Hydra mesh scale.y updated to 2.5x');
  assert(Math.abs(hydraMesh.scale.z - baseScaleZ * 2.5) < 1e-4, 'Hydra mesh scale.z updated to 2.5x');

  // Test lower boundary clamping: val = 0 should clamp to 0.01 (preventing degenerate 0-matrix)
  clusters.setScaleMultiplier(0);
  assert(Math.abs(clusters.scaleMultiplier - 0.01) < 1e-4, 'setScaleMultiplier(0) clamped to min 0.01');
  assert(hydraMesh.scale.x > 0, 'Hydra scale.x is strictly positive at multiplier 0');

  // Test negative input: val = -5.0 should clamp to 0.01 (preventing inverted normals)
  clusters.setScaleMultiplier(-5.0);
  assert(Math.abs(clusters.scaleMultiplier - 0.01) < 1e-4, 'setScaleMultiplier(-5.0) clamped to min 0.01');
  assert(hydraMesh.scale.x > 0 && hydraMesh.scale.y > 0 && hydraMesh.scale.z > 0,
    'All Hydra mesh scale components remain positive (> 0)');

  // Test very small positive: 0.001 clamped to 0.01
  clusters.setScaleMultiplier(0.001);
  assert(Math.abs(clusters.scaleMultiplier - 0.01) < 1e-4, 'setScaleMultiplier(0.001) clamped to min 0.01');

  // Test large scaling: 10.0x
  clusters.setScaleMultiplier(10.0);
  assert(Math.abs(clusters.scaleMultiplier - 10.0) < 1e-4, 'setScaleMultiplier(10.0) sets 10.0x');
  assert(Math.abs(hydraMesh.scale.x - baseScaleX * 10.0) < 1e-4, 'Hydra mesh scale.x scaled to 10.0x');

  // Test InstancedMesh synchronization
  const inst = clusters.instancedMesh;
  const prevMatrixVer = inst.instanceMatrix.version;
  clusters.setScaleMultiplier(1.8);
  assert(inst.instanceMatrix.version > prevMatrixVer,
    `setScaleMultiplier flags instancedMesh.instanceMatrix.needsUpdate incrementing version (${inst.instanceMatrix.version} > ${prevMatrixVer})`);
  const dummyMatrix = new THREE.Matrix4();
  inst.getMatrixAt(0, dummyMatrix);
  const dummyPos = new THREE.Vector3();
  const dummyQuat = new THREE.Quaternion();
  const dummyScale = new THREE.Vector3();
  dummyMatrix.decompose(dummyPos, dummyQuat, dummyScale);
  const firstCluster = clusters.clusters[0];
  const expectedInstScaleX = firstCluster.radius * firstCluster.scale[0] * 1.8;
  assert(Math.abs(dummyScale.x - expectedInstScaleX) < 1e-3,
    `InstancedMesh matrix index 0 matches scale 1.8x (${dummyScale.x.toFixed(3)} vs ${expectedInstScaleX.toFixed(3)})`);

  // Edge cases: NaN, undefined
  let scaleNanThrew = false;
  try {
    clusters.setScaleMultiplier(NaN);
    clusters.setScaleMultiplier(undefined);
  } catch (e) {
    scaleNanThrew = true;
  }
  assert(!scaleNanThrew, 'setScaleMultiplier(NaN / undefined) does not throw exception');

  clusters.dispose();
});

suite('1.4 GalaxyClusters: update() pulse, visibility gating & invalid inputs', () => {
  const clusters = new GalaxyClusters({ pulseEnabled: true });
  const virgo = clusters.getCluster('Virgo');
  const virgoMesh = virgo.mesh;
  const baseScaleX = virgo.radius * virgo.scale[0];

  // At elapsed = 0: pulse = 1.0 + Math.sin(0) * 0.035 = 1.0
  clusters.update(0);
  assert(Math.abs(virgoMesh.scale.x - baseScaleX) < 1e-3, 'update(0) scale is nominal 1.0x');

  // At elapsed = Math.PI / (2 * 1.8) ~ 0.87266: sin(1.8 * elapsed) = 1.0 -> pulse = 1.035
  const peakTime = Math.PI / 3.6;
  clusters.update(peakTime);
  const expectedPeak = baseScaleX * 1.035;
  assert(Math.abs(virgoMesh.scale.x - expectedPeak) < 1e-3,
    `update(peakTime) scale is peak 1.035x (${virgoMesh.scale.x.toFixed(4)} vs ${expectedPeak.toFixed(4)})`);

  // At elapsed = 3 * Math.PI / 3.6: sin = -1.0 -> pulse = 0.965
  const troughTime = 3 * Math.PI / 3.6;
  clusters.update(troughTime);
  const expectedTrough = baseScaleX * 0.965;
  assert(Math.abs(virgoMesh.scale.x - expectedTrough) < 1e-3,
    `update(troughTime) scale is trough 0.965x (${virgoMesh.scale.x.toFixed(4)} vs ${expectedTrough.toFixed(4)})`);

  // Visibility gating: when group.visible is false, update() early-returns
  clusters.setVisible(false);
  const scaleBefore = virgoMesh.scale.x;
  clusters.update(peakTime); // would change scale to peak if not gated
  assert(virgoMesh.scale.x === scaleBefore, 'update() early-returns without modifying scales when group is invisible');

  clusters.setVisible(true);

  // Edge cases: NaN, null, negative, huge
  const edgeElapsed = [NaN, null, undefined, -100, 1e9, 0];
  let updateEdgeThrew = false;
  try {
    for (const val of edgeElapsed) {
      clusters.update(val);
    }
  } catch (e) {
    updateEdgeThrew = true;
  }
  assert(!updateEdgeThrew, 'update() with edge-case elapsed values does not throw');

  clusters.dispose();
});

suite('1.5 GalaxyClusters: dispose() idempotency, resource cleanup & post-disposal safety', () => {
  const clusters = new GalaxyClusters();
  // also instantiate instancedMesh to test its cleanup
  const inst = clusters.instancedMesh;
  assert(inst instanceof THREE.InstancedMesh, 'Instanced mesh created before dispose');
  assert(clusters.group.children.length === 29, 'Group initially contains 29 meshes');
  assert(clusters.sharedGeometry instanceof THREE.SphereGeometry, 'sharedGeometry is SphereGeometry');
  assert(clusters.material instanceof THREE.MeshPhysicalMaterial, 'material is MeshPhysicalMaterial');

  // Spy on geometry and material dispose
  let geomDisposed = false;
  let matDisposed = false;
  clusters.sharedGeometry.addEventListener('dispose', () => { geomDisposed = true; });
  clusters.material.addEventListener('dispose', () => { matDisposed = true; });

  // 1st call to dispose()
  clusters.dispose();
  assert(geomDisposed, 'sharedGeometry.dispose() was invoked');
  assert(matDisposed, 'material.dispose() was invoked');
  assert(clusters.sharedGeometry === null, 'clusters.sharedGeometry nullified');
  assert(clusters.material === null, 'clusters.material nullified');
  assert(clusters._instancedMesh === null, 'clusters._instancedMesh nullified');
  assert(clusters.meshes.length === 0, 'clusters.meshes array cleared');
  assert(clusters.group.children.length === 0, 'All meshes removed from group');

  // Idempotency: call dispose() 2nd, 3rd, 5th, 10th time
  let repeatedDisposeThrew = false;
  try {
    clusters.dispose();
    clusters.dispose();
    clusters.dispose();
    clusters.dispose();
    clusters.dispose();
  } catch (e) {
    repeatedDisposeThrew = true;
  }
  assert(!repeatedDisposeThrew, 'dispose() is strictly idempotent and can be called repeatedly without throwing');

  // Post-disposal method calls must not throw TypeError
  let postCallThrew = false;
  try {
    clusters.setVisible(false);
    clusters.setVisible(true);
    clusters.setOpacity(0.5);
    clusters.setScaleMultiplier(2.0);
    clusters.update(1.0);
    clusters.getCluster('Hydra');
    clusters.getClusters();
  } catch (e) {
    postCallThrew = true;
    console.error('Post-dispose method threw:', e);
  }
  assert(!postCallThrew, 'All public methods execute safely post-disposal without throwing exceptions');
});

// ====================================================================
// SUITE 2: GalaxySwarm Dynamic Rescaling, Lifecycle & Memory
// ====================================================================
suite('2.1 GalaxySwarm: setCount() dynamic rescaling & cluster quota preservation', () => {
  const cf = new CosmicField();
  const swarm = new GalaxySwarm(cf, { count: 16000 });

  assert(swarm.count === 16000, 'Initial count is 16,000');
  assert(swarm.pointsMesh.geometry.getAttribute('position').count === 16000, 'Initial position count is 16,000');

  // Test dynamic count scaling across multiple magnitudes
  const testCounts = [1000, 5000, 12000, 16000, 20000, 32000];
  for (const n of testCounts) {
    swarm.setCount(n);
    assert(swarm.count === n, `setCount(${n}) updates swarm.count`);
    const pos = swarm.pointsMesh.geometry.getAttribute('position');
    const col = swarm.pointsMesh.geometry.getAttribute('color');
    const size = swarm.pointsMesh.geometry.getAttribute('size');
    assert(pos.count === n, `Position buffer length matches ${n}`);
    assert(col.count === n, `Color buffer length matches ${n}`);
    assert(size.count === n, `Size buffer length matches ${n}`);

    const counts = swarm.getClusterCounts();
    const quotaSum = counts.centaurusGA + counts.virgo + counts.hydraAntlia + counts.coma + counts.diffuseFilament;
    assert(quotaSum === n, `Quota sum (${quotaSum}) equals totalCount (${n}) exactly`);

    // Verify proportions within +/- 1 particle due to rounding
    const expectedGA = Math.round(n * (5200 / 16000));
    assert(counts.centaurusGA === expectedGA, `GA quota correctly scaled: ${counts.centaurusGA} vs ${expectedGA}`);
    const expectedVirgo = Math.round(n * (3400 / 16000));
    assert(counts.virgo === expectedVirgo, `Virgo quota correctly scaled: ${counts.virgo} vs ${expectedVirgo}`);
    const expectedComa = Math.round(n * (1600 / 16000));
    assert(counts.coma === expectedComa, `Coma quota correctly scaled: ${counts.coma} vs ${expectedComa}`);
  }

  // Clamping lower bound: Math.max(100, Math.round(newCount))
  swarm.setCount(0);
  assert(swarm.count === 100, 'setCount(0) clamped to minimum 100 particles');
  assert(swarm.pointsMesh.geometry.getAttribute('position').count === 100, 'Position buffer resized to clamped 100');

  swarm.setCount(-500);
  assert(swarm.count === 100, 'setCount(-500) clamped to minimum 100 particles');

  swarm.setCount(42);
  assert(swarm.count === 100, 'setCount(42) clamped to minimum 100 particles');

  // Decimal rounding
  swarm.setCount(2500.6);
  assert(swarm.count === 2501, 'setCount(2500.6) rounded to 2501');

  // Non-numeric edge cases: NaN, undefined
  let setCountNanThrew = false;
  try {
    swarm.setCount(NaN);
    swarm.setCount(undefined);
  } catch (e) {
    setCountNanThrew = true;
  }
  assert(!setCountNanThrew, 'setCount(NaN / undefined) executes without crashing');

  swarm.dispose();
});

suite('2.2 GalaxySwarm: setPointSize() boundary clamping & buffer rebuild', () => {
  const swarm = new GalaxySwarm(null, { count: 500, pointSize: 1.65 });
  assert(swarm.pointSize === 1.65, 'Initial pointSize is 1.65');

  // Test setPointSize(2.8)
  swarm.setPointSize(2.8);
  assert(Math.abs(swarm.pointSize - 2.8) < 1e-4, 'setPointSize(2.8) updates pointSize to 2.8');

  // Test lower bound clamping: Math.max(0.1, val)
  swarm.setPointSize(0);
  assert(Math.abs(swarm.pointSize - 0.1) < 1e-4, 'setPointSize(0) clamped to min 0.1');

  swarm.setPointSize(-5.0);
  assert(Math.abs(swarm.pointSize - 0.1) < 1e-4, 'setPointSize(-5.0) clamped to min 0.1');

  swarm.setPointSize(0.005);
  assert(Math.abs(swarm.pointSize - 0.1) < 1e-4, 'setPointSize(0.005) clamped to min 0.1');

  // Test large point size
  swarm.setPointSize(10.0);
  assert(Math.abs(swarm.pointSize - 10.0) < 1e-4, 'setPointSize(10.0) sets pointSize to 10.0');

  // Verify size attribute buffer values are proportional
  const sizeAttr = swarm.pointsMesh.geometry.getAttribute('size');
  let allAboveZero = true;
  for (let i = 0; i < sizeAttr.count; i++) {
    if (sizeAttr.getX(i) <= 0 || !Number.isFinite(sizeAttr.getX(i))) {
      allAboveZero = false;
      break;
    }
  }
  assert(allAboveZero, 'All size buffer entries are positive and finite numbers');

  // Non-numeric edge cases: NaN, undefined
  let sizeNanThrew = false;
  try {
    swarm.setPointSize(NaN);
    swarm.setPointSize(undefined);
  } catch (e) {
    sizeNanThrew = true;
  }
  assert(!sizeNanThrew, 'setPointSize(NaN / undefined) executes without throwing');

  swarm.dispose();
});

suite('2.3 GalaxySwarm: setOpacity() clamping [0, 1] & shader uniform synchronization', () => {
  const swarm = new GalaxySwarm(null, { opacity: 0.94 });
  assert(swarm.opacity === 0.94, 'Initial opacity is 0.94');
  assert(swarm.material.uniforms.uOpacity.value === 0.94, 'Shader uniform uOpacity initialized to 0.94');

  // Boundary 0
  swarm.setOpacity(0);
  assert(swarm.opacity === 0.0, 'setOpacity(0): opacity is 0.0');
  assert(swarm.material.uniforms.uOpacity.value === 0.0, 'setOpacity(0): uOpacity uniform is 0.0');

  // Boundary 1
  swarm.setOpacity(1);
  assert(swarm.opacity === 1.0, 'setOpacity(1): opacity is 1.0');
  assert(swarm.material.uniforms.uOpacity.value === 1.0, 'setOpacity(1): uOpacity uniform is 1.0');

  // Negative clamp: -1
  swarm.setOpacity(-1);
  assert(swarm.opacity === 0.0, 'setOpacity(-1): clamped to 0.0');
  assert(swarm.material.uniforms.uOpacity.value === 0.0, 'setOpacity(-1): uOpacity clamped to 0.0');

  // Positive clamp: 2
  swarm.setOpacity(2);
  assert(swarm.opacity === 1.0, 'setOpacity(2): clamped to 1.0');
  assert(swarm.material.uniforms.uOpacity.value === 1.0, 'setOpacity(2): uOpacity clamped to 1.0');

  // Extreme clamps: -1e6 and +1e6
  swarm.setOpacity(-1e6);
  assert(swarm.opacity === 0.0 && swarm.material.uniforms.uOpacity.value === 0.0, 'setOpacity(-1e6) clamped to 0.0');
  swarm.setOpacity(1e6);
  assert(swarm.opacity === 1.0 && swarm.material.uniforms.uOpacity.value === 1.0, 'setOpacity(1e6) clamped to 1.0');

  // Non-numeric edge cases: NaN, undefined, null
  let opNanThrew = false;
  try {
    swarm.setOpacity(NaN);
    swarm.setOpacity(undefined);
    swarm.setOpacity(null);
  } catch (e) {
    opNanThrew = true;
  }
  assert(!opNanThrew, 'setOpacity(NaN / undefined / null) does not throw exception');

  // String parsing
  swarm.setOpacity('0.63');
  assert(Math.abs(swarm.opacity - 0.63) < 1e-4, 'setOpacity("0.63") coerces to 0.63');

  swarm.dispose();
});

suite('2.4 GalaxySwarm: setVisible() truthy/falsy toggling', () => {
  const swarm = new GalaxySwarm();
  assert(swarm.visible === true, 'Initial visible is true');
  assert(swarm.group.visible === true, 'Initial group.visible is true');

  swarm.setVisible(false);
  assert(swarm.visible === false, 'setVisible(false): visible is false');
  assert(swarm.group.visible === false, 'setVisible(false): group.visible is false');

  swarm.setVisible(true);
  assert(swarm.visible === true, 'setVisible(true): visible is true');
  assert(swarm.group.visible === true, 'setVisible(true): group.visible is true');

  // Falsy and truthy coercion
  swarm.setVisible(0);
  assert(swarm.visible === false && swarm.group.visible === false, 'setVisible(0) coerces to false');

  swarm.setVisible(1);
  assert(swarm.visible === true && swarm.group.visible === true, 'setVisible(1) coerces to true');

  swarm.setVisible(null);
  assert(swarm.visible === false && swarm.group.visible === false, 'setVisible(null) coerces to false');

  swarm.setVisible('active');
  assert(swarm.visible === true && swarm.group.visible === true, 'setVisible("active") coerces to true');

  swarm.dispose();
});

suite('2.5 GalaxySwarm: dispose() cleanup, idempotency & post-disposal safety', () => {
  const swarm = new GalaxySwarm(null, { count: 1000 });
  const geom = swarm.pointsMesh.geometry;
  const mat = swarm.pointsMesh.material;
  const tex = swarm.particleTexture;

  assert(swarm.pointsMesh instanceof THREE.Points, 'pointsMesh exists');
  assert(swarm.group.children.length === 1, 'group has pointsMesh child');

  let geomDisposed = false;
  let matDisposed = false;
  let texDisposed = false;
  geom.addEventListener('dispose', () => { geomDisposed = true; });
  mat.addEventListener('dispose', () => { matDisposed = true; });
  tex.addEventListener('dispose', () => { texDisposed = true; });

  // 1st dispose call
  swarm.dispose();
  assert(geomDisposed, 'pointsMesh.geometry disposed');
  assert(matDisposed, 'pointsMesh.material disposed');
  assert(texDisposed, 'particleTexture disposed');
  assert(swarm.pointsMesh === null, 'pointsMesh reference nullified');
  assert(swarm.particleTexture === null, 'particleTexture reference nullified');
  assert(swarm.group.children.length === 0, 'Group children emptied');

  // Idempotency: call dispose() 2nd, 3rd, 5th, 10th time
  let repeatedSwarmDisposeThrew = false;
  try {
    swarm.dispose();
    swarm.dispose();
    swarm.dispose();
    swarm.dispose();
    swarm.dispose();
  } catch (e) {
    repeatedSwarmDisposeThrew = true;
  }
  assert(!repeatedSwarmDisposeThrew, 'GalaxySwarm.dispose() is strictly idempotent');

  // Post-disposal method execution safety
  let swarmPostCallThrew = false;
  try {
    swarm.setVisible(false);
    swarm.setVisible(true);
    swarm.setOpacity(0.5);
    swarm.update(1.0);
    swarm.getClusterCounts();
  } catch (e) {
    swarmPostCallThrew = true;
    console.error('Post-dispose swarm method threw:', e);
  }
  assert(!swarmPostCallThrew, 'All public swarm methods execute safely post-disposal without throwing');
});

suite('2.6 GalaxySwarm: memory allocation & leak stress during update() loop', () => {
  const swarm = new GalaxySwarm(null, { count: 4000 });

  // Baseline garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const initialMemory = process.memoryUsage().heapUsed;

  // Run 10,000 frames of update()
  for (let frame = 0; frame < 10000; frame++) {
    const elapsed = frame * 0.0166;
    swarm.update(elapsed);
  }

  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMB = (finalMemory - initialMemory) / (1024 * 1024);

  console.log(`  [Memory Benchmark] Initial Heap: ${(initialMemory / 1024 / 1024).toFixed(2)} MB, Final Heap: ${(finalMemory / 1024 / 1024).toFixed(2)} MB, Delta: ${memoryDeltaMB.toFixed(3)} MB`);

  // Delta should be well under 2.0 MB for 10,000 frames (virtually zero allocation)
  assert(memoryDeltaMB < 2.0, `Memory delta across 10,000 update() calls is negligible (${memoryDeltaMB.toFixed(3)} MB < 2.0 MB)`);

  swarm.dispose();
});

suite('2.7 GalaxySwarm: Virial core concentration & numerical float bounds (18,000 particles)', () => {
  const cf = new CosmicField();
  const swarm = new GalaxySwarm(cf, { count: 18000 });

  const geom = swarm.pointsMesh.geometry;
  const pos = geom.getAttribute('position');
  const col = geom.getAttribute('color');
  const size = geom.getAttribute('size');

  assert(pos.count === 18000, 'Position attribute count is exactly 18,000');
  assert(col.count === 18000, 'Color attribute count is exactly 18,000');
  assert(size.count === 18000, 'Size attribute count is exactly 18,000');

  // Check all 54,000 coordinate components are finite
  let allPositionsFinite = true;
  let allColorsInRange = true;
  let allSizesPositive = true;

  for (let i = 0; i < 18000; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      allPositionsFinite = false;
      break;
    }

    const r = col.getX(i);
    const g = col.getY(i);
    const b = col.getZ(i);
    if (r < 0 || r > 1.0 || g < 0 || g > 1.0 || b < 0 || b > 1.0) {
      allColorsInRange = false;
      break;
    }

    const s = size.getX(i);
    if (s <= 0 || !Number.isFinite(s)) {
      allSizesPositive = false;
      break;
    }
  }

  assert(allPositionsFinite, 'All 54,000 position coordinate floats are finite numbers');
  assert(allColorsInRange, 'All 54,000 RGB color components are normalized in [0, 1]');
  assert(allSizesPositive, 'All 18,000 size floats are strictly positive numbers');

  // Verify Virgo concentration (Virgo core particles index range)
  const virgoCenter = new THREE.Vector3(-8, 3, 0);
  const counts = swarm.getClusterCounts();
  const virgoStart = counts.centaurusGA;
  const virgoEnd = virgoStart + counts.virgo;
  let virgoDistances = [];
  for (let i = virgoStart; i < virgoEnd; i++) {
    const d = Math.hypot(pos.getX(i) - virgoCenter.x, pos.getY(i) - virgoCenter.y, pos.getZ(i) - virgoCenter.z);
    virgoDistances.push(d);
  }
  virgoDistances.sort((a, b) => a - b);
  const virgoMedian = virgoDistances[Math.floor(virgoDistances.length / 2)];
  assert(virgoMedian < 6.0, `Virgo core median distance is tightly packed (< 6.0, actual: ${virgoMedian.toFixed(2)})`);

  // Verify Coma concentration
  const comaCenter = new THREE.Vector3(5, 45, -25);
  const comaStart = virgoEnd + counts.hydraAntlia;
  const comaEnd = comaStart + counts.coma;
  let comaCoreCount = 0;
  for (let i = comaStart; i < comaEnd; i++) {
    const d = Math.hypot(pos.getX(i) - comaCenter.x, pos.getY(i) - comaCenter.y, pos.getZ(i) - comaCenter.z);
    if (d < 16.0) comaCoreCount++;
  }
  assert(comaCoreCount === counts.coma, `All ${counts.coma} Coma particles fall within virial boundary (actual: ${comaCoreCount})`);

  swarm.dispose();
});

// ====================================================================
// SUITE 3: Deep Adversarial Churn, Immutability & 50,000-Frame Stress
// ====================================================================
suite('3.1 GalaxyClusters: Constructor options polymorphism & catalog query immutability', () => {
  // Test constructor with custom options
  const customOpts = {
    color: 0xffeeaa,
    roughness: 0.15,
    metalness: 0.20,
    clearcoat: 0.90,
    clearcoatRoughness: 0.10,
    reflectivity: 0.60,
    sheen: 0.50,
    opacity: 0.80,
    scaleMultiplier: 1.25,
    pulseEnabled: true
  };
  const clusters = new GalaxyClusters(customOpts);

  assert(clusters.material.color.getHex() === 0xffeeaa, 'Custom color applied');
  assert(Math.abs(clusters.material.roughness - 0.15) < 1e-4, 'Custom roughness applied');
  assert(Math.abs(clusters.material.metalness - 0.20) < 1e-4, 'Custom metalness applied');
  assert(Math.abs(clusters.material.clearcoat - 0.90) < 1e-4, 'Custom clearcoat applied');
  assert(Math.abs(clusters.material.opacity - 0.80) < 1e-4, 'Custom opacity applied');
  assert(clusters.pulseEnabled === true, 'pulseEnabled initialized from options');
  assert(Math.abs(clusters.scaleMultiplier - 1.25) < 1e-4, 'scaleMultiplier initialized from options');

  // Test getClusters() immutability: mutating returned array must not mutate internal state
  const catalog = clusters.getClusters();
  assert(catalog.length === 29, 'Catalog returned 29 entries');
  catalog.length = 0; // attempt to wipe
  assert(clusters.clusters.length === 29, 'Internal clusters array remains intact after mutating getClusters() return');

  // Test getCluster() edge case inputs
  assert(clusters.getCluster('') === null, 'getCluster("") returns null');
  assert(clusters.getCluster(null) === null, 'getCluster(null) returns null');
  assert(clusters.getCluster(undefined) === null, 'getCluster(undefined) returns null');
  assert(clusters.getCluster(12345) === null, 'getCluster(12345) returns null');
  assert(clusters.getCluster('nonexistent') === null, 'getCluster("nonexistent") returns null');

  // Case & whitespace tolerance
  const c1 = clusters.getCluster('  vIrGo  ');
  assert(c1 !== null && c1.id === 'virgo', 'getCluster("  vIrGo  ") case & whitespace insensitive match');
  const c2 = clusters.getCluster('THE GREAT ATTRACTOR');
  assert(c2 !== null && c2.id === 'great-attractor', 'getCluster("THE GREAT ATTRACTOR") uppercase match');

  clusters.dispose();
});

suite('3.2 GalaxyClusters: 50,000-frame animation pulse heap benchmark', () => {
  const clusters = new GalaxyClusters({ pulseEnabled: true });

  const initialHeap = process.memoryUsage().heapUsed;

  // 50,000 frames
  for (let f = 0; f < 50000; f++) {
    clusters.update(f * 0.0166);
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const deltaMB = (finalHeap - initialHeap) / (1024 * 1024);

  console.log(`  [Clusters 50K Frames Heap] Initial: ${(initialHeap/1024/1024).toFixed(2)} MB, Final: ${(finalHeap/1024/1024).toFixed(2)} MB, Delta: ${deltaMB.toFixed(3)} MB`);
  assert(deltaMB < 3.0, `Clusters 50,000 update() frames heap delta negligible (${deltaMB.toFixed(3)} MB < 3.0 MB)`);

  clusters.dispose();
});

suite('3.3 GalaxySwarm: Rapid dynamic reconfiguration (100x slider drag churn)', () => {
  const swarm = new GalaxySwarm(null, { count: 1000 });

  // Simulate user dragging count and pointSize sliders back and forth 100 times
  let churnSuccess = true;
  try {
    for (let i = 0; i < 100; i++) {
      const c = 500 + (i % 20) * 200; // between 500 and 4300
      const sz = 0.5 + (i % 10) * 0.3; // between 0.5 and 3.2
      swarm.setCount(c);
      swarm.setPointSize(sz);
      swarm.setOpacity((i % 10) / 10);
    }
  } catch (e) {
    churnSuccess = false;
    console.error('Slider churn threw:', e);
  }

  assert(churnSuccess, '100x dynamic count, size & opacity reconfiguration completes without exception');
  assert(swarm.pointsMesh.geometry.getAttribute('position').count > 0, 'Buffer attributes valid after 100x churn');

  swarm.dispose();
});

suite('3.4 GalaxySwarm: Extreme count boundaries (count = 100 minimum clamp vs count = 50,000)', () => {
  const swarm = new GalaxySwarm(null, { count: 100 });

  // 1. Min clamp count = 100
  assert(swarm.count === 100, 'Swarm count is 100');
  const counts100 = swarm.getClusterCounts();
  const sum100 = counts100.centaurusGA + counts100.virgo + counts100.hydraAntlia + counts100.coma + counts100.diffuseFilament;
  assert(sum100 === 100, `Min count 100 sum is exact (${sum100} === 100)`);
  assert(counts100.centaurusGA > 0 && counts100.virgo > 0 && counts100.coma > 0, 'All core quotas > 0 even at count 100');

  // 2. High stress count = 50,000
  swarm.setCount(50000);
  assert(swarm.count === 50000, 'Swarm scaled up to 50,000 particles');
  assert(swarm.pointsMesh.geometry.getAttribute('position').count === 50000, '50,000 positions in buffer');
  const counts50k = swarm.getClusterCounts();
  const sum50k = counts50k.centaurusGA + counts50k.virgo + counts50k.hydraAntlia + counts50k.coma + counts50k.diffuseFilament;
  assert(sum50k === 50000, `High stress count 50,000 sum is exact (${sum50k} === 50000)`);

  swarm.dispose();
});

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n================================================================');
console.log(`STRESS HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  console.error('\nFAILURES:');
  for (const f of failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('\nVERDICT: ALL EMPIRICAL ADVERSARIAL STRESS TESTS PASSED CLEANLY.');
  process.exit(0);
}

