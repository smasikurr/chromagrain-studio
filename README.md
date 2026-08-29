# 🎨 ChromaGrain Studio — 8K Procedural Gradient & Halftone Asset Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ChromaGrain Studio** is an enterprise-grade, procedural abstract graphic engine designed for digital artists, UI/UX designers, and microstock creators. Generate infinite unique, high-resolution (8K/4K) grainy gradients, liquid mesh art, and vintage halftone dot patterns ready for **Adobe Stock, Freepik, Shutterstock, POD (Print on Demand)**, and SaaS web interfaces.

---

## 🌟 Key Features

### 1. 🎛️ Procedural Gradient Generation
- **10+ Advanced Gradient Archetypes**:
  - `Linear` & `Radial` with dynamic focal points.
  - `Conic / Sweep` for chromatic angles and vinyl textures.
  - `Liquid Mesh / Blobs` for modern fluid UI backgrounds.
  - `Wave / Ribbon` for smooth flowing geometric bands.
  - `Topographic / Contour` for isometric landscape styling.
  - `Aura / Soft Glow` for ambient spiritual and modern glassmorphism aesthetics.
  - `Retro Halftone Screen` for vintage Y2K comic and print aesthetics.

### 2. 🏁 Halftone Engine with 100% Transparent PNG Alpha Export
- **True Alpha Channel Preservation**: Renders isolated halftone dots with complete transparent voids.
- **Color Modes**:
  - **CMYK Inks**: Offset angle-separated cyan, magenta, yellow, and black print dots.
  - **Source Gradient**: Smooth continuous color transitions sampled from the background nodes.
  - **Monochrome Ink**: Custom single-ink color picker with dot/void inversion support.
- **Pattern Geometries**: Dot, Circle, Line / Screen, Diamond, and Crosshair.

### 3. 🛡️ Anti-Banding Dithering & Color Science
- **16-bit Float Emulation**: High-precision math eliminates visual stair-stepping and color banding.
- **Triangular & Blue Noise Dither**: High-frequency film grain injection for velvety smooth transitions.
- **Film Grain & Texture Controls**: Adjustable grain roughness, color noise separation, and micro-luminance jitter.

### 4. 📸 Camera Raw & Filter Gallery Post-Processing
- **Camera Raw Adjustments**: Exposure, Contrast, Highlights, Shadows, Clarity, Texture, Vibrance, Saturation, and Feathered Vignette.
- **Filter Gallery Suite**:
  - *Glass Ripple*: Procedural refraction and caustics.
  - *Plastic Wrap*: Y2K glossy liquid shine and specular highlights.
  - *Halftone Screen*: Classic offset printing rasterization.
  - *Mosaic Stained Glass*: Faceted Voronoi cell fragmentation.
  - *Rough Texture*: Organic fine art paper and canvas tactile grain.

### 5. ⚡ Multi-Threaded 8K Web Worker Rendering
- Offloads heavy rendering to background **OffscreenCanvas Web Workers**, keeping the UI responsive at 60 FPS.
- Supports instant resolutions:
  - **8K UHD** (`7680 × 4320`)
  - **4K UHD** (`3840 × 2160`)
  - **2K QHD** (`2560 × 1440`)
  - **1080p FHD** (`1920 × 1080`)
  - **Square UHD** (`4096 × 4096`)
  - **Custom Dimensions** (Up to 10,000px)

### 6. 📦 Single & Bulk Multi-Format Exporter
- **Single Canvas Download**: Instant one-click export dropdown from the live canvas toolbar.
- **Batch Generator**: Generate 5, 10, 20, 50, or 100 variations simultaneously with unique seeds.
- **Supported Export Formats**:
  - **PNG** (Lossless 32-bit with full alpha transparency support).
  - **Ultra JPEG** (Adobe Stock / Shutterstock submission ready, 98% quality).
  - **WebP** (Ultra-compact for fast web performance).
  - **Vector SVG** (Embeddable vector definitions with pure SVG noise filters).
  - **CSS Code** (Pure CSS gradients + base64 SVG noise layer).
  - **ZIP Archive** (Bulk export with automated folder packaging).
  - **Metadata CSV** (Auto-generated titles, descriptions, and 30+ keywords for stock platforms).

### 7. 🎯 Interactive Live Viewport & Inspection Tools
- **Direct Node Manipulation**: Click anywhere to add color nodes, drag to position.
- **Node Opacity Slider**: Individual 0–100% opacity control per color node with quick presets.
- **Composition Guides**:
  - *Rule-of-Thirds Grid Guide*
  - *Center Alignment Crosshairs*
  - *Vector Connection Lines*
- **Diagnostic Views**:
  - *Hold for Raw* (Compare before/after post-processing effects).
  - *Grayscale Check* (Validate luminance balance and WCAG contrast).
  - *Dark Transparency Checkerboard* (Real-time preview of alpha channels).

---

## 🚀 Commercial Use Cases

| Target Market | Suggested Format | Application |
| :--- | :--- | :--- |
| **Adobe Stock / Freepik** | 8K / 4K JPEG (100% Quality) | Abstract backgrounds, wallpapers, tech textures |
| **Print On Demand (POD)** | High-Res Transparent PNG | T-shirt graphics, streetwear, posters, stickers |
| **UI/UX & SaaS Web** | WebP / Pure CSS Code | Hero section backdrops, glassmorphism cards, onboarding |
| **Graphic Design & Branding** | Vector SVG / 8K PNG | Packaging boxes, vinyl album art, presentation decks |

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) with Functional Hooks
- **Language**: [TypeScript 5.8](https://www.typescriptlang.org/) (Strict Mode)
- **Build Tool**: [Vite 6.2](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Packaging & Archives**: [JSZip](https://stuk.github.io/jszip/)
- **Multi-threading**: Web Workers (`Worker` + `OffscreenCanvas`)

---

## 📂 Project Structure

```text
├── index.html                   # Primary HTML entry point
├── package.json                 # Dependencies and build scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
├── src/
│   ├── main.tsx                 # Application mount
│   ├── App.tsx                  # Core state coordinator & layout
│   ├── types.ts                 # Central TypeScript interfaces & types
│   ├── components/
│   │   ├── TopBar.tsx           # Header, actions, and global branding
│   │   ├── Sidebar.tsx          # Deep parameter tuning & filter controls
│   │   ├── CanvasPreview.tsx    # Live interactive viewport & node editor
│   │   ├── BulkGallery.tsx      # Batch gallery manager, filters & cards
│   │   └── ExportModal.tsx      # CSS / SVG / PNG modal export dialog
│   └── utils/
│       ├── renderer.ts          # Core 2D canvas rendering & filter pipeline
│       ├── worker.ts            # Web Worker dispatcher for high-res rendering
│       ├── renderWorker.ts      # OffscreenCanvas procedural worker thread
│       ├── svgExporter.ts       # Scalable vector SVG generator
│       ├── metadata.ts          # Stock metadata, tags & CSV exporter
│       └── color.ts             # RGB, HSL, Hex, and color harmony algorithms
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/) / [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/chromagrain-studio.git
   cd chromagrain-studio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Production Build

To build the optimized static production bundle:
```bash
npm run build
```
The output will be generated in the `dist/` directory, ready to deploy to Vercel, Netlify, Cloudflare Pages, or Cloud Run.

### Linting & Type Checking

```bash
npm run lint
```

---

## 📈 Stock Platform Submission Checklist

When uploading assets created with ChromaGrain Studio to **Adobe Stock** or **Shutterstock**:
1. **Resolution**: Select **8K** or **4K** preset (ensures > 4MP requirement).
2. **Color Banding**: Keep **Anti-Banding Dither** turned **ON**.
3. **Format**:
   - Use **Ultra JPG** for solid backgrounds.
   - Use **Transparent PNG** for Halftones and isolated design elements.
4. **Metadata**: Click **Export Metadata CSV** in the bulk gallery to get copy-paste ready titles and 30+ high-ranking keywords.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
