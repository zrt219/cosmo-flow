import * as THREE from 'three';

/**
 * Authentic 8-stop scientific color ramp for Laniakea cosmic velocity streamlines
 * matching Tully et al. (Nature 2014):
 * 0.00: Deep royal blue (outflow origin near MW/Antlia)
 * 0.14: Azure blue
 * 0.28: Electric cyan outflow channel
 * 0.42: Ice white transition
 * 0.55: Crisp silvery-white filaments
 * 0.70: Warm radiant gold
 * 0.85: Deep glowing amber
 * 1.00: Crimson red attractor core convergence at GA/Centaurus
 */
const SCIENTIFIC_COLOR_STOPS = [
  { t: 0.00, color: new THREE.Color(0x0033cc) },
  { t: 0.14, color: new THREE.Color(0x0080ff) },
  { t: 0.28, color: new THREE.Color(0x00d4ff) },
  { t: 0.42, color: new THREE.Color(0xcce8ff) },
  { t: 0.55, color: new THREE.Color(0xffffff) },
  { t: 0.70, color: new THREE.Color(0xffc233) },
  { t: 0.85, color: new THREE.Color(0xff6600) },
  { t: 1.00, color: new THREE.Color(0xdc1400) }
];

/**
 * Color ramp for vertical Coma fountain loops:
 * Arching upwards in bright silvery-white and capping with warm gold at the Coma apex
 */
const COMA_COLOR_STOPS = [
  { t: 0.00, color: new THREE.Color(0xdceeff) }, // Pale silvery blue-white base
  { t: 0.20, color: new THREE.Color(0xf4f9ff) }, // Silvery-white ascent
  { t: 0.65, color: new THREE.Color(0xffffff) }, // Brilliant silvery-white arch
  { t: 0.85, color: new THREE.Color(0xffdd66) }, // Warm luminous gold transition
  { t: 1.00, color: new THREE.Color(0xffc233) }  // Warm radiant gold cap at Coma apex
];

function sampleRamp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.t && t <= s2.t) {
      const alpha = (t - s1.t) / (s2.t - s1.t);
      return new THREE.Color().lerpColors(s1.color, s2.color, alpha);
    }
  }
  return stops[stops.length - 1].color.clone();
}

/**
 * StreamlineRenderer generates and renders 3D cosmic velocity streamlines,
 * high-latitude Coma fountain loops, and directional arrowhead cones
 * faithfully reproducing Tully et al. (Nature 2014) / Laniakea cosmic flows.
 */
export class StreamlineRenderer {
  constructor(cosmicField, options = {}) {
    this.cosmicField = cosmicField;
    this.streamlineCount = options.streamlineCount || 320;
    this.arrowInterval = options.arrowInterval || 14.0;
    this.arrowScale = options.arrowScale || 1.15;
    this.showArrows = options.showArrows !== undefined ? options.showArrows : true;
    this.lineOpacity = options.lineOpacity !== undefined ? options.lineOpacity : 0.82;
    this.flowSpeed = options.flowSpeed !== undefined ? options.flowSpeed : 0.85;
    this.isAnimated = options.isAnimated !== undefined ? options.isAnimated : true;
    this.showComaLoops = options.showComaLoops !== undefined ? options.showComaLoops : true;

    this.group = new THREE.Group();
    this.group.name = 'StreamlinesGroup';

    this.streamlineData = [];
    this.arrowData = [];

    this.init();
  }

  init() {
    this.generateAllStreamlines();
    this.buildLineMesh();
    this.buildArrowMesh();
  }

  /**
   * Generates standard seeds across cosmological regions
   * Reserving ~20% of seeds for the northern Coma inflow launch corridor
   */
  generateSeeds() {
    const seeds = [];
    const repellerPos = this.cosmicField.attractors.find(a => a.type === 'repeller')?.position || new THREE.Vector3(32, -4, 18);

    // 1. Northern Coma inflow launch corridor (~20% of seeds: X in [2, 22], Y in [-2, 10], Z in [-32, -10])
    if (this.showComaLoops) {
      const comaSeedCount = Math.floor(this.streamlineCount * 0.20);
      for (let i = 0; i < comaSeedCount; i++) {
        const seed = new THREE.Vector3(
          THREE.MathUtils.lerp(2, 22, Math.random()),
          THREE.MathUtils.lerp(-2, 10, Math.random()),
          THREE.MathUtils.lerp(-32, -10, Math.random())
        );
        seeds.push(seed);
      }
    }

    // 2. Outflow seeds from Dipole Repeller & Foreground Blue Basin (~40% of seeds)
    const repellerSeedCount = Math.floor(this.streamlineCount * (this.showComaLoops ? 0.40 : 0.48));
    for (let i = 0; i < repellerSeedCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 6.0 + Math.random() * 28.0;

      const seed = new THREE.Vector3(
        repellerPos.x + r * Math.sin(phi) * Math.cos(theta),
        repellerPos.y + (r * 0.35) * Math.cos(phi),
        repellerPos.z + r * Math.sin(phi) * Math.sin(theta)
      );
      seeds.push(seed);
    }

    // 3. Seeds distributed along the Milky Way / Antlia / Virgo bridge (~22% of seeds)
    const bridgeSeedCount = Math.floor(this.streamlineCount * (this.showComaLoops ? 0.22 : 0.28));
    for (let i = 0; i < bridgeSeedCount; i++) {
      const t = Math.random();
      const seed = new THREE.Vector3(
        THREE.MathUtils.lerp(18, -25, t) + (Math.random() - 0.5) * 18.0,
        (Math.random() - 0.5) * 14.0,
        THREE.MathUtils.lerp(35, 5, t) + (Math.random() - 0.5) * 18.0
      );
      seeds.push(seed);
    }

    // 4. Wide cosmic web filament seeds (remaining to reach exact streamlineCount)
    const remaining = this.streamlineCount - seeds.length;
    for (let i = 0; i < remaining; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 28.0 + Math.random() * 65.0;
      const y = (Math.random() - 0.5) * 32.0;

      const seed = new THREE.Vector3(
        Math.cos(angle) * radius - 5,
        y,
        Math.sin(angle) * radius - 5
      );
      seeds.push(seed);
    }

    return seeds;
  }

  generateComaLoops() {
    // Coma vertical fountain loops are now fully integrated via genuine RK4 physics
    // from the northern Coma inflow launch corridor seeds in generateSeeds().
  }

  generateAllStreamlines() {
    this.streamlineData = [];

    // Trace physics RK4 streamlines
    const seeds = this.generateSeeds();
    for (let i = 0; i < seeds.length; i++) {
      const result = this.cosmicField.traceStreamline(seeds[i], 190, 0.92);
      if (result.points.length >= 8 && result.totalLength > 10.0) {
        const arcLengths = [0];
        let cum = 0;
        let maxY = -Infinity;
        for (let j = 1; j < result.points.length; j++) {
          cum += result.points[j - 1].distanceTo(result.points[j]);
          arcLengths.push(cum);
          if (result.points[j].y > maxY) maxY = result.points[j].y;
        }

        const isComaLoop = result.destination === 'coma-cluster' || maxY > 35.0;

        this.streamlineData.push({
          points: result.points,
          totalLength: result.totalLength,
          arcLengths: arcLengths,
          isComaLoop: isComaLoop,
          destination: result.destination
        });
      }
    }
  }

  buildLineMesh() {
    if (this.lineSegmentsMesh) {
      this.group.remove(this.lineSegmentsMesh);
      this.lineSegmentsMesh.geometry.dispose();
    }

    const positions = [];
    const colors = [];

    for (let i = 0; i < this.streamlineData.length; i++) {
      const { points, totalLength, arcLengths, isComaLoop } = this.streamlineData[i];
      const count = points.length;
      const stops = isComaLoop ? COMA_COLOR_STOPS : SCIENTIFIC_COLOR_STOPS;

      for (let j = 0; j < count - 1; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];

        positions.push(p1.x, p1.y, p1.z);
        positions.push(p2.x, p2.y, p2.z);

        const t1 = totalLength > 0 ? arcLengths[j] / totalLength : 0;
        const t2 = totalLength > 0 ? arcLengths[j + 1] / totalLength : 1;

        const col1 = sampleRamp(stops, t1);
        const col2 = sampleRamp(stops, t2);

        colors.push(col1.r, col1.g, col1.b);
        colors.push(col2.r, col2.g, col2.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.lineMaterial = new THREE.LineDashedMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.lineOpacity,
      blending: THREE.NormalBlending,
      linewidth: 1,
      dashSize: 3.0,
      gapSize: 1.5,
      scale: 1.0
    });

    this.lineSegmentsMesh = new THREE.LineSegments(geometry, this.lineMaterial);
    this.lineSegmentsMesh.computeLineDistances();
    this.group.add(this.lineSegmentsMesh);
  }

  computePointColor(p, gaPos, target) {
    const distToGA = p.distanceTo(gaPos);
    const norm = Math.min(1.0, distToGA / 70.0);
    const c = sampleRamp(SCIENTIFIC_COLOR_STOPS, 1.0 - norm);
    target.copy(c);
  }

  sampleColor(t, isComa = false) {
    return sampleRamp(isComa ? COMA_COLOR_STOPS : SCIENTIFIC_COLOR_STOPS, t);
  }

  buildArrowMesh() {
    if (this.arrowMesh) {
      this.group.remove(this.arrowMesh);
      this.arrowMesh.geometry.dispose();
      this.arrowMesh.material.dispose();
    }

    // Cone geometry: pointed along +Y in Three.js
    const coneRadius = 0.58 * this.arrowScale;
    const coneHeight = 1.95 * this.arrowScale;
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
    coneGeo.translate(0, 0, 0);

    // Dark metallic cones with sharp highlights matching reference photo
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x1e242a,
      roughness: 0.28,
      metalness: 0.85,
      emissive: 0x0a0e14,
      flatShading: true
    });

    this.arrowData = [];
    const tangent = new THREE.Vector3();

    for (let sIdx = 0; sIdx < this.streamlineData.length; sIdx++) {
      const { points, totalLength, arcLengths } = this.streamlineData[sIdx];
      if (totalLength < 12.0) continue;

      const numArrows = Math.max(1, Math.floor(totalLength / this.arrowInterval));
      const spacing = totalLength / (numArrows + 1);

      for (let a = 1; a <= numArrows; a++) {
        const targetDist = a * spacing + (Math.random() - 0.5) * 1.5;

        let segIdx = 0;
        for (let k = 0; k < arcLengths.length - 1; k++) {
          if (arcLengths[k + 1] >= targetDist) {
            segIdx = k;
            break;
          }
        }

        const pA = points[segIdx];
        const pB = points[segIdx + 1];
        if (!pA || !pB) continue;

        const segLen = arcLengths[segIdx + 1] - arcLengths[segIdx];
        const alpha = segLen > 0.0001 ? (targetDist - arcLengths[segIdx]) / segLen : 0;
        const pos = new THREE.Vector3().lerpVectors(pA, pB, alpha);

        tangent.subVectors(pB, pA).normalize();
        if (tangent.lengthSq() < 0.001) tangent.set(0, 1, 0);

        this.arrowData.push({
          streamlineIndex: sIdx,
          normalizedOffset: targetDist / totalLength,
          basePos: pos.clone(),
          tangent: tangent.clone()
        });
      }
    }

    this.arrowCount = this.arrowData.length;
    this.arrowMesh = new THREE.InstancedMesh(coneGeo, coneMat, this.arrowCount);
    this.arrowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.updateArrowTransforms(0);
    this.arrowMesh.visible = this.showArrows;
    this.group.add(this.arrowMesh);
  }

  updateArrowTransforms(timeOffset = 0) {
    if (!this.arrowMesh || !this.arrowData) return;

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const tangent = new THREE.Vector3();

    for (let i = 0; i < this.arrowData.length; i++) {
      const item = this.arrowData[i];
      const sData = this.streamlineData[item.streamlineIndex];
      if (!sData) continue;

      if (this.isAnimated) {
        let norm = (item.normalizedOffset + timeOffset * 0.035 * this.flowSpeed) % 1.0;
        const curDist = norm * sData.totalLength;

        let segIdx = 0;
        for (let k = 0; k < sData.arcLengths.length - 1; k++) {
          if (sData.arcLengths[k + 1] >= curDist) {
            segIdx = k;
            break;
          }
        }

        const pA = sData.points[segIdx];
        const pB = sData.points[Math.min(segIdx + 1, sData.points.length - 1)];

        if (pA && pB) {
          const segLen = sData.arcLengths[segIdx + 1] - sData.arcLengths[segIdx];
          const alpha = segLen > 0.0001 ? (curDist - sData.arcLengths[segIdx]) / segLen : 0;
          pos.lerpVectors(pA, pB, alpha);
          tangent.subVectors(pB, pA).normalize();
        } else {
          pos.copy(item.basePos);
          tangent.copy(item.tangent);
        }
      } else {
        pos.copy(item.basePos);
        tangent.copy(item.tangent);
      }

      quat.setFromUnitVectors(up, tangent);

      dummy.position.copy(pos);
      dummy.quaternion.copy(quat);
      dummy.scale.set(this.arrowScale, this.arrowScale, this.arrowScale);
      dummy.updateMatrix();

      this.arrowMesh.setMatrixAt(i, dummy.matrix);
    }

    this.arrowMesh.instanceMatrix.needsUpdate = true;
  }

  animate(delta, elapsed) {
    if (this.isAnimated && this.showArrows) {
      this.updateArrowTransforms(elapsed);
    }

    // Animate dash offset for flowing streamline effect
    if (this.isAnimated && this.lineMaterial && this.lineMaterial.dashOffset !== undefined) {
      this.lineMaterial.dashOffset = -(elapsed * this.flowSpeed * 2.0);
    }
  }

  setStreamlineCount(count) {
    this.streamlineCount = count;
    this.rebuild();
  }

  setArrowScale(scale) {
    this.arrowScale = scale;
    this.buildArrowMesh();
  }

  setLineOpacity(val) {
    this.lineOpacity = val;
    if (this.lineMaterial) {
      this.lineMaterial.opacity = val;
    }
  }

  setShowArrows(val) {
    this.showArrows = val;
    if (this.arrowMesh) {
      this.arrowMesh.visible = val;
    }
  }

  setShowComaLoops(val) {
    this.showComaLoops = val;
    this.rebuild();
  }

  rebuild() {
    this.generateAllStreamlines();
    this.buildLineMesh();
    this.buildArrowMesh();
  }
}
