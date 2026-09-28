import fs from 'fs';
import path from 'path';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

const outputDir = path.resolve('docs/assets');
fs.mkdirSync(outputDir, { recursive: true });

console.log('🌌 Generating 8 Section-by-Section Explanatory GIFs for CosmoFlow README...');

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
  { id: 'ga', name: 'The Great Attractor', pos: new Vec3(-38, 2, -5), mass: 3200, softening: 12 },
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

// Generate Global Streamlines
const streamlines = [];
const repellerPos = attractors[2].pos;

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

for (let i = 0; i < 90; i++) {
  const angle = (i / 90) * Math.PI * 2;
  const r = 35.0 + (i % 5) * 8.0;
  const seed = new Vec3(Math.cos(angle) * r - 5, (Math.sin(angle * 2) - 0.5) * 16, Math.sin(angle) * r - 5);
  const line = traceStreamline(seed);
  if (line.length > 10) streamlines.push({ pts: line, isComa: false });
}

// Coma vertical fountain loops
for (let i = 0; i < 32; i++) {
  const angle = (i / 32) * Math.PI * 2;
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
for (let i = 0; i < 2400; i++) {
  const rType = (i % 100) / 100.0;
  let p;
  if (rType < 0.32) {
    const c = i % 2 === 0 ? attractors[0].pos : attractors[1].pos;
    const rad = Math.pow(Math.random(), 2.0) * 20.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(c.x + rad * Math.cos(th), c.y + (Math.random() - 0.5) * 10, c.z + rad * Math.sin(th));
  } else if (rType < 0.52) {
    const c = attractors[3].pos;
    const rad = Math.pow(Math.random(), 1.8) * 14.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(c.x + rad * Math.cos(th), c.y + (Math.random() - 0.5) * 8, c.z + rad * Math.sin(th));
  } else if (rType < 0.65) {
    const rad = Math.pow(Math.random(), 1.6) * 12.0;
    const th = Math.random() * Math.PI * 2;
    p = new Vec3(comaCenter.x + rad * Math.cos(th), comaCenter.y + (Math.random() - 0.5) * 12, comaCenter.z + rad * Math.sin(th));
  } else {
    const t = Math.random();
    const bx = (1 - t) * repellerPos.x + t * attractors[0].pos.x;
    const by = (1 - t) * repellerPos.y + t * attractors[0].pos.y;
    const bz = (1 - t) * repellerPos.z + t * attractors[0].pos.z;
    p = new Vec3(bx + (Math.random() - 0.5) * 16, by + (Math.random() - 0.5) * 10, bz + (Math.random() - 0.5) * 16);
  }
  galaxies.push(p);
}

// 3D Projection Engine
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

// Software Framebuffer Renderer with custom rendering modes
function renderFrame(camPos, lookAt, width, height, time = 0, options = {}) {
  const {
    showSlice = true,
    showStreamlines = true,
    showGalaxies = true,
    showLabels = false,
    showSpheres = false,
    sliceY = 0,
    hudOverlay = null
  } = options;

  const buf = new Uint8Array(width * height * 4);
  const zBuf = new Float32Array(width * height).fill(999999);

  // Background gradient: deep cosmic blue-black
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const r = Math.round(3 + t * 5);
    const g = Math.round(5 + t * 8);
    const b = Math.round(12 + t * 16);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  // 1. Draw Heatmap Slice Plane (grid projection)
  if (showSlice) {
    const planeSize = 85;
    const step = 3.5;
    for (let px = -planeSize; px <= planeSize; px += step) {
      for (let pz = -planeSize; pz <= planeSize; pz += step) {
        const pt = project(new Vec3(px, sliceY, pz), camPos, lookAt, width, height);
        if (pt && pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
          const dGA = Math.hypot(px - attractors[0].pos.x, pz - attractors[0].pos.z);
          const dRep = Math.hypot(px - repellerPos.x, pz - repellerPos.z);

          let colR = 25, colG = 185, colB = 75; // Green default
          if (dGA < 30) {
            const t = 1.0 - dGA / 30.0;
            colR = Math.round(225 + t * 30);
            colG = Math.round(125 - t * 65);
            colB = 15;
          } else if (dRep < 32) {
            const t = 1.0 - dRep / 32.0;
            colR = Math.round(10 - t * 5);
            colG = Math.round(140 - t * 80);
            colB = Math.round(220 + t * 35);
          }

          const idx = (pt.y * width + pt.x) * 4;
          if (pt.z < zBuf[pt.y * width + pt.x]) {
            zBuf[pt.y * width + pt.x] = pt.z;
            buf[idx] = Math.round(buf[idx] * 0.35 + colR * 0.65);
            buf[idx + 1] = Math.round(buf[idx + 1] * 0.35 + colG * 0.65);
            buf[idx + 2] = Math.round(buf[idx + 2] * 0.35 + colB * 0.65);
          }
        }
      }
    }
  }

  // 2. Draw Streamlines
  if (showStreamlines) {
    for (let sl of streamlines) {
      const pts = sl.pts;
      for (let j = 0; j < pts.length - 1; j++) {
        const pA = pts[j];
        const pB = pts[j + 1];
        const sA = project(pA, camPos, lookAt, width, height);
        const sB = project(pB, camPos, lookAt, width, height);

        if (!sA || !sB) continue;

        let sr = 245, sg = 248, sb = 255;
        if (sl.isComa) {
          sr = 220; sg = 240; sb = 255;
        } else {
          const dGA = Math.hypot(pA.x - attractors[0].pos.x, pA.y - attractors[0].pos.y, pA.z - attractors[0].pos.z);
          if (dGA < 24.0) {
            sr = 255; sg = 175; sb = 45;
          } else if (pA.x > 5 && pA.z > 0) {
            sr = 0; sg = 225; sb = 255;
          }
        }

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
  }

  // 3. Draw 3D Shaded Cluster Spheres
  if (showSpheres) {
    const sphereNodes = [
      { pos: attractors[0].pos, r: 8, col: [255, 200, 100] },
      { pos: attractors[1].pos, r: 7, col: [255, 180, 80] },
      { pos: attractors[3].pos, r: 6, col: [220, 240, 255] },
      { pos: comaCenter, r: 7, col: [210, 235, 255] },
      { pos: hydraPos, r: 5, col: [230, 240, 255] },
      { pos: antliaPos, r: 5, col: [180, 225, 255] },
      { pos: new Vec3(-45, -4, 68), r: 6, col: [240, 245, 255] },
      { pos: new Vec3(42, -8, 62), r: 6, col: [240, 245, 255] }
    ];

    for (let s of sphereNodes) {
      const sp = project(s.pos, camPos, lookAt, width, height);
      if (sp && sp.x >= 0 && sp.x < width && sp.y >= 0 && sp.y < height) {
        const radPix = Math.max(3, Math.round(s.r * (200 / sp.z)));
        for (let dy = -radPix; dy <= radPix; dy++) {
          for (let dx = -radPix; dx <= radPix; dx++) {
            const dist = Math.hypot(dx, dy);
            if (dist <= radPix) {
              const px = sp.x + dx;
              const py = sp.y + dy;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                const shade = 1.0 - (dist / radPix) * 0.6;
                buf[idx] = Math.min(255, Math.round(s.col[0] * shade));
                buf[idx + 1] = Math.min(255, Math.round(s.col[1] * shade));
                buf[idx + 2] = Math.min(255, Math.round(s.col[2] * shade));
              }
            }
          }
        }
      }
    }
  }

  // 4. Draw Galaxies
  if (showGalaxies) {
    for (let g of galaxies) {
      const s = project(g, camPos, lookAt, width, height);
      if (s && s.x >= 1 && s.x < width - 1 && s.y >= 1 && s.y < height - 1) {
        const idx = (s.y * width + s.x) * 4;
        buf[idx] = 255;
        buf[idx + 1] = 255;
        buf[idx + 2] = 255;
        buf[idx - 4] = Math.min(255, buf[idx - 4] + 90);
        buf[idx + 4] = Math.min(255, buf[idx + 4] + 90);
        buf[((s.y - 1) * width + s.x) * 4] = Math.min(255, buf[((s.y - 1) * width + s.x) * 4] + 90);
        buf[((s.y + 1) * width + s.x) * 4] = Math.min(255, buf[((s.y + 1) * width + s.x) * 4] + 90);
      }
    }
  }

  // 5. Draw 3D Billboard Labels
  if (showLabels) {
    const labelItems = [
      { name: 'The Great Attractor', pos: attractors[0].pos, color: [255, 185, 60] },
      { name: 'Centaurus', pos: attractors[1].pos, color: [255, 195, 80] },
      { name: 'Virgo', pos: attractors[3].pos, color: [180, 215, 255] },
      { name: 'Milky Way', pos: milkyWayPos, color: [0, 240, 210] },
      { name: 'Coma', pos: comaCenter, color: [190, 220, 255] },
      { name: 'Hydra', pos: hydraPos, color: [210, 230, 255] },
      { name: 'Antlia', pos: antliaPos, color: [100, 210, 255] }
    ];

    for (let item of labelItems) {
      const sp = project(item.pos, camPos, lookAt, width, height);
      if (sp && sp.x >= 20 && sp.x < width - 60 && sp.y >= 20 && sp.y < height - 20) {
        // Draw marker dot
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const px = sp.x + dx;
            const py = sp.y + dy;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              buf[idx] = item.color[0];
              buf[idx + 1] = item.color[1];
              buf[idx + 2] = item.color[2];
            }
          }
        }
        // Draw simulated label badge box
        const badgeW = 48;
        const badgeH = 8;
        const bx = sp.x - 24;
        const by = sp.y - 14;
        for (let ly = 0; ly < badgeH; ly++) {
          for (let lx = 0; lx < badgeW; lx++) {
            const px = bx + lx;
            const py = by + ly;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              buf[idx] = Math.round(buf[idx] * 0.3 + 240 * 0.7);
              buf[idx + 1] = Math.round(buf[idx + 1] * 0.3 + 245 * 0.7);
              buf[idx + 2] = Math.round(buf[idx + 2] * 0.3 + 255 * 0.7);
            }
          }
        }
      }
    }
  }

  // 6. Draw HUD Dock Overlay for GIF Studio section
  if (hudOverlay === 'studio') {
    const dockW = 160;
    const dockH = 50;
    const dx = width - dockW - 14;
    const dy = height - dockH - 14;

    for (let y = 0; y < dockH; y++) {
      for (let x = 0; x < dockW; x++) {
        const px = dx + x;
        const py = dy + y;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          buf[idx] = Math.round(buf[idx] * 0.2 + 15 * 0.8);
          buf[idx + 1] = Math.round(buf[idx + 1] * 0.2 + 25 * 0.8);
          buf[idx + 2] = Math.round(buf[idx + 2] * 0.2 + 40 * 0.8);
        }
      }
    }

    // Red record button in dock
    const rbx = dx + 14;
    const rby = dy + 16;
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 132; x++) {
        const px = rbx + x;
        const py = rby + y;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          buf[idx] = 230;
          buf[idx + 1] = 40;
          buf[idx + 2] = 60;
        }
      }
    }
  }

  return buf;
}

/**
 * Generic Helper to generate a standardized section GIF
 */
async function generateSectionGif(filename, framesCallback, options = {}) {
  const width = options.width || 560;
  const height = options.height || 315;
  const totalFrames = options.frames || 24;
  const fps = options.fps || 18;
  const delay = Math.round(1000 / fps);

  const encoder = new GIFEncoder();

  for (let f = 0; f < totalFrames; f++) {
    const t = f / totalFrames;
    const frameOpts = framesCallback(t, f, totalFrames);
    const rgba = renderFrame(
      frameOpts.camPos,
      frameOpts.lookAt,
      width,
      height,
      t,
      frameOpts.renderOpts || {}
    );
    const palette = quantize(rgba, 128);
    const index = applyPalette(rgba, palette);

    encoder.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0
    });
  }

  encoder.finish();
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, encoder.bytes());
  const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
  console.log(`✅ [${filename}] generated: ${sizeKB} KB`);
}

async function main() {
  console.log('--- Generating 8 Explanatory GIFs ---');

  // 1. The Great Attractor & Centaurus Convergence Vortex
  await generateSectionGif('sec-1-great-attractor.gif', (t) => {
    const target = attractors[0].pos; // (-38, 2, -5)
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 48 * Math.cos(angle), target.y + 24 + Math.sin(angle * 2) * 6, target.z + 48 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: true, showSpheres: true } };
  });

  // 2. Dipole Repeller & Blue Cosmic Void Outflow
  await generateSectionGif('sec-2-dipole-repeller.gif', (t) => {
    const target = repellerPos; // (32, -4, 18)
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 52 * Math.cos(angle), target.y + 26 + Math.sin(angle * 2) * 5, target.z + 52 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: true } };
  });

  // 3. Coma High-Latitude Vertical Fountain Loops
  await generateSectionGif('sec-3-coma-fountain.gif', (t) => {
    const target = comaCenter; // (5, 45, -25)
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 45 * Math.cos(angle), target.y + 15 + Math.sin(angle) * 8, target.z + 45 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: false, showStreamlines: true, showGalaxies: true, showSpheres: true } };
  });

  // 4. Virgo Cluster & Milky Way Local Filament Bridge
  await generateSectionGif('sec-4-virgo-milkyway.gif', (t) => {
    const target = attractors[3].pos; // Virgo (-8, 3, 0)
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 38 * Math.cos(angle), target.y + 18 + Math.sin(angle * 2) * 4, target.z + 38 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: true, showSpheres: true } };
  });

  // 5. GPU Dynamic Scalar Potential Heatmap Slice & Contours
  await generateSectionGif('sec-5-scalar-slice.gif', (t) => {
    const target = new Vec3(-8, 0, -6);
    const camPos = new Vec3(-8, 140, 60);
    const sliceY = Math.sin(t * Math.PI * 2) * 14.0;
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: false, sliceY } };
  });

  // 6. 3D Cluster Shaded Spheres & 18,000+ Galaxy Swarm
  await generateSectionGif('sec-6-cluster-spheres.gif', (t) => {
    const target = new Vec3(-15, 6, 8);
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 65 * Math.cos(angle), target.y + 32, target.z + 65 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: false, showStreamlines: false, showGalaxies: true, showSpheres: true } };
  });

  // 7. 12 Authentic 3D Billboard Labels & Occlusion Scaling
  await generateSectionGif('sec-7-billboard-labels.gif', (t) => {
    const target = new Vec3(-10, 8, -6);
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 120 * Math.cos(angle), target.y + 60, target.z + 120 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: true, showLabels: true } };
  });

  // 8. Deterministic 360° GIF & WebM Recording Studio Dock
  await generateSectionGif('sec-8-gif-studio.gif', (t) => {
    const target = new Vec3(-10, 8, -6);
    const angle = t * Math.PI * 2;
    const camPos = new Vec3(target.x + 135 * Math.cos(angle), target.y + 65, target.z + 135 * Math.sin(angle));
    return { camPos, lookAt: target, renderOpts: { showSlice: true, showStreamlines: true, showGalaxies: true, hudOverlay: 'studio' } };
  });

  console.log('🎉 All 8 section GIFs generated successfully in docs/assets/!');
}

main().catch(console.error);
