import { animate, spring, stagger } from 'motion';
import * as THREE from 'three';

/**
 * MotionEngine coordinates Motion One animations and physics transitions
 * across UI components, camera intros, HUD stats, and celestial labels.
 */
export class MotionEngine {
  constructor(app) {
    this.app = app;
    this.hudHeader = document.querySelector('.hud-header');
    this.hudBottomBar = document.querySelector('.hud-bottom-bar');
    this.recDockPanel = document.querySelector('.rec-dock-panel');

    this.introActive = false;
    this.introProgress = 0;
    this.introDuration = 4.2; // Smooth 4.2s flythrough

    // Intro camera parameters starting deep at Great Attractor core zooming out to reference
    this.startPos = new THREE.Vector3(-38, 2, -5);
    this.startTarget = new THREE.Vector3(-38, 2, -5);
    this.endPos = new THREE.Vector3(-12, 100, 135);
    this.endTarget = new THREE.Vector3(-10, 4, -8);
    this.startFov = 26;
    this.endFov = 46;
  }

  stopIntro() {
    this.introActive = false;
    const overlay = document.querySelector('.intro-overlay');
    if (overlay) {
      animate(overlay, { opacity: [1, 0] }, { duration: 0.3 }).finished.then(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
    }
    if (this.app.cosmicLabels) {
      this.app.cosmicLabels.setOpacity(0.95);
    }
  }

  /**
   * Starts the cinematic flythrough intro sequence
   */
  async playIntroSequence() {
    // 1. Create full-screen dark title card overlay with pointer-events: none
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    overlay.style.pointerEvents = 'none';

    const title = document.createElement('div');
    title.className = 'intro-title';

    const text = 'LANIAKEA';
    title.innerHTML = text
      .split('')
      .map(
        char =>
          `<span class="intro-letter" style="display:inline-block; opacity:0; transform:scale(0.7) translateY(15px);">${char}</span>`
      )
      .join('');

    const subtitle = document.createElement('div');
    subtitle.className = 'intro-subtitle';
    subtitle.textContent = '3D Peculiar Velocity & Cosmic Flow Dynamics';
    subtitle.style.opacity = '0';
    subtitle.style.transform = 'translateY(20px)';

    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    document.body.appendChild(overlay);

    // Initial camera placement at the Great Attractor convergence point
    this.introActive = true;
    this.introProgress = 0;

    if (this.app.camera) {
      this.app.camera.position.copy(this.startPos);
      this.app.camera.fov = this.startFov;
      this.app.camera.updateProjectionMatrix();

      if (this.app.controls) {
        this.app.controls.target.copy(this.startTarget);
        this.app.controls.update();
      }
    }

    // Hide labels initially during flyout
    if (this.app.cosmicLabels) {
      this.app.cosmicLabels.setOpacity(0);
    }

    // Motion One animation sequence for title card typography
    const letters = overlay.querySelectorAll('.intro-letter');
    
    // Letters entrance stagger
    animate(
      letters,
      { opacity: [0, 1], transform: ['scale(0.7) translateY(15px)', 'scale(1) translateY(0)'] },
      { duration: 0.9, delay: stagger(0.08), easing: 'ease-out' }
    );

    // Subtitle entrance
    setTimeout(() => {
      animate(
        subtitle,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration: 0.8, easing: 'ease-out' }
      );
    }, 450);

    // Fade out after hold
    setTimeout(() => {
      animate(
        title,
        { opacity: [1, 0], transform: ['scale(1)', 'scale(1.06)'] },
        { duration: 0.9, easing: 'ease-in' }
      );
      animate(
        subtitle,
        { opacity: [1, 0], transform: ['translateY(0)', 'translateY(-10px)'] },
        { duration: 0.8, easing: 'ease-in' }
      );
      animate(
        overlay,
        { opacity: [1, 0] },
        { duration: 0.9, easing: 'ease-in-out' }
      ).finished.then(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
    }, 3200);
  }

  /**
   * Per-frame camera update during flythrough intro
   */
  update(delta) {
    if (!this.introActive) return;

    this.introProgress += delta;
    const t = Math.min(this.introProgress / this.introDuration, 1.0);

    // Quintic / smoothstep-like easing curve for majestic camera pull-back
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (this.app.camera) {
      this.app.camera.position.lerpVectors(this.startPos, this.endPos, easeT);
      this.app.camera.fov = THREE.MathUtils.lerp(this.startFov, this.endFov, easeT);
      this.app.camera.updateProjectionMatrix();

      if (this.app.controls) {
        this.app.controls.target.lerpVectors(this.startTarget, this.endTarget, easeT);
        this.app.controls.update();
      } else {
        this.app.camera.lookAt(this.endTarget);
      }
    }

    if (t >= 1.0) {
      this.introActive = false;
      this.revealHUD();
      this.revealLabels();
    }
  }

  /**
   * Staggered spring reveal of the observatory HUD panels & animated stat counters
   */
  revealHUD() {
    this.hudHeader = this.hudHeader || document.querySelector('.hud-header');
    this.hudBottomBar = this.hudBottomBar || document.querySelector('.hud-bottom-bar');
    this.recDockPanel = this.recDockPanel || document.querySelector('.rec-dock-panel');

    if (this.hudHeader) {
      animate(
        this.hudHeader,
        { opacity: [0, 1], transform: ['translate(-30px, -20px)', 'translate(0, 0)'] },
        { duration: 0.55, easing: spring({ stiffness: 280, damping: 22 }) }
      );
    }

    if (this.hudBottomBar) {
      animate(
        this.hudBottomBar,
        { opacity: [0, 1], transform: ['translate(-50%, 40px)', 'translate(-50%, 0)'] },
        { duration: 0.55, delay: 0.15, easing: spring({ stiffness: 280, damping: 22 }) }
      );
    }

    if (this.recDockPanel) {
      animate(
        this.recDockPanel,
        { opacity: [0, 1], transform: ['translateX(40px)', 'translateX(0)'] },
        { duration: 0.55, delay: 0.28, easing: spring({ stiffness: 280, damping: 22 }) }
      );
    }

    // Lil-gui smooth reveal
    const lilGui = document.querySelector('.lil-gui');
    if (lilGui) {
      animate(
        lilGui,
        { opacity: [0, 1], transform: ['translateX(30px)', 'translateX(0)'] },
        { duration: 0.6, delay: 0.35, easing: spring({ stiffness: 260, damping: 20 }) }
      );
    }

    // Number ticker counters for HUD metrics
    const stats = [
      { id: 'stat-streamlines', target: this.app.streamlineRenderer?.streamlineCount || 320 },
      { id: 'stat-galaxies', target: this.app.galaxySwarm?.count || 18000 },
      { id: 'stat-arrows', target: this.app.streamlineRenderer?.arrowCount || 1400 },
      { id: 'stat-fps', target: 60 }
    ];

    stats.forEach(({ id, target }) => {
      const el = document.getElementById(id);
      if (el) {
        animate(0, target, {
          duration: 1.8,
          easing: 'ease-out',
          onUpdate: latest => {
            el.textContent = Math.round(latest).toLocaleString();
          }
        });
      }
    });
  }

  /**
   * Staggered spring entrance for all 12 celestial billboard labels
   */
  revealLabels() {
    if (!this.app.cosmicLabels || !this.app.cosmicLabels.labels) return;

    const labels = this.app.cosmicLabels.labels;
    this.app.cosmicLabels.setOpacity(0.95);

    labels.forEach((item, idx) => {
      if (!item.sprite) return;

      const baseScale = item.baseW;
      const baseH = item.baseH;

      // Start at scale 0
      item.sprite.scale.set(0.001, 0.001, 1.0);
      item.sprite.material.opacity = 0.0;

      setTimeout(() => {
        animate(0, 1, {
          duration: 0.65,
          easing: spring({ stiffness: 220, damping: 16 }),
          onUpdate: latest => {
            if (item.sprite) {
              item.sprite.scale.set(baseScale * latest, baseH * latest, 1.0);
              item.sprite.material.opacity = 0.95 * Math.min(1.0, latest * 1.2);
            }
          }
        });
      }, idx * 60); // 60ms progressive stagger
    });
  }

  /**
   * Bouncy spring animation on preset button clicks
   */
  animatePresetButton(button) {
    if (!button) return;
    animate(
      button,
      { transform: ['scale(0.92)', 'scale(1.0)'] },
      { duration: 0.35, easing: spring({ stiffness: 420, damping: 14 }) }
    );
  }

  /**
   * Spring micro-interaction for generic button clicks
   */
  animateButtonPress(element) {
    if (!element) return;
    animate(
      element,
      { transform: ['scale(0.94)', 'scale(1.0)'] },
      { duration: 0.28, easing: spring({ stiffness: 450, damping: 15 }) }
    );
  }

  /**
   * Smooth interactive pill selection spring feedback
   */
  animatePillSelect(pill, pillGroup) {
    if (!pill) return;
    if (pillGroup) {
      pillGroup.querySelectorAll('.rec-pill').forEach(p => {
        if (p !== pill) p.classList.remove('active');
      });
    }
    pill.classList.add('active');
    animate(
      pill,
      { transform: ['scale(1.12)', 'scale(1.0)'] },
      { duration: 0.3, easing: spring({ stiffness: 400, damping: 16 }) }
    );
  }

  /**
   * Recording dock state animations
   */
  animateRecordingDock(action) {
    if (!this.recDockPanel) {
      this.recDockPanel = document.querySelector('.rec-dock-panel');
    }
    if (!this.recDockPanel) return;

    if (action === 'startRecording') {
      const btnRecord = document.getElementById('btn-record-gif');
      if (btnRecord) {
        animate(
          btnRecord,
          { transform: ['scale(0.95)', 'scale(1.02)', 'scale(1.0)'] },
          { duration: 0.4, easing: spring({ stiffness: 350, damping: 14 }) }
        );
      }
    } else if (action === 'showProgress') {
      const prog = document.getElementById('rec-progress-container');
      if (prog) {
        prog.style.display = 'block';
        animate(
          prog,
          { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] },
          { duration: 0.3, easing: 'ease-out' }
        );
      }
    }
  }

  /**
   * Spring modal entrance with backdrop blur transition
   */
  showModal(overlayEl) {
    if (!overlayEl) return;
    overlayEl.style.display = 'flex';

    animate(
      overlayEl,
      { opacity: [0, 1], backdropFilter: ['blur(0px)', 'blur(16px)'] },
      { duration: 0.32, easing: 'ease-out' }
    );

    const card = overlayEl.querySelector('.rec-modal-card');
    if (card) {
      animate(
        card,
        {
          opacity: [0, 1],
          transform: ['scale(0.86) translateY(24px)', 'scale(1.0) translateY(0)']
        },
        { duration: 0.45, easing: spring({ stiffness: 320, damping: 20 }) }
      );
    }
  }

  /**
   * Modal exit transition
   */
  hideModal(overlayEl) {
    if (!overlayEl) return;

    const card = overlayEl.querySelector('.rec-modal-card');
    if (card) {
      animate(
        card,
        {
          opacity: [1, 0],
          transform: ['scale(1.0) translateY(0)', 'scale(0.88) translateY(18px)']
        },
        { duration: 0.25, easing: 'ease-in' }
      );
    }

    animate(
      overlayEl,
      { opacity: [1, 0], backdropFilter: ['blur(16px)', 'blur(0px)'] },
      { duration: 0.28, easing: 'ease-in' }
    ).finished.then(() => {
      overlayEl.style.display = 'none';
    });
  }
}

export default MotionEngine;
