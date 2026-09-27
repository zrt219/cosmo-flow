import * as THREE from 'three';

/**
 * CameraController manages automated 3D camera orbits, smart interactive resume,
 * and multi-waypoint cinematic flythrough tours across cosmological structures.
 */
export class CameraController {
  constructor(camera, controls, domElement) {
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;

    // Auto-Orbit settings
    this.autoOrbit = true;
    this.orbitSpeed = 0.45; // Radians per second multiplier
    this.smartResume = true;
    this.smartResumeDelay = 2.0; // Seconds to wait after user stops dragging
    this.lastUserInteractionTime = 0;
    this.isUserInteracting = false;

    // Cinematic Tour settings
    this.isTourActive = false;
    this.tourProgress = 0;
    this.tourDuration = 22.0; // Total tour duration in seconds
    this.tourLoop = false;

    // Waypoints for the guided tour across the Laniakea supercluster
    this.tourWaypoints = [
      {
        name: 'Laniakea Reference Overview',
        cameraPos: new THREE.Vector3(-6, 80, 138),
        lookAt: new THREE.Vector3(-8, 8, -6),
        fov: 48,
        durationWeight: 0.22
      },
      {
        name: 'Great Attractor & Centaurus Core',
        cameraPos: new THREE.Vector3(-75, 28, 38),
        lookAt: new THREE.Vector3(-38, 4, -4),
        fov: 45,
        durationWeight: 0.20
      },
      {
        name: 'Coma High-Latitude Fountain Loops',
        cameraPos: new THREE.Vector3(12, 68, 40),
        lookAt: new THREE.Vector3(5, 45, -25),
        fov: 50,
        durationWeight: 0.20
      },
      {
        name: 'Virgo Local Supercluster Core',
        cameraPos: new THREE.Vector3(-12, 22, 45),
        lookAt: new THREE.Vector3(-8, 3, 0),
        fov: 42,
        durationWeight: 0.18
      },
      {
        name: 'Dipole Repeller Outflow Basin',
        cameraPos: new THREE.Vector3(68, 32, 65),
        lookAt: new THREE.Vector3(32, -4, 18),
        fov: 48,
        durationWeight: 0.20
      }
    ];

    this.initInteractionListeners();
  }

  initInteractionListeners() {
    const onInteract = () => {
      this.isUserInteracting = true;
      this.lastUserInteractionTime = performance.now() / 1000.0;
      if (this.isTourActive) {
        this.stopTour();
      }
    };

    const onRelease = () => {
      this.isUserInteracting = false;
      this.lastUserInteractionTime = performance.now() / 1000.0;
    };

    this.domElement.addEventListener('pointerdown', onInteract);
    this.domElement.addEventListener('wheel', onInteract, { passive: true });
    window.addEventListener('pointerup', onRelease);
  }

  update(delta) {
    const now = performance.now() / 1000.0;

    // 1. If cinematic tour is active, interpolate along spline waypoints
    if (this.isTourActive) {
      this.updateTour(delta);
      return;
    }

    // 2. Check smart resume for auto-orbiting
    const timeSinceInteraction = now - this.lastUserInteractionTime;
    const canOrbit = this.autoOrbit && (!this.isUserInteracting) && (!this.smartResume || timeSinceInteraction > this.smartResumeDelay);

    if (canOrbit) {
      // Calculate smooth circular orbit around current controls target
      const target = this.controls.target;
      const cam = this.camera;

      // Relative spherical coordinate rotation
      const offset = new THREE.Vector3().subVectors(cam.position, target);
      const radius = Math.hypot(offset.x, offset.z);
      let angle = Math.atan2(offset.z, offset.x);

      angle += this.orbitSpeed * delta * 0.4;

      cam.position.x = target.x + radius * Math.cos(angle);
      cam.position.z = target.z + radius * Math.sin(angle);
      cam.lookAt(target);
    }
  }

  startTour(duration = 22.0) {
    this.isTourActive = true;
    this.tourProgress = 0;
    this.tourDuration = duration;
  }

  stopTour() {
    this.isTourActive = false;
  }

  toggleTour() {
    if (this.isTourActive) {
      this.stopTour();
    } else {
      this.startTour();
    }
    return this.isTourActive;
  }

  updateTour(delta) {
    this.tourProgress += delta / this.tourDuration;

    if (this.tourProgress >= 1.0) {
      if (this.tourLoop) {
        this.tourProgress = this.tourProgress % 1.0;
      } else {
        this.tourProgress = 1.0;
        this.stopTour();
        return;
      }
    }

    const n = this.tourWaypoints.length;
    const scaledT = this.tourProgress * n;
    const idx = Math.floor(scaledT) % n;
    const nextIdx = (idx + 1) % n;
    const localT = scaledT - Math.floor(scaledT);

    // Smooth cubic Hermite / smoothstep blending between waypoints
    const easeT = localT * localT * (3.0 - 2.0 * localT);

    const wpA = this.tourWaypoints[idx];
    const wpB = this.tourWaypoints[nextIdx];

    this.camera.position.lerpVectors(wpA.cameraPos, wpB.cameraPos, easeT);
    this.controls.target.lerpVectors(wpA.lookAt, wpB.lookAt, easeT);
    this.camera.fov = THREE.MathUtils.lerp(wpA.fov, wpB.fov, easeT);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.controls.target);
  }

  /**
   * Evaluates exact camera position for a 360-degree turntable loop
   * given a normalized progress t in [0, 1]
   */
  getTurntableStateAt(t, radius = 160, height = 75, target = new THREE.Vector3(-8, 8, -6)) {
    const angle = t * Math.PI * 2;
    const x = target.x + radius * Math.cos(angle);
    const z = target.z + radius * Math.sin(angle);
    const y = target.y + height + Math.sin(angle * 2) * 12.0;

    return {
      cameraPos: new THREE.Vector3(x, y, z),
      targetPos: target.clone()
    };
  }
}
