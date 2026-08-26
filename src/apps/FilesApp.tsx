import React, { useState } from 'react'
import { getInitialVfs, findEntry, VEntry } from '../vfs/vfs'

export default function FilesApp(){
  const [vfs] = useState(getInitialVfs)
  const [cwd, setCwd] = useState<string[]>(([]))

  const node = findEntry(cwd.length?cwd:[''], vfs) as VEntry | null
  const children = node && node.type==='dir' ? node.children ?? [] : []

  function enter(name: string){
    setCwd(prev=>[...prev,name])
  }
  function up(){
    setCwd(prev=>prev.slice(0, -1))
  }

  return (
    <div>
      <h3>Files</h3>
      <div>Path: /{cwd.join('/')}</div>
      <div style={{marginTop:8}}>
        <button onClick={up} disabled={cwd.length===0} className="button">Up</button>
      </div>
      <ul className="file-list" style={{marginTop:8}}>
        {children.map(c=> (
          <li key={c.name} onDoubleClick={()=> c.type==='dir' ? enter(c.name) : null}>
            {c.type==='dir' ? '📁' : '📄'} {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
