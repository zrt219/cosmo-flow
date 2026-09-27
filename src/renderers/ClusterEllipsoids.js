import * as THREE from 'three';

/**
 * ClusterEllipsoids renders 3D shaded ellipsoids/spheres representing
 * major galaxy clusters and foreground galaxies faithfully matching the
 * Tully et al. (Nature 2014) reference visualization.
 */
export class ClusterEllipsoids {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ClusterEllipsoidsGroup';

    this.visible = true;
    this.scaleMultiplier = 1.0;

    this.initClusterData();
    this.buildMeshes();
  }

  initClusterData() {
    this.clusters = [
      // 1. Foreground prominent galaxy clusters (Bottom Left)
      { pos: new THREE.Vector3(-55, -2, 60), radius: 3.2, scale: [1.1, 0.9, 1.0] },
      { pos: new THREE.Vector3(-68, -6, 52), radius: 2.6, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(-45, -4, 68), radius: 2.8, scale: [1.2, 0.8, 1.1] },
      { pos: new THREE.Vector3(-75, 4, 35), radius: 2.2, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(-60, 8, 25), radius: 2.4, scale: [1.0, 1.0, 1.0] },

      // 2. Foreground prominent galaxy clusters (Bottom Right / Milky Way neighborhood)
      { pos: new THREE.Vector3(25, -6, 55), radius: 3.0, scale: [1.1, 0.9, 1.1] },
      { pos: new THREE.Vector3(42, -8, 62), radius: 3.4, scale: [1.2, 0.85, 1.0] },
      { pos: new THREE.Vector3(58, -12, 70), radius: 3.8, scale: [1.15, 0.9, 1.15] },
      { pos: new THREE.Vector3(34, -4, 42), radius: 2.5, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(12, -2, 48), radius: 2.2, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(48, -2, 38), radius: 2.8, scale: [1.05, 0.95, 1.0] },

      // 3. Hydra & Antlia cluster nodes
      { pos: new THREE.Vector3(-24, 8, 18), radius: 2.8, scale: [1.1, 1.0, 1.0] }, // Hydra
      { pos: new THREE.Vector3(-18, 5, 22), radius: 2.4, scale: [1.0, 1.0, 1.0] }, // Antlia
      { pos: new THREE.Vector3(-28, 6, 26), radius: 1.8, scale: [1.0, 1.0, 1.0] },

      // 4. Centaurus & Great Attractor Hub
      { pos: new THREE.Vector3(-34, 6, 2), radius: 3.6, scale: [1.2, 0.9, 1.1] }, // Centaurus Core
      { pos: new THREE.Vector3(-38, 2, -5), radius: 4.2, scale: [1.1, 1.0, 1.1] }, // Great Attractor
      { pos: new THREE.Vector3(-42, 10, -12), radius: 2.8, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(-28, 14, 12), radius: 2.2, scale: [1.0, 1.0, 1.0] }, // Abell 3574
      { pos: new THREE.Vector3(-32, 10, 16), radius: 2.0, scale: [1.0, 1.0, 1.0] }, // Abell 3565

      // 5. Virgo & Coma Bridge Nodes
      { pos: new THREE.Vector3(-8, 3, 0), radius: 3.5, scale: [1.1, 0.95, 1.05] }, // Virgo
      { pos: new THREE.Vector3(-16, 22, -12), radius: 2.2, scale: [1.0, 1.0, 1.0] }, // NGC 5016
      { pos: new THREE.Vector3(5, 45, -25), radius: 3.8, scale: [1.1, 1.1, 1.1] }, // Coma Core
      { pos: new THREE.Vector3(2, 48, -28), radius: 2.4, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(8, 42, -22), radius: 2.0, scale: [1.0, 1.0, 1.0] },

      // 6. Background peripheral clusters (Top & Edges)
      { pos: new THREE.Vector3(-15, 35, -45), radius: 2.2, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(25, 28, -40), radius: 2.5, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(-50, 20, -35), radius: 2.4, scale: [1.0, 1.0, 1.0] },
      { pos: new THREE.Vector3(65, 8, -20), radius: 2.8, scale: [1.1, 0.9, 1.0] }
    ];
  }

  buildMeshes() {
    // Shaded glossy white/pearl material matching the reference image's cluster spheres
    const material = new THREE.MeshStandardMaterial({
      color: 0xf5f7fb,
      roughness: 0.22,
      metalness: 0.15,
      emissive: 0x222835,
      flatShading: false
    });

    const sphereGeo = new THREE.SphereGeometry(1.0, 32, 24);

    this.instancedMesh = new THREE.InstancedMesh(sphereGeo, material, this.clusters.length);
    this.instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

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
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.instancedMesh);
  }

  setScaleMultiplier(val) {
    this.scaleMultiplier = val;
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
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  setVisible(visible) {
    this.visible = visible;
    this.group.visible = visible;
  }
}
