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
    <div className="h-40 bg-white border-t">
      <div className="flex border-b">
        <button className={`px-3 py-2 ${activeTab==='pipeline'?'border-b-2 border-indigo-600':''}`} onClick={()=>onSelectTab('pipeline')}>Pipeline Map</button>
        <button className={`px-3 py-2 ${activeTab==='pipeline-registers'?'border-b-2 border-indigo-600':''}`} onClick={()=>onSelectTab('pipeline-registers')}>Pipeline Registers</button>
        <button className={`px-3 py-2 ${activeTab==='console'?'border-b-2 border-indigo-600':''}`} onClick={()=>onSelectTab('console')}>Errors / Console</button>
      </div>
  <div className="p-3 overflow-auto h-[calc(100%-3rem)]">
        {activeTab==='pipeline' && (
          <div>
            <div className="text-sm text-slate-600 mb-2">Pipeline Map (mock)</div>
            <div className="grid grid-cols-5 gap-2">
              {(pipelineData?.cycles?.[0]?.perStage ?? [{},{},{},{},{}]).map((s,i)=> (
                <div key={i} className="p-2 bg-slate-50 border rounded">{s.instr ?? '---'}</div>
              ))}
            </div>
          </div>
        )}
        {activeTab==='pipeline-registers' && (
          <div className="text-sm text-slate-600">Pipeline Registers (mock)</div>
        )}
        {activeTab==='console' && (
          <div className="text-xs font-mono">
            {consoleLines.length===0 ? <div className="text-slate-500">No logs</div> : consoleLines.map((l,i)=>(<div key={i}>{l}</div>))}
          </div>
        )}
      </div>
    </div>
  )
}
