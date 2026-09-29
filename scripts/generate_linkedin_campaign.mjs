import fs from 'fs';
import path from 'path';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const outputDir = path.resolve('docs/linkedin_campaign');
const assetsDir = path.resolve('campaign_assets');
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

console.log('🚀 Generating 5 Square (1:1) LinkedIn Ad Campaign GIFs with Authentic 3D App Colors & Lighting...');

/**
 * 3D Vector Math Helpers
 */
class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  normalize() {
    const l = this.length();
    if (l > 0.0001) { this.x /= l; this.y /= l; this.z /= l; }
    return this;
  }
}

// Cosmological Structures matching src/physics/CosmicField.js
const attractors = [
  { id: 'ga', name: 'The Great Attractor', pos: new Vec3(-38, 2, -5), mass: 3400, softening: 12 },
  { id: 'centaurus', name: 'Centaurus', pos: new Vec3(-34, 6, 2), mass: 2200, softening: 16 },
  { id: 'repeller', name: 'Dipole Repeller', pos: new Vec3(32, -4, 18), mass: -2600, softening: 14 },
  { id: 'virgo', name: 'Virgo', pos: new Vec3(-8, 3, 0), mass: 1100, softening: 10 }
];

const comaCenter = new Vec3(5, 45, -25);
const hydraPos = new Vec3(-24, 8, 18);
const antliaPos = new Vec3(-18, 5, 22);
const milkyWayPos = new Vec3(-10, -1, 4);

function getVelocity(p) {
  const v = new Vec3(0, 0, 0);
  for (let a of attractors) {
    const dx = p.x - a.pos.x;
    const dy = p.y - a.pos.y;
    const dz = p.z - a.pos.z;
    const distSq = dx * dx + dy * dy + dz * dz + a.softening * a.softening;
    const dist = Math.sqrt(distSq);
    const force = -a.mass / (dist * dist * dist);
    v.x += force * dx;
    v.y += force * dy;
    v.z += force * dz;
  }
  // Cosmological Hubble flow and background drift
  v.x += -0.08;
  v.z += -0.04;
  return v;
}

function traceStreamline(startPos, steps = 150, dt = 0.95) {
  const pts = [startPos.clone()];
  let cur = startPos.clone();
  for (let s = 0; s < steps; s++) {
    const v1 = getVelocity(cur);
    const p2 = new Vec3(cur.x + v1.x * dt * 0.5, cur.y + v1.y * dt * 0.5, cur.z + v1.z * dt * 0.5);
    const v2 = getVelocity(p2);
    const p3 = new Vec3(cur.x + v2.x * dt * 0.5, cur.y + v2.y * dt * 0.5, cur.z + v2.z * dt * 0.5);
    const v3 = getVelocity(p3);
    const p4 = new Vec3(cur.x + v3.x * dt, cur.y + v3.y * dt, cur.z + v3.z * dt);
    const v4 = getVelocity(p4);

    const next = new Vec3(
      cur.x + (dt / 6.0) * (v1.x + 2 * v2.x + 2 * v3.x + v4.x),
      cur.y + (dt / 6.0) * (v1.y + 2 * v2.y + 2 * v3.y + v4.y),
      cur.z + (dt / 6.0) * (v1.z + 2 * v2.z + 2 * v3.z + v4.z)
    );

    if (Math.abs(next.x) > 115 || Math.abs(next.y) > 80 || Math.abs(next.z) > 115) break;
    const dGA = Math.hypot(next.x - attractors[0].pos.x, next.y - attractors[0].pos.y, next.z - attractors[0].pos.z);
    if (dGA < 2.5) {
      pts.push(next);
      break;
    }
    pts.push(next);
    cur = next;
  }
  return pts;
}

// Generate Streamlines
const streamlines = [];
const repellerPos = attractors[2].pos;

for (let i = 0; i < 140; i++) {
  const theta = (i / 140) * Math.PI * 2;
  const rad = 7.5 + (i % 6) * 4.2;
  const start = new Vec3(
    repellerPos.x + rad * Math.cos(theta),
    repellerPos.y + ((i % 7) - 3) * 2.4,
    repellerPos.z + rad * Math.sin(theta)
  );
  const pts = traceStreamline(start, 160, 0.92);
  if (pts.length > 12) streamlines.push({ type: 'standard', pts });
}

// Northern Coma Fountain Loops
for (let i = 0; i < 35; i++) {
  const start = new Vec3(
    10 + (Math.random() - 0.5) * 16,
    -1 + Math.random() * 8,
    -20 + (Math.random() - 0.5) * 16
  );
  const pts = traceStreamline(start, 140, 0.88);
  if (pts.length > 10) streamlines.push({ type: 'coma', pts });
}

// Galaxy Clusters matching real app MeshPhysicalMaterial parameters
const clusterNodes = [
  { name: 'The Great Attractor', pos: attractors[0].pos, r: 4.5, isSpecial: false },
  { name: 'Centaurus', pos: attractors[1].pos, r: 3.8, isSpecial: false },
  { name: 'Virgo', pos: attractors[3].pos, r: 3.5, isSpecial: false },
  { name: 'Coma', pos: comaCenter, r: 4.0, isSpecial: false },
  { name: 'Hydra', pos: hydraPos, r: 3.0, isSpecial: false },
  { name: 'Antlia', pos: antliaPos, r: 2.6, isSpecial: false },
  { name: 'Abell 3574', pos: new Vec3(-28, 14, 12), r: 2.3, isSpecial: false },
  { name: 'Abell 3565', pos: new Vec3(-32, 10, 16), r: 2.2, isSpecial: false },
  { name: 'NGC 5016', pos: new Vec3(-16, 22, -12), r: 2.2, isSpecial: false },
  { name: 'Foreground SE', pos: new Vec3(25, -6, 55), r: 3.0, isSpecial: false },
  { name: 'Dipole Repeller', pos: attractors[2].pos, r: 3.6, isSpecial: true, isRepeller: true }
];

// Galaxy Swarm Particles (18,000 equivalent distribution)
const galaxyPoints = [];
for (let i = 0; i < 4500; i++) {
  const cluster = clusterNodes[i % (clusterNodes.length - 1)]; // skip repeller
  const u = Math.random();
  const r = cluster.r * 2.2 * Math.pow(u, 2.0);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2.0 * Math.random() - 1.0);
  galaxyPoints.push({
    x: cluster.pos.x + r * Math.sin(phi) * Math.cos(theta),
    y: cluster.pos.y + r * Math.cos(phi) * 0.45,
    z: cluster.pos.z + r * Math.sin(phi) * Math.sin(theta),
    brightness: 0.65 + Math.random() * 0.35,
    hue: Math.random() < 0.2 ? 'blue' : (Math.random() < 0.1 ? 'gold' : 'white')
  });
}

// Background Distant Stars (CosmicSkybox)
const bgStars = [];
for (let i = 0; i < 600; i++) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = 240.0;
  bgStars.push({
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
    lum: 0.35 + Math.random() * 0.65
  });
}

/**
 * Authentic 8-stop scientific color ramp for Laniakea cosmic velocity streamlines
 * matching Tully et al. (Nature 2014) & StreamlineRenderer.js:
 * 0.00: Deep royal blue (0x0033cc / rgb(0, 51, 204))
 * 0.14: Azure blue (0x0080ff / rgb(0, 128, 255))
 * 0.28: Electric cyan (0x00d4ff / rgb(0, 212, 255))
 * 0.42: Ice white (0xcce8ff / rgb(204, 232, 255))
 * 0.55: Crisp silvery-white filaments (0xffffff / rgb(255, 255, 255))
 * 0.70: Warm radiant gold (0xffc233 / rgb(255, 194, 51))
 * 0.85: Deep glowing amber (0xff6600 / rgb(255, 102, 0))
 * 1.00: Crimson red attractor core (0xdc1400 / rgb(220, 20, 0))
 */
function sampleScientificStreamlineColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    { t: 0.00, c: [0, 51, 204] },
    { t: 0.14, c: [0, 128, 255] },
    { t: 0.28, c: [0, 212, 255] },
    { t: 0.42, c: [204, 232, 255] },
    { t: 0.55, c: [255, 255, 255] },
    { t: 0.70, c: [255, 194, 51] },
    { t: 0.85, c: [255, 102, 0] },
    { t: 1.00, c: [220, 20, 0] }
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.t && t <= s2.t) {
      const alpha = (t - s1.t) / (s2.t - s1.t);
      return [
        Math.round(s1.c[0] + (s2.c[0] - s1.c[0]) * alpha),
        Math.round(s1.c[1] + (s2.c[1] - s1.c[1]) * alpha),
        Math.round(s1.c[2] + (s2.c[2] - s1.c[2]) * alpha)
      ];
    }
  }
  return stops[stops.length - 1].c;
}

/**
 * Authentic Northern Coma Fountain Color Ramp matching StreamlineRenderer.js:
 * 0.00: Pale silvery blue-white (0xdceeff / rgb(220, 238, 255))
 * 0.20: Silvery-white ascent (0xf4f9ff / rgb(244, 249, 255))
 * 0.65: Brilliant silvery-white arch (0xffffff / rgb(255, 255, 255))
 * 0.85: Warm luminous gold (0xffdd66 / rgb(255, 221, 102))
 * 1.00: Radiant gold cap (0xffc233 / rgb(255, 194, 51))
 */
function sampleComaStreamlineColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    { t: 0.00, c: [220, 238, 255] },
    { t: 0.20, c: [244, 249, 255] },
    { t: 0.65, c: [255, 255, 255] },
    { t: 0.85, c: [255, 221, 102] },
    { t: 1.00, c: [255, 194, 51] }
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.t && t <= s2.t) {
      const alpha = (t - s1.t) / (s2.t - s1.t);
      return [
        Math.round(s1.c[0] + (s2.c[0] - s1.c[0]) * alpha),
        Math.round(s1.c[1] + (s2.c[1] - s1.c[1]) * alpha),
        Math.round(s1.c[2] + (s2.c[2] - s1.c[2]) * alpha)
      ];
    }
  }
  return stops[stops.length - 1].c;
}

/**
 * Authentic GLSL Cosmic Colormap from SlicePlaneMesh.js:
 * Void / Repeller: Deep purple -> Deep Blue -> Bright Cyan
 * Medium / Field: Lush Emerald Green -> Lime / Yellow-Green
 * Overdensity / Attractor: Amber / Orange -> Crimson Red -> Dark Red Peak
 */
function sampleCosmicColormap(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    { t: 0.00, c: [20, 0, 56] },       // c0: Deep purple (0.08, 0.0, 0.22)
    { t: 0.14, c: [5, 46, 178] },      // c1: Deep Blue (0.02, 0.18, 0.70)
    { t: 0.28, c: [0, 166, 217] },     // c2: Bright Cyan (0.0, 0.65, 0.85)
    { t: 0.44, c: [31, 191, 41] },     // c3: Lush Emerald Green (0.12, 0.75, 0.16)
    { t: 0.62, c: [199, 217, 26] },    // c4: Lime / Yellow-Green (0.78, 0.85, 0.10)
    { t: 0.78, c: [245, 148, 5] },     // c5: Amber / Orange (0.96, 0.58, 0.02)
    { t: 0.92, c: [217, 31, 13] },     // c6: Crimson Red (0.85, 0.12, 0.05)
    { t: 1.00, c: [140, 5, 20] }       // c7: Dark Red Peak (0.55, 0.02, 0.08)
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.t && t <= s2.t) {
      const alpha = (t - s1.t) / (s2.t - s1.t);
      return [
        Math.round(s1.c[0] + (s2.c[0] - s1.c[0]) * alpha),
        Math.round(s1.c[1] + (s2.c[1] - s1.c[1]) * alpha),
        Math.round(s1.c[2] + (s2.c[2] - s1.c[2]) * alpha)
      ];
    }
  }
  return stops[stops.length - 1].c;
}

/**
 * Software 3D Camera & Rasterizer with Real Shading (Square 1:1 Aspect Ratio)
 */
class SoftwareCanvas {
  constructor(width = 600, height = 600) {
    this.width = width;
    this.height = height;
    this.buffer = new Uint8Array(width * height * 4);
    this.zBuffer = new Float32Array(width * height);
    this.lightDir = new Vec3(0.5, 0.8, 0.4).normalize();
    this.clear();
  }

  clear() {
    this.zBuffer.fill(1e9);
    // Real scene background color: 0x020306
    for (let i = 0; i < this.width * this.height; i++) {
      this.buffer[i * 4 + 0] = 2;
      this.buffer[i * 4 + 1] = 3;
      this.buffer[i * 4 + 2] = 6;
      this.buffer[i * 4 + 3] = 255;
    }
  }

  project(p, camPos, lookAt, fov = 46) {
    const forward = new Vec3(lookAt.x - camPos.x, lookAt.y - camPos.y, lookAt.z - camPos.z).normalize();
    const worldUp = new Vec3(0, 1, 0);
    let right = new Vec3(
      forward.y * worldUp.z - forward.z * worldUp.y,
      forward.z * worldUp.x - forward.x * worldUp.z,
      forward.x * worldUp.y - forward.y * worldUp.x
    ).normalize();
    if (right.length() < 0.001) right = new Vec3(1, 0, 0);
    const up = new Vec3(
      right.y * forward.z - right.z * forward.y,
      right.z * forward.x - right.x * forward.z,
      right.x * forward.y - right.y * forward.x
    ).normalize();

    const d = new Vec3(p.x - camPos.x, p.y - camPos.y, p.z - camPos.z);
    const zCam = d.dot(forward);
    if (zCam <= 1.0) return null;

    const xCam = d.dot(right);
    const yCam = d.dot(up);

    const aspect = this.width / this.height;
    const fovRad = (fov * Math.PI) / 180;
    const tanHalfFov = Math.tan(fovRad / 2);

    const xScreen = (xCam / (zCam * tanHalfFov * aspect)) * (this.width / 2) + this.width / 2;
    const yScreen = (-yCam / (zCam * tanHalfFov)) * (this.height / 2) + this.height / 2;

    return { x: Math.round(xScreen), y: Math.round(yScreen), z: zCam };
  }

  setPixel(x, y, z, r, g, b, a = 1.0) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = y * this.width + x;
    if (z > this.zBuffer[idx]) return;

    const bIdx = idx * 4;
    const invA = 1.0 - a;
    this.buffer[bIdx + 0] = Math.min(255, Math.round(this.buffer[bIdx + 0] * invA + r * a));
    this.buffer[bIdx + 1] = Math.min(255, Math.round(this.buffer[bIdx + 1] * invA + g * a));
    this.buffer[bIdx + 2] = Math.min(255, Math.round(this.buffer[bIdx + 2] * invA + b * a));
  }

  drawLine(p1, p2, col1, col2, camPos, lookAt, fov, alpha = 0.85, width = 1) {
    const s1 = this.project(p1, camPos, lookAt, fov);
    const s2 = this.project(p2, camPos, lookAt, fov);
    if (!s1 || !s2) return;

    let dx = s2.x - s1.x;
    let dy = s2.y - s1.y;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    if (dist === 0) return;

    for (let i = 0; i <= dist; i++) {
      const u = i / dist;
      const x = Math.round(s1.x + dx * u);
      const y = Math.round(s1.y + dy * u);
      const z = s1.z + (s2.z - s1.z) * u;
      const r = Math.round(col1[0] + (col2[0] - col1[0]) * u);
      const g = Math.round(col1[1] + (col2[1] - col1[1]) * u);
      const b = Math.round(col1[2] + (col2[2] - col1[2]) * u);
      this.setPixel(x, y, z, r, g, b, alpha);
      if (width > 1) {
        this.setPixel(x + 1, y, z, r, g, b, alpha * 0.7);
        this.setPixel(x, y + 1, z, r, g, b, alpha * 0.7);
      }
    }
  }

  /**
   * Render High-Fidelity 3D Shaded Cluster Sphere matching THREE.MeshPhysicalMaterial
   * Crisp white sphere with directional diffuse lighting and specular sheen highlight
   */
  draw3DClusterSphere(center, radius, camPos, lookAt, fov, isRepeller = false) {
    const s = this.project(center, camPos, lookAt, fov);
    if (!s) return;

    const screenR = Math.max(3, Math.round((radius / s.z) * (this.height / 2) * 1.05));
    const viewDir = new Vec3(camPos.x - center.x, camPos.y - center.y, camPos.z - center.z).normalize();

    // Soft outer atmosphere glow halo
    for (let dy = -screenR * 2.2; dy <= screenR * 2.2; dy++) {
      for (let dx = -screenR * 2.2; dx <= screenR * 2.2; dx++) {
        const d = Math.hypot(dx, dy);
        const normD = d / (screenR * 2.0);
        if (normD < 1.0) {
          const glowAlpha = Math.pow(1.0 - normD, 2.5) * 0.45;
          if (isRepeller) {
            this.setPixel(s.x + dx, s.y + dy, s.z + radius, 120, 40, 200, glowAlpha);
          } else {
            this.setPixel(s.x + dx, s.y + dy, s.z + radius, 220, 240, 255, glowAlpha);
          }
        }
      }
    }

    // 3D Shaded Sphere Body
    for (let dy = -screenR; dy <= screenR; dy++) {
      for (let dx = -screenR; dx <= screenR; dx++) {
        const dSq = dx * dx + dy * dy;
        if (dSq <= screenR * screenR) {
          const nx = dx / screenR;
          const ny = -dy / screenR;
          const nz = Math.sqrt(Math.max(0, 1.0 - (nx * nx + ny * ny)));

          // Normal in world space approximately oriented to camera
          const N = new Vec3(nx, ny, nz).normalize();

          // Diffuse component (Directional light)
          const diff = Math.max(0.18, N.dot(this.lightDir));

          // Specular Blinn-Phong highlight
          const H = new Vec3(this.lightDir.x + viewDir.x, this.lightDir.y + viewDir.y, this.lightDir.z + viewDir.z).normalize();
          const spec = Math.pow(Math.max(0, N.dot(H)), 16) * 0.95;

          // Rim / Fresnel clearcoat
          const fresnel = Math.pow(1.0 - Math.max(0, N.dot(new Vec3(0, 0, 1))), 3.0) * 0.4;

          const pxZ = s.z - radius * nz;

          if (isRepeller) {
            const r = Math.min(255, Math.round(50 * diff + 180 * spec + 120 * fresnel));
            const g = Math.min(255, Math.round(15 * diff + 80 * spec));
            const b = Math.min(255, Math.round(90 * diff + 255 * spec + 160 * fresnel));
            this.setPixel(s.x + dx, s.y + dy, pxZ, r, g, b, 0.95);
          } else {
            // Authentic Crisp White MeshPhysicalMaterial
            const baseCol = 245 * diff + 255 * spec + 240 * fresnel;
            const r = Math.min(255, Math.round(baseCol));
            const g = Math.min(255, Math.round(baseCol));
            const b = Math.min(255, Math.round(Math.min(255, baseCol * 1.02)));
            this.setPixel(s.x + dx, s.y + dy, pxZ, r, g, b, 0.98);
          }
        }
      }
    }
  }

  /**
   * Render Milky Way Marker with glowing electric cyan core and orbital rings
   */
  drawMilkyWayMarker(camPos, lookAt, fov) {
    const s = this.project(milkyWayPos, camPos, lookAt, fov);
    if (!s) return;

    // Glowing cyan halo
    for (let dy = -12; dy <= 12; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= 12) {
          const a = Math.pow(1.0 - d / 12, 1.8) * 0.85;
          this.setPixel(s.x + dx, s.y + dy, s.z - 1, 0, 235, 255, a);
        }
      }
    }
    // Solid white core
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.hypot(dx, dy) <= 2) {
          this.setPixel(s.x + dx, s.y + dy, s.z - 2, 255, 255, 255, 1.0);
        }
      }
    }
    // Cyan Crosshairs
    for (let d = 4; d <= 9; d++) {
      this.setPixel(s.x + d, s.y, s.z - 1, 0, 235, 255, 0.9);
      this.setPixel(s.x - d, s.y, s.z - 1, 0, 235, 255, 0.9);
      this.setPixel(s.x, s.y + d, s.z - 1, 0, 235, 255, 0.9);
      this.setPixel(s.x, s.y - d, s.z - 1, 0, 235, 255, 0.9);
    }
  }

  /**
   * Render Distant Background Starfield
   */
  drawBackgroundStars(camPos, lookAt, fov) {
    for (let star of bgStars) {
      const s = this.project(new Vec3(star.x, star.y, star.z), camPos, lookAt, fov);
      if (s) {
        const r = Math.round(200 * star.lum);
        const g = Math.round(220 * star.lum);
        const b = Math.round(255 * star.lum);
        this.setPixel(s.x, s.y, s.z + 100, r, g, b, 0.7);
      }
    }
  }

  /**
   * Render Authentic GPU Scalar Potential & Divergence Slice with Real GLSL Colormap
   */
  drawHeatmapSlice(camPos, lookAt, fov, time = 0) {
    const step = 3.5;
    for (let gx = -75; gx <= 75; gx += step) {
      for (let gz = -75; gz <= 75; gz += step) {
        const p = new Vec3(gx, 0, gz);
        const s = this.project(p, camPos, lookAt, fov);
        if (!s) continue;

        let phi = 0;
        for (let a of attractors) {
          const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z, a.softening);
          phi -= a.mass / d;
        }

        // Potential mapping: uMinPot: -140.0, uMaxPot: 80.0
        let normT = (phi - (-140.0)) / (80.0 - (-140.0));
        normT = Math.max(0, Math.min(1, 1.0 - normT));

        // Subtly pulse near GA
        const distGA = Math.hypot(p.x - attractors[0].pos.x, p.z - attractors[0].pos.z);
        const wave = Math.sin(distGA * 0.15 - time * 2.0) * 0.05;
        normT = Math.max(0, Math.min(1, normT + wave));

        const col = sampleCosmicColormap(normT);

        // Iso-contour line highlight
        const contourPhase = (normT * 14.0) % 1.0;
        const isContour = contourPhase < 0.12;

        const r = isContour ? Math.min(255, col[0] + 50) : col[0];
        const g = isContour ? Math.min(255, col[1] + 50) : col[1];
        const b = isContour ? Math.min(255, col[2] + 50) : col[2];
        const alpha = isContour ? 0.75 : 0.45;

        for (let py = 0; py < 3; py++) {
          for (let px = 0; px < 3; px++) {
            this.setPixel(s.x + px, s.y + py, s.z + 8.0, r, g, b, alpha);
          }
        }
      }
    }
  }

  drawBadge(text, subtext = '', badgeColor = [0, 229, 255]) {
    const pad = 12;
    const w = this.width;
    const h = this.height;

    // Glassmorphic top banner card
    for (let y = 14; y < 62; y++) {
      for (let x = 14; x < w - 14; x++) {
        this.setPixel(x, y, 0.1, 4, 8, 16, 0.88);
      }
    }
    // Border
    for (let x = 14; x < w - 14; x++) {
      this.setPixel(x, 14, 0.05, badgeColor[0], badgeColor[1], badgeColor[2], 0.7);
      this.setPixel(x, 62, 0.05, 20, 35, 55, 0.7);
    }
    for (let y = 14; y <= 62; y++) {
      this.setPixel(14, y, 0.05, badgeColor[0], badgeColor[1], badgeColor[2], 0.7);
      this.setPixel(w - 14, y, 0.05, 20, 35, 55, 0.7);
    }

    // Live Watermark at bottom
    for (let y = h - 34; y < h - 12; y++) {
      for (let x = 14; x < 260; x++) {
        this.setPixel(x, y, 0.1, 6, 12, 22, 0.85);
      }
    }
  }
}

/**
 * High-Quality GIF Exporter Helper
 */
async function renderGIF(filename, frameCount, renderFrameFn) {
  const width = 600;
  const height = 600;
  const fps = 18;
  const canvas = new SoftwareCanvas(width, height);

  const gif = GIFEncoder();
  const filePath = path.join(outputDir, filename);
  const copyPath = path.join(assetsDir, filename);

  console.log(`🎬 Rendering ${filename} (${frameCount} frames, 600x600 1:1, Authentic 3D App Color Ramp)...`);

  for (let f = 0; f < frameCount; f++) {
    canvas.clear();
    const t = f / frameCount;
    renderFrameFn(canvas, t, f, frameCount);

    const palette = quantize(canvas.buffer, 128);
    const index = applyPalette(canvas.buffer, palette);
    gif.writeFrame(index, width, height, { palette, delay: Math.round(1000 / fps) });
  }

  gif.finish();
  const bytes = Buffer.from(gif.bytes());
  fs.writeFileSync(filePath, bytes);
  fs.writeFileSync(copyPath, bytes);
  console.log(`✅ Saved: ${filePath} (${Math.round(bytes.length / 1024)} KB)`);
}

/**
 * --------------------------------------------------------------------------
 * Ad 1: Hero 360° Flythrough (The Grand Architecture of Laniakea)
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-1-hero-flythrough.gif', 36, (canvas, t, f, n) => {
  const angle = t * Math.PI * 2;
  const rad = 135;
  const camPos = new Vec3(
    -10 + Math.cos(angle) * rad,
    75 + Math.sin(angle * 2) * 14,
    -5 + Math.sin(angle) * rad
  );
  const lookAt = new Vec3(-10, 4, -8);

  // Distant Starfield
  canvas.drawBackgroundStars(camPos, lookAt, 46);

  // Authentic GPU Scalar Slice Plane
  canvas.drawHeatmapSlice(camPos, lookAt, 46, t * Math.PI * 2);

  // Streamlines with Authentic 8-stop Color Ramp + Coma Loops
  for (let s of streamlines) {
    const isComa = s.type === 'coma';
    const pts = s.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const u1 = i / pts.length;
      const u2 = (i + 1) / pts.length;
      const col1 = isComa ? sampleComaStreamlineColor(u1) : sampleScientificStreamlineColor(u1);
      const col2 = isComa ? sampleComaStreamlineColor(u2) : sampleScientificStreamlineColor(u2);
      canvas.drawLine(pts[i], pts[i + 1], col1, col2, camPos, lookAt, 46, 0.90);
    }
  }

  // Galaxy Swarm (18,000 equivalent)
  for (let g of galaxyPoints) {
    const s = canvas.project(new Vec3(g.x, g.y, g.z), camPos, lookAt, 46);
    if (s) {
      const tw = 0.7 + Math.sin(f * 0.4 + g.x) * 0.3;
      let r = 255, gCol = 255, b = 255;
      if (g.hue === 'blue') { r = 180; gCol = 225; b = 255; }
      else if (g.hue === 'gold') { r = 255; gCol = 230; b = 170; }
      canvas.setPixel(s.x, s.y, s.z, r, gCol, b, g.brightness * tw);
    }
  }

  // Milky Way Cyan Beacon
  canvas.drawMilkyWayMarker(camPos, lookAt, 46);

  // 3D Shaded Glossy White Cluster Spheres (MeshPhysicalMaterial)
  for (let c of clusterNodes) {
    canvas.draw3DClusterSphere(c.pos, c.r, camPos, lookAt, 46, c.isRepeller);
  }

  canvas.drawBadge('LANIAKEA COSMIC FLOW 3D', 'Three.js r174 • 18,000 Swarm • 60 FPS WebGL', [0, 229, 255]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 2: RK4 Numerical Streamline Tracing & Velocity Vector Fields
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-2-rk4-streamlines.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-30 + Math.cos(t * Math.PI * 2) * 45, 50, 65 + Math.sin(t * Math.PI * 2) * 35);
  const lookAt = new Vec3(-28, 4, -5);

  canvas.drawBackgroundStars(camPos, lookAt, 44);

  for (let s of streamlines) {
    const isComa = s.type === 'coma';
    const pts = s.pts;
    const flowOffset = Math.floor(t * pts.length);

    for (let i = 0; i < pts.length - 1; i++) {
      const isFlowHighlight = Math.abs(((i + flowOffset) % pts.length) - Math.floor(pts.length / 2)) < 3;
      const u1 = i / pts.length;
      const u2 = (i + 1) / pts.length;

      let col1 = isComa ? sampleComaStreamlineColor(u1) : sampleScientificStreamlineColor(u1);
      let col2 = isComa ? sampleComaStreamlineColor(u2) : sampleScientificStreamlineColor(u2);

      if (isFlowHighlight) {
        col1 = [255, 255, 255];
        col2 = [255, 255, 255];
      }

      canvas.drawLine(pts[i], pts[i + 1], col1, col2, camPos, lookAt, 44, isFlowHighlight ? 1.0 : 0.85, isFlowHighlight ? 2 : 1);
    }
  }

  canvas.drawMilkyWayMarker(camPos, lookAt, 44);

  for (let c of clusterNodes) {
    canvas.draw3DClusterSphere(c.pos, c.r, camPos, lookAt, 44, c.isRepeller);
  }

  canvas.drawBadge('RK4 STREAMLINE INTEGRATION', 'Peculiar Velocity Vector Gradient -∇Φ', [255, 194, 51]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 3: GPU GLSL Gravitational Scalar Potential Heatmap Slice
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-3-gpu-scalar-slice.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-10, 150 + Math.sin(t * Math.PI * 2) * 18, -5 + Math.cos(t * Math.PI * 2) * 25);
  const lookAt = new Vec3(-10, 0, -5);

  canvas.drawBackgroundStars(camPos, lookAt, 48);

  // Full GPU Scalar Density / Potential Slicing
  canvas.drawHeatmapSlice(camPos, lookAt, 48, t * Math.PI * 2);

  // Overlay Streamlines
  for (let s of streamlines.slice(0, 70)) {
    const isComa = s.type === 'coma';
    const pts = s.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const u1 = i / pts.length;
      const u2 = (i + 1) / pts.length;
      const col1 = isComa ? sampleComaStreamlineColor(u1) : sampleScientificStreamlineColor(u1);
      const col2 = isComa ? sampleComaStreamlineColor(u2) : sampleScientificStreamlineColor(u2);
      canvas.drawLine(pts[i], pts[i + 1], col1, col2, camPos, lookAt, 48, 0.55);
    }
  }

  canvas.drawMilkyWayMarker(camPos, lookAt, 48);

  for (let c of clusterNodes) {
    canvas.draw3DClusterSphere(c.pos, c.r * 1.05, camPos, lookAt, 48, c.isRepeller);
  }

  canvas.drawBadge('GPU GLSL SCALAR POTENTIAL SLICE', 'Astrophysical Colormap • Iso-potential Grids', [0, 240, 180]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 4: 18,000+ Galaxy Particle Swarm & Virial Cusp Clustering
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-4-galaxy-swarm-shimmer.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-22 + Math.cos(t * Math.PI * 2) * 35, 22, 30 + Math.sin(t * Math.PI * 2) * 25);
  const lookAt = new Vec3(-34, 4, 0);

  canvas.drawBackgroundStars(camPos, lookAt, 42);

  // Soft Swarm Glow
  for (let g of galaxyPoints) {
    const s = canvas.project(new Vec3(g.x, g.y, g.z), camPos, lookAt, 42);
    if (s) {
      const shimmer = 0.65 + Math.sin(f * 0.5 + g.x * 2.0) * 0.35;
      let r = 240, gCol = 248, b = 255;
      if (g.hue === 'blue') { r = 160; gCol = 210; b = 255; }
      else if (g.hue === 'gold') { r = 255; gCol = 225; b = 150; }

      const intensity = g.brightness * shimmer;
      canvas.setPixel(s.x, s.y, s.z, Math.round(r * intensity), Math.round(gCol * intensity), Math.round(b * intensity), intensity);
      if (intensity > 0.8) {
        canvas.setPixel(s.x + 1, s.y, s.z, Math.round(r * 0.5), Math.round(gCol * 0.5), Math.round(b * 0.5), 0.4);
        canvas.setPixel(s.x, s.y + 1, s.z, Math.round(r * 0.5), Math.round(gCol * 0.5), Math.round(b * 0.5), 0.4);
      }
    }
  }

  canvas.drawMilkyWayMarker(camPos, lookAt, 42);

  for (let c of clusterNodes.slice(0, 4)) {
    canvas.draw3DClusterSphere(c.pos, c.r, camPos, lookAt, 42, c.isRepeller);
  }

  canvas.drawBadge('18,000+ GALAXY SWARM PARTICLES', 'Virial Power-Law Cusps & GPU Shimmer Shader', [220, 160, 255]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 5: Client-Side Deterministic 360° Recording Studio
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-5-client-recorder-studio.gif', 32, (canvas, t, f, n) => {
  const angle = t * Math.PI * 2;
  const camPos = new Vec3(-12 + Math.cos(angle) * 90, 55, 95 + Math.sin(angle) * 70);
  const lookAt = new Vec3(-10, 4, -8);

  canvas.drawBackgroundStars(camPos, lookAt, 46);

  for (let s of streamlines) {
    const isComa = s.type === 'coma';
    const pts = s.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const u1 = i / pts.length;
      const u2 = (i + 1) / pts.length;
      const col1 = isComa ? sampleComaStreamlineColor(u1) : sampleScientificStreamlineColor(u1);
      const col2 = isComa ? sampleComaStreamlineColor(u2) : sampleScientificStreamlineColor(u2);
      canvas.drawLine(pts[i], pts[i + 1], col1, col2, camPos, lookAt, 46, 0.88);
    }
  }

  canvas.drawMilkyWayMarker(camPos, lookAt, 46);

  for (let c of clusterNodes) {
    canvas.draw3DClusterSphere(c.pos, c.r, camPos, lookAt, 46, c.isRepeller);
  }

  // Draw HUD recording studio overlay UI representation
  for (let y = canvas.height - 105; y < canvas.height - 25; y++) {
    for (let x = canvas.width - 235; x < canvas.width - 25; x++) {
      canvas.setPixel(x, y, 0.05, 5, 10, 20, 0.9);
    }
  }
  // Recording dock border
  for (let x = canvas.width - 235; x < canvas.width - 25; x++) {
    canvas.setPixel(x, canvas.height - 105, 0.04, 0, 229, 255, 0.5);
    canvas.setPixel(x, canvas.height - 25, 0.04, 0, 229, 255, 0.5);
  }
  // Record button red pulsating indicator
  const pulse = 0.8 + Math.sin(f * 0.6) * 0.2;
  for (let dy = -7; dy <= 7; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      if (Math.hypot(dx, dy) <= 7) {
        canvas.setPixel(canvas.width - 195 + dx, canvas.height - 65 + dy, 0.01, Math.round(255 * pulse), 40, 50, 1.0);
      }
    }
  }

  canvas.drawBadge('360° GIF & WEBM RECORDING STUDIO', 'Deterministic Frame Capture • 1-Click Export', [255, 60, 80]);
});

console.log('🎉 All 5 LinkedIn Ad Campaign GIFs Generated with Authentic Real 3D Colors!');
