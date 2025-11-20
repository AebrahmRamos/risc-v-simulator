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
