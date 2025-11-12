import React from 'react'

interface Props {
  runState: 'idle'|'running'|'paused'
  onRun: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onAssemble: () => void
  assemblerErrorsCount?: number
}

export default function ToolBar({ runState, onRun, onPause, onStep, onReset, onAssemble, assemblerErrorsCount }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b">
      <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={onRun}>Run</button>
      <button className="px-3 py-1 bg-yellow-400 text-black rounded" onClick={onPause}>Pause</button>
      <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={onStep}>Step</button>
      <button className="px-3 py-1 bg-gray-200 rounded" onClick={onReset}>Reset</button>
      <div className="flex-1" />
      <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={onAssemble}>Assemble</button>
      <div className="ml-3 text-sm text-slate-600">Errors: {assemblerErrorsCount ?? 0}</div>
    </div>
  )
}
