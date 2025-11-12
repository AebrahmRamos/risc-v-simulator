# RISC-V Simulator Backend (Milestone 1)

FastAPI backend for validating RISC-V assembly code.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
# Development mode
uvicorn app:app --reload --port 8000

# Or using Python directly
python app.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### POST /api/assemble
Risc-V assembly code validator

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

## Supported Instructions for Validating (Milestone 1)

- **LW** - Load Word: `LW rd, offset(base)`
- **SW** - Store Word: `SW rs2, offset(base)`
- **AND** - Bitwise AND: `AND rd, rs1, rs2`
- **OR** - Bitwise OR: `OR rd, rs1, rs2`
- **ORI** - OR Immediate: `ORI rd, rs1, imm`
- **BLT** - Branch Less Than: `BLT rs1, rs2, label`
- **BGE** - Branch Greater Equal: `BGE rs1, rs2, label`
