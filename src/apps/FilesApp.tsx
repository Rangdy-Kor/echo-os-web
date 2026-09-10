import React, { useState, useRef, useEffect } from 'react'
import { findEntry, VEntry } from '../vfs/vfs'

type Props = {
  vfs: VEntry
  initialPath?: string[]
  onOpenItem: (path: string[], item: VEntry) => void
  onCreateTextFile: (directoryPath: string[], fileName: string) => void
  windowId?: string
  onTitleChange?: (windowId: string, title: string) => void
  onPathChange?: (path: string[]) => void
}

export default function FilesApp({ vfs, initialPath = [], onOpenItem, onCreateTextFile, windowId, onTitleChange, onPathChange }: Props){
  const [cwd, setCwd] = useState<string[]>(() => initialPath.slice())
  const cwdRef = useRef<string[]>(cwd)
  useEffect(() => { cwdRef.current = cwd }, [cwd])
  useEffect(() => {
    if(windowId && onTitleChange) onTitleChange(windowId, cwd.length === 0 ? 'Files' : cwd[cwd.length - 1])
    onPathChange?.(cwd)
  }, [cwd])

  // navigation history stacks: store snapshots of cwd arrays
  const [backStack, setBackStack] = useState<string[][]>([])
  const [forwardStack, setForwardStack] = useState<string[][]>([])

  // selection state: single-item selection by name within current directory
  const [selected, setSelected] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')

  // root ref to allow sizing to fill parent .content area
  const rootRef = useRef<HTMLDivElement | null>(null)

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
    // clear selection when navigating into a directory
    setSelected(null)
  }

  function up(){
    // snapshot current cwd reliably and update stacks
    if (cwdRef.current.length === 0) return
    const snapshot = cwdRef.current.slice()
    setBackStack(bs => [...bs, snapshot])
    setForwardStack([])
    setCwd(prev => prev.slice(0, -1))
    setSelected(null)
  }

  function goBack(){
    setBackStack(bs => {
      if(bs.length === 0) return bs
      const prev = bs[bs.length - 1]
      // push current cwd into forward stack using the ref snapshot
      setForwardStack(fs => [...fs, cwdRef.current.slice()])
      setCwd(prev)
      setSelected(null)
      return bs.slice(0, -1)
    })
  }

  function goForward(){
    setForwardStack(fs => {
      if(fs.length === 0) return fs
      const next = fs[fs.length - 1]
      setBackStack(bs => [...bs, cwdRef.current.slice()])
      setCwd(next)
      setSelected(null)
      return fs.slice(0, -1)
    })
  }

  function newTextFile(){
    onCreateTextFile(cwdRef.current, newFileName)
    setNewFileName('')
  }

  // Clicking inside the file list: determine whether a li was clicked.
  // If a li (or a descendant) was clicked, select that item. Otherwise clear selection.
  function onFileListClick(e: React.MouseEvent){
    const target = e.target as HTMLElement | null
    if(!target) { setSelected(null); return }
    const li = target.closest && target.closest('li') as HTMLElement | null
    // li must be a child of the current UL (defensive)
    if(li && (e.currentTarget as HTMLElement).contains(li)){
      const name = li.getAttribute('data-name')
      if(name) setSelected(name)
      return
    }
    setSelected(null)
  }

  // ensure the FilesApp root fills the parent .content area so clicks on the
  // empty region reach this component. We use a ResizeObserver on the
  // closest ancestor with class 'content' and set the root div height accordingly.
  useEffect(() => {
    const root = rootRef.current
    if(!root) return
    const contentEl = root.closest && (root.closest('.content') as HTMLElement | null)
    if(!contentEl) return

    // set initial height
    root.style.height = `${contentEl.clientHeight}px`
    root.style.boxSizing = 'border-box'

    const ro = new ResizeObserver(()=>{
      if(root && contentEl)
        root.style.height = `${contentEl.clientHeight}px`
    })
    ro.observe(contentEl)

    return ()=> ro.disconnect()
  }, [])

  // Root-level click: handle clicks that occur outside .file-list (e.g., the empty area below the list)
  function onRootClick(e: React.MouseEvent){
    const target = e.target as HTMLElement | null
    if(!target) return
    // ignore clicks inside toolbar
    if(target.closest && target.closest('.files-nav')) return
    // if click is inside the file-list area, let the ul handler manage selection
    if(target.closest && target.closest('.file-list')) return
    // otherwise clear selection
    setSelected(null)
  }

  return (
    <div ref={rootRef} className="files-app" onClick={onRootClick} style={{display:'flex',flexDirection:'column'}}>
      <h3>Files</h3>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div className="files-nav">
          <button className="button" onClick={goBack} disabled={backStack.length===0}>◀ Back</button>
          <button className="button" onClick={goForward} disabled={forwardStack.length===0}>Forward ▶</button>
          <button className="button" onClick={up} disabled={cwd.length===0}>Up</button>
          <input className="files-new-file-input" aria-label="New text file name" placeholder="File name (.txt optional)" value={newFileName} onChange={event=>setNewFileName(event.target.value)} onKeyDown={event=>{ if(event.key === 'Enter' && newFileName.trim()) newTextFile() }} />
          <button className="button" onClick={newTextFile} disabled={!newFileName.trim()}>New Text File</button>
        </div>
        <div className="files-path" style={{marginLeft:8,color:'var(--muted)'}}>Path: /{cwd.join('/')}</div>
      </div>

      <ul className="file-list" style={{marginTop:8}} onClick={onFileListClick}>
        {children.map(c=> (
            <li
              key={c.name}
              data-name={c.name}
              className={selected === c.name ? 'selected' : ''}
              onMouseDown={(e)=>{ if ((e as React.MouseEvent).detail > 1) { e.preventDefault() } }}
              onDoubleClick={(e)=>{
                e.preventDefault()
                try{ document.getSelection()?.removeAllRanges() }catch{}
                if(c.type === 'dir') enter(c.name)
                else onOpenItem([...cwd, c.name], c)
              }}
            >
              {c.type==='dir' ? '📁' : '📄'} {c.name}
            </li>
        ))}
      </ul>
    </div>
  )
}
