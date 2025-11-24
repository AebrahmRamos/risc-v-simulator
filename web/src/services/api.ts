// Frontend API service for RISC-V Simulator

const API_BASE_URL = 'http://localhost:8000'

export interface AssembleRequest {
  source: string
}

export interface AssembleError {
  line: number
  message: string
  severity: 'error' | 'warn'
}

export interface AssembleResponse {
  success: boolean
  instructions: Array<{
    line: number
    opcode: string
    raw: string
  }>
  errors: AssembleError[]
}

export async function assembleCode(source: string): Promise<AssembleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assemble`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

export async function loadProgram(source: string, initialRegisters?: Record<string, number>, initialMemory?: Record<string, number|string>): Promise<{ success: boolean; errors?: AssembleError[]; instructions?: any[]; labels?: Record<string, string> }> {
  const response = await fetch(`${API_BASE_URL}/api/sim/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, initial_registers: initialRegisters, initial_memory: initialMemory }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function simStep(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/sim/step`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function simReset(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/sim/reset`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
