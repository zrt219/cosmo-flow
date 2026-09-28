import * as THREE from 'three';

/**
 * SlicePlaneMesh creates a 3D cutting plane with custom GPU fragment shader
 * evaluating the cosmic velocity potential / divergence field in real time.
 */
export class SlicePlaneMesh {
  constructor(cosmicField, options = {}) {
    this.cosmicField = cosmicField;
    this.width = options.width || 180;
    this.height = options.height || 180;
    this.sliceY = options.sliceY !== undefined ? options.sliceY : 0.0;

    this.group = new THREE.Group();
    this.group.name = 'SlicePlaneGroup';

    this.initMaterial();
    this.initMesh();
    this.initGridBorder();
  }

  initMaterial() {
    const shaderData = this.cosmicField.getShaderData();

    this.uniforms = {
      uAttractorPositions: { value: shaderData.uAttractorPositions },
      uAttractorMasses: { value: shaderData.uAttractorMasses },
      uAttractorSoftenings: { value: shaderData.uAttractorSoftenings },
      uAttractorCount: { value: shaderData.uAttractorCount },
      uBackgroundDrift: { value: new THREE.Vector3(...shaderData.uBackgroundDrift) },
      uOpacity: { value: 0.88 },
      uMinPot: { value: -140.0 },
      uMaxPot: { value: 80.0 },
      uContourLines: { value: 1.0 },
      uBrightness: { value: 1.05 },
      uTime: { value: 0.0 }
    };

    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform vec3 uBackgroundDrift;
      uniform float uAttractorPositions[18];
      uniform float uAttractorMasses[6];
      uniform float uAttractorSoftenings[6];
      uniform int uAttractorCount;
      uniform float uOpacity;
      uniform float uMinPot;
      uniform float uMaxPot;
      uniform float uContourLines;
      uniform float uBrightness;
      uniform float uTime;

      varying vec3 vWorldPosition;
      varying vec2 vUv;

      // Color mapping matching the astrophysical Laniakea / Dipole Repeller palette:
      // Void / Repeller: Deep Purple / Navy -> Blue -> Cyan
      // Medium / Field: Vibrant Green -> Yellow-Green
      // Overdensity / Attractor: Warm Gold -> Bright Orange -> Fiery Crimson
      vec3 sampleCosmicColormap(float t) {
        t = clamp(t, 0.0, 1.0);

        vec3 c0 = vec3(0.08, 0.0, 0.22);    // Deep purple / dark repeller core
        vec3 c1 = vec3(0.02, 0.18, 0.70);   // Deep Blue
        vec3 c2 = vec3(0.0, 0.65, 0.85);    // Bright Cyan
        vec3 c3 = vec3(0.12, 0.75, 0.16);   // Lush Emerald Green
        vec3 c4 = vec3(0.78, 0.85, 0.10);   // Lime / Yellow-Green
        vec3 c5 = vec3(0.96, 0.58, 0.02);   // Amber / Orange
        vec3 c6 = vec3(0.85, 0.12, 0.05);   // Crimson Red
        vec3 c7 = vec3(0.55, 0.02, 0.08);   // Dark Red Peak

        if (t < 0.14) {
          return mix(c0, c1, t / 0.14);
        } else if (t < 0.28) {
          return mix(c1, c2, (t - 0.14) / 0.14);
        } else if (t < 0.44) {
          return mix(c2, c3, (t - 0.28) / 0.16);
        } else if (t < 0.62) {
          return mix(c3, c4, (t - 0.44) / 0.18);
        } else if (t < 0.78) {
          return mix(c4, c5, (t - 0.62) / 0.16);
        } else if (t < 0.92) {
          return mix(c5, c6, (t - 0.78) / 0.14);
        } else {
          return mix(c6, c7, (t - 0.92) / 0.08);
        }
      }

      void main() {
        vec3 p = vWorldPosition;
        float phi = 0.0;

        for (int i = 0; i < 6; i++) {
          if (i >= uAttractorCount) break;
          vec3 aPos = vec3(
            uAttractorPositions[i * 3 + 0],
            uAttractorPositions[i * 3 + 1],
            uAttractorPositions[i * 3 + 2]
          );
          float mass = uAttractorMasses[i];
          float softening = uAttractorSoftenings[i];

          vec3 d = p - aPos;
          float dist = sqrt(dot(d, d) + softening * softening);
          phi -= mass / dist;
        }

        phi += (p.x * uBackgroundDrift.x + p.y * uBackgroundDrift.y + p.z * uBackgroundDrift.z) * 15.0;

        // Invert normalization so that deep negative potential (attractor) maps to t ~ 1.0 (red/orange)
        // and high positive potential (repeller) maps to t ~ 0.0 (blue/purple)
        float t = (phi - uMinPot) / (uMaxPot - uMinPot);
        t = 1.0 - clamp(t, 0.0, 1.0);

        vec3 color = sampleCosmicColormap(t) * uBrightness;

        // Subtle scientific contour lines
        if (uContourLines > 0.5) {
          float contour = fract(t * 18.0);
          float line = smoothstep(0.0, 0.04, contour) - smoothstep(0.04, 0.08, contour);
          color += vec3(line * 0.12);
        }

        // Vignette falloff near boundaries of the plane
        vec2 edgeDist = abs(vUv - 0.5) * 2.0;
        float edgeAlpha = 1.0 - smoothstep(0.92, 1.0, max(edgeDist.x, edgeDist.y));

        // Soft radial glow wave from Great Attractor
        vec3 gaWorldPos = vec3(-38.0, 0.0, -5.0);
        float distToGA = distance(p.xz, gaWorldPos.xz);
        float wave = sin(distToGA * 0.15 - uTime * 0.8) * 0.5 + 0.5;
        float waveMask = smoothstep(60.0, 10.0, distToGA);
        color += vec3(0.08, 0.04, 0.0) * wave * waveMask;

        gl_FragColor = vec4(color, uOpacity * edgeAlpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  initMesh() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height, 64, 64);
    this.planeMesh = new THREE.Mesh(geometry, this.material);
    // Rotate to lie horizontally (XZ plane)
    this.planeMesh.rotation.x = -Math.PI / 2;
    this.planeMesh.position.y = this.sliceY;
    this.group.add(this.planeMesh);
  }

  initGridBorder() {
    // Elegant boundary frame matching scientific observatory displays
    const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(this.width, this.height));
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x44aa88,
      transparent: true,
      opacity: 0.7
    });
    this.border = new THREE.LineSegments(borderGeo, borderMat);
    this.border.rotation.x = -Math.PI / 2;
    this.border.position.y = this.sliceY + 0.05;
    this.group.add(this.border);
  }

  setSliceY(y) {
    this.sliceY = y;
    this.planeMesh.position.y = y;
    this.border.position.y = y + 0.05;
  }

  setOpacity(val) {
    this.uniforms.uOpacity.value = val;
  }

  updateUniforms() {
    const shaderData = this.cosmicField.getShaderData();
    this.uniforms.uAttractorPositions.value = shaderData.uAttractorPositions;
    this.uniforms.uAttractorMasses.value = shaderData.uAttractorMasses;
    this.uniforms.uAttractorSoftenings.value = shaderData.uAttractorSoftenings;
    this.uniforms.uAttractorCount.value = shaderData.uAttractorCount;
  }

  update(elapsed) {
    this.updateUniforms();
    if (typeof elapsed === 'number') {
      this.uniforms.uTime.value = elapsed;
    }
  }
}
