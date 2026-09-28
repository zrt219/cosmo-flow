import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { CosmicField } from './physics/CosmicField.js';
import { SlicePlaneMesh } from './renderers/SlicePlaneMesh.js';
import { StreamlineRenderer } from './renderers/StreamlineRenderer.js';
import { GalaxySwarm } from './renderers/GalaxySwarm.js';
import { CosmicLabels } from './renderers/CosmicLabels.js';
import { GalaxyClusters } from './renderers/GalaxyClusters.js';
import { CosmicSkybox } from './renderers/CosmicSkybox.js';
import { CameraController } from './camera/CameraController.js';
import { GifRecorder } from './recorder/GifRecorder.js';
import { RecordingDock } from './ui/RecordingDock.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { MotionEngine } from './motion/MotionEngine.js';

class LaniakeaApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.enableBloom = true;

    this.clock = new THREE.Clock();
    this.fpsCounter = 0;
    this.fpsTimer = 0;

    // Camera animation target state
    this.cameraTargetPos = new THREE.Vector3();
    this.controlsTargetPos = new THREE.Vector3();
    this.cameraTargetFov = 46;
    this.isTransitioningCamera = false;

    this.initScene();
    this.initPhysicsAndMeshes();
    this.initPostProcessing();
    this.initControls();
    this.initUI();
    this.initEventListeners();

    // Start cinematic intro flythrough sequence
    if (this.motionEngine) {
      this.motionEngine.playIntroSequence();
    } else {
      this.setReferenceCamera(true);
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020306);
    this.scene.fog = new THREE.FogExp2(0x020306, 0.0015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / window.innerHeight,
      1.0,
      1400
    );

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xe8f0ff, 1.6);
    dirLight1.position.set(60, 130, 90);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xfff0dd, 0.9);
    dirLight2.position.set(-90, 60, -70);
    this.scene.add(dirLight2);
  }

  initPhysicsAndMeshes() {
    // Physics potential field
    this.cosmicField = new CosmicField();

    // Background cosmic space & stars
    this.skybox = new CosmicSkybox();
    this.scene.add(this.skybox.group);

    // Density Heatmap Slice Plane (Shader)
    this.slicePlaneMesh = new SlicePlaneMesh(this.cosmicField, {
      width: 180,
      height: 180,
      sliceY: 0
    });
    this.scene.add(this.slicePlaneMesh.group);

    // Streamlines with directional 3D arrowheads & Coma loops
    this.streamlineRenderer = new StreamlineRenderer(this.cosmicField, {
      streamlineCount: 320,
      arrowInterval: 14.0,
      arrowScale: 1.15,
      lineOpacity: 0.82,
      isAnimated: true,
      flowSpeed: 0.85,
      showComaLoops: true
    });
    this.scene.add(this.streamlineRenderer.group);

    // Major Galaxy Cluster 3D Shaded Ellipsoids
    this.galaxyClusters = new GalaxyClusters(this.scene, { visible: true, opacity: 0.95 });
    this.clusterEllipsoids = this.galaxyClusters;

    // Galaxy swarm points
    this.galaxySwarm = new GalaxySwarm(this.cosmicField, {
      count: 18000,
      pointSize: 1.6,
      opacity: 0.94
    });
    this.scene.add(this.galaxySwarm.group);

    // 3D celestial labels & projected badges
    this.cosmicLabels = new CosmicLabels(this.cosmicField, this.camera, document.body);
    this.scene.add(this.cosmicLabels.group);
  }

  initPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Subtle bloom for celestial glow
    this.bloomPass = new UnrealBloomPass(size, 0.42, 0.35, 0.78);
    this.composer.addPass(this.bloomPass);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 450;
    this.controls.minDistance = 15;
    this.controls.target.set(-10, 4, -8);

    // Automated 3D camera controls & GIF/Video recorder
    this.cameraController = new CameraController(this.camera, this.controls, this.renderer.domElement);
    this.gifRecorder = new GifRecorder(this);
  }

  initUI() {
    this.motionEngine = new MotionEngine(this);
    this.recordingDock = new RecordingDock(this);
    this.controlPanel = new ControlPanel(this);
    this.updateHUDStats();
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.composer.setSize(w, h);
    });

    // 3D Raycasting: Click any 3D label or cluster sphere to zoom straight to it
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const distMoved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (distMoved > 6) return; // Ignore drag interactions

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      // Check 3D billboard labels
      if (this.cosmicLabels?.labels) {
        const sprites = this.cosmicLabels.labels.map(l => l.sprite).filter(Boolean);
        const intersects = raycaster.intersectObjects(sprites);
        if (intersects.length > 0) {
          const clickedSprite = intersects[0].object;
          const found = this.cosmicLabels.labels.find(l => l.sprite === clickedSprite);
          if (found) {
            this.zoomToLocation(found.name, found.centroid || found.pos);
            return;
          }
        }
      }

      // Check 3D galaxy cluster spheres
      if (this.galaxyClusters?.meshes) {
        const intersects = raycaster.intersectObjects(this.galaxyClusters.meshes);
        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object;
          const clusterName = clickedMesh.name || clickedMesh.userData?.name;
          if (clusterName) {
            this.zoomToLocation(clusterName, clickedMesh.position);
          }
        }
      }
    });
  }

  /**
   * Universal location zoom resolver matching astronomical names to viewpoints
   */
  zoomToLocation(name, targetPos) {
    const q = (name || '').toLowerCase();
    if (q.includes('great attractor') || q.includes('norma')) {
      this.controlPanel?.applyPreset('The Great Attractor Core');
    } else if (q.includes('coma')) {
      this.controlPanel?.applyPreset('Coma Fountain Arch');
    } else if (q.includes('virgo')) {
      this.controlPanel?.applyPreset('Virgo Cluster');
    } else if (q.includes('centaurus')) {
      this.controlPanel?.applyPreset('Centaurus Cluster Core');
    } else if (q.includes('milky way')) {
      this.controlPanel?.applyPreset('Milky Way / Local Group');
    } else if (q.includes('hydra')) {
      this.controlPanel?.applyPreset('Hydra Cluster');
    } else if (q.includes('antlia')) {
      this.controlPanel?.applyPreset('Antlia Cluster');
    } else if (q.includes('repeller')) {
      this.controlPanel?.applyPreset('Dipole Repeller Outflow');
    } else if (targetPos) {
      const camPos = new THREE.Vector3().copy(targetPos).add(new THREE.Vector3(12, 14, 22));
      this.setCameraView(camPos, targetPos, 40);
    }
  }

  /**
   * Helper to set camera viewpoint and controls target with smooth lerp transition and FOV.
   */
  setCameraView(pos, target, fov = 46, instant = false) {
    if (this.motionEngine) {
      this.motionEngine.stopIntro();
    }
    if (this.cameraController) {
      this.cameraController.stopTour();
      this.cameraController.lastUserInteractionTime = performance.now() / 1000.0;
    }

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

  /**
   * 1. Reference Camera View matching Tully et al. (Nature 2014) labeled reference:
   * Position (-12, 100, 135), LookAt (-10, 4, -8), FOV 46.
   * Pitch ~33.9 deg. Screen placement:
   * GA on left, Coma loops top-center, Virgo center mid-plane, outflow basin lower-right.
   */
  setReferenceCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-12, 100, 135), new THREE.Vector3(-10, 4, -8), 46, instant);
  }

  /**
   * 2. Coma Fountain Arch View:
   * Position (15, 60, 40), LookAt (5, 45, -25), FOV 50.
   */
  setComaCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(15, 60, 40), new THREE.Vector3(5, 45, -25), 50, instant);
  }

  /**
   * 3. Virgo Cluster View:
   * Position (10, 25, 35), LookAt (-8, 3, 0), FOV 42.
   */
  setVirgoCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(10, 25, 35), new THREE.Vector3(-8, 3, 0), 42, instant);
  }

  /**
   * 4. The Great Attractor Core View:
   * Position (-20, 20, 25), LookAt (-38, 2, -5), FOV 45.
   */
  setAttractorCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-20, 20, 25), new THREE.Vector3(-38, 2, -5), 45, instant);
  }

  /**
   * 5. Top-Down Supergalactic Plane View:
   * Position (-10, 210, -5), LookAt (-10, 0, -5), FOV 46.
   */
  setTopDownCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-10, 210, -5), new THREE.Vector3(-10, 0, -5), 46, instant);
  }

  /**
   * 6. Centaurus Cluster Core View:
   * Position (-52, 22, 18), LookAt (-34, 6, 2), FOV 42.
   */
  setCentaurusCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-52, 22, 18), new THREE.Vector3(-34, 6, 2), 42, instant);
  }

  /**
   * 7. Milky Way / Local Group View:
   * Position (-2, 12, 24), LookAt (-10, -1, 4), FOV 38.
   */
  setMilkyWayCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-2, 12, 24), new THREE.Vector3(-10, -1, 4), 38, instant);
  }

  /**
   * 8. Hydra Cluster View:
   * Position (-12, 20, 36), LookAt (-24, 8, 18), FOV 40.
   */
  setHydraCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-12, 20, 36), new THREE.Vector3(-24, 8, 18), 40, instant);
  }

  /**
   * 9. Antlia Cluster View:
   * Position (-6, 16, 40), LookAt (-18, 5, 22), FOV 40.
   */
  setAntliaCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(-6, 16, 40), new THREE.Vector3(-18, 5, 22), 40, instant);
  }

  /**
   * 10. Dipole Repeller Outflow View:
   * Position (60, 20, 45), LookAt (32, -4, 18), FOV 48.
   */
  setRepellerCamera(instant = false) {
    this.setCameraView(new THREE.Vector3(60, 20, 45), new THREE.Vector3(32, -4, 18), 48, instant);
  }

  updateFlowButtonState(isFlowing) {
    const icon = document.getElementById('flow-icon');
    const text = document.getElementById('flow-text');
    if (icon && text) {
      icon.textContent = isFlowing ? '⏸' : '▶';
      text.textContent = isFlowing ? 'Flowing' : 'Paused';
    }
  }

  updateHUDStats() {
    const elStreams = document.getElementById('stat-streamlines');
    const elGalaxies = document.getElementById('stat-galaxies');
    const elArrows = document.getElementById('stat-arrows');

    if (elStreams) elStreams.textContent = this.streamlineRenderer.streamlineCount.toLocaleString();
    if (elGalaxies) elGalaxies.textContent = this.galaxySwarm.count.toLocaleString();
    if (elArrows) elArrows.textContent = (this.streamlineRenderer.arrowCount || 0).toLocaleString();
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Smooth camera transition if active
    if (this.isTransitioningCamera) {
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

    // Update automated camera controller (auto-orbit & cinematic tour) when not transitioning or in intro
    if (this.cameraController && !this.isTransitioningCamera && !this.motionEngine?.introActive) {
      this.cameraController.update(delta);
    }

    // Update MotionEngine camera intro
    if (this.motionEngine) {
      this.motionEngine.update(delta);
    }

    this.controls.update();

    // Density slice plane shader pulse update
    if (this.slicePlaneMesh) {
      this.slicePlaneMesh.update(elapsed);
    }

    // Streamline flow animation
    this.streamlineRenderer.animate(delta, elapsed);

    // Galaxy swarm points update
    if (this.galaxySwarm) {
      this.galaxySwarm.update(elapsed);
    }

    // Major galaxy cluster shaded ellipsoids update
    if (this.galaxyClusters) {
      this.galaxyClusters.update(elapsed);
    }

    // 3D markers and billboard label updates
    if (this.cosmicLabels) {
      this.cosmicLabels.update(this.camera, elapsed);
    }

    // Render
    if (this.enableBloom) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // FPS calculation
    this.fpsCounter++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      const fps = Math.round(this.fpsCounter / this.fpsTimer);
      const elFps = document.getElementById('stat-fps');
      if (elFps) elFps.textContent = fps;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new LaniakeaApp();
});
