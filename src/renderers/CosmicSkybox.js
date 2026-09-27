import * as THREE from 'three';

/**
 * CosmicSkybox creates a subtle, deep-space field of distant stars
 * and cosmological coordinate grids for scientific orientation.
 */
export class CosmicSkybox {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CosmicSkyboxGroup';

    this.initBackgroundStars();
    this.initReferenceAxes();
  }

  initBackgroundStars() {
    const starCount = 3500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Distribute on large outer sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 260.0 + Math.random() * 80.0;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const lum = 0.4 + Math.random() * 0.6;
      colors[i * 3 + 0] = lum * 0.85;
      colors[i * 3 + 1] = lum * 0.9;
      colors[i * 3 + 2] = lum;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    const starPoints = new THREE.Points(geo, mat);
    this.group.add(starPoints);
  }

  initReferenceAxes() {
    // Elegant Supergalactic Cartesian frame indicator
    this.axesHelper = new THREE.AxesHelper(30);
    this.axesHelper.material.opacity = 0.35;
    this.axesHelper.material.transparent = true;
    this.axesHelper.position.set(-85, -45, -85);
    this.group.add(this.axesHelper);
  }
}
