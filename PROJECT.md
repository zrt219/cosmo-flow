# Project: Laniakea 3D Cosmic Velocity Flow (Tully et al. Nature 2014)

## Architecture
- **Language / Framework**: Modern ES Modules, Three.js (v0.174.0), Vite (v6.2.0), lil-gui (v0.20.0).
- **Scene & Rendering**: `src/main.js` hosts `THREE.Scene`, `THREE.PerspectiveCamera`, `WebGLRenderer` (ACESFilmicToneMapping, antialias, sRGB), and `EffectComposer` with `RenderPass` and `UnrealBloomPass`. Directional lights at `(60, 120, 80)` (intensity 1.4) and `(-80, 50, -60)` (intensity 0.8), ambient light `0.85`.
- **Physics Field**: `src/physics/CosmicField.js` computes gravitational potentials ($\Phi$), gradient velocity vectors ($\mathbf{v} = -\nabla\Phi$), and streamlines via 4th-order Runge-Kutta (RK4) numerical integration.
- **Visual Systems**:
  - `src/renderers/StreamlineRenderer.js`: Single batched `THREE.LineSegments` for velocity streamlines, `THREE.InstancedMesh` for animated flow indicator cones.
  - `src/renderers/SlicePlaneMesh.js`: Volumetric density / potential heatmap slice on $Y = 0$ via custom GLSL `ShaderMaterial`.
  - `src/renderers/GalaxySwarm.js`: 16,000+ galaxy particle points via custom `ShaderMaterial` with distance attenuation and logarithmic falloff.
  - `src/renderers/GalaxyClusters.js` (new/enhanced): 3D shaded ellipsoids/spheres for major clusters (Centaurus, Virgo, Hydra, Antlia, Coma, Great Attractor) rendered with `THREE.MeshPhysicalMaterial` for specular highlights.
  - `src/renderers/CosmicLabels.js`: High-DPI canvas `THREE.Sprite` 3D billboard labels with crisp typography, dark outer glow, bloom integration, and batched `THREE.LineSegments` 3D leader lines.
- **UI & Controls**: `src/ui/ControlPanel.js` with `lil-gui` controls and HTML HUD overlay in `index.html`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 12 Scientific 3D Billboard Labels | Render 12 structures: GA, Centaurus, Virgo, Milky Way, Coma, Hydra, Antlia, NGC 5016, Abell 3574, Abell 3565, Abell 50753, Bulk Flow with High-DPI canvas sprites and subtle glow | M1 | ORIGINAL_REQUEST §R1 |
| 2 | 3D Hairline Leader Lines | Batched LineSegments connecting labels to physical cluster centroids | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Distance-Based Scale & Fade | Dynamic distance attenuation keeping labels readable without screen clutter | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Coma Gravitational Attractor | Register Coma at (5, 45, -25) with mass 2600 in CosmicField.js | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Universal Attractor Termination | Generalize RK4 core distance check to all attractors | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Slice Plane Uniform Expansion | Expand SlicePlaneMesh GLSL uniform arrays to 6 attractors | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Coma Fountain Streamline Seeds | Allocate 20% of seeds to northern launch corridor creating high arches reaching Y ~ 43+ | M2 | ORIGINAL_REQUEST §R2 |
| 8 | 8-Stop Scientific Color Gradient | Smooth transition: deep blue/cyan outflow -> silvery-white filaments -> warm gold/red hub | M2 | ORIGINAL_REQUEST §R2 |
| 9 | 3D Shaded Cluster Ellipsoids | Shaded ellipsoids/spheres for Hydra, Antlia, Centaurus, Virgo, Coma, GA using MeshPhysicalMaterial with specular sheen | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Hierarchical Galaxy Swarm Density | Power-law density swarms tightly packed around Virgo and Centaurus/GA cores | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Reference Camera Alignment | Default camera at (-12, 100, 135) looking at (-10, 4, -8) FOV 46 matching Tully et al. 2014 layout | M4 | ORIGINAL_REQUEST §R4 |
| 12 | Viewpoint Presets & Switching | Camera presets for Reference, Coma Arch, Virgo Cluster, GA Core, Top-Down, Repeller Outflow | M4 | ORIGINAL_REQUEST §R4 |
| 13 | HUD & GUI Label Controls | Toggles for labels, leader lines, label opacity slider, cluster ellipsoid controls | M4 | ORIGINAL_REQUEST §R4 |
| 14 | E2E Build & 60 FPS Verification | Production build `npm run build` succeeds cleanly; 60 FPS maintained; all criteria verified | M5 | ORIGINAL_REQUEST §AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 3D Scientific Typography & Labels | Implement 12 High-DPI canvas billboard sprites, glow, batched leader lines, scale/fade in `CosmicLabels.js` | None | DONE |
| M2 | Coma Fountain Loops & Velocity Gradient | Add Coma attractor, universal core termination, expand slice plane uniforms, Coma streamline seeds, 8-stop color ramp in `CosmicField.js` and `StreamlineRenderer.js` | None | DONE |
| M3 | Major Cluster 3D Ellipsoids & Swarm Density | Create 3D shaded ellipsoids in `GalaxyClusters.js` and overhaul `GalaxySwarm.js` with high-density cores | None | IN_PROGRESS (worker_m3) |
| M4 | Camera Angle & UI Alignment | Calibrate camera to reference view, add presets, expand lil-gui in `main.js` and `ControlPanel.js` | M1, M2, M3 | PLANNED |
| M5 | E2E Testing, Build & Forensic Audit | Run full production build, verify 60 FPS, verify all Acceptance Criteria, independent forensic audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### `CosmicLabels.js` ↔ `main.js`
- `new CosmicLabels(scene)`: attaches billboard sprites and leader lines group to `scene`.
- `update(camera, elapsed)`: calculates billboard orientation, camera distance scaling, and visibility.
- `setVisible(boolean)`: toggles all labels and leader lines.
- `setOpacity(number [0, 1])`: sets global opacity of sprite materials and line materials.
- `setLeaderLinesVisible(boolean)`: toggles leader lines independently.

### `CosmicField.js` ↔ `StreamlineRenderer.js` & `SlicePlaneMesh.js`
- `attractors`: array of objects `{ id, name, position: Vector3, mass: number, softening: number, color: number }`. Includes `coma-cluster` at `(5, 45, -25)`.
- `traceStreamline(seed, stepSize, maxSteps, direction)`: terminates when distance to ANY attractor core is $< 2.8$.
- `getShaderData()`: exports up to 6 attractors into flat arrays (`positions[18]`, `masses[6]`, `softenings[6]`).

### `GalaxyClusters.js` ↔ `main.js` & `ControlPanel.js`
- `new GalaxyClusters(scene)`: creates shaded ellipsoids/spheres for prominent clusters with `MeshPhysicalMaterial`.
- `setVisible(boolean)`: toggles cluster meshes.
- `setOpacity(number)`: adjusts material opacity.
- `update(elapsed)`: subtle pulse or specular animation if enabled.

### `GalaxySwarm.js` ↔ `main.js`
- Generates 16,000+ points with dedicated density concentration at Virgo (3,400), Centaurus/GA (5,200), Hydra/Antlia (2,200), Coma (1,600).
- `update(elapsed)`: animates velocity drift shader uniforms.

## Code Layout
- `src/main.js`: Main application entry, scene, camera, lights, composer, animation loop.
- `src/physics/CosmicField.js`: Attractor definitions, gravitational field, RK4 streamline integration.
- `src/renderers/StreamlineRenderer.js`: Streamline generation, Coma corridor seeds, 8-stop color gradient, flow cones.
- `src/renderers/SlicePlaneMesh.js`: Density heatmap GLSL shader plane (updated to 6 attractors).
- `src/renderers/GalaxySwarm.js`: Hierarchical galaxy particle density distribution and point shader.
- `src/renderers/GalaxyClusters.js`: 3D shaded ellipsoids/spheres with specular lighting.
- `src/renderers/CosmicLabels.js`: 3D billboard labels with subtle glow and 3D leader lines.
- `src/ui/ControlPanel.js`: lil-gui controls, camera presets, label/cluster/streamline toggles and sliders.
- `index.html` & `src/style.css`: HTML HUD styling, canvas container, typography.
