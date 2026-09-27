import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import * as THREE from 'three';

/**
 * GifRecorder provides deterministic frame-by-frame 360° seamless loop GIF rendering
 * and live WebM video capture from the Three.js WebGL canvas.
 */
export class GifRecorder {
  constructor(app) {
    this.app = app;
    this.isRecording = false;
    this.progressCallback = null;

    // Internal offscreen canvas for scaling / frame extraction
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Records a perfectly seamless 360-degree turntable looping GIF
   */
  async recordSeamlessLoop(options = {}) {
    if (this.isRecording) return;
    this.isRecording = true;

    const duration = options.duration || 4.0; // Seconds
    const fps = options.fps || 20;            // Frames per second
    const width = options.width || 640;
    const height = options.height || Math.round(width * (window.innerHeight / window.innerWidth));
    const maxColors = options.maxColors || 128;
    const includeWebM = options.includeWebM !== undefined ? options.includeWebM : true;

    const totalFrames = Math.round(duration * fps);
    const frameDelayMs = Math.round(1000 / fps);

    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    const encoder = new GIFEncoder();

    // Prepare WebM media recorder if supported
    let mediaRecorder = null;
    let videoChunks = [];
    if (includeWebM && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = this.app.renderer.domElement.captureStream(fps);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3500000 });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) videoChunks.push(e.data);
        };
        mediaRecorder.start();
      } catch (err) {
        console.warn('WebM recording not supported on this browser:', err);
      }
    }

    // Cache camera state before recording
    const originalCamPos = this.app.camera.position.clone();
    const originalTarget = this.app.controls.target.clone();
    const originalFov = this.app.camera.fov;
    const wasAutoOrbit = this.app.cameraController.autoOrbit;
    this.app.cameraController.autoOrbit = false;

    // Render loop frames deterministically
    for (let f = 0; f < totalFrames; f++) {
      const t = f / totalFrames; // [0.0, 1.0)
      const simTime = f * (1.0 / fps);

      // 1. Position camera for seamless 360° circle
      const camState = this.app.cameraController.getTurntableStateAt(t, 155, 78, originalTarget);
      this.app.camera.position.copy(camState.cameraPos);
      this.app.controls.target.copy(camState.targetPos);
      this.app.camera.lookAt(camState.targetPos);
      this.app.controls.update();

      // 2. Step animations deterministically
      this.app.streamlineRenderer.updateArrowTransforms(simTime);
      this.app.cosmicLabels.update(simTime);

      // 3. Render WebGL scene
      if (this.app.enableBloom) {
        this.app.composer.render();
      } else {
        this.app.renderer.render(this.app.scene, this.app.camera);
      }

      // 4. Draw to offscreen canvas and extract RGBA buffer
      this.offscreenCtx.drawImage(this.app.renderer.domElement, 0, 0, width, height);
      const imgData = this.offscreenCtx.getImageData(0, 0, width, height);
      const rgba = imgData.data;

      // 5. Quantize and encode GIF frame
      const palette = quantize(rgba, maxColors);
      const index = applyPalette(rgba, palette);
      encoder.writeFrame(index, width, height, {
        palette,
        delay: frameDelayMs,
        repeat: 0 // Infinite seamless loop
      });

      if (this.progressCallback) {
        this.progressCallback({
          phase: 'recording',
          progress: (f + 1) / totalFrames,
          currentFrame: f + 1,
          totalFrames: totalFrames
        });
      }

      // Small async tick to let UI update and browser breathe
      await new Promise(res => setTimeout(res, 12));
    }

    if (this.progressCallback) {
      this.progressCallback({ phase: 'encoding', progress: 0.95 });
    }

    encoder.finish();
    const gifBytes = encoder.bytes();
    const gifBlob = new Blob([gifBytes], { type: 'image/gif' });
    const gifUrl = URL.createObjectURL(gifBlob);

    let webmBlob = null;
    let webmUrl = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise((res) => {
        mediaRecorder.onstop = () => {
          webmBlob = new Blob(videoChunks, { type: 'video/webm' });
          webmUrl = URL.createObjectURL(webmBlob);
          res();
        };
        mediaRecorder.stop();
      });
    }

    // Restore original camera & controls state
    this.app.camera.position.copy(originalCamPos);
    this.app.controls.target.copy(originalTarget);
    this.app.camera.fov = originalFov;
    this.app.camera.updateProjectionMatrix();
    this.app.cameraController.autoOrbit = wasAutoOrbit;
    this.isRecording = false;

    const result = {
      phase: 'complete',
      gifBlob,
      gifUrl,
      webmBlob,
      webmUrl,
      sizeKB: Math.round(gifBlob.size / 1024),
      duration,
      fps,
      width,
      height
    };

    if (this.progressCallback) {
      this.progressCallback(result);
    }

    return result;
  }
}
