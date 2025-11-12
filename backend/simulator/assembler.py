VALID_OPCODES = ["LW", "SW", "AND", "OR", "ORI", "BLT", "BGE"]
REGISTER_PREFIX = "x"
MAX_REGISTER = 31


def is_valid_register(reg: str) -> bool:
    if not reg.startswith(REGISTER_PREFIX):
        return False
    try:
        num = int(reg[1:])
        return 0 <= num <= MAX_REGISTER
    except ValueError:
        return False


def parse_instruction(line: str, lineno: int):
    parts = line.replace(",", "").split()
    if not parts:
        return None  # skip blank lines

    opcode = parts[0].upper()
    if opcode not in VALID_OPCODES:
        raise ValueError(f"Invalid opcode '{opcode}'")

    # Instruction format validation by type
    if opcode in ["AND", "OR"]:  # R-type
        if len(parts) != 4:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rd, rs1, rs2")
        rd, rs1, rs2 = parts[1], parts[2], parts[3]
        for r in [rd, rs1, rs2]:
            if not is_valid_register(r):
                raise ValueError(f"Invalid register '{r}'")

    elif opcode in ["ORI"]:  # I-type
        if len(parts) != 4:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rd, rs1, imm")
        rd, rs1, imm = parts[1], parts[2], parts[3]
        for r in [rd, rs1]:
            if not is_valid_register(r):
                raise ValueError(f"Invalid register '{r}'")
        try:
            int(imm)
        except ValueError:
            raise ValueError(f"Immediate '{imm}' must be an integer")

    elif opcode in ["LW", "SW"]:  # Memory-type (I or S)
        if len(parts) != 3:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rd, offset(base)")
        rd_rs2, mem = parts[1], parts[2]
        if "(" not in mem or ")" not in mem:
            raise ValueError(f"Invalid memory format '{mem}'. Expected offset(base)")
        offset, base = mem.replace(")", "").split("(")
        if not is_valid_register(base):
            raise ValueError(f"Invalid base register '{base}'")
        try:
            int(offset)
        except ValueError:
            raise ValueError(f"Offset '{offset}' must be an integer")
        if not is_valid_register(rd_rs2):
            raise ValueError(f"Invalid destination/source register '{rd_rs2}'")

    elif opcode in ["BLT", "BGE"]:  # Branch-type
        if len(parts) != 4:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rs1, rs2, label")
        rs1, rs2, label = parts[1], parts[2], parts[3]
        for r in [rs1, rs2]:
            if not is_valid_register(r):
                raise ValueError(f"Invalid register '{r}'")
        if not label.isidentifier():
            raise ValueError(f"Invalid label name '{label}'")

    return {
        "line": lineno,
        "opcode": opcode,
        "raw": line.strip()
    }


def validate_program(source: str) -> dict:
    lines = source.split("\n")
    instructions = []
    errors = []
    
    for lineno, line in enumerate(lines, start=1):
        line = line.strip()
        # Skip empty lines and comments
        if not line or line.startswith("#"):
            continue
            
        try:
            instr = parse_instruction(line, lineno)
            if instr:
                instructions.append(instr)
        except ValueError as e:
            errors.append({
                "line": lineno,
                "message": str(e),
                "severity": "error"
            })
    
    return {
        "instructions": instructions,
        "errors": errors
    }
