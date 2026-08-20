# ⚡ DigiLogic Lab — Interactive Digital Logic Simulator

A modern, high-performance, browser-based digital logic circuit simulator, interactive design workbench, and Boolean analysis suite.

🌐 **Live Demo:** [https://logic-gates-simulator-4jo.pages.dev/](https://logic-gates-simulator-4jo.pages.dev/)

---

## 🚀 Key Features

### 1. 🎛️ Interactive Canvas & Routing Engine
- **Infinite Pan & Zoom**: Smooth canvas navigation with mouse wheel, pinch-to-zoom gestures, and mini-map overview.
- **Dual Wire Routing Modes**:
  - **Curved (Bézier)**: Smooth, organic flow visualization.
  - **Orthogonal (Manhattan)**: Clean, professional 90-degree schematic routing with auto-turn calculation.
- **Dynamic Signal Propagation**: Real-time high (`1` / high voltage) and low (`0` / ground) state propagation with glowing pulse animation.
- **Grid Snapping & Alignment**: Precision placement with configurable grid sizes and snap-to-grid alignment.

### 2. 🧩 Comprehensive Component Library
- **Basic & Universal Gates**: `AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`, `BUFFER`.
- **Combinational Logic ICs**: Half Adders, Full Adders, 2-to-1 & 4-to-1 Multiplexers (MUX), Demultiplexers (DEMUX), Decoders.
- **Sequential Logic & Memory**: D Flip-Flops, JK Flip-Flops, T Flip-Flops, SR Latches, Multi-bit Registers.
- **Inputs & Signal Generators**: Toggle Switches, Momentary Push Buttons, High/Low Constants, Variable-Frequency Clocks, Pulse Generators.
- **Outputs & Visualizers**: Multi-color LEDs (Red, Green, Blue, Amber), 7-Segment Displays, Hex Displays, Logic Probes, Value Text Tags.

### 3. 🏷️ Wireless Named Nets (Bus Interconnection)
- Connect distant components effortlessly using **identical label names**.
- Any input pin or net tagged with the same name automatically syncs with matching outputs without routing cluttering wires across the canvas.

### 4. 🔬 Analytical Power Tools
- **Auto Truth Table Generator**: Automatically detects all circuit inputs and outputs, computing the complete truth table state matrix in real-time.
- **Boolean Expression Solver**: Extracts algebraic Boolean expressions and simplifies them to Sum of Products (SOP) and Product of Sums (POS).
- **Interactive Karnaugh Map (K-Map)**: Visual 2, 3, and 4-variable K-maps with automated prime implicant grouping and minimization.
- **Multi-Channel Digital Oscilloscope**: Real-time logic analyzer displaying timing diagrams, signal transitions, frequency measurements, and clock cycles.

### 5. 🛠️ Custom IC Builder (Subcircuits)
- Bundle any subcircuit into a custom reusable Integrated Circuit (IC) chip with user-defined input/output pin counts, custom labels, and pin layouts.
- Re-use your custom ICs inside larger hierarchical circuits.

### 6. 🎓 Challenge Mode & Educational Guides
- Interactive puzzle levels ranging from basic gate logic to complex arithmetic units and sequential state machines.
- Instant truth-table evaluation with automated test-case scoring and celebratory feedback.
- Step-by-step interactive theory guides covering Boolean algebra laws, De Morgan's theorems, and digital design fundamentals.

### 7. 💾 Storage, Export & Sharing
- **Local Storage Persistence**: Save named circuits locally with custom author metadata (e.g. created by *Sriyans* / *Devashish*).
- **JSON Import / Export**: Share circuit schematics via portable JSON configuration files.
- **High-Resolution Image Export**: Export crisp PNG diagrams of your schematics for lab reports and presentations.

### 8. 📱 Tablet & Touchscreen Optimized
- Full touch gesture support, larger touch target controls, responsive drawer sidebars, and adaptive layouts tailored for tablets and mobile devices.
- Multiple theme palettes: **Dark Studio**, **Clean Light**, **Cyberpunk Midnight**, and **Retro Phosphor CRT**.

---

## 💻 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/) & Canvas Confetti

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/logic-gates-simulator.git
   cd logic-gates-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled static files will be generated in the `dist/` directory.

---

## 🚀 Deployment

### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages.
2. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
3. Single-Page Application (SPA) routing is handled automatically via `public/_redirects`.

### GitHub Pages
A GitHub Actions workflow is provided at `.github/workflows/static.yml`. Ensure GitHub Pages source is configured to **GitHub Actions** in repository settings.

---

## 👥 Authors & Credits

- **Sriyans**
- **Devashish**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
