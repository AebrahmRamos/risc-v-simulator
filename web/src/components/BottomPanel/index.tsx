import React from 'react'

interface Props {
  activeTab: 'pipeline-registers'|'console'|'opcodes'
  onSelectTab: (t: 'pipeline-registers'|'console'|'opcodes') => void
  pipelineHistory?: Array<{cycle: number; pipeline: any}>
  opcodes?: Array<{address: string; hex: string; raw: string}>
  consoleLines?: string[]
}

export default function BottomPanel({ activeTab, onSelectTab, pipelineHistory = [], opcodes = [], consoleLines = [] }: Props) {
  return (
    <div className="h-48 bg-[#24283b] border-t border-[#1f2335]">
      <div className="flex border-b border-[#1f2335]">
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
