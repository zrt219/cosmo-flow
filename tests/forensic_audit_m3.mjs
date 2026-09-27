import * as THREE from 'three';
import { GalaxyClusters, ClusterEllipsoids } from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('FORENSIC AUDIT SUITE: MILESTONE M3 (Clusters & Swarm Virial Density)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const violations = [];

function check(id, condition, description, details = null) {
  if (condition) {
    passCount++;
    console.log(`[PASS] [${id}] ${description}`);
  } else {
    failCount++;
    const errMsg = `[FAIL] [${id}] ${description}`;
    console.error(errMsg, details ? details : '');
    violations.push({ id, description, details });
  }
}

// ====================================================================
// SECTION 1: STATIC CODE FORENSICS & FACADE DETECTION
// ====================================================================
console.log('--- CHECK 1: Static Code Forensics & Facade Detection ---');

const clustersCode = fs.readFileSync('src/renderers/GalaxyClusters.js', 'utf8');
const swarmCode = fs.readFileSync('src/renderers/GalaxySwarm.js', 'utf8');

// 1.1 No dummy facade return constants
check('STATIC_1.1', !clustersCode.includes('return true;') || clustersCode.includes('this.visible = !!visible;'), 
  'GalaxyClusters contains no dummy constant return shortcuts');
check('STATIC_1.2', !swarmCode.includes('return true;') || swarmCode.includes('this.visible = !!val;'), 
  'GalaxySwarm contains no dummy constant return shortcuts');

// 1.3 Material authenticity in source
check('STATIC_1.3', clustersCode.includes('new THREE.MeshPhysicalMaterial'), 
  'GalaxyClusters explicitly instantiates THREE.MeshPhysicalMaterial');
check('STATIC_1.4', !clustersCode.includes('new THREE.MeshBasicMaterial'), 
  'GalaxyClusters does NOT use unshaded MeshBasicMaterial');

// 1.5 Shader authenticity in GalaxySwarm
check('STATIC_1.5', swarmCode.includes('new THREE.ShaderMaterial'), 
  'GalaxySwarm uses THREE.ShaderMaterial for particle rendering');
check('STATIC_1.6', swarmCode.includes('gl_PointSize') && swarmCode.includes('gl_Position'), 
  'GalaxySwarm implements genuine GLSL vertex shader with perspective attenuation');
check('STATIC_1.7', swarmCode.includes('texture2D') && swarmCode.includes('gl_PointCoord'), 
  'GalaxySwarm implements genuine GLSL fragment shader sampling point sprite texture');

// 1.8 Genuine power-law mathematical functions in source
check('STATIC_1.8', swarmCode.includes('Math.pow(u, 2.4)') && swarmCode.includes('Math.pow(u, 2.2)'), 
  'GalaxySwarm implements explicit power-law exponents (u^2.4, u^2.2) for virial cores');

// ====================================================================
// SECTION 2: GALAXY CLUSTERS MESH & LIGHTING AUTHENTICITY
// ====================================================================
console.log('\n--- CHECK 2: GalaxyClusters Mesh & Lighting Authenticity ---');

const clustersInstance = new GalaxyClusters();

check('MESH_2.1', clustersInstance.material instanceof THREE.MeshPhysicalMaterial, 
  'GalaxyClusters material is genuine THREE.MeshPhysicalMaterial');
check('MESH_2.2', clustersInstance.material.isMeshPhysicalMaterial === true, 
  'Material flags isMeshPhysicalMaterial === true');
check('MESH_2.3', clustersInstance.material.color.getHex() === 0xffffff, 
  'Material color is crisp white (0xffffff) matching reference image');
check('MESH_2.4', Math.abs(clustersInstance.material.roughness - 0.24) < 1e-4, 
  `Material roughness is 0.24 (actual: ${clustersInstance.material.roughness})`);
check('MESH_2.5', Math.abs(clustersInstance.material.metalness - 0.08) < 1e-4, 
  `Material metalness is 0.08 (actual: ${clustersInstance.material.metalness})`);
check('MESH_2.6', Math.abs(clustersInstance.material.clearcoat - 0.70) < 1e-4, 
  `Material clearcoat is 0.70 (actual: ${clustersInstance.material.clearcoat})`);
check('MESH_2.7', Math.abs(clustersInstance.material.clearcoatRoughness - 0.20) < 1e-4, 
  `Material clearcoatRoughness is 0.20 (actual: ${clustersInstance.material.clearcoatRoughness})`);
check('MESH_2.8', clustersInstance.material.reflectivity >= 0.49, 
  `Material reflectivity enables strong specular highlights (actual: ${clustersInstance.material.reflectivity})`);
check('MESH_2.9', clustersInstance.material.sheen >= 0.30, 
  `Material directional sheen is active (actual: ${clustersInstance.material.sheen})`);
check('MESH_2.10', clustersInstance.material.sheenRoughness === 0.25, 
  `Material sheenRoughness is calibrated (actual: ${clustersInstance.material.sheenRoughness})`);
check('MESH_2.11', clustersInstance.material.transparent === true, 
  'Material transparency is enabled for smooth opacity modulation');
check('MESH_2.12', clustersInstance.material.flatShading === false, 
  'Smooth shading enabled for realistic curvature reflections');

// Catalog and Coordinate Verification
const cat = clustersInstance.getClusters();
check('CAT_2.1', cat.length === 29, `Full cosmological catalog contains 29 clusters (actual: ${cat.length})`);
check('CAT_2.2', clustersInstance.meshes.length === 29, `Meshes array contains 29 meshes (actual: ${clustersInstance.meshes.length})`);
check('CAT_2.3', clustersInstance.group.children.length === 29, `Group contains 29 children (actual: ${clustersInstance.group.children.length})`);

// Prominent clusters exact positions
const prominentClusters = [
  { id: 'hydra', name: 'Hydra', expected: new THREE.Vector3(-24, 8, 18), rad: 2.8 },
  { id: 'antlia', name: 'Antlia', expected: new THREE.Vector3(-18, 5, 22), rad: 2.4 },
  { id: 'centaurus', name: 'Centaurus', expected: new THREE.Vector3(-34, 6, 2), rad: 3.6 },
  { id: 'virgo', name: 'Virgo', expected: new THREE.Vector3(-8, 3, 0), rad: 3.5 },
  { id: 'great-attractor', name: 'The Great Attractor', expected: new THREE.Vector3(-38, 2, -5), rad: 4.2 },
  { id: 'coma', name: 'Coma', expected: new THREE.Vector3(5, 45, -25), rad: 3.8 }
];

for (const c of prominentClusters) {
  const found = clustersInstance.getCluster(c.name);
  const posOk = found && found.pos.distanceTo(c.expected) < 1e-4;
  const radOk = found && Math.abs(found.radius - c.rad) < 1e-4;
  check(`COORD_${c.id.toUpperCase()}`, posOk && radOk, 
    `Cluster ${c.name} matches position ${c.expected.toArray()} and radius ${c.rad}`);
}

// Secondary & Abell clusters
const secondaryClusters = [
  { name: 'NGC 5016', expected: new THREE.Vector3(-16, 22, -12) },
  { name: 'Abell 3574', expected: new THREE.Vector3(-28, 14, 12) },
  { name: 'Abell 3565', expected: new THREE.Vector3(-32, 10, 16) },
  { name: 'Abell 50753', expected: new THREE.Vector3(-44, 8, -18) }
];

for (const sc of secondaryClusters) {
  const found = clustersInstance.getCluster(sc.name);
  const posOk = found && found.pos.distanceTo(sc.expected) < 1e-4;
  check(`COORD_SEC_${sc.name.replace(/\s+/g, '_')}`, posOk, 
    `Secondary cluster ${sc.name} matches position ${sc.expected.toArray()}`);
}

// Ellipsoid scaling verification (non-uniform axes)
const centMesh = clustersInstance.group.getObjectByName('Centaurus');
check('ELLIPSOID_2.1', centMesh && centMesh.scale.x !== centMesh.scale.y, 
  'Centaurus cluster has non-uniform triaxial ellipsoid geometry');
const virgoMesh = clustersInstance.group.getObjectByName('Virgo');
check('ELLIPSOID_2.2', virgoMesh && virgoMesh.scale.x !== virgoMesh.scale.y, 
  'Virgo cluster has non-uniform triaxial ellipsoid geometry');

// InstancedMesh compatibility
const inst = clustersInstance.instancedMesh;
check('INST_2.1', inst instanceof THREE.InstancedMesh, 'instancedMesh returns THREE.InstancedMesh');
check('INST_2.2', inst.count === 29, `InstancedMesh has 29 instances (actual: ${inst.count})`);

// Export alias verification
check('EXPORT_2.1', ClusterEllipsoids === GalaxyClusters, 'ClusterEllipsoids is exported as alias for GalaxyClusters');

// ====================================================================
// SECTION 3: EMPIRICAL & STATISTICAL PROOF OF POWER-LAW VIRIAL CORES
// ====================================================================
console.log('\n--- CHECK 3: GalaxySwarm Statistical Virial Density Verification ---');

const cf = new CosmicField();
const swarm1 = new GalaxySwarm(cf, { count: 16000 });
const swarm2 = new GalaxySwarm(cf, { count: 16000 });

// 3.1 Stochastic Non-Determinism Check (Anti-mock check)
const pos1 = swarm1.pointsMesh.geometry.attributes.position.array;
const pos2 = swarm2.pointsMesh.geometry.attributes.position.array;

let diffCount = 0;
for (let i = 0; i < 300; i++) {
  if (Math.abs(pos1[i] - pos2[i]) > 1e-4) {
    diffCount++;
  }
}
check('STOCH_3.1', diffCount > 290, 
  `GalaxySwarm generates stochastic particle coordinates (diff count: ${diffCount}/300) - NOT a mock buffer`);

// 3.2 Partition Quotas
const counts = swarm1.getClusterCounts();
check('QUOTA_3.1', counts.centaurusGA === 5200, `Centaurus/GA quota is 5,200 (actual: ${counts.centaurusGA})`);
check('QUOTA_3.2', counts.virgo === 3400, `Virgo quota is 3,400 (actual: ${counts.virgo})`);
check('QUOTA_3.3', counts.hydraAntlia === 2200, `Hydra/Antlia quota is 2,200 (actual: ${counts.hydraAntlia})`);
check('QUOTA_3.4', counts.coma === 1600, `Coma quota is 1,600 (actual: ${counts.coma})`);
check('QUOTA_3.5', counts.diffuseFilament === 3600, `Diffuse/Filament quota is 3,600 (actual: ${counts.diffuseFilament})`);
check('QUOTA_3.6', counts.centaurusGA + counts.virgo + counts.hydraAntlia + counts.coma + counts.diffuseFilament === 16000, 
  'Total particles partition sum equals exactly 16,000');

// 3.3 Rigorous Statistical Goodness-of-Fit for Virgo Power-Law (gamma = 2.2)
// In GalaxySwarm.js:
// x = virgo.x + r * sinPhi * cosTheta
// y = virgo.y + r * cosPhi * 0.48
// z = virgo.z + r * sinPhi * sinTheta
// where r = 14.5 * u^2.2
// Unflattened distance r = sqrt((dx)^2 + (dy/0.48)^2 + (dz)^2)
// Inverted random variable: u_inferred = (r / 14.5)^(1 / 2.2)
// If genuinely generated from u ~ Uniform(0,1), u_inferred MUST have Uniform(0,1) statistics!
const virgoX = -8, virgoY = 3, virgoZ = 0;
const virgoUInferred = [];
const virgoActualDist = [];

for (let i = 5200; i < 5200 + 3400; i++) {
  const dx = pos1[i * 3 + 0] - virgoX;
  const dy = (pos1[i * 3 + 1] - virgoY) / 0.48;
  const dz = pos1[i * 3 + 2] - virgoZ;
  const rUnflat = Math.hypot(dx, dy, dz);
  const uInf = Math.pow(Math.min(1.0, rUnflat / 14.5), 1.0 / 2.2);
  virgoUInferred.push(uInf);

  const dActual = Math.hypot(pos1[i * 3 + 0] - virgoX, pos1[i * 3 + 1] - virgoY, pos1[i * 3 + 2] - virgoZ);
  virgoActualDist.push(dActual);
}

virgoUInferred.sort((a, b) => a - b);
virgoActualDist.sort((a, b) => a - b);

const N_virgo = virgoUInferred.length;
const uVirgoP25 = virgoUInferred[Math.floor(N_virgo * 0.25)];
const uVirgoP50 = virgoUInferred[Math.floor(N_virgo * 0.50)];
const uVirgoP75 = virgoUInferred[Math.floor(N_virgo * 0.75)];
const uVirgoMean = virgoUInferred.reduce((a, b) => a + b, 0) / N_virgo;

check('STAT_VIRGO_U50', Math.abs(uVirgoP50 - 0.50) < 0.04, 
  `Virgo inverted power-law median matches theoretical Uniform(0,1) median 0.50 (actual: ${uVirgoP50.toFixed(4)})`);
check('STAT_VIRGO_MEAN', Math.abs(uVirgoMean - 0.50) < 0.03, 
  `Virgo inverted power-law mean matches theoretical 0.50 (actual: ${uVirgoMean.toFixed(4)})`);
check('STAT_VIRGO_P25', Math.abs(uVirgoP25 - 0.25) < 0.04, 
  `Virgo inverted power-law 25th percentile matches theoretical 0.25 (actual: ${uVirgoP25.toFixed(4)})`);
check('STAT_VIRGO_P75', Math.abs(uVirgoP75 - 0.75) < 0.04, 
  `Virgo inverted power-law 75th percentile matches theoretical 0.75 (actual: ${uVirgoP75.toFixed(4)})`);

// Virial core concentration comparison
const virgoMedianActual = virgoActualDist[Math.floor(N_virgo * 0.50)];
check('CONC_VIRGO_CORE', virgoMedianActual < 3.5, 
  `Virgo core is tightly packed: median distance is ${virgoMedianActual.toFixed(2)} (< 3.5 vs uniform 11.5)`);

// 3.4 Rigorous Statistical Goodness-of-Fit for Centaurus & GA (gamma = 2.4)
// In GalaxySwarm.js:
// GA: nGAOnly = 3120, center = (-38, 2, -5), rVirial = 22.0, yFlat = 0.42
const gaX = -38, gaY = 2, gaZ = -5;
const gaUInferred = [];
for (let i = 0; i < 3120; i++) {
  const dx = pos1[i * 3 + 0] - gaX;
  const dy = (pos1[i * 3 + 1] - gaY) / 0.42;
  const dz = pos1[i * 3 + 2] - gaZ;
  const rUnflat = Math.hypot(dx, dy, dz);
  const uInf = Math.pow(Math.min(1.0, rUnflat / 22.0), 1.0 / 2.4);
  gaUInferred.push(uInf);
}
gaUInferred.sort((a, b) => a - b);
const gaMedian = gaUInferred[Math.floor(gaUInferred.length * 0.50)];
const gaMean = gaUInferred.reduce((a, b) => a + b, 0) / gaUInferred.length;

check('STAT_GA_U50', Math.abs(gaMedian - 0.50) < 0.04, 
  `GA inverted power-law median matches theoretical Uniform(0,1) median 0.50 (actual: ${gaMedian.toFixed(4)})`);
check('STAT_GA_MEAN', Math.abs(gaMean - 0.50) < 0.03, 
  `GA inverted power-law mean matches theoretical 0.50 (actual: ${gaMean.toFixed(4)})`);

// 3.5 Rigorous Statistical Goodness-of-Fit for Coma Cluster (gamma = 1.85)
// Coma: center = (5, 45, -25), rVirial = 15.0, yFlat = 0.85
const comaX = 5, comaY = 45, comaZ = -25;
const comaUInferred = [];
for (let i = 5200 + 3400 + 2200; i < 5200 + 3400 + 2200 + 1600; i++) {
  const dx = pos1[i * 3 + 0] - comaX;
  const dy = (pos1[i * 3 + 1] - comaY) / 0.85;
  const dz = pos1[i * 3 + 2] - comaZ;
  const rUnflat = Math.hypot(dx, dy, dz);
  const uInf = Math.pow(Math.min(1.0, rUnflat / 15.0), 1.0 / 1.85);
  comaUInferred.push(uInf);
}
comaUInferred.sort((a, b) => a - b);
const comaMedian = comaUInferred[Math.floor(comaUInferred.length * 0.50)];
const comaMean = comaUInferred.reduce((a, b) => a + b, 0) / comaUInferred.length;

check('STAT_COMA_U50', Math.abs(comaMedian - 0.50) < 0.04, 
  `Coma inverted power-law median matches theoretical Uniform(0,1) median 0.50 (actual: ${comaMedian.toFixed(4)})`);
check('STAT_COMA_MEAN', Math.abs(comaMean - 0.50) < 0.03, 
  `Coma inverted power-law mean matches theoretical 0.50 (actual: ${comaMean.toFixed(4)})`);

// 3.6 Filament & Diffuse Avoidance / Push mechanism of Dipole Repeller
// In GalaxySwarm.js, diffuse particles within 18.0 units of the repeller are pushed outward:
// if (distRepeller < 18.0) { x += (x - repeller.x) * 1.5; z += (z - repeller.z) * 1.5; }
// Verify that the repeller repulsion heuristic is actively evaluated and applied
const repellerPos = new THREE.Vector3(32, -4, 18);
let repellerCoreCount = 0;
const totalFilament = counts.diffuseFilament;
const nFilamentBridge = Math.round(totalFilament * 0.67);
const nDiffuse = totalFilament - nFilamentBridge;
const diffuseStartIdx = 16000 - nDiffuse;

for (let i = diffuseStartIdx; i < 16000; i++) {
  const px = pos1[i * 3 + 0];
  const py = pos1[i * 3 + 1];
  const pz = pos1[i * 3 + 2];
  const dRep = Math.hypot(px - repellerPos.x, py - repellerPos.y, pz - repellerPos.z);
  if (dRep < 8.0) {
    repellerCoreCount++;
  }
}
// Due to the radial volume scaling (rad = 25..95) and expansion push, innermost core (<8 units) is nearly empty (<0.5%)
check('REPELLER_AVOIDANCE', repellerCoreCount <= 2, 
  `Diffuse particles actively clear innermost Dipole Repeller core (particles within 8 units: ${repellerCoreCount} <= 2)`);


// ====================================================================
// SECTION 4: SHADER & GRAPHICAL PIPELINE INTEGRITY
// ====================================================================
console.log('\n--- CHECK 4: Shader & Graphical Pipeline Integrity ---');

check('SHADER_4.1', swarm1.material instanceof THREE.ShaderMaterial, 
  'Swarm material is genuine THREE.ShaderMaterial');
check('SHADER_4.2', swarm1.material.blending === THREE.AdditiveBlending, 
  'Additive blending is enabled for luminous galactic accumulation');
check('SHADER_4.3', swarm1.material.transparent === true, 
  'Transparent rendering enabled');
check('SHADER_4.4', swarm1.material.depthWrite === false, 
  'DepthWrite is false to avoid particle self-occlusion artifacts');
check('SHADER_4.5', swarm1.material.vertexColors === true, 
  'VertexColors enabled for individual cluster color tints');
check('SHADER_4.6', swarm1.material.uniforms.uTexture !== undefined, 
  'uTexture uniform present');
check('SHADER_4.7', swarm1.material.uniforms.uOpacity !== undefined, 
  'uOpacity uniform present');
check('SHADER_4.8', swarm1.particleTexture instanceof THREE.Texture, 
  'particleTexture is genuine THREE.Texture');

// ====================================================================
// SECTION 5: LIFECYCLE, LEAK DEFENSE & ADVERSARIAL STRESS
// ====================================================================
console.log('\n--- CHECK 5: Lifecycle, Memory & Adversarial Stress ---');

// Stress 5.1: setCount extreme dynamic scaling
swarm1.setCount(25000);
check('STRESS_5.1', swarm1.count === 25000 && swarm1.pointsMesh.geometry.attributes.position.count === 25000, 
  'setCount(25000) scales buffer geometry to 25,000 points cleanly');
swarm1.setCount(100);
check('STRESS_5.2', swarm1.count === 100 && swarm1.pointsMesh.geometry.attributes.position.count === 100, 
  'setCount(100) scales down to minimum cleanly');

// Stress 5.3: dispose on GalaxyClusters
const testClusters = new GalaxyClusters();
testClusters.dispose();
check('STRESS_5.3', testClusters.sharedGeometry === null && testClusters.material === null && testClusters.meshes.length === 0, 
  'GalaxyClusters.dispose() nulls references and releases geometry/material');

// Stress 5.4: dispose on GalaxySwarm
swarm1.dispose();
check('STRESS_5.4', swarm1.pointsMesh === null && swarm1.particleTexture === null, 
  'GalaxySwarm.dispose() nulls references and releases GPU point mesh/texture');

// Stress 5.5: GalaxyClusters pulse animation
const pulseCluster = new GalaxyClusters(null, { pulseEnabled: true });
const virgoMeshPulse = pulseCluster.group.getObjectByName('Virgo');
const origX = virgoMeshPulse.scale.x;
pulseCluster.update(1.0);
check('STRESS_5.5', virgoMeshPulse.scale.x !== origX && Number.isFinite(virgoMeshPulse.scale.x), 
  'GalaxyClusters pulse animation dynamically modulates mesh transform smoothly');

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================\n');

if (violations.length > 0) {
  console.error('INTEGRITY VIOLATIONS DETECTED:');
  for (const v of violations) {
    console.error(`- [${v.id}] ${v.description}`);
  }
  console.log('\nFINAL AUDITOR VERDICT: INTEGRITY VIOLATION\n');
  process.exit(1);
} else {
  console.log('ALL FORENSIC CHECKS PASSED EMPIRICALLY.');
  console.log('FINAL AUDITOR VERDICT: CLEAN\n');
  process.exit(0);
}
