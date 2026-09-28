---
description: Guardrails for UI event handlers, Motion One/animation libraries, and Three.js camera transitions
always_on: true
---

# Three.js & UI Animation Engineering Guardrails

## 1. Event Handler Business Logic Priority
- **Execute Critical Logic First**: In DOM and HUD event listeners, always execute primary state changes, data mutations, and camera dispatchers (e.g., `applyPreset`, `navigate`, `setState`) **before** calling optional cosmetic micro-animations.
- **Defensive Micro-Animations**: Wrap third-party animation library calls (Motion One, GSAP, Web Animations API) in `try/catch` or use native CSS transitions so cosmetic animation failures can never break core functionality.

## 2. Three.js OrbitControls & Camera Tween Coexistence
- **Disable Controls During Tweens**: When animating `camera.position`, `camera.fov`, and `controls.target`, set `controls.enabled = false` for the duration of the transition to prevent OrbitControls from overriding camera matrices.
- **Resynchronize on Arrival**: Upon completion of the tween, set `controls.enabled = true` and call `controls.update()`.
- **Deterministic Easing**: Prefer time-based parametric tweens (e.g., cubic Hermite / smoothstep) over unbounded frame-rate dependent `lerp` for camera flight paths.

## 3. 3D Orbital Controller Singularity Defense
- When implementing auto-orbit around a target using cylindrical/spherical coordinates, check radial distance (`Math.hypot(offset.x, offset.z) > 1.5`) before calculating `Math.atan2(offset.z, offset.x)` to prevent orientation locking in vertical/top-down camera angles.
- Pause auto-orbit for a graceful duration (e.g., 3-5 seconds) after preset selection or user interaction.
