import React, { useEffect, useRef, useState } from 'react'
import type { AppDescriptor } from '../apps/registry'
import type { FilesSessionState } from '../apps/FilesApp'
import { findApp } from '../apps/registry'
import { findEntry, getExistingRenameCandidate, getRenameSelectionEnd, type VEntry } from '../vfs/vfs'
import UniversalSurface, { type SurfaceResult } from './UniversalSurface'

export type TabTarget =
  | { type: 'empty' }
  | { type: 'item'; label: string; path: string[]; itemType: VEntry['type']; appId: 'files' | 'text-viewer' }
  | { type: 'application'; label: string; appId: string }

export type SurfaceTab = {
  id: string
  target: TabTarget
  history: TabTarget[]
  future: TabTarget[]
}

export type SurfaceState = {
  windowId: string
  tabs: SurfaceTab[]
  activeTabId: string
  selectedTabIds: string[]
  selectionAnchorTabId: string | null
}

type EditorSession = {
  id: string
  path: string[]
}

export type SurfaceTabRuntime = {
  editorSessions: EditorSession[]
  editorDrafts: Record<string, string>
  nextEditorSessionId: number
  filesSession?: FilesSessionState
}

type ExternalDropTarget = { windowId: string; insertionIndex: number }

type Props = {
  surface: SurfaceState
  apps: AppDescriptor[]
  vfs: VEntry
  items: SurfaceResult[]
  recent: SurfaceResult[]
  maxRecent: number
  active: boolean
  onExecute: (tabId: string, result: SurfaceResult, mode: 'current' | 'background-tab') => void
  onOpenItem: (tabId: string, path: string[], item: VEntry) => void
  onCreateTextFile: (directoryPath: string[], fileName: string) => void
  onCreateFolder: (directoryPath: string[], folderName: string) => void
  onRenameItem: (path: string[], newName: string) => string | null
  onDeleteItem: (path: string[]) => boolean
  pathMigration: { id: number; oldPath: string[]; newPath: string[] } | null
  onSaveItem: (path: string[], content: string) => void
  onDirectoryChange: (tabId: string, path: string[]) => void
  onAddTab: () => void
  onSelectTab: (tabId: string, mode: 'normal' | 'toggle' | 'range') => void
  onCloseTab: (tabId: string) => void
  onReorderTabs: (tabIds: string[], insertionIndex: number) => void
  onTransferTabs: (tabIds: string[], grabbedTabId: string, targetWindowId: string, insertionIndex: number) => void
  onFindExternalDropTarget: (clientX: number, clientY: number) => ExternalDropTarget | null
  onDragEnd: () => void
  registerTabStrip: (element: HTMLDivElement | null) => void
  externalDropInsertionIndex: number | null
  getTabRuntime: (tabId: string) => SurfaceTabRuntime
  onBack: (tabId: string) => void
}

function tabLabel(tab: SurfaceTab, dirty = false){
  const label = tab.target.type === 'empty' ? 'New Tab' : tab.target.label
  return dirty ? `${label}*` : label
}

function pathsMatch(a: string[], b: string[]){
  return a.length === b.length && a.every((part, index)=>part === b[index])
}

function migrateSessionPath(path: string[], migration: NonNullable<Props['pathMigration']>){
  return path.length >= migration.oldPath.length && migration.oldPath.every((part, index)=>path[index] === part)
    ? [...migration.newPath, ...path.slice(migration.oldPath.length)]
    : path
}

export default function SurfaceWorkspace({ surface, apps, vfs, items, recent, maxRecent, active: surfaceActive, onExecute, onOpenItem, onCreateTextFile, onCreateFolder, onRenameItem, onDeleteItem, pathMigration, onSaveItem, onDirectoryChange, onAddTab, onSelectTab, onCloseTab, onReorderTabs, onTransferTabs, onFindExternalDropTarget, onDragEnd, registerTabStrip, externalDropInsertionIndex, getTabRuntime, onBack }: Props){
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, { path: string; dirty: boolean }>>({})
  const [renamingTab, setRenamingTab] = useState<{ tabId: string; originalName: string; draft: string } | null>(null)
  const [tabDrag, setTabDrag] = useState<{ tabIds: string[]; insertionIndex: number } | null>(null)
  const tabStripRef = useRef<HTMLDivElement | null>(null)
  const tabElementsRef = useRef(new Map<string, HTMLDivElement>())
  const dragCleanupRef = useRef<(()=>void) | null>(null)
  const suppressClickTabRef = useRef<string | null>(null)
  const tabRenameInputRef = useRef<HTMLInputElement | null>(null)
  const tabRenameCancelledRef = useRef(false)
  const appliedPathMigrationRef = useRef<number | null>(null)

  if(pathMigration && appliedPathMigrationRef.current !== pathMigration.id){
    for(const tab of surface.tabs){
      const runtime = getTabRuntime(tab.id)
      const migratedDrafts: Record<string, string> = {}
      for(const [path, draft] of Object.entries(runtime.editorDrafts)){
        migratedDrafts[migrateSessionPath(path.split('/').filter(Boolean), pathMigration).join('/')] = draft
      }
      runtime.editorDrafts = migratedDrafts
      runtime.editorSessions = runtime.editorSessions.map(session=>({
        ...session,
        path: migrateSessionPath(session.path, pathMigration),
      }))
    }
    appliedPathMigrationRef.current = pathMigration.id
  }

  for(const tab of surface.tabs){
    if(tab.target.type !== 'item' || tab.target.appId !== 'text-viewer') continue
    const targetPath = tab.target.path
    const runtime = getTabRuntime(tab.id)
    const sessions = runtime.editorSessions
    if(!sessions.some(session=>pathsMatch(session.path, targetPath))){
      runtime.editorSessions = [
        ...sessions,
        { id: `${tab.id}-editor-session-${runtime.nextEditorSessionId++}`, path: targetPath },
      ]
    }
  }

  useEffect(()=>()=>dragCleanupRef.current?.(),[])

  useEffect(()=>{
    if(tabDrag && tabDrag.tabIds.some(tabId=>!surface.tabs.some(tab=>tab.id === tabId))){
      dragCleanupRef.current?.()
      setTabDrag(null)
    }
  },[surface.tabs, tabDrag?.tabIds])

  useEffect(()=>{
    if(!renamingTab) return
    const input = tabRenameInputRef.current
    input?.focus()
    input?.setSelectionRange(0, getRenameSelectionEnd(renamingTab.originalName, 'file'))
  },[renamingTab?.tabId])

  function setTabDirty(tabId: string, path: string, dirty: boolean){
    setDirtyTabs(current=>current[tabId]?.path === path && current[tabId].dirty === dirty
      ? current
      : { ...current, [tabId]: { path, dirty } }
    )
  }

  function startTabRename(tab: SurfaceTab, event: React.MouseEvent){
    if(tab.target.type !== 'item' || tab.target.itemType !== 'file' || tab.target.appId !== 'text-viewer') return
    event.preventDefault()
    event.stopPropagation()
    setRenamingTab({ tabId: tab.id, originalName: tab.target.label, draft: tab.target.label })
  }

  function finishTabRename(){
    if(!renamingTab) return
    if(tabRenameCancelledRef.current){
      tabRenameCancelledRef.current = false
      setRenamingTab(null)
      return
    }

    const tab = surface.tabs.find(candidate=>candidate.id === renamingTab.tabId)
    if(tab?.target.type !== 'item' || tab.target.itemType !== 'file'){
      setRenamingTab(null)
      return
    }
    const parent = findEntry(tab.target.path.slice(0, -1), vfs)
    const siblingNames = parent?.type === 'dir' ? (parent.children ?? []).map(entry=>entry.name) : []
    const finalCandidate = getExistingRenameCandidate(renamingTab.draft, siblingNames, tab.target.label)
    onRenameItem(tab.target.path, finalCandidate)
    setRenamingTab(null)
  }

  function startTabDrag(tabId: string, event: React.PointerEvent<HTMLDivElement>){
    if(event.button !== 0 || renamingTab?.tabId === tabId) return
    if((event.target as Element).closest('button, input')) return
    suppressClickTabRef.current = null

    const pointerId = event.pointerId
    const startX = event.clientX
    const startY = event.clientY
    const selectedIds = new Set(surface.selectedTabIds)
    const draggedTabIds = selectedIds.has(tabId)
      ? surface.tabs.filter(tab=>selectedIds.has(tab.id)).map(tab=>tab.id)
      : [tabId]
    let dragging = false
    let insertionIndex: number | null = null
    let externalTarget: ExternalDropTarget | null = null
    let ghost: HTMLElement | null = null
    let grabOffsetX = 0
    let grabOffsetY = 0

    function moveGhost(clientX: number, clientY: number){
      if(!ghost) return
      ghost.style.transform = `translate3d(${clientX - grabOffsetX}px, ${clientY - grabOffsetY}px, 0)`
    }

    function createGhost(clientX: number, clientY: number){
      const source = tabElementsRef.current.get(tabId)
      if(!source) return
      const rect = source.getBoundingClientRect()
      const ghostTabs = draggedTabIds.map(id=>tabElementsRef.current.get(id)).filter((tab): tab is HTMLDivElement=>Boolean(tab))
      const draggedIndex = draggedTabIds.indexOf(tabId)
      grabOffsetX = ghostTabs.slice(0, draggedIndex).reduce((width, tab)=>width + tab.getBoundingClientRect().width + 4, 0) + startX - rect.left
      grabOffsetY = startY - rect.top
      ghost = document.createElement('div')
      ghost.classList.add('surface-tab-drag-ghost')
      ghost.setAttribute('aria-hidden', 'true')
      ghost.style.height = `${rect.height}px`
      for(const tab of ghostTabs){
        const clone = tab.cloneNode(true) as HTMLElement
        clone.classList.remove('dragging', 'drop-before', 'drop-after')
        clone.style.width = `${tab.getBoundingClientRect().width}px`
        clone.style.height = `${rect.height}px`
        clone.querySelectorAll<HTMLElement>('button, input').forEach(element=>element.tabIndex = -1)
        ghost.appendChild(clone)
      }
      document.body.appendChild(ghost)
      moveGhost(clientX, clientY)
    }

    function cleanup(){
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerCancel)
      document.body.style.userSelect = ''
      ghost?.remove()
      ghost = null
      dragCleanupRef.current = null
      onDragEnd()
    }

    function finish(commit: boolean){
      cleanup()
      setTabDrag(null)
      if(!dragging) return
      suppressClickTabRef.current = tabId
      if(!commit) return
      if(externalTarget) onTransferTabs(draggedTabIds, tabId, externalTarget.windowId, externalTarget.insertionIndex)
      else if(insertionIndex !== null) onReorderTabs(draggedTabIds, insertionIndex)
    }

    function onPointerMove(moveEvent: PointerEvent){
      if(moveEvent.pointerId !== pointerId) return
      if(!dragging){
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
        if(distance < 5) return
        dragging = true
        document.body.style.userSelect = 'none'
        createGhost(moveEvent.clientX, moveEvent.clientY)
      }

      moveGhost(moveEvent.clientX, moveEvent.clientY)

      const strip = tabStripRef.current
      if(!strip) return
      const stripRect = strip.getBoundingClientRect()
      const insideStrip = moveEvent.clientX >= stripRect.left && moveEvent.clientX <= stripRect.right
        && moveEvent.clientY >= stripRect.top && moveEvent.clientY <= stripRect.bottom
      if(!insideStrip){
        insertionIndex = null
        externalTarget = onFindExternalDropTarget(moveEvent.clientX, moveEvent.clientY)
        setTabDrag({ tabIds: draggedTabIds, insertionIndex: -1 })
        return
      }

      externalTarget = null
      onFindExternalDropTarget(-1, -1)
      const draggedIds = new Set(draggedTabIds)
      const otherTabs = surface.tabs.filter(tab=>!draggedIds.has(tab.id))
      insertionIndex = otherTabs.reduce((index, tab)=>{
        const rect = tabElementsRef.current.get(tab.id)?.getBoundingClientRect()
        return rect && moveEvent.clientX > rect.left + rect.width / 2 ? index + 1 : index
      }, 0)
      setTabDrag({ tabIds: draggedTabIds, insertionIndex })
    }

    function onPointerUp(upEvent: PointerEvent){
      if(upEvent.pointerId === pointerId) finish(true)
    }

    function onPointerCancel(cancelEvent: PointerEvent){
      if(cancelEvent.pointerId === pointerId) finish(false)
    }

    dragCleanupRef.current?.()
    dragCleanupRef.current = cleanup
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerCancel)
  }

  function activateTab(tabId: string, event: React.MouseEvent<HTMLDivElement>){
    if(suppressClickTabRef.current === tabId){
      suppressClickTabRef.current = null
      return
    }
    onSelectTab(tabId, event.shiftKey ? 'range' : event.ctrlKey ? 'toggle' : 'normal')
  }

  function closeTabWithMiddleClick(tabId: string, event: React.MouseEvent<HTMLDivElement>){
    if(event.button !== 1 || renamingTab?.tabId === tabId) return
    if((event.target as Element).closest('button, input')) return
    event.preventDefault()
    event.stopPropagation()
    onCloseTab(tabId)
  }

  const draggedIds = new Set(tabDrag?.tabIds ?? [])
  const remainingTabs = surface.tabs.filter(tab=>!draggedIds.has(tab.id))
  const shownInsertionIndex = externalDropInsertionIndex ?? tabDrag?.insertionIndex ?? -1
  const indicatorTabs = externalDropInsertionIndex === null ? remainingTabs : surface.tabs
  const dropBeforeTabId = shownInsertionIndex >= 0 && shownInsertionIndex < indicatorTabs.length
    ? indicatorTabs[shownInsertionIndex].id
    : null
  const dropAfterTabId = shownInsertionIndex === indicatorTabs.length && indicatorTabs.length > 0
    ? indicatorTabs[indicatorTabs.length - 1].id
    : null

  return (
    <div className="surface-workspace">
      <div ref={element=>{ tabStripRef.current = element; registerTabStrip(element) }} className="surface-tabs" role="tablist" aria-label="Surface tabs">
        {surface.tabs.map(tab=>{
          const active = tab.id === surface.activeTabId
          const selected = surface.selectedTabIds.includes(tab.id)
          const path = tab.target.type === 'item' ? tab.target.path.join('/') : null
          const dirty = path !== null && dirtyTabs[tab.id]?.path === path && dirtyTabs[tab.id].dirty
          const label = tabLabel(tab, dirty)
          const renamable = tab.target.type === 'item' && tab.target.itemType === 'file' && tab.target.appId === 'text-viewer'
          const tabClasses = ['surface-tab']
          if(active) tabClasses.push('active')
          if(selected) tabClasses.push('selected')
          if(tabDrag?.tabIds.includes(tab.id)) tabClasses.push('dragging')
          if(dropBeforeTabId === tab.id) tabClasses.push('drop-before')
          if(dropAfterTabId === tab.id) tabClasses.push('drop-after')
          return (
            <div
              key={tab.id}
              ref={element=>{ if(element) tabElementsRef.current.set(tab.id, element); else tabElementsRef.current.delete(tab.id) }}
              className={tabClasses.join(' ')}
              data-surface-tab-id={tab.id}
              role="tab"
              aria-selected={active}
              onPointerDown={event=>startTabDrag(tab.id, event)}
              onMouseDown={event=>{ if(event.button === 1) event.preventDefault() }}
              onAuxClick={event=>closeTabWithMiddleClick(tab.id, event)}
              onClick={event=>activateTab(tab.id, event)}
            >
              <div className="surface-tab-label-slot" onDoubleClick={renamable ? event=>startTabRename(tab, event) : undefined}>
                {renamingTab?.tabId === tab.id ? (
                  <input
                    ref={tabRenameInputRef}
                    className="surface-tab-rename"
                    aria-label={`Rename ${tab.target.type === 'empty' ? 'Tab' : tab.target.label}`}
                    value={renamingTab.draft}
                    onMouseDown={event=>event.stopPropagation()}
                    onPointerDown={event=>event.stopPropagation()}
                    onAuxClick={event=>event.stopPropagation()}
                    onClick={event=>event.stopPropagation()}
                    onDoubleClick={event=>event.stopPropagation()}
                    onChange={event=>setRenamingTab(current=>current ? { ...current, draft: event.target.value } : current)}
                    onKeyDown={event=>{
                      event.stopPropagation()
                      if(event.key === 'Enter') event.currentTarget.blur()
                      if(event.key === 'Escape'){
                        tabRenameCancelledRef.current = true
                        event.currentTarget.blur()
                      }
                    }}
                    onBlur={finishTabRename}
                  />
                ) : (
                  <span className="surface-tab-label">{label}</span>
                )}
              </div>
              <button className="surface-tab-close" aria-label={`Close ${label}`} onPointerDown={event=>event.stopPropagation()} onAuxClick={event=>event.stopPropagation()} onClick={event=>{ event.stopPropagation(); onCloseTab(tab.id) }}>×</button>
            </div>
          )
        })}
        <button className="button surface-add-tab" aria-label="New Tab" title="New Tab" onClick={onAddTab}>＋</button>
      </div>
      <div className="surface-tab-content">
        {surface.tabs.map(tab=>{
          const active = tab.id === surface.activeTabId
          const target = tab.target
          const showingFiles = target.type !== 'empty' && target.appId === 'files'
          const filesTarget = showingFiles
            ? target
            : [...tab.history, ...tab.future].reverse().find(candidate=>candidate.type !== 'empty' && candidate.appId === 'files')
          const FilesComp = filesTarget ? findApp('files')?.component : undefined
          const TextComp = findApp('text-viewer')?.component
          const runtime = getTabRuntime(tab.id)
          const editorSessions = runtime.editorSessions
          const showingEditorPath = target.type === 'item' && target.appId === 'text-viewer' ? target.path : null
          let content: React.ReactNode

          if(target.type === 'empty'){
            content = <UniversalSurface apps={apps} items={items} recent={recent} maxRecent={maxRecent} active={active} onExecute={(result, mode = 'current')=>onExecute(tab.id, result, mode)} />
          } else if(showingFiles){
            content = FilesComp ? null : <p>Target is unavailable.</p>
          } else {
            const app = findApp(target.appId)
            const Comp = app?.component
            if(!Comp){
              content = <p>Target is unavailable.</p>
            } else if(target.appId === 'text-viewer' && target.type === 'item'){
              content = TextComp ? null : <p>Target is unavailable.</p>
            } else {
              content = <Comp />
            }
          }

          const filesInitialPath = filesTarget?.type === 'item' ? filesTarget.path : []
          return (
            <div key={tab.id} className="surface-tab-panel" role="tabpanel" hidden={!active}>
              {FilesComp && filesTarget && (
                <div className="surface-target-panel" hidden={!showingFiles}>
                  <FilesComp vfs={vfs} initialPath={filesInitialPath} initialSession={runtime.filesSession} onSessionChange={(session: FilesSessionState)=>{ runtime.filesSession = session }} active={surfaceActive && active && showingFiles} onOpenItem={(path: string[], item: VEntry)=>onOpenItem(tab.id, path, item)} onCreateTextFile={onCreateTextFile} onCreateFolder={onCreateFolder} onRenameItem={onRenameItem} onDeleteItem={onDeleteItem} pathMigration={pathMigration} onPathChange={(path: string[])=>{ if(showingFiles) onDirectoryChange(tab.id, path) }} />
                </div>
              )}
              {TextComp && editorSessions.map(session=>{
                const showingEditor = !!showingEditorPath && pathsMatch(session.path, showingEditorPath)
                const path = session.path.join('/')
                return (
                  <div key={session.id} className="surface-target-panel" hidden={!showingEditor}>
                    <TextComp
                      vfs={vfs}
                      initialItemPath={session.path}
                      pathMigration={pathMigration}
                      active={surfaceActive && active && showingEditor}
                      initialDraft={runtime.editorDrafts[path]}
                      onDraftChange={(draft: string)=>{ runtime.editorDrafts[path] = draft }}
                      onSave={onSaveItem}
                      onBack={showingEditor && tab.history.length > 0 ? ()=>onBack(tab.id) : undefined}
                      onDirtyChange={(dirty: boolean)=>{
                        if(showingEditor) setTabDirty(tab.id, path, dirty)
                      }}
                    />
                  </div>
                )
              })}
              {!showingFiles && !showingEditorPath && <div className="surface-target-panel">{content}</div>}
              {showingEditorPath && !TextComp && <div className="surface-target-panel">{content}</div>}
              {showingFiles && !FilesComp && <div className="surface-target-panel">{content}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
