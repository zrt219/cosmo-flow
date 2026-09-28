import * as THREE from 'three';

/**
 * GalaxyClusters renders 3D shaded ellipsoids/spheres representing
 * prominent galaxy clusters and secondary clusters faithfully matching the
 * Tully et al. (Nature 2014) reference visualization.
 *
 * Utilizes THREE.MeshPhysicalMaterial with directional specular sheen
 * and clearcoat to realistically reflect scene lighting.
 */
export class GalaxyClusters {
  constructor(sceneOrOptions = null, options = {}) {
    let scene = null;
    let opts = options;
    if (sceneOrOptions && typeof sceneOrOptions.add === 'function') {
      scene = sceneOrOptions;
    } else if (sceneOrOptions && typeof sceneOrOptions === 'object') {
      opts = sceneOrOptions;
    }

    this.group = new THREE.Group();
    this.group.name = 'GalaxyClustersGroup';

    this.visible = opts.visible !== undefined ? opts.visible : true;
    this.group.visible = this.visible;
    this.opacity = opts.opacity !== undefined ? opts.opacity : 0.95;
    this.scaleMultiplier = opts.scaleMultiplier !== undefined ? opts.scaleMultiplier : 1.0;
    this.pulseEnabled = opts.pulseEnabled !== undefined ? opts.pulseEnabled : false;

    this.initClusterData();
    this.initMaterial(opts);
    this.buildMeshes();

    if (scene) {
      scene.add(this.group);
    }
  }

  initClusterData() {
    this.clusters = [
      // 1. Primary Prominent Galaxy Clusters
      {
        id: 'hydra',
        name: 'Hydra',
        pos: new THREE.Vector3(-24, 8, 18),
        radius: 2.8,
        scale: [1.1, 1.0, 1.0],
        category: 'Major Cluster'
      },
      {
        id: 'antlia',
        name: 'Antlia',
        pos: new THREE.Vector3(-18, 5, 22),
        radius: 2.4,
        scale: [1.0, 1.0, 1.0],
        category: 'Major Cluster'
      },
      {
        id: 'centaurus',
        name: 'Centaurus',
        pos: new THREE.Vector3(-34, 6, 2),
        radius: 3.6,
        scale: [1.2, 0.9, 1.1],
        category: 'Major Cluster'
      },
      {
        id: 'virgo',
        name: 'Virgo',
        pos: new THREE.Vector3(-8, 3, 0),
        radius: 3.5,
        scale: [1.1, 0.95, 1.05],
        category: 'Major Cluster'
      },
      {
        id: 'great-attractor',
        name: 'The Great Attractor',
        pos: new THREE.Vector3(-38, 2, -5),
        radius: 4.2,
        scale: [1.1, 1.0, 1.1],
        category: 'Supercluster Hub'
      },
      {
        id: 'coma',
        name: 'Coma',
        pos: new THREE.Vector3(5, 45, -25),
        radius: 3.8,
        scale: [1.1, 1.1, 1.1],
        category: 'Major Cluster'
      },

      // 2. Secondary & Abell Clusters
      {
        id: 'ngc-5016',
        name: 'NGC 5016',
        pos: new THREE.Vector3(-16, 22, -12),
        radius: 2.2,
        scale: [1.0, 1.0, 1.0],
        category: 'Secondary Cluster'
      },
      {
        id: 'abell-3574',
        name: 'Abell 3574',
        pos: new THREE.Vector3(-28, 14, 12),
        radius: 2.2,
        scale: [1.0, 1.0, 1.0],
        category: 'Abell Cluster'
      },
      {
        id: 'abell-3565',
        name: 'Abell 3565',
        pos: new THREE.Vector3(-32, 10, 16),
        radius: 2.0,
        scale: [1.0, 1.0, 1.0],
        category: 'Abell Cluster'
      },
      {
        id: 'abell-50753',
        name: 'Abell 50753',
        pos: new THREE.Vector3(-44, 8, -18),
        radius: 2.3,
        scale: [1.05, 0.95, 1.0],
        category: 'Abell Cluster'
      },

      // 3. Foreground prominent galaxy clusters (Bottom Left)
      {
        id: 'fg-sw-1',
        name: 'Foreground SW 1',
        pos: new THREE.Vector3(-55, -2, 60),
        radius: 3.2,
        scale: [1.1, 0.9, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-sw-2',
        name: 'Foreground SW 2',
        pos: new THREE.Vector3(-68, -6, 52),
        radius: 2.6,
        scale: [1.0, 1.0, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-sw-3',
        name: 'Foreground SW 3',
        pos: new THREE.Vector3(-45, -4, 68),
        radius: 2.8,
        scale: [1.2, 0.8, 1.1],
        category: 'Foreground'
      },
      {
        id: 'fg-w-1',
        name: 'Foreground W 1',
        pos: new THREE.Vector3(-75, 4, 35),
        radius: 2.2,
        scale: [1.0, 1.0, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-w-2',
        name: 'Foreground W 2',
        pos: new THREE.Vector3(-60, 8, 25),
        radius: 2.4,
        scale: [1.0, 1.0, 1.0],
        category: 'Foreground'
      },

      // 4. Foreground prominent galaxy clusters (Bottom Right / Milky Way neighborhood)
      {
        id: 'fg-se-1',
        name: 'Foreground SE 1',
        pos: new THREE.Vector3(25, -6, 55),
        radius: 3.0,
        scale: [1.1, 0.9, 1.1],
        category: 'Foreground'
      },
      {
        id: 'fg-se-2',
        name: 'Foreground SE 2',
        pos: new THREE.Vector3(42, -8, 62),
        radius: 3.4,
        scale: [1.2, 0.85, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-se-3',
        name: 'Foreground SE 3',
        pos: new THREE.Vector3(58, -12, 70),
        radius: 3.8,
        scale: [1.15, 0.9, 1.15],
        category: 'Foreground'
      },
      {
        id: 'fg-e-1',
        name: 'Foreground E 1',
        pos: new THREE.Vector3(34, -4, 42),
        radius: 2.5,
        scale: [1.0, 1.0, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-e-2',
        name: 'Foreground E 2',
        pos: new THREE.Vector3(12, -2, 48),
        radius: 2.2,
        scale: [1.0, 1.0, 1.0],
        category: 'Foreground'
      },
      {
        id: 'fg-e-3',
        name: 'Foreground E 3',
        pos: new THREE.Vector3(48, -2, 38),
        radius: 2.8,
        scale: [1.05, 0.95, 1.0],
        category: 'Foreground'
      },

      // 5. Cluster subnodes & filaments
      {
        id: 'hydra-subnode',
        name: 'Hydra-Antlia Subnode',
        pos: new THREE.Vector3(-28, 6, 26),
        radius: 1.8,
        scale: [1.0, 1.0, 1.0],
        category: 'Subnode'
      },
      {
        id: 'centaurus-subnode',
        name: 'Centaurus Subnode',
        pos: new THREE.Vector3(-42, 10, -12),
        radius: 2.8,
        scale: [1.0, 1.0, 1.0],
        category: 'Subnode'
      },
      {
        id: 'coma-subnode-1',
        name: 'Coma Subnode 1',
        pos: new THREE.Vector3(2, 48, -28),
        radius: 2.4,
        scale: [1.0, 1.0, 1.0],
        category: 'Subnode'
      },
      {
        id: 'coma-subnode-2',
        name: 'Coma Subnode 2',
        pos: new THREE.Vector3(8, 42, -22),
        radius: 2.0,
        scale: [1.0, 1.0, 1.0],
        category: 'Subnode'
      },

      // 6. Background peripheral clusters (Top & Edges)
      {
        id: 'periph-nw',
        name: 'Peripheral NW',
        pos: new THREE.Vector3(-15, 35, -45),
        radius: 2.2,
        scale: [1.0, 1.0, 1.0],
        category: 'Peripheral'
      },
      {
        id: 'periph-ne',
        name: 'Peripheral NE',
        pos: new THREE.Vector3(25, 28, -40),
        radius: 2.5,
        scale: [1.0, 1.0, 1.0],
        category: 'Peripheral'
      },
      {
        id: 'periph-far-w',
        name: 'Peripheral Far W',
        pos: new THREE.Vector3(-50, 20, -35),
        radius: 2.4,
        scale: [1.0, 1.0, 1.0],
        category: 'Peripheral'
      },
      {
        id: 'periph-far-e',
        name: 'Peripheral Far E',
        pos: new THREE.Vector3(65, 8, -20),
        radius: 2.8,
        scale: [1.1, 0.9, 1.0],
        category: 'Peripheral'
      }
    ];
  }

  initMaterial(opts = {}) {
    // High-fidelity MeshPhysicalMaterial matching reference image:
    // Crisp white glossy cluster spheres with clearcoat sheen reflecting scene directional lights
    this.material = new THREE.MeshPhysicalMaterial({
      color: opts.color !== undefined ? opts.color : 0xffffff,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.24,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.08,
      clearcoat: opts.clearcoat !== undefined ? opts.clearcoat : 0.70,
      clearcoatRoughness: opts.clearcoatRoughness !== undefined ? opts.clearcoatRoughness : 0.20,
      reflectivity: opts.reflectivity !== undefined ? opts.reflectivity : 0.50,
      sheen: opts.sheen !== undefined ? opts.sheen : 0.35,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.25,
      transparent: true,
      opacity: this.opacity,
      flatShading: false
    });
  }

  buildMeshes() {
    this.sharedGeometry = new THREE.SphereGeometry(1.0, 32, 24);
    this.meshes = [];

    for (let i = 0; i < this.clusters.length; i++) {
      const c = this.clusters[i];
      const mesh = new THREE.Mesh(this.sharedGeometry, this.material);
      mesh.name = c.name;
      mesh.userData = {
        id: c.id,
        name: c.name,
        category: c.category,
        baseRadius: c.radius,
        baseScale: [...c.scale],
        basePos: c.pos.clone()
      };

      mesh.position.copy(c.pos);
      mesh.scale.set(
        c.radius * c.scale[0] * this.scaleMultiplier,
        c.radius * c.scale[1] * this.scaleMultiplier,
        c.radius * c.scale[2] * this.scaleMultiplier
      );

      c.mesh = mesh;
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
  }

  /**
   * InstancedMesh representation for high-throughput batching or compatibility.
   */
  createInstancedMesh() {
    const geo = new THREE.SphereGeometry(1.0, 32, 24);
    const instMesh = new THREE.InstancedMesh(geo, this.material, this.clusters.length);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.clusters.length; i++) {
      const c = this.clusters[i];
      dummy.position.copy(c.pos);
      dummy.scale.set(
        c.radius * c.scale[0] * this.scaleMultiplier,
        c.radius * c.scale[1] * this.scaleMultiplier,
        c.radius * c.scale[2] * this.scaleMultiplier
      );
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
    }

    instMesh.instanceMatrix.needsUpdate = true;
    return instMesh;
  }

  get instancedMesh() {
    if (!this._instancedMesh) {
      this._instancedMesh = this.createInstancedMesh();
    }
    return this._instancedMesh;
  }

  setScaleMultiplier(val) {
    this.scaleMultiplier = Math.max(0.01, val);
    for (let i = 0; i < this.clusters.length; i++) {
      const c = this.clusters[i];
      const mesh = this.meshes[i];
      if (mesh) {
        mesh.scale.set(
          c.radius * c.scale[0] * this.scaleMultiplier,
          c.radius * c.scale[1] * this.scaleMultiplier,
          c.radius * c.scale[2] * this.scaleMultiplier
        );
      }
    }

    if (this._instancedMesh) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.clusters.length; i++) {
        const c = this.clusters[i];
        dummy.position.copy(c.pos);
        dummy.scale.set(
          c.radius * c.scale[0] * this.scaleMultiplier,
          c.radius * c.scale[1] * this.scaleMultiplier,
          c.radius * c.scale[2] * this.scaleMultiplier
        );
        dummy.updateMatrix();
        this._instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      this._instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  setVisible(visible) {
    this.visible = !!visible;
    this.group.visible = this.visible;
    if (this._instancedMesh) {
      this._instancedMesh.visible = this.visible;
    }
  }

  setOpacity(val) {
    this.opacity = THREE.MathUtils.clamp(val, 0.0, 1.0);
    if (this.material) {
      this.material.opacity = this.opacity;
      this.material.transparent = this.opacity < 1.0;
      this.material.needsUpdate = true;
    }
  }

  update(elapsed) {
    if (!this.group.visible) return;

    // Gentle breathing oscillation — always active for living feel
    for (let i = 0; i < this.clusters.length; i++) {
      const c = this.clusters[i];
      const mesh = this.meshes[i];
      if (!mesh) continue;

      // Each cluster gets a unique phase offset based on index
      const phase = i * 0.47;
      // Great Attractor gets a stronger, slower pulse (breathing glow)
      const isGA = c.id === 'great-attractor';
      const amplitude = isGA ? 0.055 : 0.025;
      const speed = isGA ? 1.2 : 1.8;
      const breathe = 1.0 + Math.sin(elapsed * speed + phase) * amplitude;

      // Additional pulse layer when pulse mode is explicitly enabled
      const extraPulse = this.pulseEnabled
        ? 1.0 + Math.sin(elapsed * 2.8 + phase * 0.3) * 0.035
        : 1.0;

      const totalScale = breathe * extraPulse;

      mesh.scale.set(
        c.radius * c.scale[0] * this.scaleMultiplier * totalScale,
        c.radius * c.scale[1] * this.scaleMultiplier * totalScale,
        c.radius * c.scale[2] * this.scaleMultiplier * totalScale
      );
    }
  }

  getCluster(nameOrId) {
    if (!nameOrId) return null;
    const q = String(nameOrId).toLowerCase().trim();
    return this.clusters.find(c =>
      (c.id && c.id.toLowerCase() === q) ||
      (c.name && c.name.toLowerCase() === q)
    ) || null;
  }

  getClusters() {
    return [...this.clusters];
  }

  dispose() {
    if (this.sharedGeometry) {
      this.sharedGeometry.dispose();
      this.sharedGeometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    if (this._instancedMesh) {
      if (this._instancedMesh.geometry) {
        this._instancedMesh.geometry.dispose();
      }
      this._instancedMesh = null;
    }
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.meshes = [];
  }
}

export { GalaxyClusters as ClusterEllipsoids };
export default GalaxyClusters;
