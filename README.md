# RISC-V Simulator

5-stage pipelined RISC-V processor simulator with cycle-accurate execution, hazard detection, and interactive visualization.

# Milestone 3 — Pipeline Implementation (Nov 23, 2025)
  - Implemented the 5 stage pipeline simulator (IF -> ID -> EX -> MEM -> WB)
    - Pipeline register trace table
    - Data hazard with stalling (no forwarding)
    - Control hazard with predict not taken and flush on taken branches
    - RISC-V instruction encoder / instruction tbale
  - Pipeline visualization through the trace tables where the rows = registers, and columns = cycles
  - Opcode tab implementation showing the instruction and their corresponding 32 bit opcode hex
  - Enhanced api's
    - /api/sim/load accepts initial_registers and initial_memory
    - /api/sim/step returns complete pipeline snapshop
    - Instruction encoding and hex display

# Milestone 2 — GUI and Initial Execution (Nov 20, 2025)
 - Added support for labels
 - Separated Integer and Floating integers in `CPU State` panel into tabs with scrollable views
 - Assemble loads program into the simulator allowing `Step` to execute cycle-by-cycle
 - Implemented the simulator endpoints and services

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

## Quick Start with Examples

1. **Start servers** (see Quick Start section below)
2. **Open** http://localhost:5173/
3. **Try an example:**
   ```bash
   # Copy from examples/02_data_hazard.asm
   ADDI x1, x0, 10
   ADDI x2, x0, 20
   ADD x3, x1, x2      # Watch for stalls!
   ADD x4, x3, x3
   ```
4. **Click Assemble** → **Click Step** repeatedly
5. **Watch** the Pipeline Registers table fill with cycle data

See `/examples/README.md` for 7 complete example programs with expected behaviors.

## Supported Instructions

**Arithmetic:**
- `ADD`, `SUB`, `ADDI` - Addition and subtraction
- `AND`, `OR`, `ORI` - Bitwise operations
- `SLL`, `SLLI` - Shift left logical
- `SLT` - Set less than (signed comparison)

**Memory:**
- `LW` - Load word: `LW x1, 0(x2)`
- `SW` - Store word: `SW x2, 4(x1)`

**Control:**
- `BEQ`, `BNE` - Branch if equal/not equal
- `BLT`, `BGE` - Branch if less than / greater or equal (signed)

**Memory Layout (per spec):**
- Data segment: `0x0000` - `0x007F` (128 bytes)
- Program segment: `0x0080` - `0x00FF` (128 bytes)

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

