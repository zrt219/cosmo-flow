import { RecorderModal } from './RecorderModal.js';

/**
 * RecordingDock creates a floating HUD panel for camera automation,
 * auto-orbit toggling, cinematic tours, and 1-click seamless loop GIF recording.
 */
export class RecordingDock {
  constructor(app) {
    this.app = app;
    this.modal = new RecorderModal();

    this.duration = 4.0;
    this.resolution = 640;
    this.fps = 20;

    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    this.dockEl = document.createElement('div');
    this.dockEl.className = 'rec-dock-panel';

    this.dockEl.innerHTML = `
      <div class="rec-dock-header">
        <span class="rec-dock-title">Camera & GIF Studio</span>
        <div class="rec-dock-status" id="rec-dock-status">Ready</div>
      </div>

      <div class="rec-dock-controls">
        <!-- 360 Auto Orbit Toggle Button -->
        <button class="rec-dock-btn active" id="btn-toggle-orbit" title="Toggle 360° Continuous Orbit">
          <span class="rec-btn-icon">🔄</span>
          <span id="txt-toggle-orbit">Auto-Orbit ON</span>
        </button>

        <!-- Cinematic Guided Tour Button -->
        <button class="rec-dock-btn" id="btn-toggle-tour" title="Start Guided Tour of Supercluster">
          <span class="rec-btn-icon">🎬</span>
          <span id="txt-toggle-tour">Cinematic Tour</span>
        </button>

        <!-- Record Seamless Loop GIF Button -->
        <button class="rec-dock-btn rec-btn-record" id="btn-record-gif" title="Capture Seamless 360° Looping GIF">
          <span class="rec-record-dot"></span>
          <span id="txt-record-gif">Record 360° GIF</span>
        </button>
      </div>

      <!-- Recording Options Pills -->
      <div class="rec-dock-pills">
        <div class="rec-pill-group">
          <span class="rec-pill-label">Duration:</span>
          <button class="rec-pill" data-dur="3.0">3s</button>
          <button class="rec-pill active" data-dur="4.0">4s</button>
          <button class="rec-pill" data-dur="6.0">6s</button>
        </div>
        <div class="rec-pill-group">
          <span class="rec-pill-label">Quality:</span>
          <button class="rec-pill active" data-res="640">480p</button>
          <button class="rec-pill" data-res="800">720p</button>
        </div>
      </div>

      <!-- Live Progress Bar (Hidden during idle) -->
      <div class="rec-progress-container" id="rec-progress-container" style="display: none;">
        <div class="rec-progress-info">
          <span id="rec-progress-phase">Capturing 360° Loop...</span>
          <span id="rec-progress-pct">0%</span>
        </div>
        <div class="rec-progress-track">
          <div class="rec-progress-fill" id="rec-progress-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.dockEl);
  }

  bindEvents() {
    const btnOrbit = document.getElementById('btn-toggle-orbit');
    const txtOrbit = document.getElementById('txt-toggle-orbit');
    const btnTour = document.getElementById('btn-toggle-tour');
    const txtTour = document.getElementById('txt-toggle-tour');
    const btnRecord = document.getElementById('btn-record-gif');
    const txtRecord = document.getElementById('txt-record-gif');

    const progressContainer = document.getElementById('rec-progress-container');
    const progressPhase = document.getElementById('rec-progress-phase');
    const progressPct = document.getElementById('rec-progress-pct');
    const progressFill = document.getElementById('rec-progress-fill');
    const statusEl = document.getElementById('rec-dock-status');

    // 1. Auto-Orbit toggle
    if (btnOrbit) {
      btnOrbit.addEventListener('click', () => {
        const nextState = !this.app.cameraController.autoOrbit;
        this.app.cameraController.autoOrbit = nextState;
        btnOrbit.classList.toggle('active', nextState);
        txtOrbit.textContent = nextState ? 'Auto-Orbit ON' : 'Auto-Orbit OFF';
      });
    }

    // 2. Cinematic Tour toggle
    if (btnTour) {
      btnTour.addEventListener('click', () => {
        const isActive = this.app.cameraController.toggleTour();
        btnTour.classList.toggle('active', isActive);
        txtTour.textContent = isActive ? 'Stop Tour' : 'Cinematic Tour';
        if (isActive && btnOrbit) {
          btnOrbit.classList.remove('active');
          txtOrbit.textContent = 'Auto-Orbit OFF';
        }
      });
    }

    // 3. Duration & Resolution pills
    document.querySelectorAll('.rec-pill[data-dur]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rec-pill[data-dur]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.duration = parseFloat(btn.getAttribute('data-dur'));
      });
    });

    document.querySelectorAll('.rec-pill[data-res]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rec-pill[data-res]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.resolution = parseInt(btn.getAttribute('data-res'), 10);
      });
    });

    // 4. Record 360° GIF
    if (btnRecord) {
      btnRecord.addEventListener('click', async () => {
        if (this.app.gifRecorder.isRecording) return;

        btnRecord.disabled = true;
        btnRecord.classList.add('recording');
        txtRecord.textContent = 'Recording...';
        progressContainer.style.display = 'block';
        if (statusEl) {
          statusEl.textContent = 'Recording';
          statusEl.classList.add('recording');
        }

        this.app.gifRecorder.progressCallback = (info) => {
          if (info.phase === 'recording') {
            const pct = Math.round(info.progress * 100);
            progressPhase.textContent = `Capturing Frame ${info.currentFrame}/${info.totalFrames}...`;
            progressPct.textContent = `${pct}%`;
            progressFill.style.width = `${pct}%`;
          } else if (info.phase === 'encoding') {
            progressPhase.textContent = 'Encoding GIF Palette...';
            progressPct.textContent = '95%';
            progressFill.style.width = '95%';
          } else if (info.phase === 'complete') {
            progressContainer.style.display = 'none';
            btnRecord.disabled = false;
            btnRecord.classList.remove('recording');
            txtRecord.textContent = 'Record 360° GIF';
            if (statusEl) {
              statusEl.textContent = 'Ready';
              statusEl.classList.remove('recording');
            }
            this.modal.show(info);
          }
        };

        await this.app.gifRecorder.recordSeamlessLoop({
          duration: this.duration,
          fps: this.fps,
          width: this.resolution,
          maxColors: 128,
          includeWebM: true
        });
      });
    }
  }
}
