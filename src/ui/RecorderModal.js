/**
 * RecorderModal displays the generated GIF / WebM preview with instant download buttons
 */
export class RecorderModal {
  constructor() {
    this.createDOM();
  }

  createDOM() {
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.className = 'rec-modal-overlay';
    this.modalOverlay.style.display = 'none';

    this.modalOverlay.innerHTML = `
      <div class="rec-modal-card">
        <div class="rec-modal-header">
          <div class="rec-modal-title">
            <span class="rec-badge-dot"></span>
            <h3>3D Seamless GIF Capture Ready</h3>
          </div>
          <button class="rec-close-btn" id="rec-modal-close">&times;</button>
        </div>

        <div class="rec-preview-container">
          <img id="rec-gif-preview" class="rec-gif-img" alt="Laniakea 360 GIF" />
        </div>

        <div class="rec-meta-row">
          <div class="rec-meta-item">
            <span class="rec-meta-val" id="rec-meta-res">640 &times; 400</span>
            <span class="rec-meta-label">Resolution</span>
          </div>
          <div class="rec-meta-item">
            <span class="rec-meta-val" id="rec-meta-fps">20 FPS</span>
            <span class="rec-meta-label">Frame Rate</span>
          </div>
          <div class="rec-meta-item">
            <span class="rec-meta-val" id="rec-meta-duration">4.0s</span>
            <span class="rec-meta-label">Duration</span>
          </div>
          <div class="rec-meta-item">
            <span class="rec-meta-val" id="rec-meta-size">1.8 MB</span>
            <span class="rec-meta-label">File Size</span>
          </div>
        </div>

        <div class="rec-actions-row">
          <a id="rec-download-gif" class="rec-btn rec-btn-primary" download="laniakea_360_loop.gif">
            <span>📥</span> Download .GIF
          </a>
          <a id="rec-download-webm" class="rec-btn rec-btn-secondary" download="laniakea_360_video.webm" style="display: none;">
            <span>🎬</span> Download .WEBM Video
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalOverlay);

    // Close button handler
    const closeBtn = document.getElementById('rec-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.hide();
    });
  }

  show(result) {
    const imgEl = document.getElementById('rec-gif-preview');
    const dlGif = document.getElementById('rec-download-gif');
    const dlWebm = document.getElementById('rec-download-webm');
    const metaRes = document.getElementById('rec-meta-res');
    const metaFps = document.getElementById('rec-meta-fps');
    const metaDuration = document.getElementById('rec-meta-duration');
    const metaSize = document.getElementById('rec-meta-size');

    if (imgEl) imgEl.src = result.gifUrl;
    if (dlGif) dlGif.href = result.gifUrl;

    if (result.webmUrl && dlWebm) {
      dlWebm.href = result.webmUrl;
      dlWebm.style.display = 'inline-flex';
    } else if (dlWebm) {
      dlWebm.style.display = 'none';
    }

    if (metaRes) metaRes.textContent = `${result.width} × ${result.height}`;
    if (metaFps) metaFps.textContent = `${result.fps} FPS`;
    if (metaDuration) metaDuration.textContent = `${result.duration}s`;
    if (metaSize) metaSize.textContent = `${result.sizeKB} KB`;

    this.modalOverlay.style.display = 'flex';
  }

  hide() {
    this.modalOverlay.style.display = 'none';
  }
}
