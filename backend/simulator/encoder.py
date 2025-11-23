"""
RISC-V RV32I instruction encoder - converts assembly to machine code hex.
Reference: RISC-V Instruction Set Manual Volume I: User-Level ISA
"""

# Opcode field (bits 6-0)
OPCODES = {
    "LUI": 0b0110111,
    "AUIPC": 0b0010111,
    "JAL": 0b1101111,
    "JALR": 0b1100111,
    "BRANCH": 0b1100011,  # BEQ, BNE, BLT, BGE, BLTU, BGEU
    "LOAD": 0b0000011,    # LB, LH, LW, LBU, LHU
    "STORE": 0b0100011,   # SB, SH, SW
    "OP_IMM": 0b0010011,  # ADDI, SLTI, SLTIU, XORI, ORI, ANDI, SLLI, SRLI, SRAI
    "OP": 0b0110011,      # ADD, SUB, SLL, SLT, SLTU, XOR, SRL, SRA, OR, AND
}

# Function3 field for different instruction types
FUNCT3 = {
    # Branch
    "BEQ": 0b000,
    "BNE": 0b001,
    "BLT": 0b100,
    "BGE": 0b101,
    "BLTU": 0b110,
    "BGEU": 0b111,
    # Load
    "LB": 0b000,
    "LH": 0b001,
    "LW": 0b010,
    "LBU": 0b100,
    "LHU": 0b101,
    # Store
    "SB": 0b000,
    "SH": 0b001,
    "SW": 0b010,
    # OP-IMM
    "ADDI": 0b000,
    "SLTI": 0b010,
    "SLTIU": 0b011,
    "XORI": 0b100,
    "ORI": 0b110,
    "ANDI": 0b111,
    "SLLI": 0b001,
    "SRLI": 0b101,
    "SRAI": 0b101,
    # OP (R-type)
    "ADD": 0b000,
    "SUB": 0b000,
    "SLL": 0b001,
    "SLT": 0b010,
    "SLTU": 0b011,
    "XOR": 0b100,
    "SRL": 0b101,
    "SRA": 0b101,
    "OR": 0b110,
    "AND": 0b111,
}

# Function7 field for R-type and some I-type
FUNCT7 = {
    "ADD": 0b0000000,
    "SUB": 0b0100000,
    "SLL": 0b0000000,
    "SLT": 0b0000000,
    "SLTU": 0b0000000,
    "XOR": 0b0000000,
    "SRL": 0b0000000,
    "SRA": 0b0100000,
    "OR": 0b0000000,
    "AND": 0b0000000,
    "SLLI": 0b0000000,
    "SRLI": 0b0000000,
    "SRAI": 0b0100000,
}


def _reg_to_int(reg: str) -> int:
    """Convert register string to integer"""
    if reg.startswith('x'):
        return int(reg[1:])
    return 0


def _sign_extend(val: int, bits: int) -> int:
    """Sign-extend value to 32 bits"""
    sign_bit = 1 << (bits - 1)
    if val & sign_bit:
        return val | (0xFFFFFFFF << bits)
    return val


def encode_r_type(opcode: int, rd: int, funct3: int, rs1: int, rs2: int, funct7: int) -> int:
    """Encode R-type instruction"""
    return (funct7 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | opcode


def encode_i_type(opcode: int, rd: int, funct3: int, rs1: int, imm: int) -> int:
    """Encode I-type instruction"""
    imm = imm & 0xFFF  # 12-bit immediate
    return (imm << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | opcode


def encode_s_type(opcode: int, funct3: int, rs1: int, rs2: int, imm: int) -> int:
    """Encode S-type instruction"""
    imm = imm & 0xFFF
    imm_11_5 = (imm >> 5) & 0x7F
    imm_4_0 = imm & 0x1F
    return (imm_11_5 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (imm_4_0 << 7) | opcode


def encode_b_type(opcode: int, funct3: int, rs1: int, rs2: int, imm: int) -> int:
    """Encode B-type instruction (branch offset)"""
    imm = imm & 0x1FFF  # 13-bit signed offset
    imm_12 = (imm >> 12) & 0x1
    imm_10_5 = (imm >> 5) & 0x3F
    imm_4_1 = (imm >> 1) & 0xF
    imm_11 = (imm >> 11) & 0x1
    return (imm_12 << 31) | (imm_10_5 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (imm_4_1 << 8) | (imm_11 << 7) | opcode


def encode_instruction(opcode: str, operands: list, current_addr: int, label_map: dict) -> int:
    """
    Encode a single RISC-V instruction to 32-bit machine code.
    
    Args:
        opcode: Instruction mnemonic (e.g., "ADD", "LW", "BEQ")
        operands: List of operand strings (without commas)
        current_addr: Current instruction address
        label_map: Dictionary mapping labels to addresses
    
    Returns:
        32-bit encoded instruction
    """
    opcode = opcode.upper()
    
    try:
        # R-type: ADD, SUB, AND, OR, SLL, SLT, etc.
        if opcode in ["ADD", "SUB", "AND", "OR", "SLL", "SLT", "XOR", "SRL", "SRA"]:
            rd = _reg_to_int(operands[0])
            rs1 = _reg_to_int(operands[1])
            rs2 = _reg_to_int(operands[2])
            return encode_r_type(OPCODES["OP"], rd, FUNCT3[opcode], rs1, rs2, FUNCT7[opcode])
        
        # I-type arithmetic: ADDI, ORI, ANDI, etc.
        elif opcode in ["ADDI", "SLTI", "XORI", "ORI", "ANDI"]:
            rd = _reg_to_int(operands[0])
            rs1 = _reg_to_int(operands[1])
            imm = int(operands[2])
            return encode_i_type(OPCODES["OP_IMM"], rd, FUNCT3[opcode], rs1, imm)
        
        # I-type shift: SLLI, SRLI, SRAI
        elif opcode in ["SLLI", "SRLI", "SRAI"]:
            rd = _reg_to_int(operands[0])
            rs1 = _reg_to_int(operands[1])
            shamt = int(operands[2]) & 0x1F  # 5-bit shift amount
            funct7 = FUNCT7[opcode]
            imm = (funct7 << 5) | shamt
            return encode_i_type(OPCODES["OP_IMM"], rd, FUNCT3[opcode], rs1, imm)
        
        # Load: LW, LH, LB, etc.
        elif opcode in ["LW", "LH", "LB", "LBU", "LHU"]:
            rd = _reg_to_int(operands[0])
            # Parse offset(base) format
            mem_operand = operands[1]
            offset_str, base_str = mem_operand.replace(")", "").split("(")
            offset = int(offset_str)
            rs1 = _reg_to_int(base_str)
            return encode_i_type(OPCODES["LOAD"], rd, FUNCT3[opcode], rs1, offset)
        
        # Store: SW, SH, SB
        elif opcode in ["SW", "SH", "SB"]:
            rs2 = _reg_to_int(operands[0])
            # Parse offset(base) format
            mem_operand = operands[1]
            offset_str, base_str = mem_operand.replace(")", "").split("(")
            offset = int(offset_str)
            rs1 = _reg_to_int(base_str)
            return encode_s_type(OPCODES["STORE"], FUNCT3[opcode], rs1, rs2, offset)
        
        # Branch: BEQ, BNE, BLT, BGE, etc.
        elif opcode in ["BEQ", "BNE", "BLT", "BGE", "BLTU", "BGEU"]:
            rs1 = _reg_to_int(operands[0])
            rs2 = _reg_to_int(operands[1])
            label = operands[2]
            
            # Calculate branch offset
            if label in label_map:
                target_addr = label_map[label]
                offset = target_addr - current_addr
            else:
                offset = 0  # Unknown label, use 0 (will be resolved later or cause error)
            
            return encode_b_type(OPCODES["BRANCH"], FUNCT3[opcode], rs1, rs2, offset)
        
        # Unsupported instruction - return NOP (ADDI x0, x0, 0)
        else:
            return encode_i_type(OPCODES["OP_IMM"], 0, 0b000, 0, 0)
    
    except (ValueError, IndexError, KeyError):
        # Error in encoding - return NOP
        return encode_i_type(OPCODES["OP_IMM"], 0, 0b000, 0, 0)
