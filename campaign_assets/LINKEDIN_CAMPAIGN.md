# 🌌 CosmoFlow: 5-Part LinkedIn Technical Ad & Content Campaign

> **Engineered for High-Engagement Tech & Scientific Audiences on LinkedIn**  
> **Topic**: Interactive Cosmological WebGL Visualization & Numerical Flow Simulation  
> **Live Web App**: [https://epic-hubble.vercel.app](https://epic-hubble.vercel.app)  
> **GitHub Repository**: [https://github.com/zrt219/cosmo-flow](https://github.com/zrt219/cosmo-flow)

---

## 📊 Campaign Summary & Asset Inventory

All campaign media assets are formatted in a 1:1 square ratio (600×600 px) with clean telemetry overlays, designed for instant visual impact in the LinkedIn feed.

| Ad / Post # | Focus / Feature | Asset File | File Size | Key Concept |
| :--- | :--- | :--- | :--- | :--- |
| **Post 1** | **Flagship 360° Hero** | [`docs/linkedin_campaign/ad-1-hero-flythrough.gif`](./docs/linkedin_campaign/ad-1-hero-flythrough.gif) | ~1.5 MB | Full Supercluster Basin of Attraction |
| **Post 2** | **RK4 Numerical Physics** | [`docs/linkedin_campaign/ad-2-rk4-streamlines.gif`](./docs/linkedin_campaign/ad-2-rk4-streamlines.gif) | ~988 KB | 4th-order Runge-Kutta Vector Streamlines |
| **Post 3** | **GPU GLSL Shaders** | [`docs/linkedin_campaign/ad-3-gpu-scalar-slice.gif`](./docs/linkedin_campaign/ad-3-gpu-scalar-slice.gif) | ~890 KB | Dynamic Density Slicing & Divergence Planes |
| **Post 4** | **Galaxy Swarm Rendering** | [`docs/linkedin_campaign/ad-4-galaxy-swarm-shimmer.gif`](./docs/linkedin_campaign/ad-4-galaxy-swarm-shimmer.gif) | ~451 KB | 18,000 Particle Instanced BufferGeometries |
| **Post 5** | **Client Recording Studio** | [`docs/linkedin_campaign/ad-5-client-recorder-studio.gif`](./docs/linkedin_campaign/ad-5-client-recorder-studio.gif) | ~1.1 MB | Zero-backend WebM/GIF Client-Side Export |

---

## 🚀 Post 1: The Cosmic Watershed (Hero Announcement)

**Target Audience**: WebGL Engineers, Data Visualization Designers, Astrophysicists, Creative Tech Leaders.  
**Attached Media**: `docs/linkedin_campaign/ad-1-hero-flythrough.gif`

```markdown
What happens when you visualize 500 million light-years of galactic velocity fields in real-time WebGL? 🌌

Meet CosmoFlow — an interactive 3D cosmological flow simulation mapping the Laniakea Supercluster and the Great Attractor directly in your browser.

Based on the landmark Nature 2014 research by Tully et al., CosmoFlow treats galaxy velocities not as static points, but as dynamic streamlines falling along the cosmic gravitational gradient toward the Centaurus/Norma basin.

🛠️ The Engineering Behind It:
• Three.js r174 + Custom GLSL Particle Shaders
• 4th-Order Runge-Kutta (RK4) numerical streamline integration
• Dynamic Gravitational Potential & Density Scalar Slicing
• 100% Client-Side WebM / GIF Recording Studio with Octree Quantization
• Zero backend, 60 FPS across desktop & mobile

Try the live interactive simulation:
🔗 https://epic-hubble.vercel.app

Star the open-source repository on GitHub:
⭐ https://github.com/zrt219/cosmo-flow

What’s your favorite high-density physics or WebGL visualization project? Let's discuss in the comments! 👇

#WebGL #ThreeJS #JavaScript #DataViz #Astronomy #FrontendEngineering #CreativeCoding #OpenSource #Science #Physics
```

---

## 🔬 Post 2: Numerical Integration at Scale (RK4 Vector Streamlines)

**Target Audience**: Physics Engine Devs, Math Enthusiasts, Simulation Developers, Graphics Programmers.  
**Attached Media**: `docs/linkedin_campaign/ad-2-rk4-streamlines.gif`

```markdown
Why standard Euler integration fails when simulating 500 million light-years of gravitational drift 🪐👇

When simulating cosmic streamlines flowing toward the Great Attractor, simple first-order Euler integration accumulates severe truncation errors over astronomical distances:
x(t + dt) = x(t) + v(x) * dt ❌ (High drift & artificial energy gain)

To guarantee numerical stability and preserve the precise cosmological boundary of the Laniakea watershed, CosmoFlow implements 4th-order Runge-Kutta (RK4) integration:
• k1 = v(x)
• k2 = v(x + dt/2 * k1)
• k3 = v(x + dt/2 * k2)
• k4 = v(x + dt * k3)
• x(t + dt) = x(t) + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4) ✅

The result? Crisp, convergent streamlines capturing the gravitational divide between Laniakea and the Perseus-Pisces supercluster at real-time 60 FPS.

Explore the mathematics in action:
🔗 https://epic-hubble.vercel.app
Source code: https://github.com/zrt219/cosmo-flow

#Algorithms #Mathematics #PhysicsEngine #ComputationalPhysics #ThreeJS #JavaScript #WebDev
```

---

## 🎨 Post 3: GPU Scalar Slicing & Real-Time GLSL Shaders

**Target Audience**: Technical Artists, GLSL/Shader Devs, Creative Technologists, UX Engineers.  
**Attached Media**: `docs/linkedin_campaign/ad-3-gpu-scalar-slice.gif`

```markdown
Visualizing invisible volumetric density fields in WebGL without killing frame rates ⚡

In cosmological data visualization, showing galaxies alone misses 90% of the story. The real driver of structure is the underlying Gravitational Potential and Peculiar Velocity divergence fields.

Instead of heavy 3D volumetric raymarching that throttles mobile GPUs, CosmoFlow uses an interactive GPU Scalar Slicing plane:
1. Dynamic arbitrary slicing planes along XY, XZ, and YZ axes
2. Custom GLSL Fragment Shaders sampling analytical potential wells (Great Attractor, Perseus-Pisces, Shapley Concentration)
3. Real-time Viridis / Plasma / Turbo colormap transitions in fractional screen space
4. Iso-contour line generation with adaptive gradient falloff

Interactive parameter controls let users scrub through depth layers and expose hidden gravitational saddles in real time.

Test the slice shader in your browser:
👉 https://epic-hubble.vercel.app

#GLSL #Shader #CreativeCoding #WebGraphics #UIUX #ThreeJS #Frontend
```

---

## 🛰️ Post 4: Rendering 18,000 Galaxies with Zero Garbage Collection

**Target Audience**: Senior Frontend Engineers, Web Performance Specialists, Three.js Architects.  
**Attached Media**: `docs/linkedin_campaign/ad-4-galaxy-swarm-shimmer.gif`

```markdown
How to render 18,000 unique galaxies with Doppler shift, twinkle animations, and zero garbage collection in WebGL 💡

Creating a swarm of thousands of individual Three.js Mesh objects will immediately choke the render loop with draw calls and memory allocations.

Here is the architectural pattern used in CosmoFlow:
🔹 Single BufferGeometry with interleaved Float32Array attributes (Position, Velocity, Color, Luminosity, Phase)
🔹 Custom Vertex Shader executing per-particle sinusoidal twinkle and Doppler color shifting entirely on the GPU
🔹 Zero heap allocations in the `requestAnimationFrame` loop
🔹 Cubic Hermite camera flight interpolation between celestial coordinates (Virgo Cluster, Great Attractor, Centaurus, Norma, Shapley)

Result: Silky smooth 60 FPS on both Apple Silicon and standard mobile devices.

Check out the architecture on GitHub:
⭐ https://github.com/zrt219/cosmo-flow
Live Demo: https://epic-hubble.vercel.app

#WebPerf #SoftwareArchitecture #JavaScript #ThreeJS #Performance #Programming
```

---

## 🎬 Post 5: Browser-Native GIF/Video Studio with Zero Backend

**Target Audience**: Full-Stack Devs, DevTool Creators, Product Engineers, Open Source Contributors.  
**Attached Media**: `docs/linkedin_campaign/ad-5-client-recorder-studio.gif`

```markdown
Ever wanted to let users record high-resolution GIFs and 60 FPS WebM videos directly from your WebGL canvas without a server? 🎥

In CosmoFlow, we built an integrated Client-Side Recording Studio:
✨ MediaRecorder API capturing hardware-accelerated VP9/WebM video streams
✨ Web Worker pipeline using `gifenc` for client-side NeuQuant color quantization
✨ Progress telemetry HUD rendering frame counts, capture times, and file sizes
✨ Automatic one-click file download directly in the client

No FFmpeg server. No AWS Lambda transcoding bill. 100% private, instantaneous, and zero latency.

Try recording your own custom cosmic orbit:
🔗 https://epic-hubble.vercel.app
Source code: https://github.com/zrt219/cosmo-flow

What’s your go-to approach for client-side asset generation?

#WebDev #FullStack #JavaScript #OpenSource #DevTools #BrowserTech #Coding
```

---

## 💡 Best Practices for Running This Campaign

1. **Scheduling**: Space posts 2 to 3 days apart (e.g. Tuesday & Thursday mornings 8:00 AM – 10:00 AM EST).
2. **First Comment Strategy**: Pin a direct link to the GitHub repository and live web app in the first comment for maximum algorithmic reach.
3. **Engagement Hooks**: Ask an open-ended engineering question at the end of each post (e.g., *“How do you handle client-side export in your apps?”* or *“What’s your preferred numerical integrator for physics simulations?”*).
4. **Media Format**: Upload the `.gif` directly to LinkedIn as a video/image asset so it auto-loops silently in the mobile feed.
