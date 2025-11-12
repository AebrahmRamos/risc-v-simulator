export type DisplayFormat = 'hex'|'dec'|'bin'

export interface AsmError { line?: number; message: string; severity: 'error'|'warn' }

export interface PipelineStageInfo { stage: string; instr?: string; instrHex?: string; stageInfo?: Record<string, any> }

export interface PipelineCycle { cycleNumber: number; perStage: PipelineStageInfo[] }

export interface PipelineState { stages: string[]; cycles: PipelineCycle[] }

export interface SimulationState {
  pc: string; // hex string
  registers: string[]; // hex strings length 32
  floatRegisters?: string[]; // optional FP registers f0..f31
  cycle: number;
  pipeline?: PipelineState;
}
