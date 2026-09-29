import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const targetDirs = [
  path.resolve('docs/linkedin_campaign'),
  path.resolve('campaign_assets'),
  path.resolve('C:/Users/Zhane/Documents/2018 resume/2025+ AFTER DIARY QUEEN/Blockchain/linkined ad campaign adds'),
  path.resolve('D:/programming/Blockchain development/linkined ad campaign adds')
];

for (let d of targetDirs) {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch (e) {}
}

// 1. Simple static HTTP server for dist/
const distDir = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(8080, '127.0.0.1', resolve));
console.log('📡 Local server listening on http://127.0.0.1:8080');

// 2. Launch Chrome with WebGL enabled
console.log('🚀 Launching Chrome WebGL instance...');
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1280,960'
  ]
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle0', timeout: 30000 });
console.log('🌌 CosmoFlow App loaded in Headless Chrome with full WebGL!');

// Wait 2.5 seconds for scene & bloom shaders to warm up
await new Promise((r) => setTimeout(r, 2500));

// 3. Inject deterministic in-browser GIF recorder engine
await page.evaluate(() => {
  // Expose global recording helper
  window.captureLiveWebGLGif = async function(config) {
    const {
      duration = 2.4,
      fps = 16,
      width = 600,
      height = 600,
      maxColors = 128,
      setupFn = null,
      stepFn = null
    } = config;

    const totalFrames = Math.round(duration * fps);
    const delay = Math.round(1000 / fps);
    const app = window.app;

    if (!app) throw new Error('App not initialized');

    // Run setup if provided
    if (setupFn) {
      eval(`(${setupFn})`)(app);
    }

    // Offscreen canvas for frame scaling
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    const frameBase64List = [];

    // Save camera & animation state
    const originalPos = app.camera.position.clone();
    const originalTarget = app.controls.target.clone();

    for (let f = 0; f < totalFrames; f++) {
      const t = f / totalFrames;
      const simTime = f * (1.0 / fps);

      if (stepFn) {
        eval(`(${stepFn})`)(app, t, f, totalFrames, simTime);
      }

      // Render WebGL
      if (app.enableBloom && app.composer) {
        app.composer.render();
      } else {
        app.renderer.render(app.scene, app.camera);
      }

      // Draw WebGL canvas to square offscreen canvas (centered crop)
      const srcW = app.renderer.domElement.width;
      const srcH = app.renderer.domElement.height;
      const minDim = Math.min(srcW, srcH);
      const sx = (srcW - minDim) / 2;
      const sy = (srcH - minDim) / 2;

      ctx.drawImage(app.renderer.domElement, sx, sy, minDim, minDim, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const bytes = new Uint8Array(imgData.data.buffer);
      
      // Fast chunked binary to base64
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      frameBase64List.push(btoa(binary));
    }

    // Restore camera
    app.camera.position.copy(originalPos);
    app.controls.target.copy(originalTarget);
    app.controls.update();

    return {
      frames: frameBase64List,
      width,
      height,
      delay,
      totalFrames
    };
  };
});

// Import gifenc in Node for encoding
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

// 4. Define the 20 Campaign Clips
const campaignClips = [
  {
    name: 'ad-01-hero-full-orbit.gif',
    title: 'Ad 1: Hero 360° Orbit',
    duration: 3.0,
    fps: 16,
    setup: `(app) => {
      app.setReferenceCamera(true);
      if (app.streamlineRenderer) app.streamlineRenderer.isAnimated = true;
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 155;
      app.camera.position.set(-10 + Math.cos(angle) * rad, 78 + Math.sin(angle * 2) * 12, -8 + Math.sin(angle) * rad);
      app.controls.target.set(-10, 4, -8);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-02-great-attractor-basin.gif',
    title: 'Ad 2: Great Attractor Basin',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-65, 30, 25);
      app.controls.target.set(-38, 2, -5);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 38;
      app.camera.position.set(-38 + Math.cos(angle) * rad, 25 + Math.sin(angle) * 8, -5 + Math.sin(angle) * rad);
      app.controls.target.set(-38, 2, -5);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.5);
    }`
  },
  {
    name: 'ad-03-coma-fountain-apex.gif',
    title: 'Ad 3: Coma Fountain Apex',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(5, 75, 45);
      app.controls.target.set(5, 45, -25);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 42;
      app.camera.position.set(5 + Math.cos(angle) * rad, 65 + Math.sin(angle) * 10, -25 + Math.sin(angle) * rad);
      app.controls.target.set(5, 45, -25);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-04-centaurus-core-convergence.gif',
    title: 'Ad 4: Centaurus Core Convergence',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-58, 28, 35);
      app.controls.target.set(-34, 6, 2);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 36;
      app.camera.position.set(-34 + Math.cos(angle) * rad, 24 + Math.sin(angle) * 6, 2 + Math.sin(angle) * rad);
      app.controls.target.set(-34, 6, 2);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.2);
    }`
  },
  {
    name: 'ad-05-virgo-cluster-stream.gif',
    title: 'Ad 5: Virgo Cluster Local Inflow',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-28, 24, 30);
      app.controls.target.set(-8, 3, 0);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 32;
      app.camera.position.set(-8 + Math.cos(angle) * rad, 20 + Math.sin(angle) * 6, 0 + Math.sin(angle) * rad);
      app.controls.target.set(-8, 3, 0);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-06-milky-way-beacon.gif',
    title: 'Ad 6: Milky Way Cyan Beacon',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-24, 12, 22);
      app.controls.target.set(-10, -1, 4);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 24;
      app.camera.position.set(-10 + Math.cos(angle) * rad, 10 + Math.sin(angle) * 4, 4 + Math.sin(angle) * rad);
      app.controls.target.set(-10, -1, 4);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-07-hydra-antlia-corridor.gif',
    title: 'Ad 7: Hydra & Antlia Corridor',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-45, 26, 48);
      app.controls.target.set(-21, 6, 20);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 35;
      app.camera.position.set(-21 + Math.cos(angle) * rad, 22 + Math.sin(angle) * 6, 20 + Math.sin(angle) * rad);
      app.controls.target.set(-21, 6, 20);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-08-dipole-repeller-void.gif',
    title: 'Ad 8: Dipole Repeller Cosmic Void',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(55, 22, 45);
      app.controls.target.set(32, -4, 18);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      const rad = 36;
      app.camera.position.set(32 + Math.cos(angle) * rad, 18 + Math.sin(angle) * 6, 18 + Math.sin(angle) * rad);
      app.controls.target.set(32, -4, 18);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-09-top-down-architectural-plane.gif',
    title: 'Ad 9: Top-Down Architectural Plane',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-10, 185, -8);
      app.controls.target.set(-10, 0, -8);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(-10 + Math.cos(angle) * 15, 185, -8 + Math.sin(angle) * 15);
      app.controls.target.set(-10, 0, -8);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-10-rk4-streamlines-velocity-flow.gif',
    title: 'Ad 10: RK4 Velocity Flow Vectors',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-45, 45, 60);
      app.controls.target.set(-25, 4, 0);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 3.5);
    }`
  },
  {
    name: 'ad-11-density-slice-y-elevation-scrub.gif',
    title: 'Ad 11: GPU Slice Y-Elevation Scrub',
    duration: 3.0,
    fps: 16,
    setup: `(app) => {
      app.setReferenceCamera(true);
    }`,
    step: `(app, t, f, n, simTime) => {
      const sliceY = Math.sin(t * Math.PI * 2) * 25;
      if (app.slicePlaneMesh) {
        app.slicePlaneMesh.group.position.y = sliceY;
      }
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 1.5);
    }`
  },
  {
    name: 'ad-12-isopotential-contours-grid.gif',
    title: 'Ad 12: Isopotential Contours & Grid',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-25, 110, 30);
      app.controls.target.set(-25, 0, 0);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(-25 + Math.cos(angle) * 12, 110, Math.sin(angle) * 12);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 1.5);
    }`
  },
  {
    name: 'ad-13-18k-galaxy-swarm-shimmer.gif',
    title: 'Ad 13: 18,000 Galaxy Swarm Shimmer',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-35, 18, 30);
      app.controls.target.set(-28, 4, 5);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      if (app.galaxySwarm) app.galaxySwarm.update(simTime);
      const angle = t * Math.PI * 2;
      app.camera.position.set(-35 + Math.cos(angle) * 8, 18, 30 + Math.sin(angle) * 8);
      app.camera.lookAt(app.controls.target);
    }`
  },
  {
    name: 'ad-14-unreal-bloom-post-processing.gif',
    title: 'Ad 14: UnrealBloom Post-Processing',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-38, 35, 55);
      app.controls.target.set(-20, 5, -5);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-15-velocity-cones-density.gif',
    title: 'Ad 15: Conical Directional Arrowheads',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-35, 14, 25);
      app.controls.target.set(-25, 4, 5);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 3.0);
    }`
  },
  {
    name: 'ad-16-coma-loops-fountain-isolation.gif',
    title: 'Ad 16: Coma Northern Fountain Loops',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(25, 55, 30);
      app.controls.target.set(5, 40, -20);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(5 + Math.cos(angle) * 45, 55, -20 + Math.sin(angle) * 45);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-17-cinematic-waypoint-tour.gif',
    title: 'Ad 17: Cinematic Waypoint Tour',
    duration: 3.2,
    fps: 16,
    setup: `(app) => {
      app.setReferenceCamera(true);
    }`,
    step: `(app, t, f, n, simTime) => {
      // Smooth spline through waypoints
      // Smooth spline through waypoints using plain arrays
      const wpts = [
        [-10, 80, 140],
        [-55, 35, 45],
        [15, 65, 35],
        [-20, 20, 25],
        [-10, 80, 140]
      ];
      const seg = t * (wpts.length - 1);
      const idx = Math.floor(seg);
      const frac = seg - idx;
      const p1 = wpts[idx];
      const p2 = wpts[Math.min(idx + 1, wpts.length - 1)];
      const x = p1[0] + (p2[0] - p1[0]) * frac;
      const y = p1[1] + (p2[1] - p1[1]) * frac;
      const z = p1[2] + (p2[2] - p1[2]) * frac;
      app.camera.position.set(x, y, z);
      app.controls.target.set(-15, 4, -5);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-18-client-recorder-studio-hud.gif',
    title: 'Ad 18: In-Browser Recording Studio',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-15, 60, 110);
      app.controls.target.set(-10, 4, -8);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(-10 + Math.cos(angle) * 110, 60, -8 + Math.sin(angle) * 110);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-19-glossy-physical-clusters.gif',
    title: 'Ad 19: Glossy Physical Clusters',
    duration: 2.5,
    fps: 16,
    setup: `(app) => {
      app.camera.position.set(-48, 16, 18);
      app.controls.target.set(-34, 6, 2);
      app.camera.lookAt(app.controls.target);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(-34 + Math.cos(angle) * 22, 14 + Math.sin(angle) * 4, 2 + Math.sin(angle) * 22);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  },
  {
    name: 'ad-20-full-dashboard-telemetry-hud.gif',
    title: 'Ad 20: Full Cosmological Dashboard',
    duration: 3.0,
    fps: 16,
    setup: `(app) => {
      app.setReferenceCamera(true);
    }`,
    step: `(app, t, f, n, simTime) => {
      const angle = t * Math.PI * 2;
      app.camera.position.set(-10 + Math.cos(angle) * 145, 78 + Math.sin(angle) * 10, -8 + Math.sin(angle) * 145);
      app.camera.lookAt(app.controls.target);
      if (app.streamlineRenderer) app.streamlineRenderer.updateArrowTransforms(simTime * 2.0);
    }`
  }
];

// 5. Execute All 20 Captures
console.log(`🎬 Capturing ${campaignClips.length} authentic WebGL campaign GIFs...`);

for (let i = 0; i < campaignClips.length; i++) {
  const clip = campaignClips[i];
  
  // Check if already rendered
  const firstDest = path.join(targetDirs[0], clip.name);
  if (fs.existsSync(firstDest) && fs.statSync(firstDest).size > 200000) {
    console.log(`\n[${i + 1}/${campaignClips.length}] ⏭️ Clip "${clip.title}" already rendered (${Math.round(fs.statSync(firstDest).size / 1024)} KB), copying to destinations...`);
    const existingBytes = fs.readFileSync(firstDest);
    for (let destDir of targetDirs.slice(1)) {
      fs.writeFileSync(path.join(destDir, clip.name), existingBytes);
    }
    continue;
  }

  console.log(`\n[${i + 1}/${campaignClips.length}] Capturing "${clip.title}" -> ${clip.name}...`);

  const result = await page.evaluate(async (config) => {
    return await window.captureLiveWebGLGif(config);
  }, {
    duration: clip.duration,
    fps: clip.fps,
    width: 600,
    height: 600,
    maxColors: 128,
    setupFn: clip.setup,
    stepFn: clip.step
  });

  const { frames, width, height, delay, totalFrames } = result;
  console.log(`  Encoding ${totalFrames} frames with gifenc (${width}x${height})...`);

  const encoder = GIFEncoder();

  for (let f = 0; f < frames.length; f++) {
    const rawRgba = new Uint8Array(Buffer.from(frames[f], 'base64'));
    const palette = quantize(rawRgba, 128);
    const index = applyPalette(rawRgba, palette);
    encoder.writeFrame(index, width, height, { palette, delay });
  }

  encoder.finish();
  const gifBytes = Buffer.from(encoder.bytes());

  for (let destDir of targetDirs) {
    const outPath = path.join(destDir, clip.name);
    fs.writeFileSync(outPath, gifBytes);
  }

  console.log(`  ✅ Saved to all target folders (${Math.round(gifBytes.length / 1024)} KB)`);
}

await browser.close();
server.close();
console.log('\n🎉 ALL 20 AUTHENTIC WEBGL CAMPAIGN GIFS CAPTURED & SAVED SUCCESSFULLY!');
