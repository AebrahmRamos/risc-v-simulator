import React, { useState } from 'react'
import ToolBar from './components/ToolBar'
import CodePanel from './components/CodePanel'
import CPUState from './components/CPUState'
import BottomPanel from './components/BottomPanel'
import { SimulationState, PipelineState, AsmError } from './types'
import { assembleCode } from './services/api'

const initialState: SimulationState = {
  pc: '0x00000000',
  registers: Array.from({length:32}).map(()=> '0x00000000'),
  floatRegisters: Array.from({length:32}).map(()=> '0x00000000'),
  cycle: 0,
  pipeline: {
    stages: ['IF','ID','EX','MEM','WB'],
    cycles: [
      { cycleNumber: 0, perStage: [ {stage:'IF'}, {stage:'ID'}, {stage:'EX'}, {stage:'MEM'}, {stage:'WB'} ] }
    ]
  }
}

export default function App(){
  const [code, setCode] = useState<string>(`# sample riscv\nLW x1, 0(x2)\nAND x3, x1, x2`)
  const [sim, setSim] = useState<SimulationState>(initialState)
  const [activeTab, setActiveTab] = useState<'pipeline'|'pipeline-registers'|'console'>('pipeline')
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [assemblerErrors, setAssemblerErrors] = useState<AsmError[]>([])
  const [isAssembling, setIsAssembling] = useState(false)

  async function handleAssemble(){
    setIsAssembling(true)
    setConsoleLines((l)=>[...l, 'Assembling...'])
    
    try {
      const result = await assembleCode(code)
      
      if (result.success) {
        setConsoleLines((l)=>[...l, `✓ Assembly successful! ${result.instructions.length} instructions loaded.`])
        setAssemblerErrors([])
      } else {
        setConsoleLines((l)=>[
          ...l, 
          `✗ Assembly failed with ${result.errors.length} error(s):`,
          ...result.errors.map(e => `  Line ${e.line}: ${e.message}`)
        ])
        setAssemblerErrors(result.errors)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setConsoleLines((l)=>[...l, `✗ Error: ${errorMsg}. Is the backend running?`])
      setAssemblerErrors([])
    } finally {
      setIsAssembling(false)
    }
  }

  function handleStep(){
    // mock step: increment PC and cycle
    setSim(s=>({ ...s, pc: `0x${(parseInt(s.pc)+4).toString(16).padStart(8,'0')}`, cycle: s.cycle+1 }))
    setConsoleLines((l)=>[...l, `Stepped to cycle ${sim.cycle+1}`])
  }

  function handleReset(){
    setSim(initialState)
    setConsoleLines([])
    setAssemblerErrors([])
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1b26]">
      <div className="flex-shrink-0">
        <ToolBar 
          runState="idle" 
          onRun={()=>{}} 
          onPause={()=>{}} 
          onStep={handleStep} 
          onReset={handleReset} 
          onAssemble={handleAssemble}
          assemblerErrorsCount={assemblerErrors.length}
        />
      </div>

      {/* Main content: editor + cpu state */}
      <div className="flex-1 flex gap-2 p-2 overflow-hidden">
        <div className="flex-1 bg-[#24283b] border border-[#1f2335] overflow-hidden rounded">
          <CodePanel code={code} onChange={setCode} assemblerErrors={assemblerErrors} />
        </div>
        <div className="w-80 flex-shrink-0 bg-[#24283b] border border-[#1f2335] overflow-hidden rounded">
          <CPUState state={sim} />
        </div>
      </div>

      <div className="flex-shrink-0">
        <BottomPanel activeTab={activeTab} onSelectTab={setActiveTab} pipelineData={sim.pipeline} consoleLines={consoleLines} />
      </div>
    </div>
  )
}
