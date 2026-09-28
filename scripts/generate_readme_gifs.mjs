import fs from 'fs';
import path from 'path';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

// Make sure output dir exists
const outputDir = path.resolve('docs/assets');
fs.mkdirSync(outputDir, { recursive: true });

console.log('🌌 Generating README animated GIF assets with gifenc...');

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

// Cosmological Attractor / Repeller field
const attractors = [
  { id: 'ga', name: 'The Great Attractor', pos: new Vec3(-38, 2, -5), mass: 3200, softening: 12 },
  { id: 'centaurus', name: 'Centaurus', pos: new Vec3(-34, 6, 2), mass: 2200, softening: 16 },
  { id: 'repeller', name: 'Dipole Repeller', pos: new Vec3(32, -4, 18), mass: -2600, softening: 14 },
  { id: 'virgo', name: 'Virgo', pos: new Vec3(-8, 3, 0), mass: 1100, softening: 10 }
];

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

function traceStreamline(startPos, steps = 140, dt = 0.95) {
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

// Generate Streamlines
const streamlines = [];
const repellerPos = attractors[2].pos;

// Outflow seeds
for (let i = 0; i < 110; i++) {
  const theta = (i / 110) * Math.PI * 2;
  const r = 8.0 + (i % 7) * 3.5;
  const seed = new Vec3(
    repellerPos.x + r * Math.cos(theta),
    repellerPos.y + (Math.sin(theta * 3)) * 4.0,
    repellerPos.z + r * Math.sin(theta)
  );
  const line = traceStreamline(seed);
  if (line.length > 10) streamlines.push({ pts: line, isComa: false });
}

// Filament & bridge seeds
for (let i = 0; i < 90; i++) {
  const angle = (i / 90) * Math.PI * 2;
  const r = 35.0 + (i % 5) * 8.0;
  const seed = new Vec3(Math.cos(angle) * r - 5, (Math.sin(angle * 2) - 0.5) * 16, Math.sin(angle) * r - 5);
  const line = traceStreamline(seed);
  if (line.length > 10) streamlines.push({ pts: line, isComa: false });
}

// Coma vertical fountain loops
const comaCenter = new Vec3(5, 45, -25);
for (let i = 0; i < 28; i++) {
  const angle = (i / 28) * Math.PI * 2;
  const r = 5.0 + (i % 4) * 3.0;
  const p0 = new Vec3(comaCenter.x + Math.cos(angle) * r * 1.8, 5.0, comaCenter.z + Math.sin(angle) * r);
  const p1 = new Vec3(comaCenter.x + Math.cos(angle) * r * 0.7, 45.0 + (i % 5) * 3.0, comaCenter.z + Math.sin(angle) * r * 0.7);
  const p2 = new Vec3(comaCenter.x + (Math.cos(angle * 2)) * 2.0, comaCenter.y, comaCenter.z + (Math.sin(angle * 2)) * 2.0);

  const loopPts = [];
  for (let step = 0; step <= 30; step++) {
    const t = step / 30;
    const lx = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const ly = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    const lz = (1 - t) * (1 - t) * p0.z + 2 * (1 - t) * t * p1.z + t * t * p2.z;
    loopPts.push(new Vec3(lx, ly, lz));
  }
  streamlines.push({ pts: loopPts, isComa: true });
}

// Galaxy swarm particles
const galaxies = [];
for (let i = 0; i < 2200; i++) {
  const rType = (i % 100) / 100.0;
  let p;
  if (rType < 0.32) {
    // GA / Centaurus
    const c = i % 2 === 0 ? attractors[0].pos : attractors[1].pos;
    const rad = Math.pow(Math.random(), 2.0) * 20.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(c.x + rad * Math.cos(th), c.y + (Math.random() - 0.5) * 10, c.z + rad * Math.sin(th));
  } else if (rType < 0.52) {
    // Virgo
    const c = attractors[3].pos;
    const rad = Math.pow(Math.random(), 1.8) * 14.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(c.x + rad * Math.cos(th), c.y + (Math.random() - 0.5) * 8, c.z + rad * Math.sin(th));
  } else if (rType < 0.65) {
    // Coma
    const rad = Math.pow(Math.random(), 1.6) * 12.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(comaCenter.x + rad * Math.cos(th), comaCenter.y + (Math.random() - 0.5) * 12, comaCenter.z + rad * Math.sin(th));
  } else {
    // Filaments
    const t = Math.random();
    const bx = (1 - t) * repellerPos.x + t * attractors[0].pos.x;
    const by = (1 - t) * repellerPos.y + t * attractors[0].pos.y;
    const bz = (1 - t) * repellerPos.z + t * attractors[0].pos.z;
    p = new Vec3(bx + (Math.random() - 0.5) * 16, by + (Math.random() - 0.5) * 10, bz + (Math.random() - 0.5) * 16);
  }
  galaxies.push(p);
}

// 3D Projection
function project(p, camPos, lookAt, width, height, fov = 46) {
  const fwd = new Vec3(lookAt.x - camPos.x, lookAt.y - camPos.y, lookAt.z - camPos.z).normalize();
  const worldUp = new Vec3(0, 1, 0);
  const right = new Vec3(fwd.y * worldUp.z - fwd.z * worldUp.y, fwd.z * worldUp.x - fwd.x * worldUp.z, fwd.x * worldUp.y - fwd.y * worldUp.x).normalize();
  const up = new Vec3(right.y * fwd.z - right.z * fwd.y, right.z * fwd.x - right.x * fwd.z, right.x * fwd.y - right.y * fwd.x).normalize();

  const rel = new Vec3(p.x - camPos.x, p.y - camPos.y, p.z - camPos.z);
  const zCam = rel.dot(fwd);
  if (zCam < 1.0) return null;

  const xCam = rel.dot(right);
  const yCam = rel.dot(up);

  const aspect = width / height;
  const fovRad = (fov * Math.PI) / 180;
  const tanHalfFov = Math.tan(fovRad / 2);

  const xNdc = xCam / (zCam * tanHalfFov * aspect);
  const yNdc = yCam / (zCam * tanHalfFov);

  const sx = (xNdc * 0.5 + 0.5) * width;
  const sy = (-yNdc * 0.5 + 0.5) * height;

  return { x: Math.round(sx), y: Math.round(sy), z: zCam };
}

// Software Framebuffer Renderer
function renderFrame(camPos, lookAt, width, height, time = 0) {
  const buf = new Uint8Array(width * height * 4);
  const zBuf = new Float32Array(width * height).fill(999999);

  // Background gradient: deep cosmic blue-black
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const r = Math.round(2 + t * 4);
    const g = Math.round(4 + t * 7);
    const b = Math.round(10 + t * 14);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  // Draw Heatmap Slice Plane (grid projection)
  const planeSize = 85;
  const step = 3.5;
  for (let px = -planeSize; px <= planeSize; px += step) {
    for (let pz = -planeSize; pz <= planeSize; pz += step) {
      const pt = project(new Vec3(px, 0, pz), camPos, lookAt, width, height);
      if (pt && pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
        // Colormap
        const dGA = Math.hypot(px - attractors[0].pos.x, pz - attractors[0].pos.z);
        const dRep = Math.hypot(px - repellerPos.x, pz - repellerPos.z);

        let colR = 30, colG = 180, colB = 70; // Green default
        if (dGA < 28) {
          const t = 1.0 - dGA / 28.0;
          colR = Math.round(220 + t * 35);
          colG = Math.round(120 - t * 60);
          colB = 20;
        } else if (dRep < 32) {
          const t = 1.0 - dRep / 32.0;
          colR = Math.round(10 - t * 5);
          colG = Math.round(140 - t * 80);
          colB = Math.round(220 + t * 35);
        }

        const idx = (pt.y * width + pt.x) * 4;
        if (pt.z < zBuf[pt.y * width + pt.x]) {
          zBuf[pt.y * width + pt.x] = pt.z;
          buf[idx] = Math.round(buf[idx] * 0.4 + colR * 0.6);
          buf[idx + 1] = Math.round(buf[idx + 1] * 0.4 + colG * 0.6);
          buf[idx + 2] = Math.round(buf[idx + 2] * 0.4 + colB * 0.6);
        }
      }
    }
  }

  // Draw Streamlines
  for (let sl of streamlines) {
    const pts = sl.pts;
    for (let j = 0; j < pts.length - 1; j++) {
      const pA = pts[j];
      const pB = pts[j + 1];
      const sA = project(pA, camPos, lookAt, width, height);
      const sB = project(pB, camPos, lookAt, width, height);

      if (!sA || !sB) continue;

      // Color based on region
      let sr = 240, sg = 245, sb = 255;
      if (sl.isComa) {
        sr = 220; sg = 240; sb = 255;
      } else {
        const dGA = Math.hypot(pA.x - attractors[0].pos.x, pA.y - attractors[0].pos.y, pA.z - attractors[0].pos.z);
        if (dGA < 22.0) {
          sr = 255; sg = 170; sb = 40;
        } else if (pA.x > 5 && pA.z > 0) {
          sr = 0; sg = 220; sb = 255;
        }
      }

      // Draw line segment (Bresenham)
      let x0 = sA.x, y0 = sA.y, x1 = sB.x, y1 = sB.y;
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
          const idx = (y0 * width + x0) * 4;
          buf[idx] = Math.min(255, buf[idx] + sr);
          buf[idx + 1] = Math.min(255, buf[idx + 1] + sg);
          buf[idx + 2] = Math.min(255, buf[idx + 2] + sb);
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }
  }

  // Draw Galaxies
  for (let g of galaxies) {
    const s = project(g, camPos, lookAt, width, height);
    if (s && s.x >= 1 && s.x < width - 1 && s.y >= 1 && s.y < height - 1) {
      const idx = (s.y * width + s.x) * 4;
      buf[idx] = 255;
      buf[idx + 1] = 255;
      buf[idx + 2] = 255;
      // Slight glow around particle
      buf[idx - 4] = Math.min(255, buf[idx - 4] + 100);
      buf[idx + 4] = Math.min(255, buf[idx + 4] + 100);
      buf[((s.y - 1) * width + s.x) * 4] = Math.min(255, buf[((s.y - 1) * width + s.x) * 4] + 100);
      buf[((s.y + 1) * width + s.x) * 4] = Math.min(255, buf[((s.y + 1) * width + s.x) * 4] + 100);
    }
  }

  return buf;
}

/**
 * 1. Generate 360-degree Orbit GIF: docs/assets/laniakea-360-orbit.gif
 */
async function generate360OrbitGif() {
  console.log('Rendering 360° Orbit GIF (36 frames)...');
  const width = 600;
  const height = 340;
  const totalFrames = 36;
  const fps = 18;
  const delay = Math.round(1000 / fps);

  const encoder = new GIFEncoder();
  const target = new Vec3(-10, 8, -6);
  const radius = 150;
  const heightOffset = 75;

  for (let f = 0; f < totalFrames; f++) {
    const t = f / totalFrames;
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(
      target.x + radius * Math.cos(angle),
      target.y + heightOffset + Math.sin(angle * 2) * 14.0,
      target.z + radius * Math.sin(angle)
    );

    const rgba = renderFrame(camPos, target, width, height, t);
    const palette = quantize(rgba, 128);
    const index = applyPalette(rgba, palette);

    encoder.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0
    });
    process.stdout.write(`\rFrame ${f + 1}/${totalFrames} encoded.`);
  }

  encoder.finish();
  const filePath = path.join(outputDir, 'laniakea-360-orbit.gif');
  fs.writeFileSync(filePath, encoder.bytes());
  console.log(`\n✅ Saved: ${filePath} (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);
}

/**
 * 2. Generate Coma Fountain Tour GIF: docs/assets/laniakea-fountain-tour.gif
 */
async function generateTourGif() {
  console.log('Rendering Coma Fountain & Great Attractor Tour GIF (30 frames)...');
  const width = 600;
  const height = 340;
  const totalFrames = 30;
  const fps = 15;
  const delay = Math.round(1000 / fps);

  const encoder = new GIFEncoder();

  for (let f = 0; f < totalFrames; f++) {
    const t = f / totalFrames;
    // Flyby from Great Attractor towards Coma fountain
    const camX = -45 + t * 55;
    const camY = 35 + Math.sin(t * Math.PI) * 30;
    const camZ = 75 - t * 40;
    const camPos = new Vec3(camX, camY, camZ);

    const lookX = -30 + t * 35;
    const lookY = 10 + t * 25;
    const lookZ = -10 - t * 15;
    const target = new Vec3(lookX, lookY, lookZ);

    const rgba = renderFrame(camPos, target, width, height, t);
    const palette = quantize(rgba, 128);
    const index = applyPalette(rgba, palette);

    encoder.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0
    });
    process.stdout.write(`\rTour Frame ${f + 1}/${totalFrames} encoded.`);
  }

  encoder.finish();
  const filePath = path.join(outputDir, 'laniakea-fountain-tour.gif');
  fs.writeFileSync(filePath, encoder.bytes());
  console.log(`\n✅ Saved: ${filePath} (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);
}

async function main() {
  await generate360OrbitGif();
  await generateTourGif();
  console.log('🎉 All animated GIF assets created successfully in docs/assets/!');
}

main().catch(console.error);
