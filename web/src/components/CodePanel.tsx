import React from 'react'

interface Props {
  code: string
  onChange: (c: string) => void
  highlightedLines?: number[]
  assemblerErrors?: { line?: number; message: string }[]
}

export default function CodePanel({ code, onChange, highlightedLines = [], assemblerErrors = [] }: Props) {
  return (
    <div className="h-full p-3 flex flex-col bg-[#24283b]">
      <div className="mb-2 text-sm text-[#565f89]">Editor</div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full flex-1 font-mono text-sm p-3 bg-[#1a1b26] text-[#a9b1d6] border border-[#292e42] rounded resize-none overflow-auto focus:outline-none focus:border-[#7aa2f7]"
        style={{ caretColor: '#a9b1d6' }}
      />
      <div className="mt-2 text-xs text-[#f7768e]">
        {assemblerErrors.map((err, i) => (
          <div key={i}>Line {err.line ?? '?'}: {err.message}</div>
        ))}
      </div>
    </div>
  )
}
