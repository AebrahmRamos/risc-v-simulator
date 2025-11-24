import React, { useState } from 'react'
import ToolBar from './components/ToolBar'
import CodePanel from './components/CodePanel'
import CPUState from './components/CPUState'
import BottomPanel from './components/BottomPanel'
import RegisterInitializer from './components/RegisterInitializer'
import MemoryEditor from './components/MemoryEditor'
import { SimulationState, PipelineState, AsmError } from './types'
import { assembleCode, loadProgram, simStep, simReset } from './services/api'

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
  const [activeTab, setActiveTab] = useState<'pipeline-diagram'|'pipeline-registers'|'opcodes'|'console'>('pipeline-diagram')
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [assemblerErrors, setAssemblerErrors] = useState<AsmError[]>([])
  const [isAssembling, setIsAssembling] = useState(false)
  const [opcodes, setOpcodes] = useState<Array<{address: string; hex: string; raw: string}>>([])
  const [pipelineState, setPipelineState] = useState<any>(null)
  const [pipelineHistory, setPipelineHistory] = useState<any[]>([])
  const [initialRegisters, setInitialRegisters] = useState<Record<string, number> | undefined>(undefined)
  const [initialMemory, setInitialMemory] = useState<Record<string, number | string> | undefined>(undefined)
  const [showRegEditor, setShowRegEditor] = useState(false)
  const [showMemEditor, setShowMemEditor] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isHalted, setIsHalted] = useState(false)

  async function handleAssemble(){
    setIsAssembling(true)
    setConsoleLines((l)=>[...l, 'Assembling...'])
    
    try {
      // assemble + load into sim
      const res = await loadProgram(code, initialRegisters, initialMemory)
      if (res.success) {
        setConsoleLines((l)=>[...l, `✓ Loaded program to simulator`])
        setAssemblerErrors([])
        setPipelineHistory([])
        setIsHalted(false)
        // Store opcodes for display
        if (res.instructions) {
          setOpcodes(res.instructions.map((i: any) => ({
            address: i.address,
            hex: i.hex,
            raw: i.raw
          })))
        }
      } else {
        setConsoleLines((l)=>[...l, `✗ Load failed`, ...((res.errors||[]).map(e=>`Line ${e.line}: ${e.message}`))])
        setAssemblerErrors(res.errors || [])
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setConsoleLines((l)=>[...l, `✗ Error: ${errorMsg}. Is the backend running?`])
      setAssemblerErrors([])
    } finally {
      setIsAssembling(false)
    }
  }

  async function handleStep(){
    if (isHalted) return
    try{
      const state = await simStep()
      setSim(s=>({ ...s, pc: state.pc, registers: state.registers, cycle: state.cycle }))
      setPipelineState(state.pipeline)
      setPipelineHistory(h => [...h, { cycle: state.cycle, pipeline: state.pipeline, flush_count: state.flush_count || 0, stall_cycles: state.stall_cycles || 0 }])
      setConsoleLines(l=>[...l, `Cycle ${state.cycle} PC=${state.pc}${state.stall_cycles > 0 ? ` [${state.stall_cycles} stalls]` : ''}`])
      
      // Check if halted (all stages empty)
      const allEmpty = state.halted && 
        state.pipeline['IF/ID']?.nop && 
        state.pipeline['ID/EX']?.nop && 
        state.pipeline['EX/MEM']?.nop && 
        state.pipeline['MEM/WB']?.nop
      
      if (allEmpty) {
        setIsHalted(true)
        setIsRunning(false)
        setConsoleLines(l=>[...l, '✓ Program completed'])
      }
    } catch(e){
      setConsoleLines(l=>[...l, `Step failed: ${e instanceof Error? e.message: String(e)}`])
      setIsRunning(false)
    }
  }

  async function handleRun(){
    if (isHalted || isRunning) return
    setIsRunning(true)
    setConsoleLines(l=>[...l, 'Running...'])
    
    // Auto-step until halted
    let stepCount = 0
    const maxSteps = 1000 // Safety limit
    
    while (stepCount < maxSteps && !isHalted) {
      try {
        const state = await simStep()
        setSim(s=>({ ...s, pc: state.pc, registers: state.registers, cycle: state.cycle }))
        setPipelineState(state.pipeline)
        setPipelineHistory(h => [...h, { cycle: state.cycle, pipeline: state.pipeline, flush_count: state.flush_count || 0, stall_cycles: state.stall_cycles || 0 }])
        
        // Check if halted
        const allEmpty = state.halted && 
          state.pipeline['IF/ID']?.nop && 
          state.pipeline['ID/EX']?.nop && 
          state.pipeline['EX/MEM']?.nop && 
          state.pipeline['MEM/WB']?.nop
        
        if (allEmpty) {
          setIsHalted(true)
          setIsRunning(false)
          setConsoleLines(l=>[...l, `✓ Program completed in ${state.cycle} cycles (${state.stall_cycles} stalls, ${state.flush_count} flushes)`])
          break
        }
        
        stepCount++
      } catch(e) {
        setConsoleLines(l=>[...l, `Run failed: ${e instanceof Error? e.message: String(e)}`])
        setIsRunning(false)
        break
      }
    }
    
    if (stepCount >= maxSteps) {
      setConsoleLines(l=>[...l, `⚠ Stopped after ${maxSteps} cycles (safety limit)`])
      setIsRunning(false)
    }
  }
  
  function handlePause(){
    setIsRunning(false)
    setConsoleLines(l=>[...l, 'Paused'])
  }

  function handleReset(){
    setIsRunning(false)
    simReset().then(()=>{
      setSim(initialState)
      setConsoleLines([])
      setAssemblerErrors([])
      setPipelineHistory([])
      setIsHalted(false)
    }).catch(e=> setConsoleLines(l=>[...l, `Reset failed: ${e instanceof Error? e.message: String(e)}`]))
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1b26]">
      <div className="flex-shrink-0">
        <ToolBar 
          runState={isRunning ? 'running' : 'idle'} 
          onRun={handleRun} 
          onPause={handlePause} 
          onStep={handleStep} 
          onReset={handleReset} 
          onAssemble={handleAssemble}
          assemblerErrorsCount={assemblerErrors.length}
          isHalted={isHalted}
        />
      </div>

      {/* Main content: editor + cpu state */}
      <div className="flex-1 flex gap-2 p-2 overflow-hidden">
        <div className="flex-1 bg-[#24283b] border border-[#1f2335] overflow-hidden rounded">
          <CodePanel code={code} onChange={setCode} assemblerErrors={assemblerErrors} />
        </div>
        <div className="w-80 flex-shrink-0 bg-[#24283b] border border-[#1f2335] overflow-auto rounded flex flex-col">
          <div className="flex-1 overflow-auto">
            <CPUState state={sim} />
          </div>
          <div className="p-2 flex flex-col gap-2 border-t border-[#1f2335] bg-[#24283b]">
            <button className="px-2 py-1 text-sm rounded bg-[#1a2338] text-[#7aa2f7]" onClick={()=>setShowRegEditor(s=>!s)}>{showRegEditor? 'Close Register Editor':'Edit Registers'}</button>
            {showRegEditor && (
              <RegisterInitializer initial={initialRegisters} onApply={(m: Record<string, number>)=>{ setInitialRegisters(m); setShowRegEditor(false); setConsoleLines(l=>[...l, 'Initial registers updated']) }} />
            )}
            <button className="px-2 py-1 text-sm rounded bg-[#1a2338] text-[#7aa2f7]" onClick={()=>setShowMemEditor(s=>!s)}>{showMemEditor? 'Close Memory Editor':'Edit Memory'}</button>
            {showMemEditor && (
              <MemoryEditor initial={initialMemory} onApply={(m: Record<string, number | string>)=>{ setInitialMemory(m); setShowMemEditor(false); setConsoleLines(l=>[...l, 'Initial memory updated']) }} />
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <BottomPanel activeTab={activeTab} onSelectTab={setActiveTab} pipelineHistory={pipelineHistory} opcodes={opcodes} consoleLines={consoleLines} />
      </div>
    </div>
  )
}
