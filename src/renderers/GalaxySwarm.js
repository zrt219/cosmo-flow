import * as THREE from 'three';
import { CosmicField } from '../physics/CosmicField.js';

/**
 * GalaxySwarm renders thousands of galaxy particles clustered realistically
 * along the cosmic web filaments and concentrated within gravitational attractor basins
 * and major clusters (Virgo, Coma, Hydra, Antlia, Centaurus, and Great Attractor).
 *
 * Implements hierarchical power-law density distribution:
 * - Centaurus & GA Core: ~5,200 particles (r proportional to u^2.4 * R_virial)
 * - Virgo Core: ~3,400 particles tightly packed
 * - Hydra & Antlia: ~2,200 particles
 * - Coma Cluster: ~1,600 particles
 * - Filament bridge & diffuse volume: ~3,600 particles
 * Total: 16,000+ points.
 */
export class GalaxySwarm {
  constructor(cosmicField = null, options = {}) {
    // Support options passed as first argument if cosmicField is omitted
    if (cosmicField && !cosmicField.attractors && typeof cosmicField === 'object') {
      options = cosmicField;
      cosmicField = null;
    }

    this.cosmicField = cosmicField || new CosmicField();
    this.count = options.count !== undefined ? options.count : 18000;
    this.pointSize = options.pointSize || 1.65;
    this.opacity = options.opacity !== undefined ? options.opacity : 0.94;
    this.visible = options.visible !== undefined ? options.visible : true;

    this.group = new THREE.Group();
    this.group.name = 'GalaxySwarmGroup';
    this.group.visible = this.visible;

    this.initTexture();
    this.initPoints();
  }

  /**
   * Generates a circular glowing point sprite texture on a 64x64 canvas.
   * Includes safe fallback for headless / Node.js test execution.
   */
  initTexture() {
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext ? canvas.getContext('2d') : null;
        if (ctx && ctx.createRadialGradient) {
          const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
          grad.addColorStop(0.25, 'rgba(240, 248, 255, 0.95)');
          grad.addColorStop(0.55, 'rgba(180, 215, 255, 0.45)');
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 64, 64);

          this.particleTexture = new THREE.CanvasTexture(canvas);
          return;
        }
      } catch (e) {
        // Fallback to data texture below
      }
    }

    // Safe fallback for headless Node.js test environments
    const data = new Uint8Array(4);
    data[0] = 255; data[1] = 255; data[2] = 255; data[3] = 255;
    this.particleTexture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    this.particleTexture.needsUpdate = true;
  }

  initPoints() {
    if (this.pointsMesh) {
      this.group.remove(this.pointsMesh);
      if (this.pointsMesh.geometry) {
        this.pointsMesh.geometry.dispose();
      }
      if (this.pointsMesh.material) {
        this.pointsMesh.material.dispose();
      }
    }

    const totalCount = this.count;
    const positions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);

    // Astronomical anchor coordinates
    const mainAttractor = (this.cosmicField && this.cosmicField.attractors && this.cosmicField.attractors[0])
      ? this.cosmicField.attractors[0].position
      : new THREE.Vector3(-38, 2, -5);
    const centaurus = new THREE.Vector3(-34, 6, 2);
    const virgo = new THREE.Vector3(-8, 3, 0);
    const coma = new THREE.Vector3(5, 45, -25);
    const hydra = new THREE.Vector3(-24, 8, 18);
    const antlia = new THREE.Vector3(-18, 5, 22);
    const repeller = (this.cosmicField && this.cosmicField.attractors && this.cosmicField.attractors[2])
      ? this.cosmicField.attractors[2].position
      : new THREE.Vector3(32, -4, 18);
    const milkyWay = new THREE.Vector3(-10, -1, 4);

    // Hierarchical cluster particle quotas based on canonical 16,000 reference distribution:
    // - Centaurus & GA Core: ~5,200 particles (32.50%)
    // - Virgo Core: ~3,400 particles (21.25%)
    // - Hydra & Antlia: ~2,200 particles (13.75%)
    // - Coma Cluster: ~1,600 particles (10.00%)
    // - Filament bridge & diffuse volume: ~3,600 particles (22.50%)
    const countGA = Math.round(totalCount * (5200 / 16000));
    const countVirgo = Math.round(totalCount * (3400 / 16000));
    const countHydra = Math.round(totalCount * (2200 / 16000));
    const countComa = Math.round(totalCount * (1600 / 16000));
    const countFilament = totalCount - (countGA + countVirgo + countHydra + countComa);

    this.clusterCounts = {
      centaurusGA: countGA,
      virgo: countVirgo,
      hydraAntlia: countHydra,
      coma: countComa,
      diffuseFilament: countFilament
    };

    let idx = 0;

    // -------------------------------------------------------------
    // 1. Centaurus & Great Attractor Hub (~5,200 particles)
    // Power-law radial cusp: r = R_virial * u^2.4
    // -------------------------------------------------------------
    const nGAOnly = Math.round(countGA * 0.60);
    for (let i = 0; i < countGA; i++, idx++) {
      const isGA = i < nGAOnly;
      const center = isGA ? mainAttractor : centaurus;
      const rVirial = isGA ? 22.0 : 17.0;

      // Authentic power-law cusp profile (r proportional to u^2.4 * R_virial)
      const u = Math.random();
      const r = rVirial * Math.pow(u, 2.4);

      const theta = Math.random() * Math.PI * 2;
      const cosPhi = 2.0 * Math.random() - 1.0;
      const sinPhi = Math.sqrt(Math.max(0.0, 1.0 - cosPhi * cosPhi));

      // Flattening along supergalactic normal (Y)
      const yFlat = isGA ? 0.42 : 0.45;
      const x = center.x + r * sinPhi * Math.cos(theta);
      const y = center.y + r * cosPhi * yFlat;
      const z = center.z + r * sinPhi * Math.sin(theta);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Warm ivory/amber core color
      colors[idx * 3 + 0] = 1.0;
      colors[idx * 3 + 1] = 0.95 + Math.random() * 0.05;
      colors[idx * 3 + 2] = 0.88 + Math.random() * 0.12;
      sizes[idx] = (1.3 + Math.random() * 1.5) * this.pointSize;
    }

    // -------------------------------------------------------------
    // 2. Virgo Core (~3,400 particles tightly packed)
    // Power-law radial cusp: r = R_virial * u^2.2
    // -------------------------------------------------------------
    for (let i = 0; i < countVirgo; i++, idx++) {
      const rVirial = 14.5;
      const u = Math.random();
      const r = rVirial * Math.pow(u, 2.2);

      const theta = Math.random() * Math.PI * 2;
      const cosPhi = 2.0 * Math.random() - 1.0;
      const sinPhi = Math.sqrt(Math.max(0.0, 1.0 - cosPhi * cosPhi));

      const x = virgo.x + r * sinPhi * Math.cos(theta);
      const y = virgo.y + r * cosPhi * 0.48;
      const z = virgo.z + r * sinPhi * Math.sin(theta);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Crisp celestial blue-white
      colors[idx * 3 + 0] = 0.92 + Math.random() * 0.08;
      colors[idx * 3 + 1] = 0.96 + Math.random() * 0.04;
      colors[idx * 3 + 2] = 1.0;
      sizes[idx] = (1.2 + Math.random() * 1.4) * this.pointSize;
    }

    // -------------------------------------------------------------
    // 3. Hydra & Antlia Clusters (~2,200 particles)
    // Power-law radial cusp: r = R_virial * u^2.0
    // -------------------------------------------------------------
    const nHydra = Math.round(countHydra * 0.55);
    for (let i = 0; i < countHydra; i++, idx++) {
      const isHydra = i < nHydra;
      const center = isHydra ? hydra : antlia;
      const rVirial = isHydra ? 12.0 : 9.5;

      const u = Math.random();
      const r = rVirial * Math.pow(u, 2.0);

      const theta = Math.random() * Math.PI * 2;
      const cosPhi = 2.0 * Math.random() - 1.0;
      const sinPhi = Math.sqrt(Math.max(0.0, 1.0 - cosPhi * cosPhi));

      const x = center.x + r * sinPhi * Math.cos(theta);
      const y = center.y + r * cosPhi * 0.46;
      const z = center.z + r * sinPhi * Math.sin(theta);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Crisp white with subtle cyan-silver tint
      colors[idx * 3 + 0] = 0.94 + Math.random() * 0.06;
      colors[idx * 3 + 1] = 0.97 + Math.random() * 0.03;
      colors[idx * 3 + 2] = 1.0;
      sizes[idx] = (1.0 + Math.random() * 1.3) * this.pointSize;
    }

    // -------------------------------------------------------------
    // 4. Coma Cluster (~1,600 particles)
    // Power-law radial profile: r = R_virial * u^1.85
    // -------------------------------------------------------------
    for (let i = 0; i < countComa; i++, idx++) {
      const rVirial = 15.0;
      const u = Math.random();
      const r = rVirial * Math.pow(u, 1.85);

      const theta = Math.random() * Math.PI * 2;
      const cosPhi = 2.0 * Math.random() - 1.0;
      const sinPhi = Math.sqrt(Math.max(0.0, 1.0 - cosPhi * cosPhi));

      const x = coma.x + r * sinPhi * Math.cos(theta);
      const y = coma.y + r * cosPhi * 0.85;
      const z = coma.z + r * sinPhi * Math.sin(theta);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Warm starburst tint
      colors[idx * 3 + 0] = 1.0;
      colors[idx * 3 + 1] = 0.97 + Math.random() * 0.03;
      colors[idx * 3 + 2] = 0.91 + Math.random() * 0.09;
      sizes[idx] = (1.1 + Math.random() * 1.4) * this.pointSize;
    }

    // -------------------------------------------------------------
    // 5. Filament Bridges & Diffuse Volume (~3,600 particles)
    // -------------------------------------------------------------
    const nFilamentBridge = Math.round(countFilament * 0.67);
    const nDiffuse = countFilament - nFilamentBridge;

    // Cosmic web filament bridges
    for (let i = 0; i < nFilamentBridge; i++, idx++) {
      const t = Math.random();
      let bx, by, bz, spread;

      if (Math.random() < 0.70) {
        // Main flow channel: Repeller -> MW -> Antlia -> Centaurus/GA
        if (t < 0.4) {
          const u = t / 0.4;
          bx = THREE.MathUtils.lerp(repeller.x - 5, milkyWay.x, u);
          by = THREE.MathUtils.lerp(repeller.y, milkyWay.y, u);
          bz = THREE.MathUtils.lerp(repeller.z, milkyWay.z, u);
        } else if (t < 0.75) {
          const u = (t - 0.4) / 0.35;
          bx = THREE.MathUtils.lerp(milkyWay.x, antlia.x, u);
          by = THREE.MathUtils.lerp(milkyWay.y, antlia.y, u);
          bz = THREE.MathUtils.lerp(milkyWay.z, antlia.z, u);
        } else {
          const u = (t - 0.75) / 0.25;
          bx = THREE.MathUtils.lerp(antlia.x, mainAttractor.x, u);
          by = THREE.MathUtils.lerp(antlia.y, mainAttractor.y, u);
          bz = THREE.MathUtils.lerp(antlia.z, mainAttractor.z, u);
        }
        spread = 5.0 + Math.random() * 6.5;
      } else {
        // Vertical Coma fountain bridge
        bx = THREE.MathUtils.lerp(virgo.x, coma.x, t);
        by = THREE.MathUtils.lerp(virgo.y, coma.y, t);
        bz = THREE.MathUtils.lerp(virgo.z, coma.z, t);
        spread = 4.5 + Math.random() * 5.5;
      }

      const angle = Math.random() * Math.PI * 2;
      const x = bx + Math.cos(angle) * spread;
      const y = by + (Math.random() - 0.5) * spread * 0.7;
      const z = bz + Math.sin(angle) * spread;

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      colors[idx * 3 + 0] = 0.82 + Math.random() * 0.18;
      colors[idx * 3 + 1] = 0.88 + Math.random() * 0.12;
      colors[idx * 3 + 2] = 0.98 + Math.random() * 0.02;
      sizes[idx] = (0.7 + Math.random() * 0.9) * this.pointSize;
    }

    // Diffuse cosmic field galaxies across volume
    for (let i = 0; i < nDiffuse; i++, idx++) {
      const rad = 25.0 + Math.random() * 70.0;
      const theta = Math.random() * Math.PI * 2;
      let x = Math.cos(theta) * rad + (Math.random() - 0.5) * 20.0;
      let y = (Math.random() - 0.5) * 45.0;
      let z = Math.sin(theta) * rad + (Math.random() - 0.5) * 20.0;

      const distRepeller = Math.hypot(x - repeller.x, y - repeller.y, z - repeller.z);
      if (distRepeller < 18.0) {
        x += (x - repeller.x) * 1.5;
        z += (z - repeller.z) * 1.5;
      }

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      colors[idx * 3 + 0] = 0.78 + Math.random() * 0.20;
      colors[idx * 3 + 1] = 0.84 + Math.random() * 0.16;
      colors[idx * 3 + 2] = 0.95 + Math.random() * 0.05;
      sizes[idx] = (0.6 + Math.random() * 0.8) * this.pointSize;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const vertexShader = `
      attribute float size;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (270.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec3 vColor;

      void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        if (texColor.a < 0.05) discard;
        gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * uOpacity);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: this.particleTexture },
        uOpacity: { value: this.opacity }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    this.pointsMesh = new THREE.Points(geometry, this.material);
    this.group.add(this.pointsMesh);
  }

  setCount(newCount) {
    this.count = Math.max(100, Math.round(newCount));
    this.initPoints();
  }

  setPointSize(val) {
    this.pointSize = Math.max(0.1, val);
    this.initPoints();
  }

  setOpacity(val) {
    this.opacity = THREE.MathUtils.clamp(val, 0.0, 1.0);
    if (this.material && this.material.uniforms && this.material.uniforms.uOpacity) {
      this.material.uniforms.uOpacity.value = this.opacity;
    }
  }

  setVisible(val) {
    this.visible = !!val;
    this.group.visible = this.visible;
  }

  update(elapsed) {
    if (this.material && this.material.uniforms && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsed;
    }
  }

  getClusterCounts() {
    return { ...this.clusterCounts };
  }

  dispose() {
    if (this.pointsMesh) {
      this.group.remove(this.pointsMesh);
      if (this.pointsMesh.geometry) {
        this.pointsMesh.geometry.dispose();
      }
      if (this.pointsMesh.material) {
        this.pointsMesh.material.dispose();
      }
      this.pointsMesh = null;
    }
    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}

export default GalaxySwarm;
