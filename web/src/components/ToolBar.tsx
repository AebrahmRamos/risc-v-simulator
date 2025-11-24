import React from 'react'

interface Props {
  runState: 'idle'|'running'|'paused'
  onRun: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onAssemble: () => void
  assemblerErrorsCount?: number
  isHalted?: boolean
}

export default function ToolBar({ runState, onRun, onPause, onStep, onReset, onAssemble, assemblerErrorsCount, isHalted }: Props) {
  const isDisabled = isHalted || runState === 'running'
  
  return (
    <div className="flex items-center gap-3 p-2 bg-[#1f2335] border-b border-[#1f2335]">
      <button 
        className="px-3 py-1 bg-[#9ece6a] text-[#1a1b26] rounded text-sm font-medium hover:bg-[#b9f27c] disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onRun}
        disabled={isDisabled}
      >
        Run
      </button>
      <button 
        className="px-3 py-1 bg-[#e0af68] text-[#1a1b26] rounded text-sm font-medium hover:bg-[#f0bf78] disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onPause}
        disabled={runState !== 'running'}
      >
        Pause
      </button>
      <button 
        className="px-3 py-1 bg-[#7aa2f7] text-[#1a1b26] rounded text-sm font-medium hover:bg-[#8ab2ff] disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onStep}
        disabled={isHalted}
      >
        Step
      </button>
      <button className="px-3 py-1 bg-[#292e42] text-[#a9b1d6] rounded text-sm hover:bg-[#343a55]" onClick={onReset}>Reset</button>
      <div className="flex-1" />
      <button className="px-3 py-1 bg-[#bb9af7] text-[#1a1b26] rounded text-sm font-medium hover:bg-[#cbaaff]" onClick={onAssemble}>Assemble</button>
      <div className="ml-3 text-sm text-[#565f89]">Errors: {assemblerErrorsCount ?? 0}</div>
    </div>
  )
}
