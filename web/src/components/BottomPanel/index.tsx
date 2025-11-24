import React from 'react'

interface Props {
  activeTab: 'pipeline-diagram'|'pipeline-registers'|'console'|'opcodes'
  onSelectTab: (t: 'pipeline-diagram'|'pipeline-registers'|'console'|'opcodes') => void
  pipelineHistory?: Array<{cycle: number; pipeline: any; flush_count?: number; stall_cycles?: number}>
  opcodes?: Array<{address: string; hex: string; raw: string}>
  consoleLines?: string[]
}

export default function BottomPanel({ activeTab, onSelectTab, pipelineHistory = [], opcodes = [], consoleLines = [] }: Props) {
  const buildPipelineDiagram = () => {
    if (pipelineHistory.length === 0) return { diagram: [], flushCycles: new Set<number>() }
    
    const instructionMap = new Map<string, Array<{cycle: number, stage: string, isStall?: boolean}>>()
    const flushCycles = new Set<number>()
    
    let prevFlushCount = 0
    
    pipelineHistory.forEach((entry, idx) => {
      const pipeline = entry.pipeline
      const currentFlushCount = entry.flush_count || 0
      
      if (currentFlushCount > prevFlushCount) {
        flushCycles.add(entry.cycle)
        prevFlushCount = currentFlushCount
      }
      
      if (!pipeline['IF/ID']?.nop && pipeline['IF/ID']?.raw) {
        const key = pipeline['IF/ID'].raw
        if (!instructionMap.has(key)) instructionMap.set(key, [])
        instructionMap.get(key)!.push({cycle: entry.cycle, stage: 'IF'})
      }
      
      if (!pipeline['ID/EX']?.nop && pipeline['ID/EX']?.raw) {
        const key = pipeline['ID/EX'].raw
        if (!instructionMap.has(key)) instructionMap.set(key, [])
        const stages = instructionMap.get(key)!
        const lastStage = stages[stages.length - 1]
        const isStall = lastStage?.stage === 'ID' && lastStage?.cycle === entry.cycle - 1
        instructionMap.get(key)!.push({cycle: entry.cycle, stage: 'ID', isStall})
      }
      
      if (!pipeline['EX/MEM']?.nop && pipeline['EX/MEM']?.raw) {
        const key = pipeline['EX/MEM'].raw
        if (!instructionMap.has(key)) instructionMap.set(key, [])
        instructionMap.get(key)!.push({cycle: entry.cycle, stage: 'EX'})
      }
      
      if (!pipeline['MEM/WB']?.nop && pipeline['MEM/WB']?.raw) {
        const key = pipeline['MEM/WB'].raw
        if (!instructionMap.has(key)) instructionMap.set(key, [])
        instructionMap.get(key)!.push({cycle: entry.cycle, stage: 'MEM'})
      }
    })
    
    return {
      diagram: Array.from(instructionMap.entries()).map(([instr, stages]) => ({
        instruction: instr,
        stages: stages
      })),
      flushCycles
    }
  }
  
  const {diagram: pipelineDiagram, flushCycles} = buildPipelineDiagram()
  const maxCycle = pipelineHistory.length > 0 ? pipelineHistory[pipelineHistory.length - 1].cycle : 0
  
  const cycleInfo = new Map<number, {stall: boolean, flush: boolean}>()
  pipelineHistory.forEach((entry) => {
    cycleInfo.set(entry.cycle, {
      stall: entry.pipeline.IF?.stalled || false,
      flush: flushCycles.has(entry.cycle)
    })
  })

  return (
    <div className="h-64 bg-[#24283b] border-t-2 border-[#7aa2f7]">
      <div className="flex border-b border-[#1f2335]">
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='pipeline-diagram'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('pipeline-diagram')}
        >
          Pipeline Diagram
        </button>
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='pipeline-registers'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('pipeline-registers')}
        >
          Pipeline Registers
        </button>
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='opcodes'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('opcodes')}
        >
          Opcode (HEX)
        </button>
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='console'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('console')}
        >
          Console / Errors
        </button>
      </div>
      <div className="p-3 overflow-auto h-[calc(100%-3rem)]">
        {activeTab==='pipeline-diagram' && (
          <div className="text-xs font-mono">
            {pipelineDiagram.length === 0 ? (
              <div className="text-[#565f89]">No instructions executed yet. Click Step or Run to begin.</div>
            ) : (
              <>
                <div className="flex gap-4 mb-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#c0caf5] border border-[#292e42]"></div>
                    <span className="text-[#a9b1d6]">Normal Stage</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#f7768e] border border-[#292e42]"></div>
                    <span className="text-[#a9b1d6]">Stall (S)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#e0af68] border border-[#292e42]"></div>
                    <span className="text-[#a9b1d6]">Flush (F)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#bb9af7] border border-[#292e42]"></div>
                    <span className="text-[#a9b1d6]">Stall+Flush (S+F)</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="border-collapse">
                  <thead>
                    <tr className="bg-[#7aa2f7]">
                      <th className="border border-[#292e42] px-4 py-2 text-left text-[#1a1b26] font-bold sticky left-0 bg-[#7aa2f7] z-10">Instruction</th>
                      {Array.from({length: maxCycle}, (_, i) => i + 1).map(cycle => {
                        const info = cycleInfo.get(cycle)
                        let cycleLabel = cycle.toString()
                        let bgColor = ''
                        
                        if (info?.stall && info?.flush) {
                          cycleLabel = `${cycle} (S+F)`
                          bgColor = 'bg-[#bb9af7]' // Purple for both
                        } else if (info?.stall) {
                          cycleLabel = `${cycle} (S)`
                          bgColor = 'bg-[#f7768e]' // Red for stall
                        } else if (info?.flush) {
                          cycleLabel = `${cycle} (F)`
                          bgColor = 'bg-[#e0af68]' // Orange for flush
                        }
                        
                        return (
                          <th key={cycle} className={`border border-[#292e42] px-4 py-2 text-center text-[#1a1b26] font-bold whitespace-nowrap ${bgColor}`}>
                            {cycleLabel}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineDiagram.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1f2335]">
                        <td className="border border-[#292e42] px-4 py-2 text-[#a9b1d6] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">
                          {item.instruction}
                        </td>
                        {Array.from({length: maxCycle}, (_, i) => i + 1).map(cycle => {
                          const stageAtCycle = item.stages.find(s => s.cycle === cycle)
                          const info = cycleInfo.get(cycle)
                          let bgColor = 'bg-[#1a1b26]'
                          let textColor = 'text-[#565f89]'
                          
                          if (stageAtCycle) {
                            if (stageAtCycle.isStall) {
                              bgColor = 'bg-[#f7768e]' 
                              textColor = 'text-[#1a1b26]'
                            } else {
                              bgColor = 'bg-[#c0caf5]' 
                              textColor = 'text-[#1a1b26]'
                            }
                          }
                          
                          return (
                            <td key={cycle} className={`border border-[#292e42] px-4 py-2 text-center font-bold ${bgColor} ${textColor}`}>
                              {stageAtCycle?.stage || ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        )}
        {activeTab==='pipeline-registers' && (
          <div className="text-xs font-mono">
            {pipelineHistory.length === 0 ? (
              <div className="text-[#565f89]">No cycles executed yet. Click Step to begin.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1a2338]">
                      <th className="border border-[#292e42] px-2 py-1 text-left text-[#7aa2f7] sticky left-0 bg-[#1a2338] z-10"></th>
                      {pipelineHistory.map((entry) => (
                        <th key={entry.cycle} className="border border-[#292e42] px-3 py-1 text-center text-[#7aa2f7] whitespace-nowrap">
                          Cycle {entry.cycle}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[#a9b1d6]">
                    {/* IF/ID.IR row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">IF/ID.IR</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['IF/ID']?.IR || ''
                        const nop = entry.pipeline['IF/ID']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* IF/ID.NPC row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">IF/ID.NPC</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['IF/ID']?.NPC || ''
                        const nop = entry.pipeline['IF/ID']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* PC row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">PC</td>
                      {pipelineHistory.map((entry) => (
                        <td key={entry.cycle} className="border border-[#292e42] px-2 py-1 text-center">
                          {entry.pipeline.IF?.PC || ''}
                        </td>
                      ))}
                    </tr>
                    {/* ID/EX.A row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">ID/EX.A</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['ID/EX']?.A || ''
                        const nop = entry.pipeline['ID/EX']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* ID/EX.B row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">ID/EX.B</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['ID/EX']?.B || ''
                        const nop = entry.pipeline['ID/EX']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* ID/EX.IMM row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">ID/EX.IMM</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['ID/EX']?.IMM || ''
                        const nop = entry.pipeline['ID/EX']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* ID/EX.IR row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">ID/EX.IR</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['ID/EX']?.IR || ''
                        const nop = entry.pipeline['ID/EX']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* ID/EX.NPC row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">ID/EX.NPC</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['ID/EX']?.NPC || ''
                        const nop = entry.pipeline['ID/EX']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* EX/MEM.ALUOutput row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">EX/MEM.ALUOutput</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['EX/MEM']?.ALUOutput || ''
                        const nop = entry.pipeline['EX/MEM']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* EX/MEM.cond row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">EX/MEM.cond</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['EX/MEM']?.cond ? '1' : '0'
                        const nop = entry.pipeline['EX/MEM']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* EX/MEM.IR row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">EX/MEM.IR</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['EX/MEM']?.IR || ''
                        const nop = entry.pipeline['EX/MEM']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* EX/MEM.B row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">EX/MEM.B</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['EX/MEM']?.B || ''
                        const nop = entry.pipeline['EX/MEM']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* MEM/WB.LMD row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">MEM/WB.LMD</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['MEM/WB']?.LMD || ''
                        const nop = entry.pipeline['MEM/WB']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : ''}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* MEM/WB.IR row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">MEM/WB.IR</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['MEM/WB']?.IR || ''
                        const nop = entry.pipeline['MEM/WB']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* MEM/WB.ALUOutput row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">MEM/WB.ALUOutput</td>
                      {pipelineHistory.map((entry) => {
                        const val = entry.pipeline['MEM/WB']?.ALUOutput || ''
                        const nop = entry.pipeline['MEM/WB']?.nop
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${nop ? 'bg-[#1a1b26]' : 'bg-yellow-400 text-black font-semibold'}`}>
                            {nop ? 'N/A' : val}
                          </td>
                        )
                      })}
                    </tr>
                    {/* MEM[EX/MEM.ALUOutput] row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">MEM[EX/MEM.ALUOutput]</td>
                      {pipelineHistory.map((entry) => (
                        <td key={entry.cycle} className="border border-[#292e42] px-2 py-1 text-center">
                          N/A
                        </td>
                      ))}
                    </tr>
                    {/* REGS[MEM/WB.IR[rd]] row */}
                    <tr className="hover:bg-[#1f2335]">
                      <td className="border border-[#292e42] px-2 py-1 text-[#565f89] sticky left-0 bg-[#24283b] z-10 whitespace-nowrap">REGS[MEM/WB.IR[rd]]</td>
                      {pipelineHistory.map((entry) => {
                        const regWritten = entry.pipeline.WB?.register_written
                        const valWritten = entry.pipeline.WB?.value_written
                        return (
                          <td key={entry.cycle} className={`border border-[#292e42] px-2 py-1 text-center ${regWritten ? 'bg-yellow-400 text-black font-semibold' : ''}`}>
                            {regWritten ? valWritten : 'N/A'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab==='opcodes' && (
          <div className="space-y-1 text-xs font-mono">
            {opcodes.length === 0 ? <div className="text-[#565f89]">No program loaded</div> : opcodes.map((op, i) => (
              <div key={i} className="flex gap-4 p-1.5 bg-[#1a1b26] rounded border border-[#292e42]">
                <span className="text-[#7aa2f7] w-24">{op.address}</span>
                <span className="text-[#f7768e] w-24">{op.hex}</span>
                <span className="text-[#a9b1d6] flex-1">{op.raw}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab==='console' && (
          <div className="text-xs font-mono text-[#a9b1d6]">
            {consoleLines.length===0 ? <div className="text-[#565f89]">No logs</div> : consoleLines.map((l,i)=>(<div key={i}>{l}</div>))}
          </div>
        )}
      </div>
    </div>
  )
}
