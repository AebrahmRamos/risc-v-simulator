import React from 'react'

interface Props {
  code: string
  onChange: (c: string) => void
  highlightedLines?: number[]
  assemblerErrors?: { line?: number; message: string }[]
}

export default function CodePanel({ code, onChange, highlightedLines = [], assemblerErrors = [] }: Props) {
  return (
    <div className="h-full p-3 flex flex-col">
      <div className="mb-2 text-sm text-slate-600">Editor</div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full flex-1 font-mono text-sm p-2 border rounded bg-white resize-none overflow-auto"
      />
      <div className="mt-2 text-xs text-red-600">
        {assemblerErrors.map((err, i) => (
          <div key={i}>Line {err.line ?? '?'}: {err.message}</div>
        ))}
      </div>
    </div>
  )
}
