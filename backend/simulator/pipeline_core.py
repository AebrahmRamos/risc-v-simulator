"""
RISC-V 5-stage pipeline simulator with hazard detection.
Implements IF, ID, EX, MEM, WB stages with data hazard stalls (no forwarding)
and control hazard handling (predict-not-taken for Group 2).
"""
from .assembler import validate_program
from .encoder import encode_instruction

MEMORY_SIZE = 0x0100
PROGRAM_START = 0x0080  # Program at 0x0080-0x00FF, data at 0x0000-0x007F


def _hex(x: int) -> str:
    return f"0x{x:08x}"


def _to_u32(x: int) -> int:
    return x & 0xFFFFFFFF


def _to_signed(x: int) -> int:
    """Convert u32 to signed int"""
    return x if x < (1 << 31) else x - (1 << 32)


class PipelineRegister:
    """Base class for pipeline registers between stages"""
    def __init__(self):
        self.nop = True  # True if bubble/NOP
        
    def flush(self):
        """Clear to NOP/bubble"""
        self.__init__()


class IFID(PipelineRegister):
    """IF/ID pipeline register"""
    def __init__(self):
        super().__init__()
        self.ir = 0  # instruction word (encoded)
        self.npc = 0  # PC + 4
        self.pc = 0  # current PC
        self.raw = ""  # raw instruction text
        self.addr = 0  # instruction address


class IDEX(PipelineRegister):
    """ID/EX pipeline register"""
    def __init__(self):
        super().__init__()
        self.ir = 0
        self.a = 0  # rs1 value
        self.b = 0  # rs2 value
        self.imm = 0  # immediate value
        self.npc = 0
        self.opcode = ""
        self.rd = -1  # destination register (-1 if none)
        self.rs1 = -1
        self.rs2 = -1
        self.raw = ""
        self.addr = 0
        # control signals
        self.alu_op = ""
        self.mem_read = False
        self.mem_write = False
        self.branch = False
        self.reg_write = False


class EXMEM(PipelineRegister):
    """EX/MEM pipeline register"""
    def __init__(self):
        super().__init__()
        self.ir = 0
        self.alu_output = 0
        self.b = 0  # rs2 value for SW
        self.cond = False  # branch condition result
        self.rd = -1
        self.raw = ""
        self.addr = 0
        # control signals
        self.mem_read = False
        self.mem_write = False
        self.reg_write = False
        self.branch_taken = False


class MEMWB(PipelineRegister):
    """MEM/WB pipeline register"""
    def __init__(self):
        super().__init__()
        self.ir = 0
        self.lmd = 0  # loaded memory data
        self.alu_output = 0
        self.rd = -1
        self.raw = ""
        self.addr = 0
        # control signals
        self.reg_write = False
        self.mem_to_reg = False  # True if LW


class PipelineSimulator:
    """5-stage pipelined RISC-V simulator"""
    
    def __init__(self):
        self.memory = bytearray(MEMORY_SIZE)
        self.registers = [0] * 32
        self.pc = PROGRAM_START
        self.cycle = 0
        self.instructions = {}  # addr -> {'tokens', 'raw', 'opcode', 'encoded'}
        self.label_map = {}
        self.halted = False
        
        # Pipeline registers
        self.ifid = IFID()
        self.idex = IDEX()
        self.exmem = EXMEM()
        self.memwb = MEMWB()
        
        # Stall control
        self.stall = False
        
        # Statistics
        self.stall_cycles = 0
        self.branch_count = 0
        self.flush_count = 0

    def reset(self):
        self.__init__()

    def load_program(self, source: str, initial_regs: dict | None = None, initial_memory: dict | None = None):
        """Load and validate program, optionally set initial register values and memory"""
        res = validate_program(source)
        if res["errors"]:
            return res

        self.reset()
        
        # Set initial register values if provided
        if initial_regs:
            for reg_name, value in initial_regs.items():
                if reg_name.startswith('x'):
                    idx = int(reg_name[1:])
                    if 0 < idx < 32:  # x0 is always 0
                        self.registers[idx] = _to_u32(value)

        # Set initial memory if provided. Expect a mapping address->word (int or hex-string)
        if initial_memory:
            for addr_str, val in initial_memory.items():
                try:
                    addr = int(addr_str, 0) if isinstance(addr_str, str) else int(addr_str)
                except Exception:
                    # skip invalid address keys
                    continue
                # Accept numeric or hex string values
                try:
                    word = int(val, 0) if isinstance(val, str) else int(val)
                except Exception:
                    continue
                # write as a 32-bit little-endian word if within bounds
                if 0 <= addr < MEMORY_SIZE and addr + 4 <= MEMORY_SIZE:
                    self._write_word(addr, _to_u32(word))
        
        addr = PROGRAM_START
        lines = source.splitlines()
        
        for raw in lines:
            line = raw.strip()
            if not line:
                continue
                
            # Handle labels
            if ":" in line:
                label, rest = line.split(":", 1)
                label = label.strip()
                if label:
                    self.label_map[label] = addr
                line = rest.strip()
                if not line:
                    continue

            tokens = line.replace(",", "").split()
            opcode = tokens[0].upper()
            
            # Encode instruction
            encoded = encode_instruction(opcode, tokens[1:], addr, self.label_map)
            
            self.instructions[addr] = {
                "tokens": tokens,
                "raw": line,
                "opcode": opcode,
                "encoded": encoded
            }
            addr += 4

        self.pc = PROGRAM_START
        
        return {
            "instructions": [
                {
                    "line": i+1,
                    "opcode": v["opcode"],
                    "raw": v["raw"],
                    "address": _hex(a),
                    "hex": _hex(v["encoded"])
                }
                for i, (a, v) in enumerate(self.instructions.items())
            ],
            "errors": [],
            "labels": {k: _hex(v) for k, v in self.label_map.items()}
        }

    def _reg_index(self, r: str) -> int:
        return int(r.lstrip("x"))

    def _read_word(self, addr: int) -> int:
        if addr < 0 or addr + 4 > MEMORY_SIZE:
            return 0
        return int.from_bytes(self.memory[addr:addr + 4], "little")

    def _write_word(self, addr: int, val: int):
        if addr < 0 or addr + 4 > MEMORY_SIZE:
            return
        self.memory[addr:addr + 4] = _to_u32(val).to_bytes(4, "little")

    def _detect_hazard(self) -> bool:
        """Detect RAW hazard: ID stage needs value being computed in EX/MEM/WB"""
        if self.ifid.nop:
            return False
            
        instr = self.instructions.get(self.ifid.addr)
        if not instr:
            return False
            
        tokens = instr["tokens"]
        opcode = instr["opcode"]
        
        # Determine source registers for current instruction in ID
        src_regs = []
        if opcode in ["ADD", "SUB", "AND", "OR", "SLT", "SLL"]:
            src_regs = [self._reg_index(tokens[2]), self._reg_index(tokens[3])]
        elif opcode in ["ADDI", "ORI", "SLLI"]:
            src_regs = [self._reg_index(tokens[2])]
        elif opcode == "LW":
            base = tokens[2].split("(")[1].replace(")", "")
            src_regs = [self._reg_index(base)]
        elif opcode == "SW":
            src_regs = [self._reg_index(tokens[1])]
            base = tokens[2].split("(")[1].replace(")", "")
            src_regs.append(self._reg_index(base))
        elif opcode in ["BEQ", "BNE", "BLT", "BGE"]:
            src_regs = [self._reg_index(tokens[1]), self._reg_index(tokens[2])]
        
        # Check if any source register is destination of instruction in EX/MEM/WB
        for src in src_regs:
            if src == 0:  # x0 never causes hazard
                continue
            if not self.idex.nop and self.idex.rd == src and self.idex.reg_write:
                return True
            if not self.exmem.nop and self.exmem.rd == src and self.exmem.reg_write:
                return True
            if not self.memwb.nop and self.memwb.rd == src and self.memwb.reg_write:
                return True
                
        return False

    def stage_if(self):
        """Instruction Fetch stage"""
        if self.stall:
            return  # Keep IF frozen
            
        instr = self.instructions.get(self.pc)
        if not instr:
            self.ifid.nop = True
            self.halted = True
            return
            
        self.ifid.nop = False
        self.ifid.ir = instr["encoded"]
        self.ifid.pc = self.pc
        self.ifid.npc = self.pc + 4
        self.ifid.raw = instr["raw"]
        self.ifid.addr = self.pc
        
        self.pc = self.ifid.npc

    def stage_id(self):
        """Instruction Decode stage"""
        if self.stall:
            # Insert bubble into EX
            self.idex.flush()
            return
            
        if self.ifid.nop:
            self.idex.flush()
            return
            
        instr = self.instructions.get(self.ifid.addr)
        if not instr:
            self.idex.flush()
            return
            
        tokens = instr["tokens"]
        opcode = instr["opcode"]
        
        self.idex.nop = False
        self.idex.ir = self.ifid.ir
        self.idex.npc = self.ifid.npc
        self.idex.opcode = opcode
        self.idex.raw = instr["raw"]
        self.idex.addr = self.ifid.addr
        
        # Decode and read registers
        self.idex.rd = -1
        self.idex.rs1 = -1
        self.idex.rs2 = -1
        
        if opcode in ["ADD", "SUB", "AND", "OR", "SLT", "SLL"]:
            self.idex.rd = self._reg_index(tokens[1])
            self.idex.rs1 = self._reg_index(tokens[2])
            self.idex.rs2 = self._reg_index(tokens[3])
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.b = self.registers[self.idex.rs2]
            self.idex.alu_op = opcode
            self.idex.reg_write = True
            
        elif opcode in ["ADDI", "ORI"]:
            self.idex.rd = self._reg_index(tokens[1])
            self.idex.rs1 = self._reg_index(tokens[2])
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.imm = int(tokens[3])
            self.idex.alu_op = opcode
            self.idex.reg_write = True
            
        elif opcode == "SLLI":
            self.idex.rd = self._reg_index(tokens[1])
            self.idex.rs1 = self._reg_index(tokens[2])
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.imm = int(tokens[3])
            self.idex.alu_op = opcode
            self.idex.reg_write = True
            
        elif opcode == "LW":
            self.idex.rd = self._reg_index(tokens[1])
            offset, base = tokens[2].replace(")", "").split("(")
            self.idex.rs1 = self._reg_index(base)
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.imm = int(offset)
            self.idex.alu_op = "ADD"
            self.idex.mem_read = True
            self.idex.reg_write = True
            
        elif opcode == "SW":
            self.idex.rs2 = self._reg_index(tokens[1])
            offset, base = tokens[2].replace(")", "").split("(")
            self.idex.rs1 = self._reg_index(base)
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.b = self.registers[self.idex.rs2]
            self.idex.imm = int(offset)
            self.idex.alu_op = "ADD"
            self.idex.mem_write = True
            
        elif opcode in ["BEQ", "BNE", "BLT", "BGE"]:
            self.idex.rs1 = self._reg_index(tokens[1])
            self.idex.rs2 = self._reg_index(tokens[2])
            self.idex.a = self.registers[self.idex.rs1]
            self.idex.b = self.registers[self.idex.rs2]
            label = tokens[3]
            target = self.label_map.get(label, self.idex.npc)
            self.idex.imm = target
            self.idex.alu_op = opcode
            self.idex.branch = True

    def stage_ex(self):
        """Execute stage"""
        if self.idex.nop:
            self.exmem.flush()
            return
            
        self.exmem.nop = False
        self.exmem.ir = self.idex.ir
        self.exmem.raw = self.idex.raw
        self.exmem.addr = self.idex.addr
        self.exmem.rd = self.idex.rd
        self.exmem.b = self.idex.b
        self.exmem.mem_read = self.idex.mem_read
        self.exmem.mem_write = self.idex.mem_write
        self.exmem.reg_write = self.idex.reg_write
        
        # ALU operation
        op = self.idex.alu_op
        if op == "ADD":
            self.exmem.alu_output = _to_u32(self.idex.a + self.idex.imm if self.idex.mem_read or self.idex.mem_write else self.idex.a + self.idex.b)
        elif op == "SUB":
            self.exmem.alu_output = _to_u32(self.idex.a - self.idex.b)
        elif op == "ADDI":
            self.exmem.alu_output = _to_u32(self.idex.a + self.idex.imm)
        elif op == "AND":
            self.exmem.alu_output = self.idex.a & self.idex.b
        elif op == "OR":
            self.exmem.alu_output = self.idex.a | self.idex.b
        elif op == "ORI":
            self.exmem.alu_output = self.idex.a | self.idex.imm
        elif op == "SLL":
            self.exmem.alu_output = _to_u32(self.idex.a << (self.idex.b & 0x1F))
        elif op == "SLLI":
            self.exmem.alu_output = _to_u32(self.idex.a << (self.idex.imm & 0x1F))
        elif op == "SLT":
            self.exmem.alu_output = 1 if _to_signed(self.idex.a) < _to_signed(self.idex.b) else 0
        elif op in ["BEQ", "BNE", "BLT", "BGE"]:
            # Branch condition evaluation
            if op == "BEQ":
                self.exmem.cond = (self.idex.a == self.idex.b)
            elif op == "BNE":
                self.exmem.cond = (self.idex.a != self.idex.b)
            elif op == "BLT":
                self.exmem.cond = (_to_signed(self.idex.a) < _to_signed(self.idex.b))
            elif op == "BGE":
                self.exmem.cond = (_to_signed(self.idex.a) >= _to_signed(self.idex.b))
                
            # Group 2: predict-not-taken, flush if taken
            if self.exmem.cond:
                self.exmem.branch_taken = True
                self.pc = self.idex.imm  # Update PC to branch target
                # Flush IF and ID stages
                self.ifid.flush()
                self.idex.flush()
                self.branch_count += 1
                self.flush_count += 1

    def stage_mem(self):
        """Memory stage"""
        if self.exmem.nop:
            self.memwb.flush()
            return
            
        self.memwb.nop = False
        self.memwb.ir = self.exmem.ir
        self.memwb.alu_output = self.exmem.alu_output
        self.memwb.rd = self.exmem.rd
        self.memwb.raw = self.exmem.raw
        self.memwb.addr = self.exmem.addr
        self.memwb.reg_write = self.exmem.reg_write
        
        if self.exmem.mem_read:
            self.memwb.lmd = self._read_word(self.exmem.alu_output)
            self.memwb.mem_to_reg = True
        elif self.exmem.mem_write:
            self._write_word(self.exmem.alu_output, self.exmem.b)
            self.memwb.mem_to_reg = False
        else:
            self.memwb.lmd = 0
            self.memwb.mem_to_reg = False

    def stage_wb(self):
        """Write Back stage"""
        if self.memwb.nop:
            return
            
        if self.memwb.reg_write and self.memwb.rd > 0:
            value = self.memwb.lmd if self.memwb.mem_to_reg else self.memwb.alu_output
            self.registers[self.memwb.rd] = _to_u32(value)

    def step(self):
        """Advance pipeline by one cycle"""
        if self.halted and self.ifid.nop and self.idex.nop and self.exmem.nop and self.memwb.nop:
            return self.get_state()
        
        # Check for hazards
        self.stall = self._detect_hazard()
        if self.stall:
            self.stall_cycles += 1
        
        # Execute stages in reverse order (WB -> IF) to avoid race conditions
        self.stage_wb()
        self.stage_mem()
        self.stage_ex()
        self.stage_id()
        self.stage_if()
        
        self.cycle += 1
        return self.get_state()

    def get_state(self):
        """Return current pipeline state"""
        return {
            "pc": _hex(self.pc),
            "registers": [_hex(r) for r in self.registers],
            "cycle": self.cycle,
            "halted": self.halted,
            "stall_cycles": self.stall_cycles,
            "branch_count": self.branch_count,
            "flush_count": self.flush_count,
            "pipeline": {
                "IF": {
                    "PC": _hex(self.pc),
                    "stalled": self.stall
                },
                "IF/ID": {
                    "nop": self.ifid.nop,
                    "IR": _hex(self.ifid.ir),
                    "NPC": _hex(self.ifid.npc),
                    "PC": _hex(self.ifid.pc),
                    "raw": self.ifid.raw if not self.ifid.nop else ""
                },
                "ID/EX": {
                    "nop": self.idex.nop,
                    "IR": _hex(self.idex.ir),
                    "A": _hex(self.idex.a),
                    "B": _hex(self.idex.b),
                    "IMM": _hex(self.idex.imm),
                    "NPC": _hex(self.idex.npc),
                    "raw": self.idex.raw if not self.idex.nop else ""
                },
                "EX/MEM": {
                    "nop": self.exmem.nop,
                    "IR": _hex(self.exmem.ir),
                    "ALUOutput": _hex(self.exmem.alu_output),
                    "B": _hex(self.exmem.b),
                    "cond": self.exmem.cond,
                    "raw": self.exmem.raw if not self.exmem.nop else ""
                },
                "MEM/WB": {
                    "nop": self.memwb.nop,
                    "IR": _hex(self.memwb.ir),
                    "LMD": _hex(self.memwb.lmd),
                    "ALUOutput": _hex(self.memwb.alu_output),
                    "raw": self.memwb.raw if not self.memwb.nop else ""
                },
                "WB": {
                    "register_written": f"x{self.memwb.rd}" if not self.memwb.nop and self.memwb.reg_write and self.memwb.rd > 0 else None,
                    "value_written": _hex(self.memwb.lmd if self.memwb.mem_to_reg else self.memwb.alu_output) if not self.memwb.nop and self.memwb.reg_write and self.memwb.rd > 0 else None
                }
            }
        }


SIM = PipelineSimulator()
