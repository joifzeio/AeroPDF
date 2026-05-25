# AeroPDF ── Privacy-First, 100% Client-Side PDF Tools Suite

<p align="center">
  <img src="https://img.shields.io/github/license/joifzeio/AeroPDF?style=flat-square&color=ef4444" alt="License" />
  <img src="https://img.shields.io/github/languages/top/joifzeio/AeroPDF?style=flat-square&color=3b82f6" alt="Language" />
  <img src="https://img.shields.io/github/directory-file-count/joifzeio/AeroPDF?style=flat-square&color=10b981" alt="Files" />
  <img src="https://img.shields.io/badge/Privacy-100%25_Browser--Based-0d9488?style=flat-square" alt="Privacy Guaranteed" />
</p>

**AeroPDF** is an ultra-premium, modern SaaS-grade web platform providing 14 high-fidelity PDF utilities. Unlike traditional platforms (like *iLovePDF* or *Smallpdf*), AeroPDF compiles, parses, and stamps all files **100% locally inside the user's browser thread** utilizing WebAssembly, `pdf-lib`, and rendering layers (`pdf.js`). Your documents never leave your computer.

---

## 🔒 Complete Regulatory Compliance & Privacy By Design

AeroPDF is engineered from the ground up to naturally satisfy the strictest global compliance standards:

*   **GDPR / CCPA / HIPAA Compliance**: Because AeroPDF is purely serverless and stores no cookies, user metrics, or document logs, **no personal data is ever collected, stored, or transmitted**. It is immediately and fully compliant with data preservation rules without requiring extensive security structures.
*   **Zero Server Uploads**: File binary operations compile on-device in isolated memory. This mitigates risks associated with data breaches or file leakage.
*   **Transparent MIT Licensing**: Free for commercial and personal usage, ensuring absolute legal transparency.

---

## 🎨 Design Philosophy & UX Features

AeroPDF presents a visual experience designed to stand out:
*   **Harmonious SaaS Palette**: Curated pastel-hued icon cards with soft, animated pink/purple background blobs that replicate premium web depths.
*   **Animated Brand Identity**: An uppercase minimal navigation header featuring a beating red SVG heart logo.
*   **Visual Pill Filtering**: Drag-responsive landing page tabs (`All`, `Organize PDF`, `Convert PDF`, `PDF Security`) with instant grid sorting.
*   **UX Action Chaining**: A direct flow engine. When a task completes, chain cards allow the user to forward output files **directly to another utility** (e.g. *Merge PDF* ➜ *Sign PDF* ➜ *Compress PDF*) without downloading and re-uploading.

---

## 🛠️ The 14 Integrated Client-Side Utilities

### 📂 1. Structure & Layout Optimization
1.  **Merge PDF**: Combine multiple PDFs into a unified file. Previews cover thumbnails and supports alpha-sort or drag-and-drop manual ordering.
2.  **Split PDF**: Extract custom ranges (e.g. `1-3, 5`) into a separate document.
3.  **Rotate Pages**: Rotates visual preview cards and applies coordinate-degree page adjustments natively.
4.  **Remove Pages**: Multi-range page-stripping. Implements a descending order deletion pipeline to avoid offset shifting.
5.  **Organize Pages**: Visual sequence restructurer. Drag and shift pages, insert blank sheets at any position, or remove pages.
6.  **Compress PDF**: Packs and flates object stream tables natively using lossless WebAssembly stream compression to reduce file size.

### 🔄 2. Document Converter Suite
7.  **PDF to JPG**: Converts pages onto HTML5 canvas nodes at configurable DPI levels (72, 150, 300). Outputs a unified ZIP for multi-page extractions.
8.  **JPG to PDF**: Packages image lists into standardized PDFs with Letter/A4 sizing, margins, and orientation toggles.
9.  **PDF to Text**: Parses page-by-page text characters client-side, showing a copyable interface and downloading raw `.txt` files.
10. **Text to PDF**: Formats text sheets using standard fonts, customizable lines, font-sizing, page bounds, and real-time previews.
11. **HTML to PDF**: A fully sandbox-compiled HTML/CSS preview editor that renders clean print-vector layouts.

### 📝 3. Security, Signing & Stamping
12. **Page Numbers**: Stamp numbering strings ("Page X of Y") at bottom-center, bottom-right, or top-right coordinate alignments.
13. **Watermark PDF**: Embed transparent text overlays with adjustable opacity, angle rotations, colors, and sizing.
14. **Sign PDF (E-Sign)**:
    *   *Draw Mode*: Smooth brush signature pad with touch support and color options (Black, Blue, Red).
    *   *Type Mode*: Formats names into realistic hand-drawn calligraphy utilizing cursive typefaces.
    *   *Precision Coordinate Mapping*: Allows absolute drag placement. Screen coordinates are calculated back to PDF points, accounting for the bottom-left coordinate origin.

---

## 💻 Tech Stack & Attributions

AeroPDF is built using:
*   **React + TypeScript + Vite**: Fast UI rendering and quick module-hot reloading.
*   **pdf-lib**: For binary PDF structures assembly, stamping, and compilation.
*   **pdf.js (pdfjs-dist)**: For canvas rendering, page extracts, and image overlays.
*   **jszip**: For ZIP packing algorithms.

AeroPDF acknowledges and is built upon standard open-source core libraries:
*   [pdf-lib](https://github.com/Hopding/pdf-lib) (MIT License)
*   [pdf.js](https://github.com/mozilla/pdf.js) (Apache 2.0 License)
*   [JSZip](https://github.com/Stuk/jszip) (MIT License)

---

## 🚀 Local Development & Quick Start

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/joifzeio/AeroPDF.git
    cd AeroPDF
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run in development environment**:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173/`.

4.  **Compile production static build**:
    ```bash
    npm run build
    ```
    Static compilation output will be located in `/dist` and ready for hosting.
