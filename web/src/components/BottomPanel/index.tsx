import React from 'react'
import { PipelineState } from '../../types'

interface Props {
  activeTab: 'pipeline'|'pipeline-registers'|'console'
  onSelectTab: (t: 'pipeline'|'pipeline-registers'|'console') => void
  pipelineData?: PipelineState
  consoleLines?: string[]
}

export default function BottomPanel({ activeTab, onSelectTab, pipelineData, consoleLines = [] }: Props) {
  return (
    <div className="h-40 bg-[#24283b] border-t border-[#1f2335]">
      <div className="flex border-b border-[#1f2335]">
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='pipeline'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('pipeline')}
        >
          Pipeline Map
        </button>
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='pipeline-registers'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('pipeline-registers')}
        >
          Pipeline Registers
        </button>
        <button 
          className={`px-3 py-2 text-sm ${activeTab==='console'?'border-b-2 border-[#7aa2f7] text-[#7aa2f7]':'text-[#565f89] hover:text-[#a9b1d6]'}`} 
          onClick={()=>onSelectTab('console')}
        >
          Errors / Console
        </button>
      </div>
      <div className="p-3 overflow-auto h-[calc(100%-3rem)]">
        {activeTab==='pipeline' && (
          <div>
            <div className="text-sm text-[#565f89] mb-2">Pipeline Map (mock)</div>
            <div className="grid grid-cols-5 gap-2">
              {(pipelineData?.cycles?.[0]?.perStage ?? [{},{},{},{},{}]).map((s,i)=> (
                <div key={i} className="p-2 bg-[#1a1b26] border border-[#292e42] rounded text-[#a9b1d6] text-sm">{s.instr ?? '---'}</div>
              ))}
            </div>
          </div>
        )}
        {activeTab==='pipeline-registers' && (
          <div className="text-sm text-[#565f89]">Pipeline Registers (mock)</div>
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
