import * as THREE from 'three';
import { GalaxyClusters } from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';

console.log('================================================================');
console.log('TEST SUITE: MILESTONE M3 (Major Galaxy Cluster Ellipsoids & Swarm)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message, details = {}) {
  if (condition) {
    passCount++;
    console.log(`  PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  FAIL: ${message}`, details);
  }
}

// ====================================================================
// SUITE 1: GalaxyClusters Catalog, Coordinates & Hierarchy
// ====================================================================
console.log('========================================');
console.log('SUITE 1: GalaxyClusters Catalog & Coordinates');
console.log('========================================');

const clusters = new GalaxyClusters();

assert(clusters instanceof GalaxyClusters, 'GalaxyClusters instantiates cleanly');
assert(clusters.group instanceof THREE.Group, 'clusters.group is a THREE.Group');
assert(clusters.group.name === 'GalaxyClustersGroup', 'Group has correct name');

// Check prominent clusters from DISPATCH.md
const hydra = clusters.getCluster('Hydra');
assert(hydra !== null, 'Hydra cluster is registered');
assert(hydra && hydra.pos.distanceTo(new THREE.Vector3(-24, 8, 18)) < 1e-4, 'Hydra at exact position (-24, 8, 18)');

const antlia = clusters.getCluster('Antlia');
assert(antlia !== null, 'Antlia cluster is registered');
assert(antlia && antlia.pos.distanceTo(new THREE.Vector3(-18, 5, 22)) < 1e-4, 'Antlia at exact position (-18, 5, 22)');

const centaurus = clusters.getCluster('Centaurus');
assert(centaurus !== null, 'Centaurus cluster is registered');
assert(centaurus && centaurus.pos.distanceTo(new THREE.Vector3(-34, 6, 2)) < 1e-4, 'Centaurus at exact position (-34, 6, 2)');

const virgo = clusters.getCluster('Virgo');
assert(virgo !== null, 'Virgo cluster is registered');
assert(virgo && virgo.pos.distanceTo(new THREE.Vector3(-8, 3, 0)) < 1e-4, 'Virgo at exact position (-8, 3, 0)');

const ga = clusters.getCluster('The Great Attractor');
assert(ga !== null, 'The Great Attractor cluster is registered');
assert(ga && ga.pos.distanceTo(new THREE.Vector3(-38, 2, -5)) < 1e-4, 'The Great Attractor at exact position (-38, 2, -5)');

const coma = clusters.getCluster('Coma');
assert(coma !== null, 'Coma cluster is registered');
assert(coma && coma.pos.distanceTo(new THREE.Vector3(5, 45, -25)) < 1e-4, 'Coma at exact position (5, 45, -25)');

// Secondary clusters
const ngc5016 = clusters.getCluster('NGC 5016');
assert(ngc5016 !== null, 'NGC 5016 cluster is registered');
assert(ngc5016 && ngc5016.pos.distanceTo(new THREE.Vector3(-16, 22, -12)) < 1e-4, 'NGC 5016 at exact position (-16, 22, -12)');

const abell3574 = clusters.getCluster('Abell 3574');
assert(abell3574 !== null, 'Abell 3574 is registered');
assert(abell3574 && abell3574.pos.distanceTo(new THREE.Vector3(-28, 14, 12)) < 1e-4, 'Abell 3574 at exact position (-28, 14, 12)');

const abell3565 = clusters.getCluster('Abell 3565');
assert(abell3565 !== null, 'Abell 3565 is registered');
assert(abell3565 && abell3565.pos.distanceTo(new THREE.Vector3(-32, 10, 16)) < 1e-4, 'Abell 3565 at exact position (-32, 10, 16)');

const abell50753 = clusters.getCluster('Abell 50753');
assert(abell50753 !== null, 'Abell 50753 is registered');
assert(abell50753 && abell50753.pos.distanceTo(new THREE.Vector3(-44, 8, -18)) < 1e-4, 'Abell 50753 at exact position (-44, 8, -18)');

// Total cluster count
const allClusters = clusters.getClusters();
assert(allClusters.length >= 20, `Total cluster catalog contains ${allClusters.length} entries (>= 20)`);
assert(clusters.meshes.length === allClusters.length, 'Individual mesh count matches cluster catalog count');
assert(clusters.group.children.length === allClusters.length, 'All cluster meshes added to group');

// ====================================================================
// SUITE 2: GalaxyClusters Material & Lighting Properties
// ====================================================================
console.log('\n========================================');
console.log('SUITE 2: GalaxyClusters Material & Specular Sheen');
console.log('========================================');

const mat = clusters.material;
assert(mat instanceof THREE.MeshPhysicalMaterial, 'Material is THREE.MeshPhysicalMaterial');
assert(mat.color.getHex() === 0xffffff, 'Material color is crisp white (0xffffff)');
assert(Math.abs(mat.roughness - 0.24) < 1e-3, `Roughness is 0.24 (actual: ${mat.roughness})`);
assert(Math.abs(mat.metalness - 0.08) < 1e-3, `Metalness is 0.08 (actual: ${mat.metalness})`);
assert(Math.abs(mat.clearcoat - 0.70) < 1e-3, `Clearcoat is 0.70 (actual: ${mat.clearcoat})`);
assert(Math.abs(mat.clearcoatRoughness - 0.20) < 1e-3, `Clearcoat roughness is 0.20 (actual: ${mat.clearcoatRoughness})`);
assert(mat.reflectivity >= 0.45, `Reflectivity catches specular sheen (actual: ${mat.reflectivity})`);
assert(mat.sheen >= 0.20, `Directional sheen enabled (actual: ${mat.sheen})`);

// ====================================================================
// SUITE 3: GalaxyClusters Public API & Transformation
// ====================================================================
console.log('\n========================================');
console.log('SUITE 3: GalaxyClusters Public Methods & Lifecycle');
console.log('========================================');

// Test setVisible
clusters.setVisible(false);
assert(clusters.group.visible === false, 'setVisible(false) hides cluster group');
clusters.setVisible(true);
assert(clusters.group.visible === true, 'setVisible(true) restores visibility');

// Test setOpacity
clusters.setOpacity(0.5);
assert(Math.abs(mat.opacity - 0.5) < 1e-3, 'setOpacity(0.5) sets material opacity');
assert(mat.transparent === true, 'Material transparent flag enabled');
clusters.setOpacity(0.95);
assert(Math.abs(mat.opacity - 0.95) < 1e-3, 'setOpacity(0.95) restores opacity');

// Test setScaleMultiplier
const baseVirgoScale = virgo.radius * virgo.scale[0];
clusters.setScaleMultiplier(2.0);
const virgoMesh = clusters.group.getObjectByName('Virgo');
assert(virgoMesh !== undefined, 'Virgo mesh found by name in group');
assert(Math.abs(virgoMesh.scale.x - baseVirgoScale * 2.0) < 1e-3, 'Virgo mesh scaled by 2.0x');
clusters.setScaleMultiplier(1.0);
assert(Math.abs(virgoMesh.scale.x - baseVirgoScale) < 1e-3, 'Virgo mesh scale restored to 1.0x');

// Test update(elapsed)
clusters.pulseEnabled = true;
clusters.update(1.5);
assert(virgoMesh.scale.x > 0, 'update(elapsed) with pulse executes smoothly');
clusters.pulseEnabled = false;

// Test instancedMesh getter
const inst = clusters.instancedMesh;
assert(inst instanceof THREE.InstancedMesh, 'instancedMesh getter returns THREE.InstancedMesh');
assert(inst.count === allClusters.length, `InstancedMesh has ${inst.count} instances`);

// Test constructor with scene
const dummyScene = new THREE.Scene();
const sceneClusters = new GalaxyClusters(dummyScene);
assert(dummyScene.children.includes(sceneClusters.group), 'GalaxyClusters attaches automatically when scene passed');

// Test dispose
sceneClusters.dispose();
assert(sceneClusters.group.children.length === 0, 'dispose() removes all child meshes from group');
assert(sceneClusters.material === null, 'dispose() cleans up material reference');

// ====================================================================
// SUITE 4: GalaxySwarm Hierarchical Power-Law Virial Distribution
// ====================================================================
console.log('\n========================================');
console.log('SUITE 4: GalaxySwarm Virial Core Particle Quotas');
console.log('========================================');

const cf = new CosmicField();
const canonicalSwarm = new GalaxySwarm(cf, { count: 16000 });

assert(canonicalSwarm.count === 16000, 'Canonical swarm count is exactly 16,000');
const counts = canonicalSwarm.getClusterCounts();

// Check quotas
assert(counts.centaurusGA === 5200, `Centaurus & GA Core has exactly 5,200 particles (actual: ${counts.centaurusGA})`);
assert(counts.virgo === 3400, `Virgo Core has exactly 3,400 particles (actual: ${counts.virgo})`);
assert(counts.hydraAntlia === 2200, `Hydra & Antlia has exactly 2,200 particles (actual: ${counts.hydraAntlia})`);
assert(counts.coma === 1600, `Coma Cluster has exactly 1,600 particles (actual: ${counts.coma})`);
assert(counts.diffuseFilament === 3600, `Filament & Diffuse has exactly 3,600 particles (actual: ${counts.diffuseFilament})`);
assert(counts.centaurusGA + counts.virgo + counts.hydraAntlia + counts.coma + counts.diffuseFilament === 16000, 'Sum of cluster particle quotas equals 16,000');

// Buffer attributes
const geom = canonicalSwarm.pointsMesh.geometry;
const posAttr = geom.getAttribute('position');
const colAttr = geom.getAttribute('color');
const sizeAttr = geom.getAttribute('size');

assert(posAttr.count === 16000, 'Position attribute has 16,000 entries');
assert(colAttr.count === 16000, 'Color attribute has 16,000 entries');
assert(sizeAttr.count === 16000, 'Size attribute has 16,000 entries');

// Check numerical validity (no NaN or Infs)
let allFinite = true;
for (let i = 0; i < posAttr.array.length; i++) {
  if (!Number.isFinite(posAttr.array[i])) {
    allFinite = false;
    break;
  }
}
assert(allFinite, 'All 48,000 position coordinate floats are finite numbers');

// Power-law density test: verify high density concentration in virial cores
// Test Virgo core particles (index 5200 to 8599)
const virgoCenter = new THREE.Vector3(-8, 3, 0);
let virgoDistances = [];
for (let i = 5200; i < 5200 + 3400; i++) {
  const px = posAttr.getX(i);
  const py = posAttr.getY(i);
  const pz = posAttr.getZ(i);
  const d = Math.hypot(px - virgoCenter.x, py - virgoCenter.y, pz - virgoCenter.z);
  virgoDistances.push(d);
}
virgoDistances.sort((a, b) => a - b);
const virgoMedian = virgoDistances[Math.floor(virgoDistances.length / 2)];
// In a uniform sphere of radius 14.5, median distance is R * (0.5)^(1/3) ~ 11.5.
// In our power-law core (r ~ u^2.2 * 14.5), median distance is 14.5 * (0.5)^2.2 ~ 3.16!
assert(virgoMedian < 6.0, `Virgo core median distance is tightly packed (< 6.0, actual: ${virgoMedian.toFixed(2)})`);

// Test Centaurus & GA particles (index 0 to 5199)
const gaCenter = new THREE.Vector3(-38, 2, -5);
const centCenter = new THREE.Vector3(-34, 6, 2);
let gaOrCentCount = 0;
for (let i = 0; i < 5200; i++) {
  const px = posAttr.getX(i);
  const py = posAttr.getY(i);
  const pz = posAttr.getZ(i);
  const dGA = Math.hypot(px - gaCenter.x, py - gaCenter.y, pz - gaCenter.z);
  const dCent = Math.hypot(px - centCenter.x, py - centCenter.y, pz - centCenter.z);
  if (dGA < 24.0 || dCent < 20.0) {
    gaOrCentCount++;
  }
}
assert(gaOrCentCount === 5200, `All 5,200 Centaurus/GA particles lie within their virial radii (actual: ${gaOrCentCount})`);

// Test Coma particles (index 10800 to 12399)
const comaCenter = new THREE.Vector3(5, 45, -25);
let comaCoreCount = 0;
for (let i = 5200 + 3400 + 2200; i < 5200 + 3400 + 2200 + 1600; i++) {
  const px = posAttr.getX(i);
  const py = posAttr.getY(i);
  const pz = posAttr.getZ(i);
  const d = Math.hypot(px - comaCenter.x, py - comaCenter.y, pz - comaCenter.z);
  if (d < 16.0) comaCoreCount++;
}
assert(comaCoreCount === 1600, `All 1,600 Coma particles are concentrated around Coma cluster (actual: ${comaCoreCount})`);

// ====================================================================
// SUITE 5: GalaxySwarm Shaders, Uniforms & Dynamic Controls
// ====================================================================
console.log('\n========================================');
console.log('SUITE 5: GalaxySwarm Shaders, Uniforms & Dynamic Controls');
console.log('========================================');

const swarmMat = canonicalSwarm.material;
assert(swarmMat instanceof THREE.ShaderMaterial, 'Swarm material is THREE.ShaderMaterial');
assert(swarmMat.uniforms.uOpacity !== undefined, 'Shader uniform uOpacity exists');
assert(swarmMat.uniforms.uTexture !== undefined, 'Shader uniform uTexture exists');

// Dynamic controls
canonicalSwarm.setOpacity(0.65);
assert(Math.abs(swarmMat.uniforms.uOpacity.value - 0.65) < 1e-4, 'setOpacity(0.65) updates uOpacity uniform');

canonicalSwarm.setVisible(false);
assert(canonicalSwarm.group.visible === false, 'setVisible(false) hides swarm group');
canonicalSwarm.setVisible(true);
assert(canonicalSwarm.group.visible === true, 'setVisible(true) restores visibility');

canonicalSwarm.update(2.5);
assert(true, 'update(elapsed) runs smoothly without exception');

// Rebuild with 18,000 points (as used in main.js)
canonicalSwarm.setCount(18000);
assert(canonicalSwarm.count === 18000, 'setCount(18000) updates swarm count');
assert(canonicalSwarm.pointsMesh.geometry.getAttribute('position').count === 18000, 'Position buffer resized to 18,000');

// Dispose
canonicalSwarm.dispose();
assert(canonicalSwarm.pointsMesh === null, 'dispose() cleans up pointsMesh');
assert(canonicalSwarm.particleTexture === null, 'dispose() cleans up particleTexture');

// ====================================================================
// SUMMARY
// ====================================================================
console.log('\n========================================');
console.log(`SUMMARY: ${passCount} / ${passCount + failCount} tests passed successfully!`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
