import GUI from 'lil-gui';

/**
 * ControlPanel sets up lil-gui controls and HUD interactions
 * faithfully exposing cosmological parameters, viewpoints, and visual toggles.
 */
export class ControlPanel {
  constructor(app) {
    this.app = app;
    this.gui = new GUI({ title: 'Cosmic Flow Parameters', width: 310 });
    this.gui.close(); // Start clean, user can open anytime

    this.initFolders();
    this.initButtons();
  }

  initFolders() {
    const { streamlineRenderer, slicePlaneMesh, galaxySwarm, cosmicField, cosmicLabels } = this.app;
    const galaxyClusters = this.app.galaxyClusters || this.app.clusterEllipsoids;

    // 1. Cosmic Labels & Typography folder
    this.labelFolder = this.gui.addFolder('Cosmic Labels & Typography');
    this.labelParams = {
      showLabels: cosmicLabels?.visible ?? true,
      labelOpacity: cosmicLabels?.baseOpacity ?? 0.95,
      showLeaders: cosmicLabels?.leaderLinesVisible ?? true,
      leaderOpacity: cosmicLabels?.baseLeaderOpacity ?? 0.55,
      labelScale: cosmicLabels?.userScale ?? 1.0
    };

    if (cosmicLabels) {
      this.labelFolder.add(this.labelParams, 'showLabels').name('Show Labels').onChange(v => {
        if (cosmicLabels.setVisible) cosmicLabels.setVisible(v);
      });
      this.labelFolder.add(this.labelParams, 'labelOpacity', 0.1, 1.0, 0.05).name('Label Opacity').onChange(v => {
        if (cosmicLabels.setOpacity) cosmicLabels.setOpacity(v);
      });
      this.labelFolder.add(this.labelParams, 'showLeaders').name('Leader Lines').onChange(v => {
        if (cosmicLabels.setLeaderLinesVisible) cosmicLabels.setLeaderLinesVisible(v);
      });
      this.labelFolder.add(this.labelParams, 'leaderOpacity', 0.0, 1.0, 0.05).name('Leader Opacity').onChange(v => {
        if (cosmicLabels.setLeaderOpacity) cosmicLabels.setLeaderOpacity(v);
      });
      this.labelFolder.add(this.labelParams, 'labelScale', 0.5, 2.5, 0.1).name('Label Scale').onChange(v => {
        if (cosmicLabels.setScale) cosmicLabels.setScale(v);
      });
    }

    // 2. Galaxy Clusters & Swarm folder
    this.clusterFolder = this.gui.addFolder('Galaxy Clusters & Swarm');
    this.clusterParams = {
      showEllipsoids: galaxyClusters?.visible ?? true,
      clusterOpacity: galaxyClusters?.opacity ?? 0.95,
      clusterScale: galaxyClusters?.scaleMultiplier ?? 1.0,
      pulseClusters: galaxyClusters?.pulseEnabled ?? false,
      showGalaxies: galaxySwarm ? (galaxySwarm.visible !== undefined ? galaxySwarm.visible : (galaxySwarm.group?.visible ?? true)) : true,
      count: galaxySwarm?.count ?? 18000,
      pointSize: galaxySwarm?.pointSize ?? 1.6
    };

    if (galaxyClusters) {
      this.clusterFolder.add(this.clusterParams, 'showEllipsoids').name('Cluster Spheres').onChange(v => {
        if (galaxyClusters.setVisible) galaxyClusters.setVisible(v);
      });
      this.clusterFolder.add(this.clusterParams, 'clusterOpacity', 0.1, 1.0, 0.05).name('Cluster Opacity').onChange(v => {
        if (galaxyClusters.setOpacity) galaxyClusters.setOpacity(v);
      });
      this.clusterFolder.add(this.clusterParams, 'clusterScale', 0.4, 2.5, 0.1).name('Cluster Scale').onChange(v => {
        if (galaxyClusters.setScaleMultiplier) galaxyClusters.setScaleMultiplier(v);
      });
      this.clusterFolder.add(this.clusterParams, 'pulseClusters').name('Pulse Clusters').onChange(v => {
        galaxyClusters.pulseEnabled = v;
      });
    }

    if (galaxySwarm) {
      this.clusterFolder.add(this.clusterParams, 'showGalaxies').name('Galaxy Swarm').onChange(v => {
        if (galaxySwarm.setVisible) {
          galaxySwarm.setVisible(v);
        } else if (galaxySwarm.group) {
          galaxySwarm.group.visible = v;
        }
      });
      this.clusterFolder.add(this.clusterParams, 'count', 3000, 35000, 1000).name('Galaxy Count').onChange(v => {
        if (galaxySwarm.setCount) galaxySwarm.setCount(v);
        this.app.updateHUDStats();
      });
      this.clusterFolder.add(this.clusterParams, 'pointSize', 0.5, 4.0, 0.1).name('Dot Size').onChange(v => {
        if (galaxySwarm.setPointSize) galaxySwarm.setPointSize(v);
      });
    }

    // 3. Camera & Automated 3D Orbit Studio folder
    this.cameraFolder = this.gui.addFolder('Camera & Orbit Studio');
    this.cameraParams = {
      preset: 'Reference (Tully 2014)',
      fov: this.app.camera?.fov ?? 46,
      autoOrbit: this.app.cameraController?.autoOrbit ?? true,
      orbitSpeed: this.app.cameraController?.orbitSpeed ?? 0.45,
      smartResume: this.app.cameraController?.smartResume ?? true,
      smartResumeDelay: this.app.cameraController?.smartResumeDelay ?? 2.0,
      tourDuration: this.app.cameraController?.tourDuration ?? 22.0
    };

    const presetList = [
      'Reference (Tully 2014)',
      'The Great Attractor Core',
      'Virgo Cluster',
      'Coma Fountain Arch',
      'Centaurus Cluster Core',
      'Milky Way / Local Group',
      'Hydra Cluster',
      'Antlia Cluster',
      'Dipole Repeller Outflow',
      'Top-Down Supergalactic Plane'
    ];

    this.presetController = this.cameraFolder.add(this.cameraParams, 'preset', presetList)
      .name('Preset View')
      .onChange(presetName => {
        this.applyPreset(presetName);
      });

    this.fovController = this.cameraFolder.add(this.cameraParams, 'fov', 30, 80, 1)
      .name('Camera FOV')
      .onChange(v => {
        if (this.app.camera) {
          this.app.camera.fov = v;
          this.app.cameraTargetFov = v;
          this.app.camera.updateProjectionMatrix();
        }
      });

    // 3D Automated Orbit & Tour Controls
    this.cameraFolder.add(this.cameraParams, 'autoOrbit').name('🔄 360° Auto-Orbit').onChange(v => {
      if (this.app.cameraController) this.app.cameraController.autoOrbit = v;
    });
    this.cameraFolder.add(this.cameraParams, 'orbitSpeed', 0.1, 2.0, 0.05).name('Orbit Speed').onChange(v => {
      if (this.app.cameraController) this.app.cameraController.orbitSpeed = v;
    });
    this.cameraFolder.add(this.cameraParams, 'smartResume').name('Smart Resume').onChange(v => {
      if (this.app.cameraController) this.app.cameraController.smartResume = v;
    });
    this.cameraFolder.add(this.cameraParams, 'smartResumeDelay', 0.5, 6.0, 0.5).name('Resume Delay (s)').onChange(v => {
      if (this.app.cameraController) this.app.cameraController.smartResumeDelay = v;
    });

    // Tour Trigger
    this.cameraFolder.add({ fn: () => this.app.cameraController?.toggleTour() }, 'fn').name('🎬 Toggle Cinematic Tour');

    // GIF Recording Trigger
    this.cameraFolder.add({
      fn: () => {
        const btn = document.getElementById('btn-record-gif');
        if (btn) btn.click();
      }
    }, 'fn').name('🔴 Record 360° GIF');

    // 4. Streamlines & Coma Loops folder
    this.streamFolder = this.gui.addFolder('Streamlines & Flow');
    this.streamParams = {
      count: streamlineRenderer?.streamlineCount ?? 320,
      lineOpacity: streamlineRenderer?.lineOpacity ?? 0.82,
      showArrows: streamlineRenderer?.showArrows ?? true,
      showComaLoops: streamlineRenderer?.showComaLoops ?? true,
      arrowScale: streamlineRenderer?.arrowScale ?? 1.15,
      arrowInterval: streamlineRenderer?.arrowInterval ?? 14.0,
      isAnimated: streamlineRenderer?.isAnimated ?? true,
      flowSpeed: streamlineRenderer?.flowSpeed ?? 0.85
    };

    if (streamlineRenderer) {
      this.streamFolder.add(this.streamParams, 'count', 50, 600, 10).name('Line Count').onChange(v => {
        if (streamlineRenderer.setStreamlineCount) streamlineRenderer.setStreamlineCount(v);
        this.app.updateHUDStats();
      });
      this.streamFolder.add(this.streamParams, 'lineOpacity', 0.1, 1.0, 0.05).name('Line Opacity').onChange(v => {
        if (streamlineRenderer.setLineOpacity) streamlineRenderer.setLineOpacity(v);
      });
      this.streamFolder.add(this.streamParams, 'showComaLoops').name('Coma Loops').onChange(v => {
        if (streamlineRenderer.setShowComaLoops) streamlineRenderer.setShowComaLoops(v);
        this.app.updateHUDStats();
      });
      this.streamFolder.add(this.streamParams, 'showArrows').name('Show Cones').onChange(v => {
        if (streamlineRenderer.setShowArrows) streamlineRenderer.setShowArrows(v);
      });
      this.streamFolder.add(this.streamParams, 'arrowScale', 0.5, 2.5, 0.1).name('Cone Scale').onChange(v => {
        if (streamlineRenderer.setArrowScale) streamlineRenderer.setArrowScale(v);
      });
      this.streamFolder.add(this.streamParams, 'isAnimated').name('Flow Animation').onChange(v => {
        streamlineRenderer.isAnimated = v;
        this.app.updateFlowButtonState(v);
      });
      this.streamFolder.add(this.streamParams, 'flowSpeed', 0.1, 4.0, 0.1).name('Flow Speed').onChange(v => {
        streamlineRenderer.flowSpeed = v;
      });
    }

    // 5. Density Heatmap Slice Plane folder
    this.sliceFolder = this.gui.addFolder('Density Heatmap Plane');
    this.sliceParams = {
      visible: slicePlaneMesh?.group?.visible ?? true,
      sliceY: slicePlaneMesh?.sliceY ?? 0,
      opacity: slicePlaneMesh?.uniforms?.uOpacity?.value ?? 0.85,
      brightness: slicePlaneMesh?.uniforms?.uBrightness?.value ?? 1.0,
      contourLines: true
    };

    if (slicePlaneMesh) {
      this.sliceFolder.add(this.sliceParams, 'visible').name('Show Slice').onChange(v => {
        if (slicePlaneMesh.group) slicePlaneMesh.group.visible = v;
      });
      this.sliceFolder.add(this.sliceParams, 'sliceY', -25, 25, 0.5).name('Height (Y)').onChange(v => {
        if (slicePlaneMesh.setSliceY) slicePlaneMesh.setSliceY(v);
      });
      this.sliceFolder.add(this.sliceParams, 'opacity', 0.1, 1.0, 0.05).name('Opacity').onChange(v => {
        if (slicePlaneMesh.setOpacity) slicePlaneMesh.setOpacity(v);
      });
      this.sliceFolder.add(this.sliceParams, 'brightness', 0.5, 2.0, 0.05).name('Brightness').onChange(v => {
        if (slicePlaneMesh.uniforms?.uBrightness) slicePlaneMesh.uniforms.uBrightness.value = v;
      });
      this.sliceFolder.add(this.sliceParams, 'contourLines').name('Contour Grids').onChange(v => {
        if (slicePlaneMesh.uniforms?.uContourLines) slicePlaneMesh.uniforms.uContourLines.value = v ? 1.0 : 0.0;
      });
    }

    // 6. Astrophysical Masses & Potential
    if (cosmicField && cosmicField.attractors) {
      this.fieldFolder = this.gui.addFolder('Cosmic Attractor Physics');
      const ga = cosmicField.attractors.find(a => a.id === 'great-attractor');
      const dr = cosmicField.attractors.find(a => a.id === 'dipole-repeller');

      if (ga && dr) {
        const physParams = {
          gaMass: ga.mass,
          drMass: -dr.mass,
          recompute: () => {
            ga.mass = physParams.gaMass;
            dr.mass = -physParams.drMass;
            if (slicePlaneMesh?.updateUniforms) slicePlaneMesh.updateUniforms();
            if (streamlineRenderer?.rebuild) streamlineRenderer.rebuild();
            this.app.updateHUDStats();
          }
        };

        this.fieldFolder.add(physParams, 'gaMass', 500, 6000, 100).name('Great Attractor Mass');
        this.fieldFolder.add(physParams, 'drMass', 500, 5000, 100).name('Dipole Repeller Mass');
        this.fieldFolder.add(physParams, 'recompute').name('⚡ Recompute Flow Field');
      }
    }

    // 7. Overlays & Bloom
    this.overlayFolder = this.gui.addFolder('Visuals & Overlays');
    this.visualParams = {
      bloom: this.app.enableBloom ?? true
    };
    this.overlayFolder.add(this.visualParams, 'bloom').name('Celestial Bloom').onChange(v => {
      this.app.enableBloom = v;
    });
  }

  applyPreset(presetName) {
    if (this.cameraParams) {
      this.cameraParams.preset = presetName;
      if (this.presetController) this.presetController.updateDisplay();
    }

    switch (presetName) {
      case 'Reference (Tully 2014)':
        if (this.app.setReferenceCamera) this.app.setReferenceCamera();
        this.setActiveHUDButton('btn-ref-view');
        break;
      case 'The Great Attractor Core':
        if (this.app.setAttractorCamera) this.app.setAttractorCamera();
        this.setActiveHUDButton('btn-attractor-view');
        break;
      case 'Virgo Cluster':
        if (this.app.setVirgoCamera) this.app.setVirgoCamera();
        this.setActiveHUDButton('btn-virgo-view');
        break;
      case 'Coma Fountain Arch':
        if (this.app.setComaCamera) this.app.setComaCamera();
        this.setActiveHUDButton('btn-coma-view');
        break;
      case 'Centaurus Cluster Core':
        if (this.app.setCentaurusCamera) this.app.setCentaurusCamera();
        this.setActiveHUDButton('btn-centaurus-view');
        break;
      case 'Milky Way / Local Group':
        if (this.app.setMilkyWayCamera) this.app.setMilkyWayCamera();
        this.setActiveHUDButton('btn-milkyway-view');
        break;
      case 'Hydra Cluster':
        if (this.app.setHydraCamera) this.app.setHydraCamera();
        this.setActiveHUDButton('btn-hydra-view');
        break;
      case 'Antlia Cluster':
        if (this.app.setAntliaCamera) this.app.setAntliaCamera();
        this.setActiveHUDButton('btn-antlia-view');
        break;
      case 'Top-Down Supergalactic Plane':
        if (this.app.setTopDownCamera) this.app.setTopDownCamera();
        this.setActiveHUDButton('btn-top-view');
        break;
      case 'Dipole Repeller Outflow':
        if (this.app.setRepellerCamera) this.app.setRepellerCamera();
        this.setActiveHUDButton('btn-repeller-view');
        break;
    }

    this.syncCameraDisplay();
  }

  syncCameraDisplay() {
    if (this.cameraParams && this.app.camera) {
      this.cameraParams.fov = Math.round(this.app.cameraTargetFov || this.app.camera.fov);
      if (this.fovController) this.fovController.updateDisplay();
    }
  }

  setActiveHUDButton(buttonOrId) {
    if (typeof document === 'undefined') return;
    const btn = typeof buttonOrId === 'string' ? document.getElementById(buttonOrId) : buttonOrId;
    if (!btn) return;
    const allBtns = document.querySelectorAll('.hud-bottom-bar .preset-btn');
    allBtns.forEach(b => {
      if (b.id !== 'btn-flow-toggle') {
        b.classList.remove('active');
      }
    });
    btn.classList.add('active');
  }

  initButtons() {
    if (typeof document === 'undefined') return;

    const btnRef = document.getElementById('btn-ref-view');
    const btnAttractor = document.getElementById('btn-attractor-view');
    const btnVirgo = document.getElementById('btn-virgo-view');
    const btnComa = document.getElementById('btn-coma-view');
    const btnCentaurus = document.getElementById('btn-centaurus-view');
    const btnMilkyWay = document.getElementById('btn-milkyway-view');
    const btnHydra = document.getElementById('btn-hydra-view');
    const btnAntlia = document.getElementById('btn-antlia-view');
    const btnRepeller = document.getElementById('btn-repeller-view');
    const btnTop = document.getElementById('btn-top-view');
    const btnFlow = document.getElementById('btn-flow-toggle');

    if (btnRef) {
      btnRef.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnRef);
        this.applyPreset('Reference (Tully 2014)');
      });
    }

    if (btnAttractor) {
      btnAttractor.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnAttractor);
        this.applyPreset('The Great Attractor Core');
      });
    }

    if (btnVirgo) {
      btnVirgo.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnVirgo);
        this.applyPreset('Virgo Cluster');
      });
    }

    if (btnComa) {
      btnComa.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnComa);
        this.applyPreset('Coma Fountain Arch');
      });
    }

    if (btnCentaurus) {
      btnCentaurus.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnCentaurus);
        this.applyPreset('Centaurus Cluster Core');
      });
    }

    if (btnMilkyWay) {
      btnMilkyWay.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnMilkyWay);
        this.applyPreset('Milky Way / Local Group');
      });
    }

    if (btnHydra) {
      btnHydra.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnHydra);
        this.applyPreset('Hydra Cluster');
      });
    }

    if (btnAntlia) {
      btnAntlia.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnAntlia);
        this.applyPreset('Antlia Cluster');
      });
    }

    if (btnRepeller) {
      btnRepeller.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnRepeller);
        this.applyPreset('Dipole Repeller Outflow');
      });
    }

    if (btnTop) {
      btnTop.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animatePresetButton(btnTop);
        this.applyPreset('Top-Down Supergalactic Plane');
      });
    }

    if (btnFlow) {
      btnFlow.addEventListener('click', () => {
        if (this.app.motionEngine) this.app.motionEngine.animateButtonPress(btnFlow);
        const nextState = !this.app.streamlineRenderer.isAnimated;
        this.app.streamlineRenderer.isAnimated = nextState;
        if (this.streamParams) this.streamParams.isAnimated = nextState;
        this.app.updateFlowButtonState(nextState);
      });
    }
  }
}
