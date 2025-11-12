import React, { useState } from 'react'
import ToolBar from './components/ToolBar'
import CodePanel from './components/CodePanel'
import CPUState from './components/CPUState'
import BottomPanel from './components/BottomPanel'
import { SimulationState, PipelineState } from './types'

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
  const [code, setCode] = useState<string>(`# sample riscv\naddi x1,x0,1`)
  const [sim, setSim] = useState<SimulationState>(initialState)
  const [activeTab, setActiveTab] = useState<'pipeline'|'pipeline-registers'|'console'>('pipeline')
  const [consoleLines, setConsoleLines] = useState<string[]>([])

  function handleAssemble(){
    // mock assemble: clear errors and write a log
    setConsoleLines((l)=>[...l, 'Assembled successfully (mock)'])
  }

  function handleStep(){
    // mock step: increment PC and cycle
    setSim(s=>({ ...s, pc: `0x${(parseInt(s.pc)+4).toString(16).padStart(8,'0')}`, cycle: s.cycle+1 }))
    setConsoleLines((l)=>[...l, `Stepped to cycle ${sim.cycle+1}`])
  }

  function handleReset(){
    setSim(initialState)
    setConsoleLines([])
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0">
        <ToolBar runState="idle" onRun={()=>{}} onPause={()=>{}} onStep={handleStep} onReset={handleReset} onAssemble={handleAssemble} />
      </div>

      {/* Main content: editor + cpu state */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="flex-1 bg-white border overflow-hidden">
          <CodePanel code={code} onChange={setCode} assemblerErrors={[]} />
        </div>
        <div className="w-80 flex-shrink-0 bg-white border overflow-hidden">
          <CPUState state={sim} />
        </div>
      </div>

      <div className="flex-shrink-0">
        <BottomPanel activeTab={activeTab} onSelectTab={setActiveTab} pipelineData={sim.pipeline} consoleLines={consoleLines} />
      </div>
    </div>
  )
}
