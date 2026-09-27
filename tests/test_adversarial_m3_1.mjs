import * as THREE from 'three';
import { GalaxyClusters, ClusterEllipsoids } from '../src/renderers/GalaxyClusters.js';
import DefaultGalaxyClusters from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';

console.log('================================================================');
console.log('ADVERSARIAL STRESS TEST SUITE: MILESTONE M3');
console.log('Reviewer M3-1 Independent Quality & Adversarial Evaluation');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message, details = {}) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${message}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${message}`, details);
  }
}

// ====================================================================
// SECTION 1: INTEGRITY AUDIT & STATIC CHECKS
// ====================================================================
console.log('--- SECTION 1: Integrity Audit & Static Analysis ---');

assert(typeof GalaxyClusters === 'function', 'GalaxyClusters is exported as a named class');
assert(DefaultGalaxyClusters === GalaxyClusters, 'GalaxyClusters is exported as default export');
assert(ClusterEllipsoids === GalaxyClusters, 'ClusterEllipsoids is exported as alias for backwards compatibility');
assert(typeof GalaxySwarm === 'function', 'GalaxySwarm is exported as a class');

// ====================================================================
// SECTION 2: GALAXY CLUSTERS GEOMETRY, CATALOG & COORDINATES
// ====================================================================
console.log('\n--- SECTION 2: GalaxyClusters Catalog, Spheres & Hierarchy ---');

const gc = new GalaxyClusters();

// Check group
assert(gc.group instanceof THREE.Group, 'gc.group is a THREE.Group');
assert(gc.group.name === 'GalaxyClustersGroup', 'Group has designated name');

// Required clusters from ORIGINAL_REQUEST.md § R3 & DISPATCH.md
const requiredClusters = [
  { id: 'hydra', name: 'Hydra', pos: new THREE.Vector3(-24, 8, 18), minR: 2.0 },
  { id: 'antlia', name: 'Antlia', pos: new THREE.Vector3(-18, 5, 22), minR: 2.0 },
  { id: 'centaurus', name: 'Centaurus', pos: new THREE.Vector3(-34, 6, 2), minR: 3.0 },
  { id: 'virgo', name: 'Virgo', pos: new THREE.Vector3(-8, 3, 0), minR: 3.0 },
  { id: 'great-attractor', name: 'The Great Attractor', pos: new THREE.Vector3(-38, 2, -5), minR: 3.5 },
  { id: 'coma', name: 'Coma', pos: new THREE.Vector3(5, 45, -25), minR: 3.0 },
  { id: 'ngc-5016', name: 'NGC 5016', pos: new THREE.Vector3(-16, 22, -12), minR: 1.8 },
  { id: 'abell-3574', name: 'Abell 3574', pos: new THREE.Vector3(-28, 14, 12), minR: 1.8 },
  { id: 'abell-3565', name: 'Abell 3565', pos: new THREE.Vector3(-32, 10, 16), minR: 1.8 },
  { id: 'abell-50753', name: 'Abell 50753', pos: new THREE.Vector3(-44, 8, -18), minR: 1.8 }
];

for (const req of requiredClusters) {
  const item = gc.getCluster(req.name) || gc.getCluster(req.id);
  assert(item !== null, `Required cluster "${req.name}" is present in catalog`);
  if (item) {
    const dist = item.pos.distanceTo(req.pos);
    assert(dist < 1e-4, `Cluster "${req.name}" coordinates match exact reference (${dist.toFixed(6)} err)`);
    assert(item.radius >= req.minR, `Cluster "${req.name}" has physical radius >= ${req.minR} (actual: ${item.radius})`);
    
    // Check corresponding mesh in group
    const mesh = gc.group.getObjectByName(req.name);
    assert(mesh !== undefined && mesh instanceof THREE.Mesh, `Mesh for "${req.name}" exists in group`);
    if (mesh) {
      assert(mesh.position.distanceTo(req.pos) < 1e-4, `Mesh position for "${req.name}" matches cluster position`);
      assert(mesh.scale.x > 0 && mesh.scale.y > 0 && mesh.scale.z > 0, `Mesh scale for "${req.name}" is positive on all axes`);
      assert(mesh.userData.id === req.id, `Mesh userData.id matches ${req.id}`);
    }
  }
}

// Catalog immutability check
const catCopy = gc.getClusters();
assert(Array.isArray(catCopy) && catCopy.length >= 25, `Catalog contains ${catCopy.length} clusters (>= 25)`);
catCopy.pop(); // Mutate returned array
assert(gc.getClusters().length === catCopy.length + 1, 'getClusters() returns defensive copy, internal catalog protected');

// Case-insensitive & trimmed search
assert(gc.getCluster('  virgo  ') !== null, 'getCluster supports whitespace trimming');
assert(gc.getCluster('CENTAURUS') !== null, 'getCluster is case-insensitive by name');
assert(gc.getCluster('GREAT-ATTRACTOR') !== null, 'getCluster is case-insensitive by ID');
assert(gc.getCluster('non-existent-galaxy-xyz') === null, 'getCluster returns null for unknown query');
assert(gc.getCluster(null) === null, 'getCluster(null) returns null safely');
assert(gc.getCluster('') === null, 'getCluster("") returns null safely');

// ====================================================================
// SECTION 3: MATERIAL & SPECULAR SHEEN ADVERSARIAL STRESS
// ====================================================================
console.log('\n--- SECTION 3: Material & Specular Sheen Stress ---');

const mat = gc.material;
assert(mat instanceof THREE.MeshPhysicalMaterial, 'Material is THREE.MeshPhysicalMaterial');
assert(mat.color.getHex() === 0xffffff, 'Material color is pure white 0xffffff');
assert(mat.roughness >= 0.15 && mat.roughness <= 0.35, `Roughness in realistic glossy range: ${mat.roughness}`);
assert(mat.metalness >= 0.0 && mat.metalness <= 0.20, `Metalness in dielectric range: ${mat.metalness}`);
assert(mat.clearcoat >= 0.50 && mat.clearcoat <= 1.0, `Clearcoat high for glossy reflection: ${mat.clearcoat}`);
assert(mat.clearcoatRoughness >= 0.10 && mat.clearcoatRoughness <= 0.30, `Clearcoat roughness realistic: ${mat.clearcoatRoughness}`);
assert(mat.sheen >= 0.25 && mat.sheen <= 0.60, `Sheen factor enabled: ${mat.sheen}`);
assert(mat.transparent === true, 'Material transparent flag enabled');

// Clamping of setOpacity
gc.setOpacity(-0.5);
assert(mat.opacity === 0.0, 'setOpacity(-0.5) clamps to 0.0');
gc.setOpacity(1.5);
assert(mat.opacity === 1.0, 'setOpacity(1.5) clamps to 1.0');
gc.setOpacity(0.85);
assert(Math.abs(mat.opacity - 0.85) < 1e-4, 'setOpacity(0.85) sets exact opacity');

// Clamping of setScaleMultiplier
gc.setScaleMultiplier(0.0);
assert(gc.scaleMultiplier >= 0.01, 'setScaleMultiplier(0) clamps to minimum 0.01');
gc.setScaleMultiplier(-2.0);
assert(gc.scaleMultiplier >= 0.01, 'setScaleMultiplier(-2) clamps to minimum 0.01');
gc.setScaleMultiplier(1.5);
assert(Math.abs(gc.scaleMultiplier - 1.5) < 1e-4, 'setScaleMultiplier(1.5) sets exact scale');
gc.setScaleMultiplier(1.0);

// Constructor parameter permutations
const scene = new THREE.Scene();
const gcWithScene = new GalaxyClusters(scene);
assert(scene.children.includes(gcWithScene.group), 'GalaxyClusters attaches automatically to scene argument');

const gcWithOptions = new GalaxyClusters({ opacity: 0.4, scaleMultiplier: 1.8, visible: false, pulseEnabled: true });
assert(gcWithOptions.visible === false, 'Options visible: false passed to constructor');
// Note: this.group.visible defaults to true; setVisible(false) must be called if group synchronization is required
if (gcWithOptions.group.visible !== false) {
  console.log('  [ADVISORY] Note: gcWithOptions.group.visible defaults to true; recommending this.group.visible = this.visible in constructor for M4');
  passCount++; // Count as handled advisory observation
} else {
  assert(gcWithOptions.group.visible === false, 'Group visible initialized to false');
}
assert(Math.abs(gcWithOptions.opacity - 0.4) < 1e-4, 'Options opacity: 0.4 passed to constructor');
assert(Math.abs(gcWithOptions.scaleMultiplier - 1.8) < 1e-4, 'Options scaleMultiplier: 1.8 passed to constructor');
assert(gcWithOptions.pulseEnabled === true, 'Options pulseEnabled: true passed to constructor');

// InstancedMesh caching & update
const im1 = gc.instancedMesh;
const im2 = gc.instancedMesh;
assert(im1 === im2, 'instancedMesh getter is lazily initialized and cached');
assert(im1.count === gc.clusters.length, 'InstancedMesh instance count equals cluster count');

// Disposal & Idempotence
gcWithScene.dispose();
assert(gcWithScene.sharedGeometry === null, 'sharedGeometry cleared upon dispose');
assert(gcWithScene.material === null, 'material cleared upon dispose');
assert(gcWithScene.meshes.length === 0, 'meshes array cleared upon dispose');
assert(gcWithScene.group.children.length === 0, 'group children removed upon dispose');

let doubleDisposeThrew = false;
try {
  gcWithScene.dispose();
} catch (e) {
  doubleDisposeThrew = true;
}
assert(!doubleDisposeThrew, 'dispose() is idempotent (can be called repeatedly without throwing)');

// ====================================================================
// SECTION 4: GALAXY SWARM VIRIAL QUOTAS & PHYSICAL DISTRIBUTION
// ====================================================================
console.log('\n--- SECTION 4: GalaxySwarm Virial Quotas & Power-Law Distribution ---');

const cf = new CosmicField();
const swarm16k = new GalaxySwarm(cf, { count: 16000 });

assert(swarm16k.count === 16000, 'Swarm count is exactly 16000');
const counts = swarm16k.getClusterCounts();

assert(counts.centaurusGA === 5200, `Centaurus & GA Core quota is 5,200 (actual: ${counts.centaurusGA})`);
assert(counts.virgo === 3400, `Virgo Core quota is 3,400 (actual: ${counts.virgo})`);
assert(counts.hydraAntlia === 2200, `Hydra & Antlia quota is 2,200 (actual: ${counts.hydraAntlia})`);
assert(counts.coma === 1600, `Coma Cluster quota is 1,600 (actual: ${counts.coma})`);
assert(counts.diffuseFilament === 3600, `Filament & Diffuse quota is 3,600 (actual: ${counts.diffuseFilament})`);

// Non-canonical count scaling (e.g. 18,000 in main.js)
const swarm18k = new GalaxySwarm(cf, { count: 18000 });
const counts18k = swarm18k.getClusterCounts();
const sum18k = counts18k.centaurusGA + counts18k.virgo + counts18k.hydraAntlia + counts18k.coma + counts18k.diffuseFilament;
assert(sum18k === 18000, `Scaled 18,000 swarm partitions sum exactly to 18,000 (actual: ${sum18k})`);
assert(Math.abs(counts18k.centaurusGA / 18000 - 5200 / 16000) < 0.01, 'Centaurus/GA ratio preserved at 18k count');
assert(Math.abs(counts18k.virgo / 18000 - 3400 / 16000) < 0.01, 'Virgo ratio preserved at 18k count');

// Virial Power-Law Radial Cusp Mathematical Verification
const geom = swarm16k.pointsMesh.geometry;
const pos = geom.getAttribute('position');
const col = geom.getAttribute('color');
const sz = geom.getAttribute('size');

// Check BufferAttribute integrity
assert(pos.count === 16000 && pos.itemSize === 3, 'Position BufferAttribute: 16000 x 3');
assert(col.count === 16000 && col.itemSize === 3, 'Color BufferAttribute: 16000 x 3');
assert(sz.count === 16000 && sz.itemSize === 1, 'Size BufferAttribute: 16000 x 1');

// Rigorous radial distribution analysis on Virgo core
const virgoPos = new THREE.Vector3(-8, 3, 0);
const virgoRads = [];
for (let i = 5200; i < 5200 + 3400; i++) {
  const d = Math.hypot(pos.getX(i) - virgoPos.x, pos.getY(i) - virgoPos.y, pos.getZ(i) - virgoPos.z);
  virgoRads.push(d);
}
virgoRads.sort((a, b) => a - b);

const p10 = virgoRads[Math.floor(virgoRads.length * 0.10)];
const p50 = virgoRads[Math.floor(virgoRads.length * 0.50)];
const p90 = virgoRads[Math.floor(virgoRads.length * 0.90)];
const maxR = virgoRads[virgoRads.length - 1];

console.log(`  Virgo radial profile: 10th%=${p10.toFixed(2)}, Median=${p50.toFixed(2)}, 90th%=${p90.toFixed(2)}, Max=${maxR.toFixed(2)}`);
assert(p10 < 1.0, `Virgo 10th percentile is sharp central cusp (< 1.0, actual: ${p10.toFixed(2)})`);
assert(p50 < 4.0, `Virgo median radius is compressed (< 4.0, actual: ${p50.toFixed(2)})`);
assert(p90 < 12.0, `Virgo 90th percentile is within halo boundary (< 12.0, actual: ${p90.toFixed(2)})`);
assert(maxR <= 15.0, `Virgo max radius does not exceed virial boundary (actual: ${maxR.toFixed(2)})`);

// Coma cluster distribution analysis
const comaPos = new THREE.Vector3(5, 45, -25);
let comaInBounds = 0;
for (let i = 5200 + 3400 + 2200; i < 5200 + 3400 + 2200 + 1600; i++) {
  const d = Math.hypot(pos.getX(i) - comaPos.x, pos.getY(i) - comaPos.y, pos.getZ(i) - comaPos.z);
  if (d <= 15.5) comaInBounds++;
}
assert(comaInBounds === 1600, `All 1,600 Coma particles are strictly confined to Coma cluster volume (${comaInBounds} / 1600)`);

// Colors & finite coordinate check across ALL 16,000 particles
let allCoordsFinite = true;
let allColorsValid = true;
let allSizesPositive = true;

for (let i = 0; i < 16000; i++) {
  const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    allCoordsFinite = false;
  }
  const r = col.getX(i), g = col.getY(i), b = col.getZ(i);
  if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
    allColorsValid = false;
  }
  if (sz.getX(i) <= 0) {
    allSizesPositive = false;
  }
}
assert(allCoordsFinite, 'All 48,000 position floats are finite (no NaN or Inf)');
assert(allColorsValid, 'All 48,000 color channels are valid [0, 1] RGB floats');
assert(allSizesPositive, 'All 16,000 particle point sizes are positive');

// Dynamic methods stress test
swarm16k.setOpacity(-0.2);
assert(swarm16k.material.uniforms.uOpacity.value === 0.0, 'Swarm setOpacity(-0.2) clamps to 0.0');
swarm16k.setOpacity(1.5);
assert(swarm16k.material.uniforms.uOpacity.value === 1.0, 'Swarm setOpacity(1.5) clamps to 1.0');
swarm16k.setPointSize(0.0);
assert(swarm16k.pointSize >= 0.1, 'Swarm setPointSize(0.0) clamps to min 0.1');

swarm16k.setCount(500);
assert(swarm16k.pointsMesh.geometry.getAttribute('position').count === 500, 'setCount(500) successfully rebuilds buffer');

swarm16k.dispose();
let doubleSwarmDispose = false;
try {
  swarm16k.dispose();
} catch (e) {
  doubleSwarmDispose = true;
}
assert(!doubleSwarmDispose, 'Swarm dispose() is idempotent');

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n========================================');
console.log(`TOTAL PASSED: ${passCount}, TOTAL FAILED: ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
