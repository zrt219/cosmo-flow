import fs from 'fs';
import path from 'path';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const outputDir = path.resolve('docs/linkedin_campaign');
fs.mkdirSync(outputDir, { recursive: true });

console.log('🚀 Generating 5 Square (1:1) LinkedIn Ad Campaign GIFs & WebM Video Assets...');

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

// Cosmological Structures
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

    if (Math.abs(next.x) > 110 || Math.abs(next.y) > 75 || Math.abs(next.z) > 110) break;
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

// Generate Global Streamlines
const streamlines = [];
const repellerPos = attractors[2].pos;

for (let i = 0; i < 130; i++) {
  const theta = (i / 130) * Math.PI * 2;
  const rad = 8.0 + (i % 5) * 4.5;
  const start = new Vec3(
    repellerPos.x + rad * Math.cos(theta),
    repellerPos.y + ((i % 7) - 3) * 2.2,
    repellerPos.z + rad * Math.sin(theta)
  );
  const pts = traceStreamline(start, 160, 0.92);
  if (pts.length > 12) streamlines.push(pts);
}

// Northern Coma Fountain Loops
for (let i = 0; i < 36; i++) {
  const t = i / 36;
  const start = new Vec3(
    10 + (Math.random() - 0.5) * 16,
    -1 + Math.random() * 8,
    -20 + (Math.random() - 0.5) * 16
  );
  const pts = traceStreamline(start, 140, 0.88);
  if (pts.length > 10) streamlines.push(pts);
}

// Cluster Spheres
const clusterNodes = [
  { name: 'Great Attractor', pos: attractors[0].pos, r: 12, col: [255, 180, 50] },
  { name: 'Centaurus', pos: attractors[1].pos, r: 8.5, col: [255, 200, 80] },
  { name: 'Virgo', pos: attractors[3].pos, r: 7.2, col: [180, 220, 255] },
  { name: 'Coma', pos: comaCenter, r: 9.0, col: [255, 225, 120] },
  { name: 'Hydra', pos: hydraPos, r: 6.0, col: [200, 230, 255] },
  { name: 'Antlia', pos: antliaPos, r: 5.5, col: [210, 235, 255] },
  { name: 'Milky Way', pos: milkyWayPos, r: 4.2, col: [0, 235, 255] }
];

// Galaxy Swarm Particles
const galaxyPoints = [];
for (let i = 0; i < 4200; i++) {
  const cluster = clusterNodes[i % clusterNodes.length];
  const u = Math.random();
  const r = cluster.r * 1.8 * Math.pow(u, 2.2);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2.0 * Math.random() - 1.0);
  galaxyPoints.push({
    x: cluster.pos.x + r * Math.sin(phi) * Math.cos(theta),
    y: cluster.pos.y + r * Math.cos(phi) * 0.45,
    z: cluster.pos.z + r * Math.sin(phi) * Math.sin(theta),
    brightness: 0.6 + Math.random() * 0.4,
    size: Math.random() < 0.15 ? 2 : 1
  });
}

/**
 * 8-Stop Astrophysical Colormap for Velocity Magnitude
 */
function sampleVelocityColor(t) {
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
 * Software 3D Camera & Rasterizer (Square 1:1 Aspect Ratio)
 */
class SoftwareCanvas {
  constructor(width = 600, height = 600) {
    this.width = width;
    this.height = height;
    this.buffer = new Uint8Array(width * height * 4);
    this.zBuffer = new Float32Array(width * height);
    this.clear();
  }

  clear() {
    this.zBuffer.fill(1e9);
    for (let i = 0; i < this.width * this.height; i++) {
      this.buffer[i * 4 + 0] = 3;
      this.buffer[i * 4 + 1] = 4;
      this.buffer[i * 4 + 2] = 8;
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

  drawLine(p1, p2, col1, col2, camPos, lookAt, fov, alpha = 0.85) {
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
    }
  }

  drawGlowSphere(center, radius, color, camPos, lookAt, fov, intensity = 1.0) {
    const s = this.project(center, camPos, lookAt, fov);
    if (!s) return;

    const screenR = Math.max(2, Math.round((radius / s.z) * (this.height / 2)));
    for (let dy = -screenR * 2; dy <= screenR * 2; dy++) {
      for (let dx = -screenR * 2; dx <= screenR * 2; dx++) {
        const d = Math.hypot(dx, dy);
        const normD = d / (screenR * 1.8);
        if (normD < 1.0) {
          const a = Math.pow(1.0 - normD, 2.2) * 0.75 * intensity;
          this.setPixel(s.x + dx, s.y + dy, s.z - radius * (1.0 - normD), color[0], color[1], color[2], a);
        }
      }
    }
  }

  drawHeatmapSlice(camPos, lookAt, fov, time = 0) {
    const step = 4.0;
    for (let gx = -70; gx <= 70; gx += step) {
      for (let gz = -70; gz <= 70; gz += step) {
        const p = new Vec3(gx, 0, gz);
        const s = this.project(p, camPos, lookAt, fov);
        if (!s) continue;

        let phi = 0;
        for (let a of attractors) {
          const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z, a.softening);
          phi -= a.mass / d;
        }

        // Pulse wave
        const distGA = Math.hypot(p.x - attractors[0].pos.x, p.z - attractors[0].pos.z);
        const wave = Math.sin(distGA * 0.18 - time * 2.5) * 0.5 + 0.5;

        let normT = (phi - (-130.0)) / (70.0 - (-130.0));
        normT = 1.0 - Math.max(0, Math.min(1, normT));

        const col = sampleVelocityColor(normT);
        const r = Math.min(255, col[0] + Math.round(wave * 25));
        const g = Math.min(255, col[1] + Math.round(wave * 15));
        const b = col[2];

        for (let py = 0; py < 3; py++) {
          for (let px = 0; px < 3; px++) {
            this.setPixel(s.x + px, s.y + py, s.z + 5.0, r, g, b, 0.42);
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
        this.setPixel(x, y, 0.1, 8, 14, 24, 0.88);
      }
    }
    // Border
    for (let x = 14; x < w - 14; x++) {
      this.setPixel(x, 14, 0.05, badgeColor[0], badgeColor[1], badgeColor[2], 0.6);
      this.setPixel(x, 62, 0.05, 30, 45, 65, 0.6);
    }
    for (let y = 14; y <= 62; y++) {
      this.setPixel(14, y, 0.05, badgeColor[0], badgeColor[1], badgeColor[2], 0.6);
      this.setPixel(w - 14, y, 0.05, 30, 45, 65, 0.6);
    }

    // Live Watermark at bottom
    for (let y = h - 34; y < h - 12; y++) {
      for (let x = 14; x < 260; x++) {
        this.setPixel(x, y, 0.1, 10, 16, 26, 0.85);
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

  console.log(`🎬 Rendering ${filename} (${frameCount} frames, 600x600 1:1)...`);

  for (let f = 0; f < frameCount; f++) {
    canvas.clear();
    const t = f / frameCount;
    renderFrameFn(canvas, t, f, frameCount);

    const palette = quantize(canvas.buffer, 128);
    const index = applyPalette(canvas.buffer, palette);
    gif.writeFrame(index, width, height, { palette, delay: Math.round(1000 / fps) });
  }

  gif.finish();
  fs.writeFileSync(filePath, Buffer.from(gif.bytes()));
  console.log(`✅ Saved: ${filePath} (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);
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
    80 + Math.sin(angle * 2) * 15,
    -5 + Math.sin(angle) * rad
  );
  const lookAt = new Vec3(-10, 4, -8);

  // Render Heatmap
  canvas.drawHeatmapSlice(camPos, lookAt, 46, t * Math.PI * 2);

  // Render Streamlines
  for (let s of streamlines) {
    for (let i = 0; i < s.length - 1; i++) {
      const u1 = i / s.length;
      const u2 = (i + 1) / s.length;
      const col1 = sampleVelocityColor(u1);
      const col2 = sampleVelocityColor(u2);
      canvas.drawLine(s[i], s[i + 1], col1, col2, camPos, lookAt, 46, 0.88);
    }
  }

  // Render Galaxy Swarm
  for (let g of galaxyPoints) {
    const s = canvas.project(new Vec3(g.x, g.y, g.z), camPos, lookAt, 46);
    if (s) {
      const tw = 0.7 + Math.sin(f * 0.4 + g.x) * 0.3;
      canvas.setPixel(s.x, s.y, s.z, 230, 245, 255, g.brightness * tw);
    }
  }

  // Render Major Clusters
  for (let c of clusterNodes) {
    canvas.drawGlowSphere(c.pos, c.r, c.col, camPos, lookAt, 46, 0.9);
  }

  canvas.drawBadge('LANIAKEA COSMIC FLOW 3D', 'Three.js r174 • 18,000 Swarm • 60 FPS WebGL', [0, 229, 255]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 2: RK4 Numerical Streamline Tracing & Velocity Vector Fields
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-2-rk4-streamlines.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-30 + Math.cos(t * Math.PI * 2) * 45, 55, 65 + Math.sin(t * Math.PI * 2) * 35);
  const lookAt = new Vec3(-28, 4, -5);

  for (let s of streamlines) {
    const flowOffset = Math.floor(t * s.length);
    for (let i = 0; i < s.length - 1; i++) {
      const isFlowHighlight = Math.abs(((i + flowOffset) % s.length) - s.length / 2) < 4;
      const u1 = i / s.length;
      const u2 = (i + 1) / s.length;
      const col1 = isFlowHighlight ? [255, 255, 255] : sampleVelocityColor(u1);
      const col2 = isFlowHighlight ? [255, 255, 255] : sampleVelocityColor(u2);
      canvas.drawLine(s[i], s[i + 1], col1, col2, camPos, lookAt, 44, isFlowHighlight ? 1.0 : 0.75);
    }
  }

  for (let c of clusterNodes) {
    canvas.drawGlowSphere(c.pos, c.r, c.col, camPos, lookAt, 44, 0.85);
  }

  canvas.drawBadge('RK4 STREAMLINE INTEGRATION', 'Peculiar Velocity Vector Gradient -∇Φ', [255, 180, 50]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 3: GPU GLSL Gravitational Scalar Potential Heatmap Slice
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-3-gpu-scalar-slice.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-10, 160 + Math.sin(t * Math.PI * 2) * 20, -5 + Math.cos(t * Math.PI * 2) * 30);
  const lookAt = new Vec3(-10, 0, -5);

  canvas.drawHeatmapSlice(camPos, lookAt, 48, t * Math.PI * 2);

  for (let s of streamlines.slice(0, 60)) {
    for (let i = 0; i < s.length - 1; i++) {
      canvas.drawLine(s[i], s[i + 1], [180, 220, 255], [255, 255, 255], camPos, lookAt, 48, 0.45);
    }
  }

  for (let c of clusterNodes) {
    canvas.drawGlowSphere(c.pos, c.r * 1.1, c.col, camPos, lookAt, 48, 0.9);
  }

  canvas.drawBadge('GPU GLSL SCALAR POTENTIAL SLICE', '8-Stop Colormap • Isopotential Contour Grids', [0, 240, 180]);
});

/**
 * --------------------------------------------------------------------------
 * Ad 4: 18,000+ Galaxy Particle Swarm & Virial Cusp Clustering
 * --------------------------------------------------------------------------
 */
await renderGIF('ad-4-galaxy-swarm-shimmer.gif', 32, (canvas, t, f, n) => {
  const camPos = new Vec3(-22 + Math.cos(t * Math.PI * 2) * 35, 25, 30 + Math.sin(t * Math.PI * 2) * 25);
  const lookAt = new Vec3(-34, 4, 0);

  for (let g of galaxyPoints) {
    const s = canvas.project(new Vec3(g.x, g.y, g.z), camPos, lookAt, 42);
    if (s) {
      const shimmer = 0.6 + Math.sin(f * 0.5 + g.x * 2.0) * 0.4;
      const r = Math.min(255, Math.round(230 * shimmer));
      const gCol = Math.min(255, Math.round(245 * shimmer));
      const b = 255;
      canvas.setPixel(s.x, s.y, s.z, r, gCol, b, g.brightness * shimmer);
      if (g.size > 1) {
        canvas.setPixel(s.x + 1, s.y, s.z, r, gCol, b, 0.5 * shimmer);
        canvas.setPixel(s.x, s.y + 1, s.z, r, gCol, b, 0.5 * shimmer);
      }
    }
  }

  for (let c of clusterNodes.slice(0, 3)) {
    canvas.drawGlowSphere(c.pos, c.r, c.col, camPos, lookAt, 42, 0.7);
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
  const camPos = new Vec3(-12 + Math.cos(angle) * 90, 60, 95 + Math.sin(angle) * 70);
  const lookAt = new Vec3(-10, 4, -8);

  for (let s of streamlines) {
    for (let i = 0; i < s.length - 1; i++) {
      const u1 = i / s.length;
      const u2 = (i + 1) / s.length;
      canvas.drawLine(s[i], s[i + 1], sampleVelocityColor(u1), sampleVelocityColor(u2), camPos, lookAt, 46, 0.85);
    }
  }

  for (let c of clusterNodes) {
    canvas.drawGlowSphere(c.pos, c.r, c.col, camPos, lookAt, 46, 0.85);
  }

  // Draw HUD recording studio overlay UI representation
  for (let y = canvas.height - 110; y < canvas.height - 20; y++) {
    for (let x = canvas.width - 240; x < canvas.width - 20; x++) {
      canvas.setPixel(x, y, 0.05, 10, 18, 28, 0.9);
    }
  }
  // Record button red dot
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      if (Math.hypot(dx, dy) <= 6) {
        canvas.setPixel(canvas.width - 200 + dx, canvas.height - 65 + dy, 0.01, 255, 40, 40, 1.0);
      }
    }
  }

  canvas.drawBadge('360° GIF & WEBM RECORDING STUDIO', 'Deterministic Frame Capture • 1-Click Export', [255, 60, 80]);
});

console.log('🎉 All 5 LinkedIn Ad Campaign GIFs Generated Successfully into docs/linkedin_campaign/!');
