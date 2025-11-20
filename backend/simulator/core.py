from .assembler import validate_program, is_valid_register

MEMORY_SIZE = 0x0100
PROGRAM_START = 0x0000


def _hex(x: int) -> str:
    return f"0x{x:08x}"


def _to_u32(x: int) -> int:
    return x & 0xFFFFFFFF


class Simulator:
    def __init__(self):
        self.memory = bytearray(MEMORY_SIZE)
        self.registers = [0] * 32
        self.pc = PROGRAM_START
        self.cycle = 0
        self.instructions = {}  # addr -> {'tokens':..., 'raw':..., 'opcode':...}
        self.label_map = {}
        self.halted = False

    def reset(self):
        self.memory = bytearray(MEMORY_SIZE)
        self.registers = [0] * 32
        self.pc = PROGRAM_START
        self.cycle = 0
        self.instructions = {}
        self.label_map = {}
        self.halted = False

    def load_program(self, source: str):
        # Validate first
        res = validate_program(source)
        if res["errors"]:
            return res

        self.reset()
        addr = PROGRAM_START

        lines = source.splitlines()
        for raw in lines:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            # handle label definitions: "label:" or "label: instr..."
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
            self.instructions[addr] = {"tokens": tokens, "raw": line, "opcode": opcode}
            addr += 4

        self.pc = PROGRAM_START
        return {"instructions": [{"line": i+1, "opcode": v["opcode"], "raw": v["raw"]} for i, v in enumerate(self.instructions.values())], "errors": []}

    def _reg_index(self, r: str) -> int:
        return int(r.lstrip("x"))

    def _read_word(self, addr: int) -> int:
        if addr < 0 or addr + 4 > MEMORY_SIZE:
            return 0
        b = self.memory[addr:addr + 4]
        return int.from_bytes(b, "little")

    def _write_word(self, addr: int, val: int):
        if addr < 0 or addr + 4 > MEMORY_SIZE:
            return
        self.memory[addr:addr + 4] = int(val & 0xFFFFFFFF).to_bytes(4, "little")

    def step(self):
        if self.halted:
            return self.get_state()

        instr = self.instructions.get(self.pc)
        if not instr:
            self.halted = True
            return self.get_state()

        toks = instr["tokens"]
        op = instr["opcode"]
        nxt_pc = self.pc + 4

        def get_reg(t):
            return self.registers[self._reg_index(t)]

        def set_reg(t, val):
            idx = self._reg_index(t)
            if idx == 0:
                return
            self.registers[idx] = _to_u32(val)

        try:
            if op == "ADD":
                rd, rs1, rs2 = toks[1], toks[2], toks[3]
                set_reg(rd, get_reg(rs1) + get_reg(rs2))

            elif op == "SUB":
                rd, rs1, rs2 = toks[1], toks[2], toks[3]
                set_reg(rd, get_reg(rs1) - get_reg(rs2))

            elif op == "ADDI":
                rd, rs1, imm = toks[1], toks[2], int(toks[3])
                set_reg(rd, get_reg(rs1) + imm)

            elif op in ("AND", "OR"):
                rd, rs1, rs2 = toks[1], toks[2], toks[3]
                a, b = get_reg(rs1), get_reg(rs2)
                set_reg(rd, a & b if op == "AND" else a | b)

            elif op == "ORI":
                rd, rs1, imm = toks[1], toks[2], int(toks[3])
                set_reg(rd, get_reg(rs1) | imm)

            elif op == "SLL":
                rd, rs1, rs2 = toks[1], toks[2], toks[3]
                set_reg(rd, (get_reg(rs1) << (get_reg(rs2) & 0x1F)))

            elif op == "SLLI":
                rd, rs1, sh = toks[1], toks[2], int(toks[3])
                set_reg(rd, get_reg(rs1) << (sh & 0x1F))

            elif op == "SLT":
                rd, rs1, rs2 = toks[1], toks[2], toks[3]
                a, b = get_reg(rs1), get_reg(rs2)
                # signed compare
                a_s = a if a < (1 << 31) else a - (1 << 32)
                b_s = b if b < (1 << 31) else b - (1 << 32)
                set_reg(rd, 1 if a_s < b_s else 0)

            elif op == "LW":
                rd, mem = toks[1], toks[2]
                offset, base = mem.replace(")", "").split("(")
                addr = get_reg(base) + int(offset)
                val = self._read_word(addr)
                set_reg(rd, val)

            elif op == "SW":
                rs2, mem = toks[1], toks[2]
                offset, base = mem.replace(")", "").split("(")
                addr = get_reg(base) + int(offset)
                self._write_word(addr, get_reg(rs2))

            elif op in ("BEQ", "BNE", "BLT", "BGE"):
                rs1, rs2, label = toks[1], toks[2], toks[3]
                a, b = get_reg(rs1), get_reg(rs2)
                take = False
                if op == "BEQ":
                    take = a == b
                elif op == "BNE":
                    take = a != b
                elif op == "BLT":
                    a_s = a if a < (1 << 31) else a - (1 << 32)
                    b_s = b if b < (1 << 31) else b - (1 << 32)
                    take = a_s < b_s
                elif op == "BGE":
                    a_s = a if a < (1 << 31) else a - (1 << 32)
                    b_s = b if b < (1 << 31) else b - (1 << 32)
                    take = a_s >= b_s
                if take:
                    if label not in self.label_map:
                        self.halted = True
                    else:
                        nxt_pc = self.label_map[label]

            else:
                # unknown -> halt
                self.halted = True

        except Exception:
            self.halted = True

        self.pc = nxt_pc
        self.cycle += 1
        return self.get_state()

    def get_state(self):
        return {
            "pc": _hex(self.pc),
            "registers": [ _hex(r) for r in self.registers ],
            "cycle": self.cycle,
            "halted": self.halted,
        }


SIM = Simulator()
