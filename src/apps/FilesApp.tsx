import React, { useState, useRef, useEffect } from 'react'
import { getInitialVfs, findEntry, VEntry } from '../vfs/vfs'

export default function FilesApp(){
  const [vfs] = useState(getInitialVfs)
  const [cwd, setCwd] = useState<string[]>(([]))
  const cwdRef = useRef<string[]>(cwd)
  useEffect(() => { cwdRef.current = cwd }, [cwd])

  // navigation history stacks: store snapshots of cwd arrays
  const [backStack, setBackStack] = useState<string[][]>([])
  const [forwardStack, setForwardStack] = useState<string[][]>([])

  const node = findEntry(cwd.length?cwd:[''], vfs) as VEntry | null
  const children = node && node.type==='dir' ? node.children ?? [] : []

  function canEnter(dirName: string){
    const target = findEntry([...cwd, dirName].length ? [...cwd, dirName] : [''], vfs)
    return !!target && target.type === 'dir'
  }

  function enter(name: string){
    if(!canEnter(name)) return
    // snapshot current cwd reliably and update stacks
    const snapshot = cwdRef.current.slice()
    setBackStack(bs => [...bs, snapshot])
    setForwardStack([])
    setCwd(prev => [...prev, name])
  }

  function up(){
    // snapshot current cwd reliably and update stacks
    if (cwdRef.current.length === 0) return
    const snapshot = cwdRef.current.slice()
    setBackStack(bs => [...bs, snapshot])
    setForwardStack([])
    setCwd(prev => prev.slice(0, -1))
  }

  function goBack(){
    setBackStack(bs => {
      if(bs.length === 0) return bs
      const prev = bs[bs.length - 1]
      // push current cwd into forward stack using the ref snapshot
      setForwardStack(fs => [...fs, cwdRef.current.slice()])
      setCwd(prev)
      return bs.slice(0, -1)
    })
  }

  function goForward(){
    setForwardStack(fs => {
      if(fs.length === 0) return fs
      const next = fs[fs.length - 1]
      setBackStack(bs => [...bs, cwdRef.current.slice()])
      setCwd(next)
      return fs.slice(0, -1)
    })
  }

  return (
    <div>
      <h3>Files</h3>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div className="files-nav">
          <button className="button" onClick={goBack} disabled={backStack.length===0}>◀ Back</button>
          <button className="button" onClick={goForward} disabled={forwardStack.length===0}>Forward ▶</button>
          <button className="button" onClick={up} disabled={cwd.length===0}>Up</button>
        </div>
        <div style={{marginLeft:8,color:'var(--muted)'}}>Path: /{cwd.join('/')}</div>
      </div>

      <ul className="file-list" style={{marginTop:8}}>
        {children.map(c=> (
            <li key={c.name} onDoubleClick={(e)=>{ e.preventDefault(); try{ document.getSelection()?.removeAllRanges() }catch{}; if(c.type==='dir') enter(c.name) }}>
            {c.type==='dir' ? '📁' : '📄'} {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
