import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findEntry, getCollisionSafeName, getNewTextFileRenameCandidate, VEntry } from '../vfs/vfs'

type PathMigration = { id: number; oldPath: string[]; newPath: string[] }

type Props = {
  vfs: VEntry
  initialPath?: string[]
  onOpenItem: (path: string[], item: VEntry) => void
  onCreateTextFile: (directoryPath: string[], fileName: string) => void
  onCreateFolder: (directoryPath: string[], folderName: string) => void
  onRenameItem: (path: string[], newName: string) => string | null
  onDeleteItem: (path: string[]) => boolean
  pathMigration?: PathMigration | null
  active?: boolean
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

export default function FilesApp({ vfs, initialPath = [], onOpenItem, onCreateTextFile, onCreateFolder, onRenameItem, onDeleteItem, pathMigration, active = true, windowId, onTitleChange, onPathChange }: Props){
  const [cwd, setCwd] = useState<string[]>(() => initialPath.slice())
  const cwdRef = useRef<string[]>(cwd)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const renameMeasureRef = useRef<HTMLSpanElement | null>(null)
  const renameCancelledRef = useRef(false)
  const [backStack, setBackStack] = useState<string[][]>([])
  const [forwardStack, setForwardStack] = useState<string[][]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renaming, setRenaming] = useState<RenameState | null>(null)
  const [renameInputWidth, setRenameInputWidth] = useState(96)

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

  useLayoutEffect(()=>{
    const input = renameInputRef.current
    const measure = renameMeasureRef.current
    if(!renaming || !input || !measure) return

    function updateWidth(){
      const inputStyle = getComputedStyle(input)
      const horizontalChrome = parseFloat(inputStyle.paddingLeft) + parseFloat(inputStyle.paddingRight)
        + parseFloat(inputStyle.borderLeftWidth) + parseFloat(inputStyle.borderRightWidth)
      const measuredWidth = Math.ceil(measure.getBoundingClientRect().width + horizontalChrome + 12)
      const list = input.closest('.file-list') as HTMLElement | null
      const listRect = list?.getBoundingClientRect()
      const inputRect = input.getBoundingClientRect()
      const leadingWidth = listRect && list ? inputRect.left - listRect.left + list.scrollLeft : 28
      const maximumWidth = Math.max(48, (list?.clientWidth ?? rootRef.current?.clientWidth ?? measuredWidth) - leadingWidth - 8)
      setRenameInputWidth(Math.min(maximumWidth, Math.max(96, measuredWidth)))
    }

    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    const viewport = input.closest('.file-list') ?? rootRef.current
    if(viewport) resizeObserver.observe(viewport)
    return ()=>resizeObserver.disconnect()
  },[renaming?.draft])

  const node = findEntry(cwd.length ? cwd : [''], vfs) as VEntry | null
  const children = node?.type === 'dir' ? node.children ?? [] : []

  useEffect(()=>{
    if(selected && !children.some(child=>child.name === selected)) setSelected(null)
    if(renaming && !children.some(child=>child.name === renaming.originalName)) setRenaming(null)
  },[children, selected, renaming?.originalName])

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
    startRename(name, 'new-text')
  }

  function createNewFolder(){
    const base = 'New Folder'
    let index = 0
    let name = base
    while(children.some(child=>child.name === name)){
      index += 1
      name = `${base} (${index})`
    }
    onCreateFolder(cwdRef.current, name)
    startRename(name)
  }

  function startRename(name: string, mode: RenameState['mode'] = 'existing'){
    setContextMenu(null)
    setSelected(name)
    setRenaming({ originalName: name, draft: name, mode })
  }

  function deleteSelectedItem(name: string){
    const deleted = onDeleteItem([...cwdRef.current, name])
    setContextMenu(null)
    if(!deleted) return
    setSelected(null)
    setRenaming(current=>current?.originalName === name ? null : current)
  }

  useEffect(()=>{
    if(!active) return

    function isEditableTarget(target: EventTarget | null){
      const element = target instanceof HTMLElement ? target : null
      return !!element?.closest('input, textarea, select, [contenteditable="true"]')
    }

    function onKeyDown(event: KeyboardEvent){
      if(isEditableTarget(event.target)) return
      if(event.key === 'F2' && selected && !renaming){
        event.preventDefault()
        startRename(selected)
      } else if(event.key === 'Backspace' && backStack.length > 0){
        event.preventDefault()
        goBack()
      } else if(event.key === 'Delete' && selected){
        event.preventDefault()
        deleteSelectedItem(selected)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return ()=>document.removeEventListener('keydown', onKeyDown)
  },[active, selected, renaming, backStack])

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
    if(target.closest('.files-nav, .files-path, .files-inline-rename')) return
    const root = rootRef.current
    if(!root) return
    event.preventDefault()
    const entryName = target.closest('li')?.getAttribute('data-name') ?? undefined
    if(entryName) setSelected(entryName)
    const rect = root.getBoundingClientRect()
    const width = 150
    const height = 72
    const requiredWidth = entryName ? width : width * 2
    setContextMenu({
      x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - requiredWidth)),
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
              <>
                <input
                  ref={renameInputRef}
                  className="files-inline-rename"
                  style={{ width: renameInputWidth }}
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
                <span ref={renameMeasureRef} className="files-inline-rename-measure" aria-hidden="true">
                  {renaming.draft || ' '}
                </span>
              </>
            ) : entry.name}
          </li>
        ))}
      </ul>

      {contextMenu && (
        <div className="files-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onPointerDown={event=>event.stopPropagation()}>
          {contextMenu.entryName ? (
            <>
              <button className="button" onClick={()=>startRename(contextMenu.entryName!)}>Rename</button>
              <button className="button" onClick={()=>deleteSelectedItem(contextMenu.entryName!)}>Delete</button>
            </>
          ) : (
            <>
              <button className="button" onClick={createNewFolder}>New Folder</button>
              <div className="files-context-submenu-trigger">
                <button className="button files-context-submenu-label" aria-haspopup="menu">
                  <span>New File</span><span aria-hidden="true">›</span>
                </button>
                <div className="files-context-submenu" role="menu">
                  <button className="button" role="menuitem" onClick={createNewTextFile}>Text File</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
