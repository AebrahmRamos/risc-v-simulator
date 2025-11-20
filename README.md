# RISC-V Simulator (Milestone 1)

IDE-like interface for RISC-V assembly validation and simulation.

## 🚀 Quick Start

### Backend (FastAPI)

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app:app --reload --port 8000
```

Backend runs on: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Frontend (React + Vite + Tailwind)

```bash
cd web
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## ✨ Features (Milestone 1)

- ✅ **Tokyo Night Storm Theme** - Dark IDE-like interface
- ✅ **Code Editor** - Write RISC-V assembly with real-time validation
- ✅ **CPU State Display** - View integer (x0-x31) and floating-point (f0-f31) registers with ABI names
- ✅ **Assembly Validation** - Real-time error checking via FastAPI backend
- ✅ **Error Console** - Inline and console error display
- ✅ **Pipeline Visualization** - Mock pipeline map (ready for expansion)

## 📦 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Tokyo Night Storm color palette

**Backend:**
- FastAPI 0.115
- Python 3.13+
- Pydantic validation
- CORS enabled

## 🛠️ Supported Instructions

- **LW** - Load Word: `LW x1, 0(x2)`
- **SW** - Store Word: `SW x2, 4(x1)`
- **AND** - Bitwise AND: `AND x3, x1, x2`
- **OR** - Bitwise OR: `OR x3, x1, x2`
- **ORI** - OR Immediate: `ORI x3, x1, 10`
- **BLT** - Branch Less Than: `BLT x1, x2, loop`
- **BGE** - Branch Greater Equal: `BGE x1, x2, end`

## 📋 Component Architecture
 - **web/src/components/ToolBar.tsx** : Top action bar (Run, Pause, Step, Reset, Assemble) and error count.
 - **web/src/components/CodePanel.tsx** : Code editor area (textarea for M1) with inline assembler error display.
 - **web/src/components/CPUState.tsx** : Read-only CPU state panel showing PC, integer (x0..x31) and FP (f0..f31) registers.
 - **web/src/components/BottomPanel/index.tsx** : Bottom tabbed panel (Pipeline Map, Pipeline Registers, Errors/Console).

## 📄 File descriptions (key files)

- `web/src/App.tsx` — Main frontend layout and glue code: holds UI state, calls assemble API, wires components.
- `web/src/types.ts` — TypeScript interfaces for SimulationState, PipelineState, and assembler error shapes.
- `web/src/services/api.ts` — Frontend API client (assembleCode) that talks to the FastAPI backend.
- `web/src/main.tsx` — React entry point that mounts the app.
- `web/index.html`, `web/vite.config.ts`, `web/package.json` — Vite/Dev config and project manifest.
- `web/src/index.css` — Tailwind + Tokyo Night Storm theme tokens and global styles.

- `backend/app.py` — FastAPI application; exposes `/api/assemble` and configures CORS.
- `backend/simulator/assembler.py` — Refactored assembler/validator logic: parse_instruction() and validate_program().
- `backend/simulator/__init__.py` — Package marker for the simulator package (can be empty).
- `backend/requirements.txt` — Python dependencies (FastAPI, uvicorn, pydantic).

```
┌─────────────────────────────────────────────┐
│  ToolBar (Run, Pause, Step, Reset, Assemble) │
├─────────────────────┬───────────────────────┤
│   Code Editor       │   CPU State           │
│   (CodePanel)       │   - Registers         │
│                     │   - PC                │
│                     │   - Float Registers   │
├─────────────────────┴───────────────────────┤
│  Bottom Panel (Tabs)                        │
│  - Pipeline Map                             │
│  - Pipeline Registers                       │
│  - Errors / Console                         │
└─────────────────────────────────────────────┘
```

## 🔌 API Endpoints

### POST /api/assemble
Validate RISC-V assembly code.

**Request:**
```json
{
  "source": "LW x1, 0(x2)\nAND x3, x1, x2"
}
```

**Response:**
```json
{
  "success": true,
  "instructions": [
    {"line": 1, "opcode": "LW", "raw": "LW x1, 0(x2)"},
    {"line": 2, "opcode": "AND", "raw": "AND x3, x1, x2"}
  ],
  "errors": []
}
```

## 🧪 Testing

Verified with Playwright browser automation:
- ✅ Assembly validation (success cases)
- ✅ Error detection and display
- ✅ Console output formatting
- ✅ UI component rendering

## 📁 Project Structure

```
risc-v-simulator/
├── backend/
│   ├── app.py              # FastAPI app
│   ├── simulator/
│   │   ├── assembler.py    # Validation logic
│   │   └── __init__.py
│   └── requirements.txt
├── web/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── types.ts        # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🎨 Color Palette (Tokyo Night Storm)

- Background: `#1a1b26`
- Panels: `#24283b`
- Borders: `#1f2335`
- Text: `#a9b1d6`
- Accent Blue: `#7aa2f7`
- Accent Cyan: `#7dcfff`
- Accent Purple: `#bb9af7`
- Accent Green: `#9ece6a`
- Error Red: `#f7768e`

## 🚧 Next Steps (Future Milestones)

- [ ] Implement step-by-step execution
- [ ] Pipeline stage visualization
- [ ] Memory view and inspection
- [ ] Breakpoint support
- [ ] Monaco editor integration
- [ ] Program counter tracking
- [ ] Register value editing
A simple web-based Risc-V simulator with support to a limited number of instructions executed through the following pipelining schema: Structural Hazard: Separate Memory, Data Hazard: No forwarding, Control Hazard: Predict-not-taken
