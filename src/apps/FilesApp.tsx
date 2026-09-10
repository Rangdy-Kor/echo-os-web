import React, { useEffect, useRef, useState } from 'react'
import { findEntry, getCollisionSafeName, getNewTextFileRenameCandidate, VEntry } from '../vfs/vfs'

type PathMigration = { id: number; oldPath: string[]; newPath: string[] }

type Props = {
  vfs: VEntry
  initialPath?: string[]
  onOpenItem: (path: string[], item: VEntry) => void
  onCreateTextFile: (directoryPath: string[], fileName: string) => void
  onRenameItem: (path: string[], newName: string) => string | null
  pathMigration?: PathMigration | null
  windowId?: string
  onTitleChange?: (windowId: string, title: string) => void
  onPathChange?: (path: string[]) => void
}

type ContextMenuState = { x: number; y: number; entryName?: string }
type RenameState = { originalName: string; draft: string; mode: 'existing' | 'new-text' }

function migratePath(path: string[], migration: PathMigration){
  return path.length >= migration.oldPath.length && migration.oldPath.every((part, index)=>path[index] === part)
    ? [...migration.newPath, ...path.slice(migration.oldPath.length)]
    : path
}

export default function FilesApp({ vfs, initialPath = [], onOpenItem, onCreateTextFile, onRenameItem, pathMigration, windowId, onTitleChange, onPathChange }: Props){
  const [cwd, setCwd] = useState<string[]>(() => initialPath.slice())
  const cwdRef = useRef<string[]>(cwd)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const renameCancelledRef = useRef(false)
  const [backStack, setBackStack] = useState<string[][]>([])
  const [forwardStack, setForwardStack] = useState<string[][]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renaming, setRenaming] = useState<RenameState | null>(null)

  useEffect(() => { cwdRef.current = cwd }, [cwd])
  useEffect(() => {
    if(windowId && onTitleChange) onTitleChange(windowId, cwd.length === 0 ? 'Files' : cwd[cwd.length - 1])
    onPathChange?.(cwd)
  }, [cwd])

  useEffect(()=>{
    if(!pathMigration) return
    setCwd(path=>migratePath(path, pathMigration))
    setBackStack(paths=>paths.map(path=>migratePath(path, pathMigration)))
    setForwardStack(paths=>paths.map(path=>migratePath(path, pathMigration)))
    setSelected(name=>name && [...cwdRef.current, name].length === pathMigration.oldPath.length && pathMigration.oldPath.every((part, index)=>[...cwdRef.current, name][index] === part)
      ? pathMigration.newPath[pathMigration.newPath.length - 1]
      : name
    )
  },[pathMigration?.id])

  useEffect(()=>{
    if(!contextMenu) return
    function closeMenu(){ setContextMenu(null) }
    function onKeyDown(event: KeyboardEvent){ if(event.key === 'Escape') closeMenu() }
    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', onKeyDown)
    return ()=>{
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  },[contextMenu])

  useEffect(()=>{
    if(!renaming) return
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  },[renaming?.originalName])

  const node = findEntry(cwd.length ? cwd : [''], vfs) as VEntry | null
  const children = node?.type === 'dir' ? node.children ?? [] : []

  function canEnter(dirName: string){
    return findEntry([...cwd, dirName], vfs)?.type === 'dir'
  }

  function enter(name: string){
    if(!canEnter(name)) return
    setBackStack(stack=>[...stack, cwdRef.current.slice()])
    setForwardStack([])
    setCwd(path=>[...path, name])
    setSelected(null)
  }

  function up(){
    if(cwdRef.current.length === 0) return
    setBackStack(stack=>[...stack, cwdRef.current.slice()])
    setForwardStack([])
    setCwd(path=>path.slice(0, -1))
    setSelected(null)
  }

  function goBack(){
    setBackStack(stack=>{
      if(stack.length === 0) return stack
      const previous = stack[stack.length - 1]
      setForwardStack(forward=>[...forward, cwdRef.current.slice()])
      setCwd(previous)
      setSelected(null)
      return stack.slice(0, -1)
    })
  }

  function goForward(){
    setForwardStack(stack=>{
      if(stack.length === 0) return stack
      const next = stack[stack.length - 1]
      setBackStack(back=>[...back, cwdRef.current.slice()])
      setCwd(next)
      setSelected(null)
      return stack.slice(0, -1)
    })
  }

  function defaultTextFileName(){
    const base = 'New Text File'
    let index = 0
    let candidate = `${base}.txt`
    while(children.some(child=>child.name === candidate)){
      index += 1
      candidate = `${base} (${index}).txt`
    }
    return candidate
  }

  function createNewTextFile(){
    const name = defaultTextFileName()
    onCreateTextFile(cwdRef.current, name)
    setContextMenu(null)
    setSelected(name)
    setRenaming({ originalName: name, draft: name, mode: 'new-text' })
  }

  function startRename(name: string){
    setContextMenu(null)
    setSelected(name)
    setRenaming({ originalName: name, draft: name, mode: 'existing' })
  }

  function finishRename(){
    if(!renaming) return
    if(renameCancelledRef.current){
      renameCancelledRef.current = false
      setRenaming(null)
      return
    }

    const rawValue = renaming.draft
    const trimmedValue = rawValue.trim()
    const siblingNames = children.map(entry=>entry.name)
    const finalCandidate = renaming.mode === 'existing'
      ? getCollisionSafeName(trimmedValue, siblingNames, renaming.originalName)
      : getNewTextFileRenameCandidate(trimmedValue, siblingNames, renaming.originalName)

    const actualName = onRenameItem([...cwdRef.current, renaming.originalName], finalCandidate)
    setSelected(actualName ?? renaming.originalName)
    setRenaming(null)
  }

  function openContextMenu(event: React.MouseEvent){
    const target = event.target as HTMLElement
    if(target.closest('.files-nav, .files-path, h3, .files-inline-rename')) return
    const root = rootRef.current
    if(!root) return
    event.preventDefault()
    const entryName = target.closest('li')?.getAttribute('data-name') ?? undefined
    if(entryName) setSelected(entryName)
    const rect = root.getBoundingClientRect()
    const width = 150
    const height = 38
    setContextMenu({
      x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - width)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - height)),
      entryName,
    })
  }

  function onFileListClick(event: React.MouseEvent){
    const name = (event.target as HTMLElement).closest('li')?.getAttribute('data-name')
    setSelected(name ?? null)
  }

  function onRootClick(event: React.MouseEvent){
    const target = event.target as HTMLElement
    if(target.closest('.files-nav, .files-path, .file-list, .files-context-menu')) return
    setSelected(null)
  }

  return (
    <div ref={rootRef} className="files-app" onClick={onRootClick} onContextMenu={openContextMenu}>
      <h3>Files</h3>
      <div className="files-header">
        <div className="files-nav">
          <button className="button" onClick={goBack} disabled={backStack.length === 0}>◀ Back</button>
          <button className="button" onClick={goForward} disabled={forwardStack.length === 0}>Forward ▶</button>
          <button className="button" onClick={up} disabled={cwd.length === 0}>Up</button>
        </div>
        <div className="files-path">Path: /{cwd.join('/')}</div>
      </div>

      <ul className="file-list" onClick={onFileListClick}>
        {children.map(entry=>(
          <li
            key={entry.name}
            data-name={entry.name}
            className={selected === entry.name ? 'selected' : ''}
            onMouseDown={event=>{ if(event.detail > 1) event.preventDefault() }}
            onDoubleClick={event=>{
              if(renaming?.originalName === entry.name) return
              event.preventDefault()
              document.getSelection()?.removeAllRanges()
              if(entry.type === 'dir') enter(entry.name)
              else onOpenItem([...cwd, entry.name], entry)
            }}
          >
            <span aria-hidden="true">{entry.type === 'dir' ? '📁' : '📄'}</span>{' '}
            {renaming?.originalName === entry.name ? (
              <input
                ref={renameInputRef}
                className="files-inline-rename"
                aria-label={`Rename ${entry.name}`}
                value={renaming.draft}
                onClick={event=>event.stopPropagation()}
                onChange={event=>setRenaming(current=>current ? { ...current, draft: event.target.value } : current)}
                onKeyDown={event=>{
                  if(event.key === 'Enter') event.currentTarget.blur()
                  if(event.key === 'Escape'){
                    renameCancelledRef.current = true
                    event.currentTarget.blur()
                  }
                }}
                onBlur={finishRename}
              />
            ) : entry.name}
          </li>
        ))}
      </ul>

      {contextMenu && (
        <div className="files-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onPointerDown={event=>event.stopPropagation()}>
          <button className="button" onClick={()=>contextMenu.entryName ? startRename(contextMenu.entryName) : createNewTextFile()}>
            {contextMenu.entryName ? 'Rename' : 'New Text File'}
          </button>
        </div>
      )}
    </div>
  )
}
