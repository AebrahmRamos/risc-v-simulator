VALID_OPCODES = [
    "LW", "SW",
    # arithmetic
    "ADD", "SUB", "ADDI",
    # logical
    "AND", "OR", "ORI",
    # shifts
    "SLL", "SLLI",
    # branches
    "BEQ", "BNE", "BLT", "BGE",
    # compare
    "SLT",
]
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

    # Accept label-only lines or label: instr on same line
    if parts[0].endswith(":"):
        # label only -> skip validation here (simulator will resolve labels)
        if len(parts) == 1:
            return None
        # otherwise drop the label token and continue with the instruction
        parts = parts[1:]
        if not parts:
            return None

    opcode = parts[0].upper()
    if opcode not in VALID_OPCODES:
        raise ValueError(f"Invalid opcode '{opcode}'")

    # Instruction format validation by opcode groups
    # R-type: rd rs1 rs2
    if opcode in ["AND", "OR", "ADD", "SUB", "SLT", "SLL"]:
        if len(parts) != 4:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rd, rs1, rs2")
        rd, rs1, rs2 = parts[1], parts[2], parts[3]
        for r in [rd, rs1, rs2]:
            if not is_valid_register(r):
                raise ValueError(f"Invalid register '{r}'")

    # I-type arithmetic: rd rs1 imm
    elif opcode in ["ADDI", "ORI"]:
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

    # SLLI: rd rs1 shamt
    elif opcode in ["SLLI"]:
        if len(parts) != 4:
            raise ValueError(f"Wrong format for {opcode}. Expected: {opcode} rd, rs1, shamt")
        rd, rs1, shamt = parts[1], parts[2], parts[3]
        for r in [rd, rs1]:
            if not is_valid_register(r):
                raise ValueError(f"Invalid register '{r}'")
        try:
            int(shamt)
        except ValueError:
            raise ValueError(f"Shift amount '{shamt}' must be an integer")

    # Memory-type (LW/SW): rd, offset(base) or rs2, offset(base)
    elif opcode in ["LW", "SW"]:
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

    # Branch-type: rs1 rs2 label
    elif opcode in ["BLT", "BGE", "BEQ", "BNE"]:
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
        # strip surrounding whitespace and remove inline comments
        line = line.strip()
        if not line:
            continue
        # remove inline comments (anything after '#')
        if '#' in line:
            line = line.split('#', 1)[0].strip()
        if not line:
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
