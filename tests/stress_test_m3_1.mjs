import * as THREE from 'three';
import { GalaxyClusters } from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';

console.log('========================================================================');
console.log('CHALLENGER M3-1: ADVERSARIAL STRESS TEST SUITE');
console.log('Target: GalaxyClusters.js & GalaxySwarm.js (Milestone M3)');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message, details = {}) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${message}`);
  } else {
    failCount++;
    const err = `  [FAIL] ${message} | Details: ${JSON.stringify(details)}`;
    console.error(err);
    failures.push(err);
  }
}

// ========================================================================
// SECTION 1: GalaxyClusters Catalog, Coordinates, Geometry & Scaling
// ========================================================================
console.log('--- SECTION 1: GalaxyClusters Catalog, Coordinates & Ellipsoid Scaling ---');

const clusters = new GalaxyClusters();
const catalog = clusters.getClusters();

// 1.1 Complete astronomical registry check
assert(catalog.length === 29, `Catalog contains exactly 29 clusters (found: ${catalog.length})`);
assert(clusters.meshes.length === 29, `Meshes array length is 29 (found: ${clusters.meshes.length})`);
assert(clusters.group.children.length === 29, `Group child count is 29 (found: ${clusters.group.children.length})`);

// 1.2 ID uniqueness & Name uniqueness
const idSet = new Set();
const nameSet = new Set();
let allIdsUnique = true;
let allNamesUnique = true;

for (const c of catalog) {
  if (idSet.has(c.id)) allIdsUnique = false;
  idSet.add(c.id);
  if (nameSet.has(c.name)) allNamesUnique = false;
  nameSet.add(c.name);
}
assert(allIdsUnique, `All ${catalog.length} cluster IDs are strictly unique`);
assert(allNamesUnique, `All ${catalog.length} cluster Names are strictly unique`);

// 1.3 Exact astronomical positions & scale factors
const expectedClusters = [
  { name: 'Hydra', pos: new THREE.Vector3(-24, 8, 18), radius: 2.8, scale: [1.1, 1.0, 1.0] },
  { name: 'Antlia', pos: new THREE.Vector3(-18, 5, 22), radius: 2.4, scale: [1.0, 1.0, 1.0] },
  { name: 'Centaurus', pos: new THREE.Vector3(-34, 6, 2), radius: 3.6, scale: [1.2, 0.9, 1.1] },
  { name: 'Virgo', pos: new THREE.Vector3(-8, 3, 0), radius: 3.5, scale: [1.1, 0.95, 1.05] },
  { name: 'The Great Attractor', pos: new THREE.Vector3(-38, 2, -5), radius: 4.2, scale: [1.1, 1.0, 1.1] },
  { name: 'Coma', pos: new THREE.Vector3(5, 45, -25), radius: 3.8, scale: [1.1, 1.1, 1.1] },
  { name: 'NGC 5016', pos: new THREE.Vector3(-16, 22, -12), radius: 2.2, scale: [1.0, 1.0, 1.0] },
  { name: 'Abell 3574', pos: new THREE.Vector3(-28, 14, 12), radius: 2.2, scale: [1.0, 1.0, 1.0] },
  { name: 'Abell 3565', pos: new THREE.Vector3(-32, 10, 16), radius: 2.0, scale: [1.0, 1.0, 1.0] },
  { name: 'Abell 50753', pos: new THREE.Vector3(-44, 8, -18), radius: 2.3, scale: [1.05, 0.95, 1.0] }
];

for (const exp of expectedClusters) {
  const c = clusters.getCluster(exp.name);
  assert(c !== null, `Cluster ${exp.name} exists in catalog`);
  if (c) {
    const dPos = c.pos.distanceTo(exp.pos);
    assert(dPos < 1e-4, `${exp.name} coordinates match exact position (${exp.pos.x}, ${exp.pos.y}, ${exp.pos.z}) (err: ${dPos})`);
    assert(Math.abs(c.radius - exp.radius) < 1e-4, `${exp.name} radius is ${exp.radius} (actual: ${c.radius})`);
    assert(
      Math.abs(c.scale[0] - exp.scale[0]) < 1e-4 &&
      Math.abs(c.scale[1] - exp.scale[1]) < 1e-4 &&
      Math.abs(c.scale[2] - exp.scale[2]) < 1e-4,
      `${exp.name} scale triad matches [${exp.scale.join(', ')}] (actual: [${c.scale.join(', ')}])`
    );

    // Verify mesh correspondence
    const mesh = c.mesh;
    assert(mesh instanceof THREE.Mesh, `${exp.name} has attached THREE.Mesh`);
    assert(mesh.position.distanceTo(exp.pos) < 1e-4, `${exp.name} mesh position matches pos`);
    assert(
      Math.abs(mesh.scale.x - exp.radius * exp.scale[0]) < 1e-4 &&
      Math.abs(mesh.scale.y - exp.radius * exp.scale[1]) < 1e-4 &&
      Math.abs(mesh.scale.z - exp.radius * exp.scale[2]) < 1e-4,
      `${exp.name} mesh scaled to radius * axis scale`
    );
  }
}

// 1.4 Ellipsoidal eccentricity verification
// Centaurus should be prolate/triaxial: scale.x > scale.z > scale.y
const cent = clusters.getCluster('Centaurus');
assert(cent.scale[0] > cent.scale[2] && cent.scale[2] > cent.scale[1], 'Centaurus is an authentic triaxial ellipsoid (X > Z > Y)');

// Virgo should be slightly flattened in Y
const vir = clusters.getCluster('Virgo');
assert(vir.scale[0] > vir.scale[1] && vir.scale[2] > vir.scale[1], 'Virgo is oblate with compression along Y-axis');

// 1.5 Robustness of getCluster queries
assert(clusters.getCluster('virgo') !== null, 'getCluster handles case-insensitive query: "virgo"');
assert(clusters.getCluster('VIRGO') !== null, 'getCluster handles uppercase query: "VIRGO"');
assert(clusters.getCluster('  virgo  ') !== null, 'getCluster handles padded whitespace: "  virgo  "');
assert(clusters.getCluster('the great attractor') !== null, 'getCluster handles multi-word lowercase query');
assert(clusters.getCluster('hydra-subnode') !== null, 'getCluster handles ID-based query: "hydra-subnode"');
assert(clusters.getCluster('non-existent-cluster') === null, 'getCluster returns null for unknown cluster');
assert(clusters.getCluster(null) === null, 'getCluster returns null safely for null');
assert(clusters.getCluster(undefined) === null, 'getCluster returns null safely for undefined');
assert(clusters.getCluster('') === null, 'getCluster returns null safely for empty string');

// 1.6 Bounding box calculations
for (const c of catalog) {
  const mesh = c.mesh;
  const bbox = new THREE.Box3().setFromObject(mesh);
  assert(bbox.containsPoint(c.pos), `Mesh bounding box contains center point for ${c.name}`);
  const minDim = Math.min(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z);
  assert(minDim >= c.radius * 1.5, `Bounding box size is consistent with radius for ${c.name} (minDim: ${minDim.toFixed(2)})`);
}

// ========================================================================
// SECTION 2: Material Parameters, Specular Sheen & Lighting Interaction
// ========================================================================
console.log('\n--- SECTION 2: MeshPhysicalMaterial Specular Parameters & Lighting ---');

const mat = clusters.material;
assert(mat instanceof THREE.MeshPhysicalMaterial, 'clusters.material is strictly THREE.MeshPhysicalMaterial');
assert(mat.color.getHex() === 0xffffff, 'Cluster sphere color is crisp white (0xffffff)');
assert(Math.abs(mat.roughness - 0.24) < 1e-4, `Roughness is 0.24 (actual: ${mat.roughness})`);
assert(Math.abs(mat.metalness - 0.08) < 1e-4, `Metalness is 0.08 (actual: ${mat.metalness})`);
assert(Math.abs(mat.clearcoat - 0.70) < 1e-4, `Clearcoat is 0.70 (actual: ${mat.clearcoat})`);
assert(Math.abs(mat.clearcoatRoughness - 0.20) < 1e-4, `Clearcoat roughness is 0.20 (actual: ${mat.clearcoatRoughness})`);
assert(Math.abs(mat.reflectivity - 0.50) < 1e-4, `Reflectivity is 0.50 (actual: ${mat.reflectivity})`);
assert(Math.abs(mat.sheen - 0.35) < 1e-4, `Sheen is 0.35 (actual: ${mat.sheen})`);
assert(mat.sheenColor.getHex() === 0xffffff, 'Sheen color is white (0xffffff)');
assert(Math.abs(mat.sheenRoughness - 0.25) < 1e-4, `Sheen roughness is 0.25 (actual: ${mat.sheenRoughness})`);
assert(mat.transparent === true, 'Transparent flag enabled');
assert(Math.abs(mat.opacity - 0.95) < 1e-4, `Default opacity is 0.95 (actual: ${mat.opacity})`);
assert(mat.flatShading === false, 'Flat shading disabled for smooth specular highlights');

// Specular lighting reflection geometry test:
// Camera reference: pos (-12, 100, 135), target (-10, 4, -8)
// Scene lights: dirLight1 (60, 130, 90), dirLight2 (-90, 60, -70)
const camPos = new THREE.Vector3(-12, 100, 135);
const l1Pos = new THREE.Vector3(60, 130, 90).normalize();
const l2Pos = new THREE.Vector3(-90, 60, -70).normalize();

for (const c of expectedClusters.slice(0, 6)) {
  const vPos = new THREE.Vector3().subVectors(camPos, c.pos).normalize();
  // Half-angle vectors
  const h1 = new THREE.Vector3().addVectors(l1Pos, vPos).normalize();
  const h2 = new THREE.Vector3().addVectors(l2Pos, vPos).normalize();
  // Normal on sphere towards half-vector
  const nDotH1 = Math.max(0, h1.dot(h1)); // Always 1 for aligned normal
  const nDotL1 = Math.max(0, l1Pos.dot(h1));
  const nDotV = Math.max(0, vPos.dot(h1));

  // Blinn-Phong specular term: (N.H)^alpha
  const shininess = 2.0 / (mat.roughness * mat.roughness) - 2.0;
  assert(shininess > 20.0, `Shininess derived from roughness 0.24 is high (${shininess.toFixed(1)} > 20)`);
  assert(nDotL1 > 0 && nDotV > 0, `Specular highlight geometrically visible on ${c.name} from light 1`);
}

// ========================================================================
// SECTION 3: Dynamic Controls, InstancedMesh Synchronization & Disposal
// ========================================================================
console.log('\n--- SECTION 3: Dynamic Controls & InstancedMesh Synchronization ---');

// 3.1 InstancedMesh synchronization
const instMesh = clusters.instancedMesh;
assert(instMesh instanceof THREE.InstancedMesh, 'instancedMesh is valid THREE.InstancedMesh');
assert(instMesh.count === 29, `InstancedMesh has 29 instances (found: ${instMesh.count})`);

// Unpack matrices and verify instance transforms
const dummyMatrix = new THREE.Matrix4();
const unpackedPos = new THREE.Vector3();
const unpackedScale = new THREE.Vector3();
const unpackedRot = new THREE.Quaternion();

for (let i = 0; i < catalog.length; i++) {
  instMesh.getMatrixAt(i, dummyMatrix);
  dummyMatrix.decompose(unpackedPos, unpackedRot, unpackedScale);
  const c = catalog[i];
  const dPos = unpackedPos.distanceTo(c.pos);
  assert(dPos < 1e-4, `Instance ${i} (${c.name}) matrix position matches cluster pos (err: ${dPos})`);
  assert(Math.abs(unpackedScale.x - c.radius * c.scale[0]) < 1e-4, `Instance ${i} (${c.name}) matrix scale.x matches`);
}

// 3.2 setScaleMultiplier synchronization with InstancedMesh
clusters.setScaleMultiplier(1.85);
for (let i = 0; i < catalog.length; i++) {
  instMesh.getMatrixAt(i, dummyMatrix);
  dummyMatrix.decompose(unpackedPos, unpackedRot, unpackedScale);
  const c = catalog[i];
  assert(
    Math.abs(unpackedScale.x - c.radius * c.scale[0] * 1.85) < 1e-4,
    `InstancedMesh ${c.name} scale dynamically updated to 1.85x`
  );
}

// Scale clamping test: negative and zero values
clusters.setScaleMultiplier(0);
assert(clusters.scaleMultiplier >= 0.01, `setScaleMultiplier(0) safely clamps to >= 0.01 (actual: ${clusters.scaleMultiplier})`);
clusters.setScaleMultiplier(-5.0);
assert(clusters.scaleMultiplier >= 0.01, `setScaleMultiplier(-5.0) safely clamps to >= 0.01 (actual: ${clusters.scaleMultiplier})`);
clusters.setScaleMultiplier(1.0);

// 3.3 setOpacity clamping test
clusters.setOpacity(-0.5);
assert(clusters.material.opacity === 0.0, `setOpacity(-0.5) clamps to 0.0 (actual: ${clusters.material.opacity})`);
clusters.setOpacity(1.5);
assert(clusters.material.opacity === 1.0, `setOpacity(1.5) clamps to 1.0 (actual: ${clusters.material.opacity})`);
clusters.setOpacity(0.95);
assert(Math.abs(clusters.material.opacity - 0.95) < 1e-4, 'setOpacity(0.95) restores expected opacity');

// 3.4 setVisible propagation
clusters.setVisible(false);
assert(clusters.group.visible === false && instMesh.visible === false, 'setVisible(false) propagates to group and instancedMesh');
clusters.setVisible(true);
assert(clusters.group.visible === true && instMesh.visible === true, 'setVisible(true) propagates to group and instancedMesh');

// 3.5 update(elapsed) pulse stability
clusters.pulseEnabled = true;
clusters.update(1.0);
assert(vir.mesh.scale.x > 0, 'Pulse update at t=1.0 scales successfully');
clusters.update(1000.0);
assert(vir.mesh.scale.x > 0, 'Pulse update at large t=1000.0 is stable');
clusters.pulseEnabled = false;
clusters.setScaleMultiplier(1.0);

// 3.6 Constructor options flexibility
const customClusters = new GalaxyClusters({
  visible: false,
  opacity: 0.6,
  scaleMultiplier: 2.2,
  pulseEnabled: true,
  roughness: 0.31,
  clearcoat: 0.85
});
assert(customClusters.visible === false, 'Custom option visible: false respected');
assert(Math.abs(customClusters.opacity - 0.6) < 1e-4, 'Custom option opacity: 0.6 respected');
assert(Math.abs(customClusters.scaleMultiplier - 2.2) < 1e-4, 'Custom option scaleMultiplier: 2.2 respected');
assert(customClusters.pulseEnabled === true, 'Custom option pulseEnabled: true respected');
assert(Math.abs(customClusters.material.roughness - 0.31) < 1e-4, 'Custom material roughness: 0.31 respected');
assert(Math.abs(customClusters.material.clearcoat - 0.85) < 1e-4, 'Custom material clearcoat: 0.85 respected');

// 3.7 Disposal and idempotency
customClusters.dispose();
assert(customClusters.sharedGeometry === null, 'dispose() cleans up sharedGeometry');
assert(customClusters.material === null, 'dispose() cleans up material');
assert(customClusters.group.children.length === 0, 'dispose() clears group children');
assert(customClusters.meshes.length === 0, 'dispose() clears meshes array');

// Idempotent dispose test
let secondDisposeThrew = false;
try {
  customClusters.dispose();
} catch (e) {
  secondDisposeThrew = true;
}
assert(!secondDisposeThrew, 'dispose() is idempotent (can be called repeatedly without throwing)');

// ========================================================================
// SECTION 4: GalaxySwarm Particle Quotas & Power-Law Density Distribution
// ========================================================================
console.log('\n--- SECTION 4: GalaxySwarm Power-Law Density & Cluster Quotas ---');

const cosmicField = new CosmicField();
const swarm16k = new GalaxySwarm(cosmicField, { count: 16000 });
const quotas16k = swarm16k.getClusterCounts();

// 4.1 Strict quota verification at 16,000 count
assert(quotas16k.centaurusGA === 5200, `Centaurus/GA quota is 5,200 (actual: ${quotas16k.centaurusGA}) (>= 5,000 requirement met)`);
assert(quotas16k.virgo === 3400, `Virgo quota is 3,400 (actual: ${quotas16k.virgo}) (>= 3,000 requirement met)`);
assert(quotas16k.hydraAntlia === 2200, `Hydra/Antlia quota is 2,200 (actual: ${quotas16k.hydraAntlia})`);
assert(quotas16k.coma === 1600, `Coma quota is 1,600 (actual: ${quotas16k.coma})`);
assert(quotas16k.diffuseFilament === 3600, `Filament/Diffuse quota is 3,600 (actual: ${quotas16k.diffuseFilament})`);
const sum16k = quotas16k.centaurusGA + quotas16k.virgo + quotas16k.hydraAntlia + quotas16k.coma + quotas16k.diffuseFilament;
assert(sum16k === 16000, `Sum of quotas is exactly 16,000 (sum: ${sum16k})`);

// 4.2 Strict quota verification at default 18,000 count
const swarm18k = new GalaxySwarm(cosmicField, { count: 18000 });
const quotas18k = swarm18k.getClusterCounts();
assert(quotas18k.centaurusGA >= 5000, `18k Centaurus/GA has ${quotas18k.centaurusGA} particles (>= 5,000)`);
assert(quotas18k.virgo >= 3000, `18k Virgo has ${quotas18k.virgo} particles (>= 3,000)`);
const sum18k = quotas18k.centaurusGA + quotas18k.virgo + quotas18k.hydraAntlia + quotas18k.coma + quotas18k.diffuseFilament;
assert(sum18k === 18000, `Sum of 18k quotas is exactly 18,000 (sum: ${sum18k})`);

// 4.3 Empirical Power-Law Cusp Verification: Virgo Cluster Core
// Index range for Virgo in 16k swarm: [5200, 8599] (3,400 particles)
const posAttr = swarm16k.pointsMesh.geometry.getAttribute('position');
const virgoCenter = new THREE.Vector3(-8, 3, 0);
const virgoDistances3D = [];
const virgoIntrinsicR = [];
let virgoXCoords = [];
let virgoYCoords = [];
let virgoZCoords = [];

for (let i = 5200; i < 5200 + 3400; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const dx = x - virgoCenter.x;
  const dy = y - virgoCenter.y;
  const dz = z - virgoCenter.z;
  virgoXCoords.push(dx);
  virgoYCoords.push(dy);
  virgoZCoords.push(dz);
  
  const d3D = Math.hypot(dx, dy, dz);
  const rIntrinsic = Math.hypot(dx, dy / 0.48, dz);
  virgoDistances3D.push(d3D);
  virgoIntrinsicR.push(rIntrinsic);
}

virgoDistances3D.sort((a, b) => a - b);
virgoIntrinsicR.sort((a, b) => a - b);

const virgoMed3D = virgoDistances3D[Math.floor(virgoDistances3D.length * 0.50)];
const virgoMean3D = virgoDistances3D.reduce((a, b) => a + b, 0) / virgoDistances3D.length;
const virgoFracHalfR3D = virgoDistances3D.filter(d => d <= 14.5 * 0.5).length / virgoDistances3D.length;

const virgoMedIntrinsic = virgoIntrinsicR[Math.floor(virgoIntrinsicR.length * 0.50)];
const virgoMeanIntrinsic = virgoIntrinsicR.reduce((a, b) => a + b, 0) / virgoIntrinsicR.length;
const virgoFracHalfRIntrinsic = virgoIntrinsicR.filter(r => r <= 14.5 * 0.5).length / virgoIntrinsicR.length;
const virgoMaxIntrinsic = virgoIntrinsicR[virgoIntrinsicR.length - 1];

// Theoretical calculations for intrinsic r = 14.5 * u^2.2:
// Expected median: 14.5 * (0.5)^2.2 = 3.156
// Expected mean: 14.5 / (2.2 + 1) = 4.531
// Particles within R/2 = 7.25: expected (0.5)^(1/2.2) = 72.98%
assert(Math.abs(virgoMedIntrinsic - 3.16) < 0.6, `Virgo intrinsic power-law median r ${virgoMedIntrinsic.toFixed(2)} matches theoretical 3.16`);
assert(Math.abs(virgoMeanIntrinsic - 4.53) < 0.6, `Virgo intrinsic power-law mean r ${virgoMeanIntrinsic.toFixed(2)} matches theoretical 4.53`);
assert(virgoFracHalfRIntrinsic >= 0.68 && virgoFracHalfRIntrinsic <= 0.78, `Virgo intrinsic fraction within R_virial/2 is ${virgoFracHalfRIntrinsic.toFixed(3)} (~73% expected for power law, vs 12.5% for uniform sphere)`);
assert(virgoMaxIntrinsic <= 14.51, `Virgo maximum intrinsic particle radius ${virgoMaxIntrinsic.toFixed(2)} strictly bounded by R_virial (14.5)`);

// 3D Euclidean properties reflecting supergalactic flattening:
assert(virgoMed3D < 3.5, `Virgo 3D Euclidean median distance is tightly packed (< 3.5, actual: ${virgoMed3D.toFixed(2)})`);
assert(virgoFracHalfR3D > 0.75, `Virgo 3D Euclidean fraction within R/2 is dense (> 75%, actual: ${virgoFracHalfR3D.toFixed(3)})`);

// Supergalactic plane disk flattening test for Virgo
// Measure standard deviations:
const stdX = Math.sqrt(virgoXCoords.reduce((acc, v) => acc + v * v, 0) / virgoXCoords.length);
const stdY = Math.sqrt(virgoYCoords.reduce((acc, v) => acc + v * v, 0) / virgoYCoords.length);
const stdZ = Math.sqrt(virgoZCoords.reduce((acc, v) => acc + v * v, 0) / virgoZCoords.length);
const horizontalStd = Math.sqrt((stdX * stdX + stdZ * stdZ) / 2);
const yFlatRatio = stdY / horizontalStd;
// Expected flattening ratio is ~0.48
assert(yFlatRatio >= 0.40 && yFlatRatio <= 0.56, `Virgo supergalactic Y-flattening ratio is ${yFlatRatio.toFixed(3)} (matches ~0.48 disk flattening)`);

// 4.4 Empirical Power-Law Cusp Verification: Centaurus & Great Attractor Hub
// Total countGA = 5200. nGAOnly = Math.round(5200 * 0.60) = 3120. Centaurus count = 2080.
const gaCenter = new THREE.Vector3(-38, 2, -5);
const centCenter = new THREE.Vector3(-34, 6, 2);

const gaDistancesIntrinsic = [];
const gaDistances3D = [];
for (let i = 0; i < 3120; i++) {
  const dx = posAttr.getX(i) - gaCenter.x;
  const dy = posAttr.getY(i) - gaCenter.y;
  const dz = posAttr.getZ(i) - gaCenter.z;
  gaDistances3D.push(Math.hypot(dx, dy, dz));
  gaDistancesIntrinsic.push(Math.hypot(dx, dy / 0.42, dz));
}
gaDistancesIntrinsic.sort((a, b) => a - b);
const gaMedIntrinsic = gaDistancesIntrinsic[Math.floor(gaDistancesIntrinsic.length * 0.50)];
const gaMeanIntrinsic = gaDistancesIntrinsic.reduce((a, b) => a + b, 0) / gaDistancesIntrinsic.length;
// Theoretical GA: r = 22.0 * u^2.4:
// Expected median: 22.0 * (0.5)^2.4 = 4.168
// Expected mean: 22.0 / (2.4 + 1) = 6.471
assert(Math.abs(gaMedIntrinsic - 4.17) < 0.7, `Great Attractor intrinsic median r ${gaMedIntrinsic.toFixed(2)} matches theoretical 4.17`);
assert(Math.abs(gaMeanIntrinsic - 6.47) < 0.7, `Great Attractor intrinsic mean r ${gaMeanIntrinsic.toFixed(2)} matches theoretical 6.47`);

// Centaurus subset: index 3120 to 5199 (2080 particles)
const centDistancesIntrinsic = [];
for (let i = 3120; i < 5200; i++) {
  const dx = posAttr.getX(i) - centCenter.x;
  const dy = posAttr.getY(i) - centCenter.y;
  const dz = posAttr.getZ(i) - centCenter.z;
  centDistancesIntrinsic.push(Math.hypot(dx, dy / 0.45, dz));
}
centDistancesIntrinsic.sort((a, b) => a - b);
const centMedIntrinsic = centDistancesIntrinsic[Math.floor(centDistancesIntrinsic.length * 0.50)];
// Theoretical Centaurus: r = 17.0 * u^2.4:
// Expected median: 17.0 * (0.5)^2.4 = 3.221
assert(Math.abs(centMedIntrinsic - 3.22) < 0.6, `Centaurus intrinsic median r ${centMedIntrinsic.toFixed(2)} matches theoretical 3.22`);

// 4.5 Coma cluster swarm verification
// Index 5200 + 3400 + 2200 = 10800 to 12399 (1600 particles)
const comaCenter = new THREE.Vector3(5, 45, -25);
const comaDistances = [];
for (let i = 10800; i < 12400; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const d = Math.hypot(x - comaCenter.x, y - comaCenter.y, z - comaCenter.z);
  comaDistances.push(d);
}
comaDistances.sort((a, b) => a - b);
const comaMed = comaDistances[Math.floor(comaDistances.length * 0.50)];
// Theoretical Coma: r = 15.0 * u^1.85:
// Expected median: 15.0 * (0.5)^1.85 = 4.161
assert(Math.abs(comaMed - 4.16) < 0.7, `Coma empirical median distance ${comaMed.toFixed(2)} matches theoretical 4.16`);

// 4.6 Hydra & Antlia swarm verification
// Index 8600 to 10799 (2200 particles)
const hydraCenter = new THREE.Vector3(-24, 8, 18);
const antliaCenter = new THREE.Vector3(-18, 5, 22);
let countInHydraOrAntlia = 0;
for (let i = 8600; i < 10800; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const dH = Math.hypot(x - hydraCenter.x, y - hydraCenter.y, z - hydraCenter.z);
  const dA = Math.hypot(x - antliaCenter.x, y - antliaCenter.y, z - antliaCenter.z);
  if (dH <= 12.01 || dA <= 9.51) {
    countInHydraOrAntlia++;
  }
}
assert(countInHydraOrAntlia === 2200, `All 2,200 Hydra/Antlia particles lie strictly within their virial limits (actual: ${countInHydraOrAntlia})`);

// ========================================================================
// SECTION 5: Buffer Attributes, Shader Uniforms & Dynamic Stress
// ========================================================================
console.log('\n--- SECTION 5: Buffer Attributes, Shaders & Dynamic Stress ---');

const colorAttr = swarm16k.pointsMesh.geometry.getAttribute('color');
const sizeAttr = swarm16k.pointsMesh.geometry.getAttribute('size');

// 5.1 Color bounds and finiteness
let colorsValid = true;
for (let i = 0; i < colorAttr.array.length; i++) {
  const c = colorAttr.array[i];
  if (!Number.isFinite(c) || c < 0.0 || c > 1.0) {
    colorsValid = false;
    break;
  }
}
assert(colorsValid, 'All 48,000 color attribute floats are valid finite floats in range [0, 1]');

// 5.2 Size bounds and scaling
let sizesPositive = true;
for (let i = 0; i < sizeAttr.array.length; i++) {
  const s = sizeAttr.array[i];
  if (!Number.isFinite(s) || s <= 0.0) {
    sizesPositive = false;
    break;
  }
}
assert(sizesPositive, 'All 16,000 particle size attribute floats are strictly positive');

// 5.3 Shader material configuration
const swarmMat = swarm16k.material;
assert(swarmMat instanceof THREE.ShaderMaterial, 'Swarm material is THREE.ShaderMaterial');
assert(swarmMat.blending === THREE.AdditiveBlending, 'Additive blending is configured for glowing particle accretion');
assert(swarmMat.depthWrite === false, 'depthWrite is disabled for particle transparency layering');
assert(swarmMat.transparent === true, 'transparent flag is enabled');
assert(swarmMat.vertexColors === true, 'vertexColors enabled in ShaderMaterial');
assert(swarmMat.uniforms.uOpacity !== undefined, 'Shader uniform uOpacity is declared');
assert(swarmMat.uniforms.uTexture !== undefined, 'Shader uniform uTexture is declared');

// 5.4 Dynamic opacity and point size controls
swarm16k.setOpacity(0.42);
assert(Math.abs(swarmMat.uniforms.uOpacity.value - 0.42) < 1e-4, 'setOpacity(0.42) updates shader uniform');
swarm16k.setOpacity(-0.2);
assert(swarmMat.uniforms.uOpacity.value === 0.0, 'setOpacity(-0.2) clamps safely to 0.0');
swarm16k.setOpacity(1.5);
assert(swarmMat.uniforms.uOpacity.value === 1.0, 'setOpacity(1.5) clamps safely to 1.0');

// 5.5 Stress test dynamic count changes (re-allocation safety)
const testCounts = [500, 2000, 16000, 32000, 18000];
let resizingClean = true;
for (const tc of testCounts) {
  swarm16k.setCount(tc);
  if (swarm16k.count !== tc || swarm16k.pointsMesh.geometry.getAttribute('position').count !== tc) {
    resizingClean = false;
  }
}
assert(resizingClean, 'Dynamic setCount cycles cleanly across extreme sizes (500 to 32,000)');

// 5.6 Fallback Texture in Headless Environment
assert(swarm16k.particleTexture !== null, 'particleTexture was created successfully');
assert(swarm16k.particleTexture instanceof THREE.Texture, 'particleTexture is an instance of THREE.Texture');

// 5.7 Disposal robustness
swarm16k.dispose();
assert(swarm16k.pointsMesh === null, 'dispose() nullifies pointsMesh');
assert(swarm16k.particleTexture === null, 'dispose() nullifies particleTexture');
assert(swarm16k.group.children.length === 0, 'dispose() empties group');

let secondSwarmDisposeThrew = false;
try {
  swarm16k.dispose();
} catch (e) {
  secondSwarmDisposeThrew = true;
}
assert(!secondSwarmDisposeThrew, 'GalaxySwarm.dispose() is idempotent');

// ========================================================================
// SECTION 6: Integration & Cross-Module Contract Verification
// ========================================================================
console.log('\n--- SECTION 6: Integration & Cross-Module Contract Verification ---');

// Verify that GalaxyClusters and GalaxySwarm share identical cosmological anchor coordinates:
const testClusters = new GalaxyClusters();
const testSwarm = new GalaxySwarm(cosmicField, { count: 16000 });

const hydraCluster = testClusters.getCluster('Hydra');
const antliaCluster = testClusters.getCluster('Antlia');
const centCluster = testClusters.getCluster('Centaurus');
const virgoCluster = testClusters.getCluster('Virgo');
const gaCluster = testClusters.getCluster('The Great Attractor');
const comaCluster = testClusters.getCluster('Coma');

assert(hydraCluster.pos.distanceTo(new THREE.Vector3(-24, 8, 18)) < 1e-4, 'Shared coordinate: Hydra (-24, 8, 18)');
assert(antliaCluster.pos.distanceTo(new THREE.Vector3(-18, 5, 22)) < 1e-4, 'Shared coordinate: Antlia (-18, 5, 22)');
assert(centCluster.pos.distanceTo(new THREE.Vector3(-34, 6, 2)) < 1e-4, 'Shared coordinate: Centaurus (-34, 6, 2)');
assert(virgoCluster.pos.distanceTo(new THREE.Vector3(-8, 3, 0)) < 1e-4, 'Shared coordinate: Virgo (-8, 3, 0)');
assert(gaCluster.pos.distanceTo(new THREE.Vector3(-38, 2, -5)) < 1e-4, 'Shared coordinate: GA (-38, 2, -5)');
assert(comaCluster.pos.distanceTo(new THREE.Vector3(5, 45, -25)) < 1e-4, 'Shared coordinate: Coma (5, 45, -25)');

// Clean up test instances
testClusters.dispose();
testSwarm.dispose();

// ========================================================================
// FINAL SUMMARY
// ========================================================================
console.log('\n========================================================================');
console.log(`CHALLENGER M3-1 RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`OVERALL VERDICT: ${failCount === 0 ? 'APPROVE' : 'REJECT'}`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
