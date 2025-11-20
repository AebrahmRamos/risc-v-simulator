import React from 'react'
import { SimulationState } from '../types'

const INT_REG_NAMES = [
  'x0 (zero)', 'x1 (ra)', 'x2 (sp)', 'x3 (gp)', 'x4 (tp)', 'x5 (t0)', 'x6 (t1)', 'x7 (t2)',
  'x8 (s0/fp)', 'x9 (s1)', 'x10 (a0)', 'x11 (a1)', 'x12 (a2)', 'x13 (a3)', 'x14 (a4)', 'x15 (a5)',
  'x16 (a6)', 'x17 (a7)', 'x18 (s2)', 'x19 (s3)', 'x20 (s4)', 'x21 (s5)', 'x22 (s6)', 'x23 (s7)',
  'x24 (s8)', 'x25 (s9)', 'x26 (s10)', 'x27 (s11)', 'x28 (t3)', 'x29 (t4)', 'x30 (t5)', 'x31 (t6)'
]

const FP_REG_NAMES = Array.from({length:32}).map((_,i)=> `f${i}`)

interface Props {
  state: SimulationState
}

export default function CPUState({ state }: Props) {
  const intRegs = state.registers || Array.from({length:32}).map(()=> '0x00000000')
  const fpRegs = state.floatRegisters || Array.from({length:32}).map(()=> '0x00000000')

  return (
    <div className="p-3 bg-[#24283b] h-full overflow-auto">
      <div className="text-sm text-[#565f89] mb-2">CPU State</div>
      <div className="mb-3">PC: <code className="bg-[#1a1b26] text-[#7dcfff] px-2 py-1 rounded text-sm">{state.pc}</code></div>

      <div className="mb-2 text-sm font-medium text-[#bb9af7]">Integer Registers</div>
      <div className="grid grid-cols-1 gap-1 mb-4 max-h-40 overflow-auto">
        {intRegs.map((r,i)=> (
          <div key={i} className="text-xs p-1.5 bg-[#1a1b26] rounded border border-[#292e42] flex justify-between">
            <span className="text-[#565f89]">{INT_REG_NAMES[i]}</span>
            <strong className="ml-2 text-[#7dcfff] font-mono">{r}</strong>
          </div>
        ))}
      </div>

      <div className="mb-2 text-sm font-medium text-[#bb9af7]">Floating-point Registers</div>
      <div className="grid grid-cols-1 gap-1 max-h-40 overflow-auto">
        {fpRegs.map((r,i)=> (
          <div key={i} className="text-xs p-1.5 bg-[#1a1b26] rounded border border-[#292e42] flex justify-between">
            <span className="text-[#565f89]">{FP_REG_NAMES[i]}</span>
            <strong className="ml-2 text-[#7dcfff] font-mono">{r}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
