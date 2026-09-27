import * as THREE from 'three';

/**
 * CosmicLabels renders authentic scientific 3D billboard labels,
 * batched hairline leader lines, and cluster locator markers faithfully
 * reproducing Tully et al. (Nature 2014) cosmological reference visualization.
 */
export class CosmicLabels {
  constructor(cosmicField, camera, container) {
    this.cosmicField = cosmicField;
    this.camera = camera;
    this.container = container;

    this.group = new THREE.Group();
    this.group.name = 'CosmicLabelsGroup';

    this.visible = true;
    this.baseOpacity = 0.95;
    this.userScale = 1.0;
    this.leaderLinesVisible = true;
    this.baseLeaderOpacity = 0.55;

    // Define 12 authentic astronomical structures matching Tully et al. (Nature 2014)
    this.labels = [
      // 1. Core Hub & Convergence Center
      {
        name: 'The Great Attractor',
        displayName: 'The Great Attractor',
        desc: 'Convergence Hub / Norma Cluster',
        category: 'Core Hub',
        pos: new THREE.Vector3(-38, 2, -5),
        centroid: new THREE.Vector3(-38, 2, -5),
        offset: new THREE.Vector3(0, 6.5, 0),
        anchor: new THREE.Vector3(-38, 8.5, -5),
        color: '#ffffff',
        glowColor: 'rgba(255, 185, 60, 0.9)',
        fontSize: 34,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 2. Major Cluster Core
      {
        name: 'Centaurus',
        displayName: 'Centaurus',
        desc: 'Major Cluster Core',
        category: 'Supercluster Hub',
        pos: new THREE.Vector3(-34, 6, 2),
        centroid: new THREE.Vector3(-34, 6, 2),
        offset: new THREE.Vector3(0, 6.0, 0),
        anchor: new THREE.Vector3(-34, 12.0, 2),
        color: '#ffffff',
        glowColor: 'rgba(255, 195, 80, 0.85)',
        fontSize: 32,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 3. Local Supercluster Core
      {
        name: 'Virgo',
        displayName: 'Virgo',
        desc: 'Local Supercluster Center',
        category: 'Supercluster',
        pos: new THREE.Vector3(-8, 3, 0),
        centroid: new THREE.Vector3(-8, 3, 0),
        offset: new THREE.Vector3(0, 5.5, 0),
        anchor: new THREE.Vector3(-8, 8.5, 0),
        color: '#ffffff',
        glowColor: 'rgba(180, 215, 255, 0.85)',
        fontSize: 32,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 4. Milky Way / Local Group Origin
      {
        name: 'Milky Way',
        displayName: 'Milky Way',
        desc: 'Local Group / 630 km/s Peculiar Velocity',
        category: 'Local Group',
        pos: new THREE.Vector3(-10, -1, 4),
        centroid: new THREE.Vector3(-10, -1, 4),
        offset: new THREE.Vector3(0, 4.5, 0),
        anchor: new THREE.Vector3(-10, 3.5, 4),
        color: '#ffffff',
        glowColor: 'rgba(0, 240, 210, 0.85)',
        fontSize: 30,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 5. High-Latitude Cluster Apex
      {
        name: 'Coma',
        displayName: 'Coma',
        desc: 'High-Latitude Cluster / Fountain Apex',
        category: 'Supercluster',
        pos: new THREE.Vector3(5, 45, -25),
        centroid: new THREE.Vector3(5, 45, -25),
        offset: new THREE.Vector3(0, 6.5, 0),
        anchor: new THREE.Vector3(5, 51.5, -25),
        color: '#ffffff',
        glowColor: 'rgba(190, 220, 255, 0.9)',
        fontSize: 34,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 6. Hydra Cluster
      {
        name: 'Hydra',
        displayName: 'Hydra',
        desc: 'Hydra-Centaurus Cluster',
        category: 'Galaxy Cluster',
        pos: new THREE.Vector3(-24, 8, 18),
        centroid: new THREE.Vector3(-24, 8, 18),
        offset: new THREE.Vector3(0, 5.0, 0),
        anchor: new THREE.Vector3(-24, 13.0, 18),
        color: '#ffffff',
        glowColor: 'rgba(210, 230, 255, 0.8)',
        fontSize: 28,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 7. Antlia Cluster
      {
        name: 'Antlia',
        displayName: 'Antlia',
        desc: 'Foreground Galaxy Cluster',
        category: 'Galaxy Cluster',
        pos: new THREE.Vector3(-18, 5, 22),
        centroid: new THREE.Vector3(-18, 5, 22),
        offset: new THREE.Vector3(0, 4.5, 0),
        anchor: new THREE.Vector3(-18, 9.5, 22),
        color: '#ffffff',
        glowColor: 'rgba(100, 210, 255, 0.8)',
        fontSize: 28,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 8. NGC 5016 Cluster
      {
        name: 'NGC 5016 Cluster',
        displayName: 'NGC 5016 Cluster',
        desc: 'Coma Bridge Node',
        category: 'Cluster Group',
        pos: new THREE.Vector3(-16, 22, -12),
        centroid: new THREE.Vector3(-16, 22, -12),
        offset: new THREE.Vector3(0, 4.5, 0),
        anchor: new THREE.Vector3(-16, 26.5, -12),
        color: '#ffffff',
        glowColor: 'rgba(200, 220, 255, 0.75)',
        fontSize: 26,
        fontWeight: '700',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 9. Abell 3574
      {
        name: 'Abell 3574',
        displayName: 'Abell 3574',
        desc: 'Centaurus Companion Cluster',
        category: 'Abell Cluster',
        pos: new THREE.Vector3(-28, 14, 12),
        centroid: new THREE.Vector3(-28, 14, 12),
        offset: new THREE.Vector3(0, 4.0, 0),
        anchor: new THREE.Vector3(-28, 18.0, 12),
        color: '#ffffff',
        glowColor: 'rgba(180, 205, 235, 0.75)',
        fontSize: 24,
        fontWeight: '600',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 10. Abell 3565
      {
        name: 'Abell 3565',
        displayName: 'Abell 3565',
        desc: 'Centaurus Group Cluster',
        category: 'Abell Cluster',
        pos: new THREE.Vector3(-32, 10, 16),
        centroid: new THREE.Vector3(-32, 10, 16),
        offset: new THREE.Vector3(0, 4.0, 0),
        anchor: new THREE.Vector3(-32, 14.0, 16),
        color: '#ffffff',
        glowColor: 'rgba(180, 205, 235, 0.75)',
        fontSize: 24,
        fontWeight: '600',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 11. Abell 50753
      {
        name: 'Abell 50753',
        displayName: 'Abell 50753',
        desc: 'High-Density Cluster Node',
        category: 'Abell Cluster',
        pos: new THREE.Vector3(-44, 8, -18),
        centroid: new THREE.Vector3(-44, 8, -18),
        offset: new THREE.Vector3(0, 4.0, 0),
        anchor: new THREE.Vector3(-44, 12.0, -18),
        color: '#ffffff',
        glowColor: 'rgba(180, 205, 235, 0.75)',
        fontSize: 24,
        fontWeight: '600',
        fontStyle: 'normal',
        hasLeader: true,
        visible: true
      },
      // 12. Cosmic Flow Directional Channel Annotation
      {
        name: 'Bulk flow toward Antlia-Centaurus',
        displayName: '➔ Bulk flow toward Antlia-Centaurus',
        desc: 'Cosmic Flow Velocity Stream',
        category: 'Flow Annotation',
        pos: new THREE.Vector3(-22, -2, 14),
        centroid: new THREE.Vector3(-22, -2, 14),
        offset: new THREE.Vector3(0, 0, 0),
        anchor: new THREE.Vector3(-22, -2, 14),
        color: '#7be2ff',
        glowColor: 'rgba(0, 190, 255, 0.85)',
        fontSize: 24,
        fontWeight: '600',
        fontStyle: 'italic',
        hasLeader: false,
        visible: true
      }
    ];

    this.initBillboardSprites();
    this.initLeaderLines();
    this.initCentroidMarkers();
    this.initHTMLElements();
  }

  /**
   * Generates High-DPI canvas textures and billboard THREE.Sprite meshes.
   */
  initBillboardSprites() {
    this.markers = [];

    for (const item of this.labels) {
      const spriteData = this.createLabelSprite(item);
      item.sprite = spriteData.sprite;
      item.baseW = spriteData.baseW;
      item.baseH = spriteData.baseH;
      item.texture = spriteData.texture;
      item.canvas = spriteData.canvas;

      this.group.add(item.sprite);

      this.markers.push({
        name: item.name,
        pos: item.pos,
        anchor: item.anchor,
        sprite: item.sprite,
        item
      });
    }
  }

  /**
   * Creates an offscreen 2D canvas at 2x High-DPI resolution,
   * draws crisp publication typography with outer contrast outline and subtle glow,
   * and wraps it in a THREE.CanvasTexture and THREE.Sprite.
   */
  createLabelSprite(item) {
    const {
      name,
      displayName,
      fontSize = 28,
      fontStyle = 'normal',
      fontWeight = '700',
      color = '#ffffff',
      glowColor = 'rgba(255, 255, 255, 0.4)'
    } = item;

    const scaleFactor = 0.08;
    const text = displayName || name;

    const canvas = typeof document !== 'undefined'
      ? document.createElement('canvas')
      : { width: 256, height: 64, getContext: () => null };

    let texture = null;
    let baseW = 10.0;
    let baseH = 2.4;

    if (typeof document !== 'undefined' && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      const dpr = 2.0;
      const fontStr = `${fontStyle} ${fontWeight} ${Math.round(fontSize * dpr)}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif`;

      ctx.font = fontStr;
      const metrics = ctx.measureText(text);
      const textWidth = Math.ceil(metrics.width);
      const textHeight = Math.ceil(fontSize * dpr * 1.4);

      const padX = Math.round(24 * dpr);
      const padY = Math.round(14 * dpr);

      canvas.width = textWidth + padX * 2;
      canvas.height = textHeight + padY * 2;

      // Re-apply context font after canvas resizing
      ctx.font = fontStr;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Heavy dark contrast outline + shadow (for legibility against galaxy stars & bright streamlines)
      ctx.save();
      ctx.shadowColor = 'rgba(2, 6, 14, 0.98)';
      ctx.shadowBlur = 8 * dpr;
      ctx.strokeStyle = 'rgba(2, 6, 14, 0.92)';
      ctx.lineWidth = 4.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, cx, cy);
      ctx.restore();

      // 2. Subtle scientific glow
      if (glowColor) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6 * dpr;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.8 * dpr;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, cx, cy);
        ctx.restore();
      }

      // 3. Crisp foreground text fill
      ctx.fillStyle = color;
      ctx.fillText(text, cx, cy);

      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      if (THREE.SRGBColorSpace) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      const aspect = canvas.width / canvas.height;
      baseH = fontSize * scaleFactor;
      baseW = baseH * aspect;
    }

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: this.baseOpacity,
      depthTest: false,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(baseW * this.userScale, baseH * this.userScale, 1.0);
    sprite.position.copy(item.anchor);

    return {
      sprite,
      canvas,
      texture,
      material,
      baseW,
      baseH
    };
  }

  /**
   * Builds batched THREE.LineSegments connecting cluster centroids
   * to label billboard anchors.
   */
  initLeaderLines() {
    const linePositions = [];

    for (const item of this.labels) {
      if (!item.hasLeader) continue;

      // Calculate connection point at bottom border of the billboard
      const lineTopY = item.anchor.y - (item.baseH * 0.45);

      linePositions.push(
        item.centroid.x, item.centroid.y, item.centroid.z,
        item.anchor.x, lineTopY, item.anchor.z
      );
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    this.leaderMaterial = new THREE.LineBasicMaterial({
      color: 0x90b8dc,
      transparent: true,
      opacity: this.baseLeaderOpacity,
      depthTest: false,
      depthWrite: false
    });

    this.leaderLines = new THREE.LineSegments(lineGeometry, this.leaderMaterial);
    this.leaderLines.name = 'CosmicLabelsLeaderLines';
    this.group.add(this.leaderLines);
  }

  /**
   * Creates subtle glowing locator dots at cluster centroids.
   */
  initCentroidMarkers() {
    const dotGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xd8ecff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    this.centroidDots = new THREE.Group();
    this.centroidDots.name = 'CosmicLabelsCentroidDots';

    for (const item of this.labels) {
      if (!item.hasLeader) continue;
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(item.centroid);
      this.centroidDots.add(dot);
    }

    this.group.add(this.centroidDots);
  }

  /**
   * Initializes overlay container for potential DOM inspection or clean backwards compatibility.
   */
  initHTMLElements() {
    this.domElements = [];
    if (this.container && typeof document !== 'undefined') {
      // Remove any pre-existing overlay
      const oldOverlay = this.container.querySelector('.cosmic-labels-overlay');
      if (oldOverlay) {
        oldOverlay.remove();
      }

      this.overlay = document.createElement('div');
      this.overlay.className = 'cosmic-labels-overlay';
      this.container.appendChild(this.overlay);
    }
  }

  /**
   * Updates distance-based scaling, distance-based fading, and subtle dynamic flow.
   * Gracefully supports both update(cameraOrElapsed, elapsed) and legacy update(elapsed).
   */
  update(cameraOrElapsed, maybeElapsed) {
    let camera = this.camera;
    let elapsed = 0;

    if (cameraOrElapsed && cameraOrElapsed.isCamera) {
      camera = cameraOrElapsed;
      this.camera = cameraOrElapsed;
      elapsed = typeof maybeElapsed === 'number' ? maybeElapsed : 0;
    } else if (typeof cameraOrElapsed === 'number') {
      elapsed = cameraOrElapsed;
    }

    if (!camera || !this.group.visible) return;

    const camPos = camera.position;

    // Distance-based adaptive scale and fade for billboard sprites
    for (let i = 0; i < this.labels.length; i++) {
      const item = this.labels[i];
      if (!item.sprite) continue;

      const dist = camPos.distanceTo(item.anchor);

      // Smooth adaptive scale: keeps labels legible across zoom levels
      const distScale = Math.min(Math.max(dist / 140.0, 0.55), 2.2) * this.userScale;
      item.sprite.scale.set(item.baseW * distScale, item.baseH * distScale, 1.0);

      // Distance-based smooth fade: attenuates when extremely close or far
      let fade = 1.0;
      if (dist < 22.0) {
        fade = Math.max(0.0, Math.min(1.0, (dist - 6.0) / 16.0));
      } else if (dist > 280.0) {
        fade = Math.max(0.0, Math.min(1.0, (420.0 - dist) / 140.0));
      }

      // Gentle pulsation for directional flow annotation to convey motion
      let flowMod = 1.0;
      if (!item.hasLeader) {
        flowMod = 0.88 + 0.12 * Math.sin(elapsed * 2.2);
      }

      const targetOpacity = this.baseOpacity * fade * flowMod;
      item.sprite.material.opacity = targetOpacity;
    }

    // Distance-based fade for leader lines
    if (this.leaderMaterial) {
      const centerDist = camPos.distanceTo(new THREE.Vector3(-15, 6, 0));
      let lineFade = 1.0;
      if (centerDist < 25.0) {
        lineFade = Math.max(0.0, Math.min(1.0, (centerDist - 8.0) / 17.0));
      } else if (centerDist > 300.0) {
        lineFade = Math.max(0.0, Math.min(1.0, (420.0 - centerDist) / 120.0));
      }
      this.leaderMaterial.opacity = this.baseLeaderOpacity * lineFade;
    }
  }

  /**
   * Sets visibility of all labels, leader lines, and markers.
   */
  setVisible(visible) {
    this.visible = Boolean(visible);
    this.group.visible = this.visible;
    if (this.overlay) {
      this.overlay.style.display = this.visible ? 'block' : 'none';
    }
  }

  /**
   * Sets overall opacity multiplier for all billboard labels.
   */
  setOpacity(opacity) {
    this.baseOpacity = Math.max(0, Math.min(1, Number(opacity)));
    for (const item of this.labels) {
      if (item.sprite && item.sprite.material) {
        item.sprite.material.opacity = this.baseOpacity;
      }
    }
  }

  /**
   * Sets user scale multiplier for billboard text labels.
   */
  setScale(scale) {
    this.userScale = Math.max(0.2, Math.min(4.0, Number(scale)));
    for (const item of this.labels) {
      if (item.sprite) {
        item.sprite.scale.set(
          item.baseW * this.userScale,
          item.baseH * this.userScale,
          1.0
        );
      }
    }
  }

  /**
   * Toggles visibility of 3D leader lines and centroid locator markers.
   */
  setLeaderLinesVisible(visible) {
    this.leaderLinesVisible = Boolean(visible);
    if (this.leaderLines) {
      this.leaderLines.visible = this.leaderLinesVisible;
    }
    if (this.centroidDots) {
      this.centroidDots.visible = this.leaderLinesVisible;
    }
  }

  /**
   * Sets opacity of 3D leader lines.
   */
  setLeaderOpacity(opacity) {
    this.baseLeaderOpacity = Math.max(0, Math.min(1, Number(opacity)));
    if (this.leaderMaterial) {
      this.leaderMaterial.opacity = this.baseLeaderOpacity;
    }
  }

  /**
   * Frees GPU textures, geometries, and materials.
   */
  dispose() {
    for (const item of this.labels) {
      if (item.texture) item.texture.dispose();
      if (item.sprite && item.sprite.material) item.sprite.material.dispose();
    }
    if (this.leaderLines) {
      if (this.leaderLines.geometry) this.leaderLines.geometry.dispose();
      if (this.leaderLines.material) this.leaderLines.material.dispose();
    }
    if (this.centroidDots) {
      this.centroidDots.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
