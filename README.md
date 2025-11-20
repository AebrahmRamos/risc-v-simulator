# Milestone 2
Milestone 2 — GUI and Initial Execution (Nov 20, 2025)
 - Added supoprt for labels
 - Separated Integer and Floating integers in `CPU State` panel into tabs with scrollable views.
 - Assemble loads program into the simulator allowing `Step` to execute a single instruction.
   - Pressing step executes one instruction and updates the PC and the registers
 - Implemented the simulator endpoints
   - `POST /api/sim/load` — assemble & load program into simulator
   - `POST /api/sim/step` — execute one instruction at current PC and return simulation state
   - `POST /api/sim/reset` — reset simulator state
 - Updated services to include helpers related to the three new endpoints, `loadProgram`, `simStep`, and `simReset`

# RISC-V Simulator

IDE-like interface for RISC-V assembly validation and simulation.

## Quick Start

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

---

# Milestone 1
Implemented the requirements for Milestone 1 which is to have a program input with error checking for registers and opcode. Went further than the requirement and have already implemented the frontend ide-like interface. Although some of the components aren't functional, the main requirement for Milestone 1 has already been implemented. The error checking indicates which line is causing the error, and which instruction and/or register is invalid as seen on the demo in https://drive.google.com/drive/folders/1Q1kjVfD1sUWo6wxq2oHW6eGPIoVb_-Cl?usp=drive_link (only accessible to a few people).

## Tech Stack

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

## Supported Instructions

- **LW** - Load Word: `LW x1, 0(x2)`
- **SW** - Store Word: `SW x2, 4(x1)`
- **AND** - Bitwise AND: `AND x3, x1, x2`
- **OR** - Bitwise OR: `OR x3, x1, x2`
- **ORI** - OR Immediate: `ORI x3, x1, 10`
- **BLT** - Branch Less Than: `BLT x1, x2, loop`
- **BGE** - Branch Greater Equal: `BGE x1, x2, end`

## Component Architecture
 - **web/src/components/ToolBar.tsx** : Top action bar (Run, Pause, Step, Reset, Assemble) and error count.
 - **web/src/components/CodePanel.tsx** : Code editor area (textarea for M1) with inline assembler error display.
 - **web/src/components/CPUState.tsx** : Read-only CPU state panel showing PC, integer (x0..x31) and FP (f0..f31) registers.
 - **web/src/components/BottomPanel/index.tsx** : Bottom tabbed panel (Pipeline Map, Pipeline Registers, Errors/Console).


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

## API Endpoints

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

## Project Structure

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


---

