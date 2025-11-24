import React, { useState } from 'react'

interface Props {
  initial?: Record<string, number>
  onApply: (regs: Record<string, number>) => void
}

const REG_NAMES = Array.from({length:32}).map((_,i)=>`x${i}`)

export default function RegisterInitializer({ initial, onApply }: Props) {
  const init: Record<string, string> = {}
  for (let i=1;i<32;i++) {
    const name = `x${i}`
    init[name] = initial && typeof initial[name] !== 'undefined' ? `0x${(initial[name]>>>0).toString(16).padStart(8,'0')}` : '0x00000000'
  }
  const [values, setValues] = useState<Record<string,string>>(init)

  function setVal(name: string, v: string){
    setValues(s=>({ ...s, [name]: v }))
  }

  return (
    <div className="bg-[#1a1b26] p-2 rounded border border-[#292e42] max-h-56 overflow-auto">
      <div className="text-xs text-[#565f89] mb-2">Initialize Registers (x1..x31)</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.keys(values).map((k)=> (
          <div key={k} className="flex items-center gap-2">
            <div className="w-10 text-[#7aa2f7]">{k}</div>
            <input className="flex-1 bg-[#12121a] px-2 py-1 text-xs font-mono rounded" value={values[k]} onChange={(e)=>setVal(k, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="px-2 py-1 text-sm rounded bg-[#9ece6a] text-black" onClick={()=>{
          // parse values to numbers
          const out: Record<string, number> = {}
          for (const k of Object.keys(values)){
            const v = values[k]
            const n = Number(v)
            out[k] = Number.isNaN(n) ? 0 : n >>> 0
          }
          onApply(out)
        }}>Apply</button>
        <button className="px-2 py-1 text-sm rounded bg-[#1a2338] text-[#7aa2f7]" onClick={()=>{
          // reset to zeros
          const z: Record<string,string> = {}
          for (let i=1;i<32;i++) z[`x${i}`] = '0x00000000'
          setValues(z)
        }}>Reset</button>
      </div>
    </div>
  )
}
