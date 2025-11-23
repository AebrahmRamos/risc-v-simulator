from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from simulator.assembler import validate_program
from simulator.pipeline_core import SIM

app = FastAPI(title="RISC-V Simulator API", version="1.0.0")

# CORS configuration for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssembleRequest(BaseModel):
    source: str


class AssembleResponse(BaseModel):
    success: bool
    instructions: list[dict]
    errors: list[dict]


@app.get("/")
def read_root():

    return {"status": "ok", "service": "RISC-V Simulator API"}


@app.post("/api/assemble", response_model=AssembleResponse)
def assemble_code(request: AssembleRequest):
    result = validate_program(request.source)
    
    return AssembleResponse(
        success=len(result["errors"]) == 0,
        instructions=result["instructions"],
        errors=result["errors"]
    )


class SimLoadRequest(BaseModel):
    source: str
    initial_registers: Optional[dict] = None
    initial_memory: Optional[dict] = None


@app.post("/api/sim/load")
def sim_load(req: SimLoadRequest):
    # assemble + load into simulator with optional register and memory initialization
    res = SIM.load_program(req.source, req.initial_registers, req.initial_memory)
    if res.get("errors"):
        return {"success": False, "errors": res.get("errors", [])}
    return {
        "success": True,
        "instructions": res.get("instructions", []),
        "labels": res.get("labels", {})
    }


@app.post("/api/sim/step")
def sim_step():
    state = SIM.step()
    return state


@app.post("/api/sim/reset")
def sim_reset():
    SIM.reset()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
