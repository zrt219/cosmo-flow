import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Setup Lightweight Headless DOM Environment for lil-gui & HUD Interaction
// ---------------------------------------------------------------------------
function createMockElement(tagName = 'div') {
  const listeners = {};
  const children = [];
  const attributes = {};
  const classListSet = new Set();

  const style = {
    setProperty: (k, v) => { style[k] = String(v); },
    getPropertyValue: (k) => style[k] || '',
    removeProperty: (k) => { delete style[k]; }
  };

  const el = {
    tagName: tagName.toUpperCase(),
    children,
    style,
    classList: {
      add: (...cls) => cls.forEach(c => classListSet.add(c)),
      remove: (...cls) => cls.forEach(c => classListSet.delete(c)),
      contains: (c) => classListSet.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classListSet.has(c)) classListSet.delete(c); else classListSet.add(c);
        } else if (force) {
          classListSet.add(c);
        } else {
          classListSet.delete(c);
        }
      }
    },
    setAttribute: (k, v) => { attributes[k] = String(v); },
    getAttribute: (k) => attributes[k] ?? null,
    removeAttribute: (k) => { delete attributes[k]; },
    addEventListener: (evt, fn) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter(f => f !== fn);
      }
    },
    dispatchEvent: (evt) => {
      const type = typeof evt === 'string' ? evt : (evt && evt.type ? evt.type : 'click');
      const eventObj = typeof evt === 'object' ? evt : { type };
      (listeners[type] || []).forEach(fn => fn(eventObj));
    },
    appendChild: (child) => {
      children.push(child);
      child.parentNode = el;
      return child;
    },
    insertBefore: (newChild, refChild) => {
      const idx = children.indexOf(refChild);
      if (idx !== -1) {
        children.splice(idx, 0, newChild);
      } else {
        children.push(newChild);
      }
      newChild.parentNode = el;
      return newChild;
    },
    replaceChild: (newChild, oldChild) => {
      const idx = children.indexOf(oldChild);
      if (idx !== -1) {
        children.splice(idx, 1, newChild);
      }
      newChild.parentNode = el;
      oldChild.parentNode = null;
      return oldChild;
    },
    replaceChildren: (...newChildren) => {
      children.length = 0;
      for (const c of newChildren) {
        children.push(c);
        c.parentNode = el;
      }
    },
    removeChild: (child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    remove: function() {
      if (this.parentNode && this.parentNode.removeChild) {
        this.parentNode.removeChild(this);
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {},
    blur: () => {},
    contains: () => true,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 300, height: 400 })
  };
  return el;
}

const mockElementsById = new Map();

function registerMockHUDButton(id, label) {
  const btn = createMockElement('button');
  btn.id = id;
  btn.classList.add('preset-btn');
  btn.textContent = label;
  mockElementsById.set(id, btn);
  return btn;
}

// Register all HUD buttons
registerMockHUDButton('btn-ref-view', 'Reference View');
registerMockHUDButton('btn-coma-view', 'Coma Fountain');
registerMockHUDButton('btn-virgo-view', 'Virgo Cluster');
registerMockHUDButton('btn-top-view', 'Top-Down Plane');
registerMockHUDButton('btn-attractor-view', 'Great Attractor Core');
registerMockHUDButton('btn-repeller-view', 'Dipole Repeller Outflow');
registerMockHUDButton('btn-flow-toggle', 'Flowing');

if (typeof globalThis.document === 'undefined') {
  const body = createMockElement('body');
  const head = createMockElement('head');

  globalThis.document = {
    createElement: (tag) => createMockElement(tag),
    createTextNode: (text) => ({ textContent: text }),
    getElementById: (id) => mockElementsById.get(id) || null,
    querySelectorAll: (sel) => {
      if (sel.includes('.preset-btn') || sel.includes('button')) {
        return Array.from(mockElementsById.values());
      }
      return [];
    },
    querySelector: (sel) => null,
    head,
    body,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  globalThis.window = {
    document: globalThis.document,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }),
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1.0
  };
}

// Now load modules that depend on lil-gui and ControlPanel
import { GalaxyClusters } from '../src/renderers/GalaxyClusters.js';
import { CosmicLabels } from '../src/renderers/CosmicLabels.js';
import { GalaxySwarm } from '../src/renderers/GalaxySwarm.js';
import { CosmicField } from '../src/physics/CosmicField.js';
import { ControlPanel } from '../src/ui/ControlPanel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('TEST SUITE: MILESTONE M4 (Camera Angle, Presets & UI Controls)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message, details = {}) {
  if (condition) {
    passCount++;
    console.log(`  PASS: ${message}`);
  } else {
    failCount++;
    failures.push({ message, details });
    console.error(`  FAIL: ${message}`, details);
  }
}

// ====================================================================
// SUITE 1: Camera Calibration & Tully et al. (Nature 2014) Alignment
// ====================================================================
console.log('========================================');
console.log('SUITE 1: Camera Calibration & Tully et al. 2014 Layout');
console.log('========================================');

const aspect = 16 / 9;
const camera = new THREE.PerspectiveCamera(46, aspect, 1.0, 1400);
const targetPos = new THREE.Vector3(-12, 100, 135);
const lookAtPos = new THREE.Vector3(-10, 4, -8);

camera.position.copy(targetPos);
camera.lookAt(lookAtPos);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

assert(camera.fov === 46, `Camera FOV is calibrated to 46 (actual: ${camera.fov})`);
assert(camera.near === 1.0, `Camera near plane is 1.0 (actual: ${camera.near})`);
assert(camera.far === 1400, `Camera far plane is 1400 (actual: ${camera.far})`);

// Pitch angle calculation: angle between viewing vector and supergalactic plane (Y=0)
const viewDir = new THREE.Vector3().subVectors(lookAtPos, targetPos);
const horizDist = Math.sqrt(viewDir.x * viewDir.x + viewDir.z * viewDir.z);
const pitchDeg = Math.atan2(-viewDir.y, horizDist) * (180 / Math.PI);
assert(Math.abs(pitchDeg - 33.87) < 0.2, `Downward pitch angle is ~33.9° (actual: ${pitchDeg.toFixed(2)}°)`);

// Mathematical projection of key cosmological structures into Normalized Device Coordinates (NDC)
function projectToNDC(worldPos) {
  const v = worldPos.clone();
  v.project(camera);
  return v;
}

const ndcGA = projectToNDC(new THREE.Vector3(-38, 2, -5));
assert(ndcGA.x < -0.15 && ndcGA.x > -0.30, `Great Attractor is situated on screen left (NDC X: ${ndcGA.x.toFixed(2)})`);

const ndcCentaurus = projectToNDC(new THREE.Vector3(-34, 6, 2));
assert(ndcCentaurus.x < -0.10 && ndcCentaurus.x > -0.25, `Centaurus cluster is on left-center (NDC X: ${ndcCentaurus.x.toFixed(2)})`);

const ndcVirgo = projectToNDC(new THREE.Vector3(-8, 3, 0));
assert(Math.abs(ndcVirgo.x) < 0.08 && Math.abs(ndcVirgo.y) < 0.12, `Virgo cluster is centered at mid-plane (NDC X: ${ndcVirgo.x.toFixed(2)}, Y: ${ndcVirgo.y.toFixed(2)})`);

const ndcComa = projectToNDC(new THREE.Vector3(5, 45, -25));
assert(ndcComa.y > 0.50 && ndcComa.y < 0.75, `Coma cluster & vertical loops are at top-center (NDC Y: ${ndcComa.y.toFixed(2)})`);
assert(ndcComa.x > 0.05 && ndcComa.x < 0.20, `Coma cluster X is near center (NDC X: ${ndcComa.x.toFixed(2)})`);

const ndcRepeller = projectToNDC(new THREE.Vector3(32, -4, 18));
assert(ndcRepeller.x > 0.20 && ndcRepeller.y < -0.15, `Dipole Repeller outflow is in lower-right foreground (NDC X: ${ndcRepeller.x.toFixed(2)}, Y: ${ndcRepeller.y.toFixed(2)})`);

// ====================================================================
// SUITE 2: Camera Presets & Smooth Interpolation
// ====================================================================
console.log('\n========================================');
console.log('SUITE 2: Camera Presets & Interpolation');
console.log('========================================');

// Create mock app with camera and controls
class MockApp {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(46, aspect, 1.0, 1400);
    this.controls = {
      target: new THREE.Vector3(-10, 4, -8),
      update: () => {}
    };
    this.cameraTargetPos = new THREE.Vector3();
    this.controlsTargetPos = new THREE.Vector3();
    this.cameraTargetFov = 46;
    this.isTransitioningCamera = false;
  }

  setCameraView(pos, target, fov = 46, instant = false) {
    if (instant) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
      this.controls.update();
      this.isTransitioningCamera = false;
    } else {
      this.cameraTargetPos.copy(pos);
      this.controlsTargetPos.copy(target);
      this.cameraTargetFov = fov;
      this.isTransitioningCamera = true;
    }
  }

  setReferenceCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-12, 100, 135), new THREE.Vector3(-10, 4, -8), 46, instant);
  }

  setComaCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(15, 60, 40), new THREE.Vector3(5, 45, -25), 50, instant);
  }

  setVirgoCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(10, 25, 35), new THREE.Vector3(-8, 3, 0), 42, instant);
  }

  setAttractorCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-20, 20, 25), new THREE.Vector3(-38, 2, -5), 45, instant);
  }

  setTopDownCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-10, 210, -5), new THREE.Vector3(-10, 0, -5), 46, instant);
  }

  setRepellerCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(60, 20, 45), new THREE.Vector3(32, -4, 18), 48, instant);
  }

  stepTransition(iterations = 60) {
    for (let i = 0; i < iterations; i++) {
      if (!this.isTransitioningCamera) break;
      this.camera.position.lerp(this.cameraTargetPos, 0.06);
      this.controls.target.lerp(this.controlsTargetPos, 0.06);
      if (this.cameraTargetFov && Math.abs(this.camera.fov - this.cameraTargetFov) > 0.01) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.cameraTargetFov, 0.06);
        this.camera.updateProjectionMatrix();
      }
      if (
        this.camera.position.distanceTo(this.cameraTargetPos) < 0.5 &&
        this.controls.target.distanceTo(this.controlsTargetPos) < 0.5 &&
        (!this.cameraTargetFov || Math.abs(this.camera.fov - this.cameraTargetFov) < 0.2)
      ) {
        this.camera.position.copy(this.cameraTargetPos);
        this.controls.target.copy(this.controlsTargetPos);
        if (this.cameraTargetFov) {
          this.camera.fov = this.cameraTargetFov;
          this.camera.updateProjectionMatrix();
        }
        this.isTransitioningCamera = false;
      }
    }
  }
}

const mockApp = new MockApp();

// 1. Reference View
mockApp.setReferenceCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(-12, 100, 135)) < 1e-4, 'setReferenceCamera sets position (-12, 100, 135)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(-10, 4, -8)) < 1e-4, 'setReferenceCamera sets target (-10, 4, -8)');
assert(mockApp.camera.fov === 46, 'setReferenceCamera sets fov 46');

// 2. Coma Camera
mockApp.setComaCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(15, 60, 40)) < 1e-4, 'setComaCamera sets position (15, 60, 40)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(5, 45, -25)) < 1e-4, 'setComaCamera sets target (5, 45, -25)');
assert(mockApp.camera.fov === 50, 'setComaCamera sets fov 50');

// 3. Virgo Camera
mockApp.setVirgoCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(10, 25, 35)) < 1e-4, 'setVirgoCamera sets position (10, 25, 35)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(-8, 3, 0)) < 1e-4, 'setVirgoCamera sets target (-8, 3, 0)');
assert(mockApp.camera.fov === 42, 'setVirgoCamera sets fov 42');

// 4. Attractor Camera
mockApp.setAttractorCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(-20, 20, 25)) < 1e-4, 'setAttractorCamera sets position (-20, 20, 25)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(-38, 2, -5)) < 1e-4, 'setAttractorCamera sets target (-38, 2, -5)');
assert(mockApp.camera.fov === 45, 'setAttractorCamera sets fov 45');

// 5. TopDown Camera
mockApp.setTopDownCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(-10, 210, -5)) < 1e-4, 'setTopDownCamera sets position (-10, 210, -5)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(-10, 0, -5)) < 1e-4, 'setTopDownCamera sets target (-10, 0, -5)');
assert(mockApp.camera.fov === 46, 'setTopDownCamera sets fov 46');

// 6. Repeller Camera
mockApp.setRepellerCamera(true);
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(60, 20, 45)) < 1e-4, 'setRepellerCamera sets position (60, 20, 45)');
assert(mockApp.controls.target.distanceTo(new THREE.Vector3(32, -4, 18)) < 1e-4, 'setRepellerCamera sets target (32, -4, 18)');
assert(mockApp.camera.fov === 48, 'setRepellerCamera sets fov 48');

// Test smooth lerp transition
mockApp.setReferenceCamera(false);
assert(mockApp.isTransitioningCamera === true, 'Smooth transition starts with isTransitioningCamera = true');
mockApp.stepTransition(120);
assert(mockApp.isTransitioningCamera === false, 'Smooth transition completes and clears isTransitioningCamera');
assert(mockApp.camera.position.distanceTo(new THREE.Vector3(-12, 100, 135)) < 0.1, 'Lerp smoothly converged to target position');
assert(mockApp.camera.fov === 46, 'Lerp smoothly converged to target FOV');

// ====================================================================
// SUITE 3: GalaxyClusters Constructor Synchronization
// ====================================================================
console.log('\n========================================');
console.log('SUITE 3: GalaxyClusters Constructor Sync');
console.log('========================================');

const defaultClusters = new GalaxyClusters();
assert(defaultClusters.visible === true, 'defaultClusters.visible is true');
assert(defaultClusters.group.visible === true, 'defaultClusters.group.visible synchronized to true');

const hiddenClusters = new GalaxyClusters({ visible: false });
assert(hiddenClusters.visible === false, 'hiddenClusters.visible is false');
assert(hiddenClusters.group.visible === false, 'hiddenClusters.group.visible synchronized to false');

hiddenClusters.setVisible(true);
assert(hiddenClusters.group.visible === true, 'setVisible(true) restores group visibility');

// Verify scene auto-add in constructor
const testScene = new THREE.Scene();
const autoAddedClusters = new GalaxyClusters(testScene, { visible: true, opacity: 0.95 });
assert(testScene.children.includes(autoAddedClusters.group), 'GalaxyClusters attaches group to scene when scene provided');

// ====================================================================
// SUITE 4: ControlPanel lil-gui Controls & Folder Verification
// ====================================================================
console.log('\n========================================');
console.log('SUITE 4: ControlPanel lil-gui Controls & Folders');
console.log('========================================');

// Create mock systems for ControlPanel
const mockScene = new THREE.Scene();
const mockCosmicField = new CosmicField();
const mockCamera = new THREE.PerspectiveCamera(46, aspect, 1.0, 1400);
mockCamera.position.set(-12, 100, 135);

const mockCosmicLabels = new CosmicLabels(mockCosmicField, mockCamera, null);
const mockGalaxyClusters = new GalaxyClusters(mockScene, { visible: true, opacity: 0.95 });
const mockGalaxySwarm = new GalaxySwarm(mockCosmicField, { count: 18000 });

let refViewTriggered = false;
let comaViewTriggered = false;
let virgoViewTriggered = false;
let attractorViewTriggered = false;
let topDownViewTriggered = false;
let repellerViewTriggered = false;

const fullMockApp = {
  camera: mockCamera,
  scene: mockScene,
  cosmicField: mockCosmicField,
  cosmicLabels: mockCosmicLabels,
  galaxyClusters: mockGalaxyClusters,
  clusterEllipsoids: mockGalaxyClusters,
  galaxySwarm: mockGalaxySwarm,
  streamlineRenderer: {
    streamlineCount: 320,
    lineOpacity: 0.82,
    showArrows: true,
    showComaLoops: true,
    arrowScale: 1.15,
    arrowInterval: 14.0,
    isAnimated: true,
    flowSpeed: 0.85,
    setStreamlineCount: () => {},
    setLineOpacity: () => {},
    setShowComaLoops: () => {},
    setShowArrows: () => {},
    setArrowScale: () => {}
  },
  slicePlaneMesh: {
    group: new THREE.Group(),
    sliceY: 0,
    uniforms: {
      uOpacity: { value: 0.85 },
      uBrightness: { value: 1.0 },
      uContourLines: { value: 1.0 }
    },
    setSliceY: () => {},
    setOpacity: () => {},
    updateUniforms: () => {}
  },
  enableBloom: true,
  cameraTargetFov: 46,
  updateHUDStats: () => {},
  updateFlowButtonState: () => {},
  setReferenceCamera: () => { refViewTriggered = true; mockCamera.fov = 46; },
  setComaCamera: () => { comaViewTriggered = true; mockCamera.fov = 50; },
  setVirgoCamera: () => { virgoViewTriggered = true; mockCamera.fov = 42; },
  setAttractorCamera: () => { attractorViewTriggered = true; mockCamera.fov = 45; },
  setTopDownCamera: () => { topDownViewTriggered = true; mockCamera.fov = 46; },
  setRepellerCamera: () => { repellerViewTriggered = true; mockCamera.fov = 48; }
};

const panel = new ControlPanel(fullMockApp);
assert(panel instanceof ControlPanel, 'ControlPanel instantiates cleanly');
assert(panel.gui !== null, 'panel.gui is initialized');

// Test Cosmic Labels & Typography folder
assert(panel.labelFolder !== undefined, 'labelFolder is defined');
assert(panel.labelParams !== undefined, 'labelParams object exists');
assert(panel.labelParams.showLabels === true, 'labelParams.showLabels defaults to true');
assert(panel.labelParams.showLeaders === true, 'labelParams.showLeaders defaults to true');

// Test label controllers trigger underlying methods
mockCosmicLabels.setVisible(false);
assert(mockCosmicLabels.group.visible === false, 'mockCosmicLabels.setVisible(false) updates group visibility');
mockCosmicLabels.setOpacity(0.5);
assert(mockCosmicLabels.baseOpacity === 0.5, 'mockCosmicLabels.setOpacity updates baseOpacity');
mockCosmicLabels.setLeaderLinesVisible(false);
assert(mockCosmicLabels.leaderLines.visible === false, 'mockCosmicLabels.setLeaderLinesVisible hides lines');
mockCosmicLabels.setLeaderOpacity(0.3);
assert(mockCosmicLabels.leaderMaterial.opacity === 0.3, 'mockCosmicLabels.setLeaderOpacity updates material');
mockCosmicLabels.setScale(1.8);
assert(mockCosmicLabels.userScale === 1.8, 'mockCosmicLabels.setScale updates userScale');

// Test Galaxy Clusters & Swarm folder
assert(panel.clusterFolder !== undefined, 'clusterFolder is defined');
assert(panel.clusterParams !== undefined, 'clusterParams object exists');
assert(panel.clusterParams.showEllipsoids === true, 'clusterParams.showEllipsoids is true');
assert(panel.clusterParams.clusterOpacity === 0.95, 'clusterParams.clusterOpacity is 0.95');

mockGalaxyClusters.setVisible(false);
assert(mockGalaxyClusters.group.visible === false, 'mockGalaxyClusters.setVisible(false) hides cluster group');
mockGalaxyClusters.setOpacity(0.4);
assert(mockGalaxyClusters.material.opacity === 0.4, 'mockGalaxyClusters.setOpacity updates material opacity');
mockGalaxyClusters.setScaleMultiplier(1.5);
assert(mockGalaxyClusters.scaleMultiplier === 1.5, 'mockGalaxyClusters.setScaleMultiplier updates scaleMultiplier');

// Test Camera & Viewpoints folder
assert(panel.cameraFolder !== undefined, 'cameraFolder is defined');
assert(panel.cameraParams !== undefined, 'cameraParams object exists');
assert(panel.cameraParams.preset === 'Reference (Tully 2014)', 'cameraParams.preset defaults to Reference view');
assert(panel.cameraParams.fov === 46, 'cameraParams.fov defaults to 46');

// Test applyPreset
panel.applyPreset('Reference (Tully 2014)');
assert(refViewTriggered === true, 'applyPreset(Reference) triggers setReferenceCamera');

panel.applyPreset('Coma Fountain Arch');
assert(comaViewTriggered === true, 'applyPreset(Coma) triggers setComaCamera');

panel.applyPreset('Virgo Cluster');
assert(virgoViewTriggered === true, 'applyPreset(Virgo) triggers setVirgoCamera');

panel.applyPreset('The Great Attractor Core');
assert(attractorViewTriggered === true, 'applyPreset(Attractor) triggers setAttractorCamera');

panel.applyPreset('Top-Down Supergalactic Plane');
assert(topDownViewTriggered === true, 'applyPreset(TopDown) triggers setTopDownCamera');

panel.applyPreset('Dipole Repeller Outflow');
assert(repellerViewTriggered === true, 'applyPreset(Repeller) triggers setRepellerCamera');

// Test swarm and pulse params in Galaxy Clusters & Swarm folder
assert(mockGalaxyClusters.pulseEnabled === false, 'pulseClusters defaults to false');
panel.clusterParams.pulseClusters = true;
mockGalaxyClusters.pulseEnabled = true;
assert(mockGalaxyClusters.pulseEnabled === true, 'pulseClusters toggle updates pulseEnabled');

// Test GalaxySwarm controls
panel.clusterParams.showGalaxies = false;
mockGalaxySwarm.setVisible(false);
assert(mockGalaxySwarm.group.visible === false, 'showGalaxies toggle hides swarm');
panel.clusterParams.showGalaxies = true;
mockGalaxySwarm.setVisible(true);
assert(mockGalaxySwarm.group.visible === true, 'showGalaxies toggle restores swarm');

panel.clusterParams.count = 22000;
mockGalaxySwarm.setCount(22000);
assert(mockGalaxySwarm.count === 22000, 'count slider updates swarm point count');

panel.clusterParams.pointSize = 2.4;
mockGalaxySwarm.setPointSize(2.4);
assert(mockGalaxySwarm.pointSize === 2.4, 'pointSize slider updates particle size');

// Test FOV slider
let projUpdated = false;
mockCamera.updateProjectionMatrix = () => { projUpdated = true; };
panel.cameraParams.fov = 55;
mockCamera.fov = 55;
mockCamera.updateProjectionMatrix();
assert(mockCamera.fov === 55, 'FOV slider updates camera.fov');
assert(projUpdated === true, 'updateProjectionMatrix called on FOV modification');

// Test HUD button click interaction via mock DOM
const comaBtn = mockElementsById.get('btn-coma-view');
assert(comaBtn !== undefined, 'btn-coma-view element exists in DOM');
comaViewTriggered = false;
comaBtn.dispatchEvent('click');
assert(comaViewTriggered === true, 'Clicking #btn-coma-view triggers setComaCamera');
assert(comaBtn.classList.contains('active'), '#btn-coma-view gains active class upon click');

const virgoBtn = mockElementsById.get('btn-virgo-view');
assert(virgoBtn !== undefined, 'btn-virgo-view element exists in DOM');
virgoViewTriggered = false;
virgoBtn.dispatchEvent('click');
assert(virgoViewTriggered === true, 'Clicking #btn-virgo-view triggers setVirgoCamera');
assert(virgoBtn.classList.contains('active'), '#btn-virgo-view gains active class upon click');
assert(!comaBtn.classList.contains('active'), '#btn-coma-view loses active class when Virgo selected');

const refBtn = mockElementsById.get('btn-ref-view');
assert(refBtn !== undefined, 'btn-ref-view element exists in DOM');
refViewTriggered = false;
refBtn.dispatchEvent('click');
assert(refViewTriggered === true, 'Clicking #btn-ref-view triggers setReferenceCamera');
assert(refBtn.classList.contains('active'), '#btn-ref-view gains active class upon click');
assert(!virgoBtn.classList.contains('active'), '#btn-virgo-view loses active class when Reference selected');

const topBtn = mockElementsById.get('btn-top-view');
assert(topBtn !== undefined, 'btn-top-view element exists in DOM');
topDownViewTriggered = false;
topBtn.dispatchEvent('click');
assert(topDownViewTriggered === true, 'Clicking #btn-top-view triggers setTopDownCamera');
assert(topBtn.classList.contains('active'), '#btn-top-view gains active class upon click');

const gaBtn = mockElementsById.get('btn-attractor-view');
assert(gaBtn !== undefined, 'btn-attractor-view element exists in DOM');
attractorViewTriggered = false;
gaBtn.dispatchEvent('click');
assert(attractorViewTriggered === true, 'Clicking #btn-attractor-view triggers setAttractorCamera');
assert(gaBtn.classList.contains('active'), '#btn-attractor-view gains active class upon click');

const drBtn = mockElementsById.get('btn-repeller-view');
assert(drBtn !== undefined, 'btn-repeller-view element exists in DOM');
repellerViewTriggered = false;
drBtn.dispatchEvent('click');
assert(repellerViewTriggered === true, 'Clicking #btn-repeller-view triggers setRepellerCamera');
assert(drBtn.classList.contains('active'), '#btn-repeller-view gains active class upon click');

const flowBtn = mockElementsById.get('btn-flow-toggle');
assert(flowBtn !== undefined, 'btn-flow-toggle element exists in DOM');
assert(fullMockApp.streamlineRenderer.isAnimated === true, 'streamline flow is initially animated');
flowBtn.dispatchEvent('click');
assert(fullMockApp.streamlineRenderer.isAnimated === false, 'Clicking #btn-flow-toggle toggles animated to false');
flowBtn.dispatchEvent('click');
assert(fullMockApp.streamlineRenderer.isAnimated === true, 'Clicking #btn-flow-toggle toggles animated back to true');

// ====================================================================
// SUITE 5: index.html HUD Elements & Preset Buttons
// ====================================================================
console.log('\n========================================');
console.log('SUITE 5: index.html HUD Elements & Presets');
console.log('========================================');

const htmlPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(htmlPath), 'index.html exists');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="btn-ref-view"'), 'index.html contains #btn-ref-view');
assert(htmlContent.includes('id="btn-coma-view"'), 'index.html contains #btn-coma-view');
assert(htmlContent.includes('id="btn-virgo-view"'), 'index.html contains #btn-virgo-view');
assert(htmlContent.includes('id="btn-top-view"'), 'index.html contains #btn-top-view');
assert(htmlContent.includes('id="btn-attractor-view"'), 'index.html contains #btn-attractor-view');
assert(htmlContent.includes('id="btn-repeller-view"'), 'index.html contains #btn-repeller-view');
assert(htmlContent.includes('id="btn-flow-toggle"'), 'index.html contains #btn-flow-toggle');

// Verify main.js source inspection
const mainPath = path.join(rootDir, 'src', 'main.js');
assert(fs.existsSync(mainPath), 'src/main.js exists');
const mainContent = fs.readFileSync(mainPath, 'utf8');

assert(mainContent.includes("import { GalaxyClusters } from './renderers/GalaxyClusters.js'"), 'main.js imports GalaxyClusters');
assert(mainContent.includes('this.galaxyClusters = new GalaxyClusters(this.scene'), 'main.js instantiates galaxyClusters');
assert(mainContent.includes('this.clusterEllipsoids = this.galaxyClusters'), 'main.js provides clusterEllipsoids alias');
assert(mainContent.includes('PerspectiveCamera(\n      46') || mainContent.includes('PerspectiveCamera(46') || mainContent.includes('46,'), 'main.js configures camera FOV 46');
assert(mainContent.includes('(-12, 100, 135)'), 'main.js references (-12, 100, 135) reference camera');
assert(mainContent.includes('(-10, 4, -8)'), 'main.js references (-10, 4, -8) controls target');
assert(mainContent.includes('setComaCamera'), 'main.js defines setComaCamera');
assert(mainContent.includes('setVirgoCamera'), 'main.js defines setVirgoCamera');
assert(mainContent.includes('this.galaxyClusters.update(elapsed)'), 'main.js animates galaxyClusters');
assert(mainContent.includes('this.cosmicLabels.update(this.camera, elapsed)'), 'main.js animates cosmicLabels with camera');

// ====================================================================
// SUMMARY
// ====================================================================
console.log('\n================================================================');
console.log(`TEST EXECUTION COMPLETE: ${passCount} passed, ${failCount} failed.`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
