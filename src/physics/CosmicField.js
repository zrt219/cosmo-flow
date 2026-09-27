import * as THREE from 'three';

/**
 * CosmicField models the cosmological velocity potential and peculiar velocity field
 * based on attractor/repeller gravitational dynamics (Laniakea / Dipole Repeller).
 */
export class CosmicField {
  constructor() {
    // Default cosmic structures scaled for visualization [-100, 100]
    this.attractors = [
      {
        id: 'great-attractor',
        name: 'Great Attractor / Laniakea Core',
        position: new THREE.Vector3(-38, 2, -5),
        mass: 3200,
        softening: 12.0,
        type: 'attractor',
        color: 0xffaa33
      },
      {
        id: 'shapley-basin',
        name: 'Centaurus / Shapley Flow',
        position: new THREE.Vector3(-60, 10, -25),
        mass: 2200,
        softening: 16.0,
        type: 'attractor',
        color: 0xff4422
      },
      {
        id: 'dipole-repeller',
        name: 'Dipole Repeller',
        position: new THREE.Vector3(32, -4, 18),
        mass: -2600, // Negative mass repels flow
        softening: 14.0,
        type: 'repeller',
        color: 0x4488ff
      },
      {
        id: 'perseus-pisces',
        name: 'Perseus-Pisces Filament',
        position: new THREE.Vector3(45, 14, -30),
        mass: 1400,
        softening: 18.0,
        type: 'attractor',
        color: 0x66dd88
      },
      {
        id: 'coma-cluster',
        name: 'Coma Supercluster / Inflow Apex',
        position: new THREE.Vector3(5, 45, -25),
        mass: 2600,
        softening: 14.0,
        type: 'attractor',
        color: 0xb0d0ff
      }
    ];

    // Global field parameters
    this.backgroundDrift = new THREE.Vector3(-0.08, 0.01, -0.04); // Hubble residual cosmic drift
    this.damping = 0.98;
  }

  /**
   * Compute gravitational/velocity potential Phi at (x, y, z)
   * Higher Phi = repulsive peak (repeller); Lower Phi = attractive well (attractor)
   * We define Phi such that peculiar velocity v = -grad(Phi)
   */
  getPotential(x, y, z) {
    let phi = 0;
    for (let i = 0; i < this.attractors.length; i++) {
      const a = this.attractors[i];
      const dx = x - a.position.x;
      const dy = y - a.position.y;
      const dz = z - a.position.z;
      const distSq = dx * dx + dy * dy + dz * dz + a.softening * a.softening;
      const invDist = 1.0 / Math.sqrt(distSq);
      
      // For an attractor (mass > 0), potential is deep negative well: -G * M / r
      // For a repeller (mass < 0), potential is high positive hill: +G * |M| / r
      phi -= (a.mass * invDist);
    }
    // Background potential gradient (drift)
    phi += (x * this.backgroundDrift.x + y * this.backgroundDrift.y + z * this.backgroundDrift.z) * 15.0;
    return phi;
  }

  /**
   * Compute peculiar velocity vector v = -grad(Phi) at (x, y, z)
   * Points toward attractors, away from repellers
   */
  getVelocity(x, y, z, target = new THREE.Vector3()) {
    target.set(0, 0, 0);

    for (let i = 0; i < this.attractors.length; i++) {
      const a = this.attractors[i];
      const dx = x - a.position.x;
      const dy = y - a.position.y;
      const dz = z - a.position.z;
      const distSq = dx * dx + dy * dy + dz * dz + a.softening * a.softening;
      const dist = Math.sqrt(distSq);
      const invDist3 = 1.0 / (dist * dist * dist);

      // Force = - grad( - mass / dist ) = - mass * delta / dist^3
      // For attractor (mass > 0): pulls toward attractor (-dx)
      // For repeller (mass < 0): pushes away from repeller (+dx)
      const forceMag = -a.mass * invDist3;
      target.x += forceMag * dx;
      target.y += forceMag * dy;
      target.z += forceMag * dz;
    }

    // Add background cosmological drift
    target.add(this.backgroundDrift);

    return target;
  }

  /**
   * Runge-Kutta 4th Order (RK4) integration step
   */
  rk4Step(pos, dt, result = new THREE.Vector3()) {
    const k1 = new THREE.Vector3();
    const k2 = new THREE.Vector3();
    const k3 = new THREE.Vector3();
    const k4 = new THREE.Vector3();
    const temp = new THREE.Vector3();

    // k1 = v(pos)
    this.getVelocity(pos.x, pos.y, pos.z, k1);

    // k2 = v(pos + dt * 0.5 * k1)
    temp.copy(pos).addScaledVector(k1, dt * 0.5);
    this.getVelocity(temp.x, temp.y, temp.z, k2);

    // k3 = v(pos + dt * 0.5 * k2)
    temp.copy(pos).addScaledVector(k2, dt * 0.5);
    this.getVelocity(temp.x, temp.y, temp.z, k3);

    // k4 = v(pos + dt * k3)
    temp.copy(pos).addScaledVector(k3, dt);
    this.getVelocity(temp.x, temp.y, temp.z, k4);

    // result = pos + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
    result.copy(pos).addScaledVector(k1, dt / 6.0);
    result.addScaledVector(k2, dt / 3.0);
    result.addScaledVector(k3, dt / 3.0);
    result.addScaledVector(k4, dt / 6.0);

    return result;
  }

  /**
   * Trace a full streamline from a starting seed position
   * Returns array of points and total length
   */
  traceStreamline(startPos, maxSteps = 160, stepSize = 1.1) {
    const points = [startPos.clone()];
    const current = startPos.clone();
    const next = new THREE.Vector3();
    let totalLength = 0;

    const bounds = 110;
    let destination = 'boundary';

    for (let step = 0; step < maxSteps; step++) {
      this.rk4Step(current, stepSize, next);

      // Check boundary conditions
      if (Math.abs(next.x) > bounds || Math.abs(next.y) > bounds * 0.7 || Math.abs(next.z) > bounds) {
        break;
      }

      // Check distance to any attractor core (< 2.8) to cleanly terminate without singularity collapse
      let reachedCore = false;
      for (let i = 0; i < this.attractors.length; i++) {
        const a = this.attractors[i];
        if (a.mass > 0 && next.distanceTo(a.position) < 2.8) {
          points.push(next.clone());
          totalLength += current.distanceTo(next);
          destination = a.id;
          reachedCore = true;
          break;
        }
      }
      if (reachedCore) {
        break;
      }

      const segmentDist = current.distanceTo(next);
      if (segmentDist < 0.05) {
        // Flow stagnation
        destination = 'stagnation';
        break;
      }

      totalLength += segmentDist;
      points.push(next.clone());
      current.copy(next);
    }

    return {
      points,
      totalLength,
      destination
    };
  }

  /**
   * Formats attractor array for GLSL shader uniforms
   */
  getShaderData() {
    const positions = [];
    const masses = [];
    const softenings = [];

    for (let i = 0; i < 6; i++) {
      const a = this.attractors[i] || { position: new THREE.Vector3(), mass: 0, softening: 1 };
      positions.push(a.position.x, a.position.y, a.position.z);
      masses.push(a.mass);
      softenings.push(a.softening);
    }

    return {
      uAttractorPositions: positions,
      uAttractorMasses: masses,
      uAttractorSoftenings: softenings,
      uAttractorCount: this.attractors.length,
      uBackgroundDrift: [this.backgroundDrift.x, this.backgroundDrift.y, this.backgroundDrift.z]
    };
  }
}
