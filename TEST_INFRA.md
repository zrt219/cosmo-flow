# E2E Test Infra: Laniakea 3D Cosmic Velocity Flow

## Test Philosophy
- Requirement-driven verification derived from `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- Multi-tier validation:
  - **Tier 1: Feature Coverage (Static & Semantic Structure)**: Verify all 12 labels, Coma attractor coordinates, cluster ellipsoids, shader uniform expansions, and lil-gui controls exist in the codebase.
  - **Tier 2: Boundary & Corner Cases**: Numerical integration boundary checks, singularity distance threshold checks, uniform array dimension limits, canvas texture dimensions.
  - **Tier 3: Cross-Feature Combinations**: SlicePlaneMesh with 6 attractors, StreamlineRenderer with Coma seeds and color gradient, camera presets interacting with OrbitControls and billboard labels.
  - **Tier 4: Production Build & Runtime Acceptance**: Clean execution of `npm run build` with zero errors, bundle size validation, clean Vite transformation.
  - **Tier 5: Adversarial Forensics & Integrity Audit**: Ensure no hardcoded dummy facades, verify genuine RK4 integration and dynamic Three.js meshes.

## Acceptance Test Suite Script
A lightweight test runner script `tests/verify_laniakea.js` will verify:
1. All 12 label definitions and coordinates present in `CosmicLabels.js`.
2. Coma cluster registered at `(5, 45, -25)` with proper mass and universal core termination in `CosmicField.js`.
3. Shader uniform arrays expanded to 6 attractors in `SlicePlaneMesh.js`.
4. High-altitude streamline seeds and 8-stop color ramp present in `StreamlineRenderer.js`.
5. 3D shaded cluster ellipsoids with MeshPhysicalMaterial present in `GalaxyClusters.js`.
6. Camera coordinates `(-12, 100, 135)` and lil-gui controls present in `main.js` and `ControlPanel.js`.
7. `npm run build` production build succeeds cleanly.
