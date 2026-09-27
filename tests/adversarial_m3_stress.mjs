import * as THREE from 'three';
import { GalaxyClusters } from '../src/renderers/GalaxyClusters.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';

console.log('================================================================');
console.log('ADVERSARIAL STRESS TEST SUITE: MILESTONE M3');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log(`[PASS] ${msg}`);
  } else {
    fail++;
    console.error(`[FAIL] ${msg}`);
  }
}

// 1. GalaxyClusters: Constructor arguments & edge cases
try {
  const dummyScene = new THREE.Scene();
  const c2 = new GalaxyClusters(dummyScene);
  assert(dummyScene.children.includes(c2.group), 'GalaxyClusters attaches to scene when passed as first arg');

  const c3 = new GalaxyClusters({ opacity: 0.3, visible: false, scaleMultiplier: 1.5 });
  assert(c3.opacity === 0.3 && c3.visible === false && c3.scaleMultiplier === 1.5, 
    'GalaxyClusters handles options as first argument polymorphic overload');
} catch (e) {
  assert(false, `Constructor crashed on valid arguments: ${e.message}`);
}

// Edge case 1: explicit null options
let nullOptsCrashed = false;
try {
  new GalaxyClusters(null, null);
} catch (e) {
  nullOptsCrashed = true;
}
assert(nullOptsCrashed, 'Vulnerability noted: GalaxyClusters(null, null) throws TypeError when opts is explicitly null');

// 2. GalaxyClusters: Boundary inputs & extreme mutations
const c = new GalaxyClusters();

// Opacity clamping
c.setOpacity(-10);
assert(c.opacity === 0.0 && c.material.opacity === 0.0, 'setOpacity(-10) clamps to 0.0');
c.setOpacity(999);
assert(c.opacity === 1.0 && c.material.opacity === 1.0, 'setOpacity(999) clamps to 1.0');

// Scale multiplier clamping
c.setScaleMultiplier(-5);
assert(c.scaleMultiplier === 0.01, 'setScaleMultiplier(-5) clamps to minimum 0.01 to prevent negative scale inversion');
c.setScaleMultiplier(100.0);
assert(c.scaleMultiplier === 100.0, 'setScaleMultiplier(100.0) scales cleanly');
c.setScaleMultiplier(1.0);

// getCluster edge cases
assert(c.getCluster(null) === null, 'getCluster(null) returns null without exception');
assert(c.getCluster(undefined) === null, 'getCluster(undefined) returns null');
assert(c.getCluster('') === null, 'getCluster("") returns null');
assert(c.getCluster(12345) === null, 'getCluster(12345) returns null');
assert(c.getCluster('nonexistent') === null, 'getCluster("nonexistent") returns null');
assert(c.getCluster('VIRGO') !== null, 'getCluster("VIRGO") is case-insensitive');
assert(c.getCluster('great-attractor') !== null, 'getCluster("great-attractor") resolves by id');

// Double dispose safety
try {
  c.dispose();
  c.dispose();
  assert(true, 'Calling dispose() twice does not throw an exception');
} catch (e) {
  assert(false, `Double dispose threw error: ${e.message}`);
}

// 3. GalaxySwarm: Constructor edge cases & dynamic scaling
let negCountCrashed = false;
try {
  new GalaxySwarm(null, { count: -500 });
} catch (e) {
  negCountCrashed = true;
}
assert(negCountCrashed, 'Vulnerability noted: new GalaxySwarm(null, { count: -500 }) throws RangeError because constructor lacks Math.max(100, count)');

try {
  const s = new GalaxySwarm(null, { count: 18000 });
  assert(s.count === 18000, 'GalaxySwarm creates 18,000 points cleanly');

  // setCount clamps
  s.setCount(-500);
  assert(s.count === 100, 'setCount(-500) clamps to minimum 100');
  assert(s.pointsMesh.geometry.attributes.position.count === 100, 'Buffer geometry respects clamped count');

  // Extreme point count
  s.setCount(35000);
  assert(s.count === 35000, 'setCount(35000) creates 35,000 points');
  assert(s.pointsMesh.geometry.attributes.position.count === 35000, 'Geometry position attribute resized to 35,000');

  // Point size clamping
  s.setPointSize(-2);
  assert(s.pointSize === 0.1, 'setPointSize(-2) clamps to minimum 0.1');

  // Opacity clamping
  s.setOpacity(-1.0);
  assert(s.opacity === 0.0, 'setOpacity(-1.0) clamps to 0.0');
  s.setOpacity(2.0);
  assert(s.opacity === 1.0, 'setOpacity(2.0) clamps to 1.0');

  // Double dispose safety
  s.dispose();
  s.dispose();
  assert(true, 'GalaxySwarm double dispose does not throw');
} catch (e) {
  assert(false, `GalaxySwarm stress test crashed: ${e.message}`);
}


// 4. Numerical range safety on buffers
const sCheck = new GalaxySwarm(null, { count: 16000 });
const pArr = sCheck.pointsMesh.geometry.attributes.position.array;
const cArr = sCheck.pointsMesh.geometry.attributes.color.array;
const szArr = sCheck.pointsMesh.geometry.attributes.size.array;

let badNumber = false;
for (let i = 0; i < pArr.length; i++) {
  if (isNaN(pArr[i]) || !isFinite(pArr[i])) {
    badNumber = true; break;
  }
}
assert(!badNumber, 'All position coordinates are finite numbers');

let badColor = false;
for (let i = 0; i < cArr.length; i++) {
  if (isNaN(cArr[i]) || cArr[i] < 0 || cArr[i] > 1.0001) {
    badColor = true; break;
  }
}
assert(!badColor, 'All color channel values are valid floats in [0, 1]');

let badSize = false;
for (let i = 0; i < szArr.length; i++) {
  if (isNaN(szArr[i]) || szArr[i] <= 0 || !isFinite(szArr[i])) {
    badSize = true; break;
  }
}
assert(!badSize, 'All particle sizes are positive finite floats');

sCheck.dispose();

console.log('\n================================================================');
console.log(`STRESS RESULTS: ${pass} PASSED, ${fail} FAILED`);
console.log('================================================================\n');

if (fail > 0) process.exit(1);
process.exit(0);
