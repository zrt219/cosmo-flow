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

    // 3. Camera & Viewpoints folder
    this.cameraFolder = this.gui.addFolder('Camera & Viewpoints');
    this.cameraParams = {
      preset: 'Reference (Tully 2014)',
      fov: this.app.camera?.fov ?? 46
    };

    const presetList = [
      'Reference (Tully 2014)',
      'Coma Fountain Arch',
      'Virgo Cluster',
      'The Great Attractor Core',
      'Top-Down Supergalactic Plane',
      'Dipole Repeller Outflow'
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

    // Fast-access action buttons in lil-gui
    this.cameraFolder.add({ fn: () => this.applyPreset('Reference (Tully 2014)') }, 'fn').name('📷 Reference View');
    this.cameraFolder.add({ fn: () => this.applyPreset('Coma Fountain Arch') }, 'fn').name('🌌 Coma Fountain');
    this.cameraFolder.add({ fn: () => this.applyPreset('Virgo Cluster') }, 'fn').name('✨ Virgo Cluster');
    this.cameraFolder.add({ fn: () => this.applyPreset('The Great Attractor Core') }, 'fn').name('🎯 Great Attractor');
    this.cameraFolder.add({ fn: () => this.applyPreset('Top-Down Supergalactic Plane') }, 'fn').name('🌐 Top-Down Plane');
    this.cameraFolder.add({ fn: () => this.applyPreset('Dipole Repeller Outflow') }, 'fn').name('💨 Dipole Repeller');

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
      case 'Coma Fountain Arch':
        if (this.app.setComaCamera) this.app.setComaCamera();
        this.setActiveHUDButton('btn-coma-view');
        break;
      case 'Virgo Cluster':
        if (this.app.setVirgoCamera) this.app.setVirgoCamera();
        this.setActiveHUDButton('btn-virgo-view');
        break;
      case 'The Great Attractor Core':
        if (this.app.setAttractorCamera) this.app.setAttractorCamera();
        this.setActiveHUDButton('btn-attractor-view');
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
    const btnComa = document.getElementById('btn-coma-view');
    const btnVirgo = document.getElementById('btn-virgo-view');
    const btnTop = document.getElementById('btn-top-view');
    const btnAttractor = document.getElementById('btn-attractor-view');
    const btnRepeller = document.getElementById('btn-repeller-view');
    const btnFlow = document.getElementById('btn-flow-toggle');

    if (btnRef) {
      btnRef.addEventListener('click', () => {
        this.applyPreset('Reference (Tully 2014)');
      });
    }

    if (btnComa) {
      btnComa.addEventListener('click', () => {
        this.applyPreset('Coma Fountain Arch');
      });
    }

    if (btnVirgo) {
      btnVirgo.addEventListener('click', () => {
        this.applyPreset('Virgo Cluster');
      });
    }

    if (btnTop) {
      btnTop.addEventListener('click', () => {
        this.applyPreset('Top-Down Supergalactic Plane');
      });
    }

    if (btnAttractor) {
      btnAttractor.addEventListener('click', () => {
        this.applyPreset('The Great Attractor Core');
      });
    }

    if (btnRepeller) {
      btnRepeller.addEventListener('click', () => {
        this.applyPreset('Dipole Repeller Outflow');
      });
    }

    if (btnFlow) {
      btnFlow.addEventListener('click', () => {
        const nextState = !this.app.streamlineRenderer.isAnimated;
        this.app.streamlineRenderer.isAnimated = nextState;
        if (this.streamParams) this.streamParams.isAnimated = nextState;
        this.app.updateFlowButtonState(nextState);
      });
    }
  }
}
