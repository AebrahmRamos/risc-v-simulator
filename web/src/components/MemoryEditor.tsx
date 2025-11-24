import React, { useState } from 'react'

interface Props {
  initial?: Record<string, number | string>
  onApply: (mem: Record<string, number | string>) => void
}

export default function MemoryEditor({ initial, onApply }: Props){
  const pretty = initial ? JSON.stringify(initial, null, 2) : '{\n  "0x0000": "0x00000000"\n}'
  const [text, setText] = useState(pretty)
  const [error, setError] = useState<string | null>(null)

  function apply(){
    try{
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected object mapping')
      setError(null)
      onApply(parsed)
    }catch(e:any){
      setError(e?.message || 'Invalid JSON')
    }
  }

  return (
    <div className="bg-[#1a1b26] p-2 rounded border border-[#292e42]">
      <div className="text-xs text-[#565f89] mb-2">Initial Memory (address → 32-bit word). Use JSON mapping, addresses in hex or decimal.</div>
      <textarea className="w-full h-28 bg-[#0f1117] text-xs font-mono p-2 rounded" value={text} onChange={(e)=>setText(e.target.value)} />
      {error && <div className="text-xs text-[#ff7b7b] mt-1">{error}</div>}
      <div className="mt-2 flex gap-2">
        <button className="px-2 py-1 text-sm rounded bg-[#9ece6a] text-black" onClick={apply}>Apply</button>
        <button className="px-2 py-1 text-sm rounded bg-[#1a2338] text-[#7aa2f7]" onClick={()=>{ setText('{\n  "0x0000": "0x00000000"\n}') }} >Reset</button>
      </div>
    </div>
  )
}
