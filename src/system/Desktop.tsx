import React, { useMemo, useRef, useEffect, useState } from 'react'
import useWindowManager from './WindowManager'
import Window from './Window'
import Taskbar from './Taskbar'
import { WindowManagerProvider } from './WindowManagerContext'
import { getApps, findApp } from '../apps/registry'
import { createFolder, createTextFile, deleteEntry, findEntry, getInitialVfs, renameEntry, updateFileContent, VEntry } from '../vfs/vfs'
import { type SurfaceResult } from './UniversalSurface'
import SurfaceWorkspace, { type SurfaceState, type SurfaceTab, type SurfaceTabRuntime, type TabTarget } from './SurfaceWorkspace'

type RecentTarget = Extract<SurfaceResult, { type: 'Item' | 'Application' }>

const MAX_RECENT_TARGETS = 5
let nextTabId = 1

function createEmptyTab(): SurfaceTab{
  return { id: `tab-${nextTabId++}`, target: { type: 'empty' }, history: [], future: [] }
}

function removeTabsFromSurface(surface: SurfaceState, movingIds: Set<string>){
  const firstMovingIndex = surface.tabs.findIndex(tab=>movingIds.has(tab.id))
  const tabs = surface.tabs.filter(tab=>!movingIds.has(tab.id))
  if(tabs.length === 0) return null
  return {
    ...surface,
    tabs,
    activeTabId: movingIds.has(surface.activeTabId)
      ? tabs[Math.min(Math.max(firstMovingIndex, 0), tabs.length - 1)].id
      : surface.activeTabId,
    selectedTabIds: surface.selectedTabIds.filter(id=>!movingIds.has(id)),
    selectionAnchorTabId: surface.selectionAnchorTabId && movingIds.has(surface.selectionAnchorTabId) ? null : surface.selectionAnchorTabId,
  }
}

function targetsMatch(a: TabTarget, b: TabTarget){
  if(a.type !== b.type) return false
  if(a.type === 'empty' || b.type === 'empty') return true
  if(a.type === 'application' || b.type === 'application') return a.type === 'application' && b.type === 'application' && a.appId === b.appId
  return a.path.length === b.path.length && a.path.every((part, index)=>part === b.path[index])
}

function recentTargetsMatch(a: RecentTarget, b: RecentTarget){
  if(a.type !== b.type) return false
  return a.type === 'Item' && b.type === 'Item'
    ? a.path === b.path
    : a.type === 'Application' && b.type === 'Application' && a.appId === b.appId
}

function migratePath(path: string[], oldPath: string[], newPath: string[]){
  return path.length >= oldPath.length && oldPath.every((part, index)=>path[index] === part)
    ? [...newPath, ...path.slice(oldPath.length)]
    : path
}

function migrateTabTarget(target: TabTarget, oldPath: string[], newPath: string[]): TabTarget{
  if(target.type !== 'item') return target
  const path = migratePath(target.path, oldPath, newPath)
  if(path === target.path) return target
  return { ...target, path, label: target.path.length === oldPath.length ? newPath[newPath.length - 1] : target.label }
}

function SurfaceTitle({ name, onRename }: { name: string; onRename: (name: string)=>void }){
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(()=>{
    if(!renaming) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [renaming])

  function startRename(event: React.MouseEvent){
    event.preventDefault()
    event.stopPropagation()
    setDraft(name)
    setRenaming(true)
  }

  function commitRename(){
    const nextName = draft.trim()
    if(nextName && nextName !== name) onRename(nextName)
    setRenaming(false)
  }

  if(renaming){
    return (
      <input
        ref={inputRef}
        className="surface-window-title-input"
        data-window-drag="false"
        value={draft}
        aria-label="Surface name"
        onChange={event=>setDraft(event.target.value)}
        onBlur={commitRename}
        onMouseDown={event=>event.stopPropagation()}
        onDoubleClick={event=>event.stopPropagation()}
        onKeyDown={event=>{
          event.stopPropagation()
          if(event.key === 'Enter'){
            event.preventDefault()
            event.currentTarget.blur()
          } else if(event.key === 'Escape'){
            event.preventDefault()
            setDraft(name)
            setRenaming(false)
          }
        }}
      />
    )
  }

  return (
    <span
      className="surface-window-title"
      data-window-drag="false"
      onDoubleClick={startRename}
    >
      {name}
    </span>
  )
}

export default function Desktop(){
  const wm = useWindowManager()
  const apps = getApps()
  const initialSurfaceOpenedRef = useRef(false)
  const [surfaces, setSurfaces] = useState<SurfaceState[]>([])
  const [recentTargets, setRecentTargets] = useState<RecentTarget[]>([])
  const [vfs, setVfs] = useState(getInitialVfs)
  const [pathMigration, setPathMigration] = useState<{ id: number; oldPath: string[]; newPath: string[] } | null>(null)
  const tabRuntimeRef = useRef(new Map<string, SurfaceTabRuntime>())
  const tabStripRefs = useRef(new Map<string, HTMLDivElement>())
  const [externalTabDrop, setExternalTabDrop] = useState<{ windowId: string; insertionIndex: number } | null>(null)

  function getTabRuntime(tabId: string){
    let runtime = tabRuntimeRef.current.get(tabId)
    if(!runtime){
      runtime = { editorSessions: [], editorDrafts: {}, nextEditorSessionId: 1 }
      tabRuntimeRef.current.set(tabId, runtime)
    }
    return runtime
  }

  function createSurfaceWindow(position?: { clientX: number; clientY: number }){
    const width = 520
    const height = 400
    const taskbarHeight = 48
    const windowId = wm.openGeneric('Surface', { minH: 160 })
    wm.setSize(windowId, width, height)
    const x = position ? position.clientX - 80 : (window.innerWidth - width) / 2
    const y = position ? position.clientY - 56 : (window.innerHeight - taskbarHeight - height) / 2
    wm.setPos(
      windowId,
      Math.max(0, Math.min(Math.round(x), window.innerWidth - width)),
      Math.max(0, Math.min(Math.round(y), window.innerHeight - taskbarHeight - height)),
    )
    return windowId
  }

  function openSurface(){
    const windowId = createSurfaceWindow()
    const tab = createEmptyTab()
    setSurfaces(current=>[...current, { windowId, tabs: [tab], activeTabId: tab.id, selectedTabIds: [], selectionAnchorTabId: null }])
  }

  useEffect(()=>{
    if(initialSurfaceOpenedRef.current) return
    initialSurfaceOpenedRef.current = true
    openSurface()
  },[])

  const wallpaperRef = useRef<HTMLDivElement | null>(null)

  useEffect(()=>{
    // ensure any userSelect override is cleared if component unmounts
    return ()=>{ document.body.style.userSelect = '' }
  },[])

  function onDesktopPointerDown(e: React.PointerEvent){
    // prevent underlying window content from receiving pointer events during desktop drag
    e.stopPropagation()
    // only react to primary button
    if((e as any).button !== 0) return
    const el = e.currentTarget as Element
    try{ el.setPointerCapture(e.pointerId) }catch{}
    // prevent text selection while dragging the desktop
    document.body.style.userSelect = 'none'

    function onPointerUp(ev: PointerEvent){
      document.body.style.userSelect = ''
      try{ (el as any).releasePointerCapture((ev as any).pointerId) }catch{}
      document.removeEventListener('pointerup', onPointerUp)
    }

    document.addEventListener('pointerup', onPointerUp)
  }

  function collectItems(entry: VEntry, parentPath = ''): SurfaceResult[]{
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name
    const result: SurfaceResult[] = entry.name === '/' ? [] : [{
      type: 'Item',
      label: entry.name,
      path,
      itemType: entry.type,
    }]
    return entry.type === 'dir'
      ? [...result, ...(entry.children ?? []).flatMap(child=>collectItems(child, path))]
      : result
  }

  const surfaceItems = useMemo(()=>collectItems(vfs), [vfs])

  function recordRecentItem(path: string[], item: Pick<VEntry, 'name' | 'type'>){
    recordRecentTarget({
      type: 'Item',
      label: item.name,
      path: path.join('/'),
      itemType: item.type,
    })
  }

  function recordRecentTarget(target: RecentTarget){
    setRecentTargets(targets=> [
      target,
      ...targets.filter(existing=>!recentTargetsMatch(existing, target)),
    ].slice(0, MAX_RECENT_TARGETS))
  }

  function executeItem(path: string[], item: Pick<VEntry, 'name' | 'type'>){
    if(item.type === 'dir'){
      const windowId = wm.openGeneric()
      wm.attachApplication(windowId, 'files', 'Files', path)
      recordRecentItem(path, item)
      return true
    }
    if(item.name.toLowerCase().endsWith('.txt')){
      const existingWindow = wm.windows.find(window=>
        window.appId === 'text-viewer' &&
        window.initialItemPath?.length === path.length &&
        window.initialItemPath.every((part, index)=> part === path[index])
      )
      if(existingWindow){
        if(existingWindow.minimized) wm.toggleMinimize(existingWindow.id)
        wm.focus(existingWindow.id)
        recordRecentItem(path, item)
        return true
      }
      const windowId = wm.openGeneric()
      wm.attachApplication(windowId, 'text-viewer', item.name, undefined, path)
      recordRecentItem(path, item)
      return true
    }
    return false
  }

  function resolveItemTarget(path: string[], item: Pick<VEntry, 'name' | 'type'>): TabTarget | null{
    if(item.type === 'dir') return path.length === 0
      ? { type: 'application', label: 'Home', appId: 'files' }
      : { type: 'item', label: item.name, path, itemType: item.type, appId: 'files' }
    if(item.name.toLowerCase().endsWith('.txt')) return { type: 'item', label: item.name, path, itemType: item.type, appId: 'text-viewer' }
    return null
  }

  function replaceTabTarget(windowId: string, tabId: string, target: TabTarget){
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: surface.tabs.map(tab=>tab.id === tabId && !targetsMatch(tab.target, target)
        ? { ...tab, target, history: [...tab.history, tab.target], future: [] }
        : tab
      ) }
      : surface
    ))
  }

  function syncTabTarget(windowId: string, tabId: string, target: TabTarget){
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: surface.tabs.map(tab=>tab.id === tabId ? { ...tab, target } : tab) }
      : surface
    ))
  }

  function addTargetTab(windowId: string, target: TabTarget, activate = false){
    const tab: SurfaceTab = { id: `tab-${nextTabId++}`, target, history: [], future: [] }
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? {
          ...surface,
          tabs: [...surface.tabs, tab],
          activeTabId: activate ? tab.id : surface.activeTabId,
          selectedTabIds: surface.selectedTabIds,
        }
      : surface
    ))
  }

  function executeSurfaceResult(windowId: string, tabId: string, result: SurfaceResult, mode: 'current' | 'background-tab'){
    if(result.type === 'Item'){
      const path = result.path.split('/').filter(Boolean)
      const target = resolveItemTarget(path, { name: result.label, type: result.itemType })
      if(target){
        if(mode === 'background-tab'){
          addTargetTab(windowId, target)
        } else {
          const surface = surfaces.find(candidate=>candidate.windowId === windowId)
          const existingTab = surface?.tabs.find(tab=>targetsMatch(tab.target, target))
          if(existingTab) selectTab(windowId, existingTab.id, 'normal')
          else replaceTabTarget(windowId, tabId, target)
        }
        recordRecentItem(path, { name: result.label, type: result.itemType })
      }
      return
    }
    if(result.type === 'Application'){
      const target: TabTarget = { type: 'application', label: result.label, appId: result.appId }
      if(mode === 'background-tab') addTargetTab(windowId, target)
      else replaceTabTarget(windowId, tabId, target)
      recordRecentTarget(result)
    }
  }

  function executeItemInTab(windowId: string, tabId: string, path: string[], item: VEntry){
    const target = resolveItemTarget(path, item)
    if(!target) return false
    replaceTabTarget(windowId, tabId, target)
    recordRecentItem(path, item)
    return true
  }

  function saveFile(path: string[], content: string){
    setVfs(current=>updateFileContent(current, path, content))
  }

  function newTextFile(directoryPath: string[], fileName: string){
    setVfs(current=>createTextFile(current, directoryPath, fileName))
  }

  function newFolder(directoryPath: string[], folderName: string){
    setVfs(current=>createFolder(current, directoryPath, folderName))
  }

  function deleteItem(path: string[]){
    const updatedVfs = deleteEntry(vfs, path)
    if(updatedVfs === vfs) return false
    setVfs(updatedVfs)
    setRecentTargets(current=>current.filter(target=>{
      if(target.type !== 'Item') return true
      const targetPath = target.path.split('/').filter(Boolean)
      return !(targetPath.length >= path.length && path.every((part, index)=>targetPath[index] === part))
    }))
    return true
  }

  function renameItem(path: string[], newName: string){
    const updatedVfs = renameEntry(vfs, path, newName)
    if(updatedVfs === vfs) return null

    const requestedName = newName.trim()
    const requestedPath = [...path.slice(0, -1), requestedName]
    const renamedEntry = findEntry(requestedPath, updatedVfs)
    if(!renamedEntry) return null

    const actualName = renamedEntry.name
    const newPath = [...path.slice(0, -1), actualName]
    setVfs(updatedVfs)
    setSurfaces(current=>current.map(surface=>({
      ...surface,
      tabs: surface.tabs.map(tab=>({
        ...tab,
        target: migrateTabTarget(tab.target, path, newPath),
        history: tab.history.map(target=>migrateTabTarget(target, path, newPath)),
        future: tab.future.map(target=>migrateTabTarget(target, path, newPath)),
      })),
    })))
    setRecentTargets(current=>current.map(target=>{
      if(target.type !== 'Item') return target
      const targetPath = target.path.split('/').filter(Boolean)
      const migratedPath = migratePath(targetPath, path, newPath)
      return migratedPath === targetPath ? target : {
        ...target,
        path: migratedPath.join('/'),
        label: targetPath.length === path.length ? actualName : target.label,
      }
    }))
    wm.migrateItemPath(path, newPath)
    setPathMigration(current=>({ id: (current?.id ?? 0) + 1, oldPath: path, newPath }))
    return actualName
  }

  function addTab(windowId: string){
    const tab = createEmptyTab()
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: [...surface.tabs, tab], activeTabId: tab.id }
      : surface
    ))
  }

  function selectTab(windowId: string, tabId: string, mode: 'normal' | 'toggle' | 'range'){
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? mode === 'normal'
        ? { ...surface, activeTabId: tabId, selectedTabIds: [], selectionAnchorTabId: tabId }
        : mode === 'toggle'
          ? {
              ...surface,
              selectedTabIds: surface.selectedTabIds.includes(tabId)
                ? surface.selectedTabIds.filter(id=>id !== tabId)
                : [...surface.selectedTabIds, tabId],
              selectionAnchorTabId: tabId,
            }
          : (()=>{
              const anchorIndex = surface.tabs.findIndex(tab=>tab.id === surface.selectionAnchorTabId)
              const tabIndex = surface.tabs.findIndex(tab=>tab.id === tabId)
              if(anchorIndex === -1 || tabIndex === -1) return { ...surface, selectedTabIds: [tabId], selectionAnchorTabId: tabId }
              const start = Math.min(anchorIndex, tabIndex)
              const end = Math.max(anchorIndex, tabIndex)
              return { ...surface, selectedTabIds: surface.tabs.slice(start, end + 1).map(tab=>tab.id) }
            })()
      : surface
    ))
  }

  function reorderTabs(windowId: string, tabIds: string[], insertionIndex: number){
    setSurfaces(current=>current.map(surface=>{
      if(surface.windowId !== windowId) return surface
      const movingIds = new Set(tabIds)
      const movingTabs = surface.tabs.filter(tab=>movingIds.has(tab.id))
      if(movingTabs.length === 0) return surface
      const remainingTabs = surface.tabs.filter(tab=>!movingIds.has(tab.id))
      const nextIndex = Math.max(0, Math.min(insertionIndex, remainingTabs.length))
      const tabs = [...remainingTabs.slice(0, nextIndex), ...movingTabs, ...remainingTabs.slice(nextIndex)]
      return tabs.every((tab, index)=>tab === surface.tabs[index]) ? surface : { ...surface, tabs }
    }))
  }

  function findTabDropDestination(sourceWindowId: string, clientX: number, clientY: number){
    let result: { windowId: string; insertionIndex: number } | null = null
    const hitElements = clientX >= 0 && clientY >= 0 ? document.elementsFromPoint(clientX, clientY) : []
    for(const [windowId, strip] of tabStripRefs.current){
      if(windowId === sourceWindowId) continue
      if(!hitElements.includes(strip)) continue
      const rect = strip.getBoundingClientRect()
      if(clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue
      const tabs = Array.from(strip.querySelectorAll<HTMLElement>(':scope > [data-surface-tab-id]'))
      const insertionIndex = tabs.reduce((index, tab)=>{
        const tabRect = tab.getBoundingClientRect()
        return clientX > tabRect.left + tabRect.width / 2 ? index + 1 : index
      }, 0)
      result = { windowId, insertionIndex }
      break
    }
    setExternalTabDrop(current=>current?.windowId === result?.windowId && current?.insertionIndex === result?.insertionIndex ? current : result)
    if(result) return { type: 'surface' as const, ...result }
    return hitElements[0] === wallpaperRef.current
      ? { type: 'desktop' as const, clientX, clientY }
      : null
  }

  function transferTabs(sourceWindowId: string, targetWindowId: string, tabIds: string[], grabbedTabId: string, insertionIndex: number){
    if(sourceWindowId === targetWindowId) return
    setSurfaces(current=>{
      const source = current.find(surface=>surface.windowId === sourceWindowId)
      const target = current.find(surface=>surface.windowId === targetWindowId)
      if(!source || !target) return current
      const movingIds = new Set(tabIds)
      const movingTabs = source.tabs.filter(tab=>movingIds.has(tab.id))
      if(movingTabs.length === 0 || !movingIds.has(grabbedTabId)) return current

      const nextIndex = Math.max(0, Math.min(insertionIndex, target.tabs.length))
      const targetTabs = [...target.tabs.slice(0, nextIndex), ...movingTabs, ...target.tabs.slice(nextIndex)]

      return current.flatMap(surface=>{
        if(surface.windowId === sourceWindowId){
          const nextSource = removeTabsFromSurface(surface, movingIds)
          return nextSource ? [nextSource] : []
        }
        if(surface.windowId === targetWindowId) return {
          ...surface,
          tabs: targetTabs,
          activeTabId: grabbedTabId,
          selectedTabIds: movingTabs.map(tab=>tab.id),
          selectionAnchorTabId: grabbedTabId,
        }
        return [surface]
      })
    })
    const source = surfaces.find(surface=>surface.windowId === sourceWindowId)
    if(source && source.tabs.every(tab=>tabIds.includes(tab.id))) closeWindow(sourceWindowId, new Set(tabIds))
    wm.focus(targetWindowId)
  }

  function detachTabs(sourceWindowId: string, tabIds: string[], grabbedTabId: string, clientX: number, clientY: number){
    const source = surfaces.find(surface=>surface.windowId === sourceWindowId)
    if(!source) return
    const movingIds = new Set(tabIds)
    const movingTabs = source.tabs.filter(tab=>movingIds.has(tab.id))
    if(movingTabs.length === 0 || !movingIds.has(grabbedTabId)) return

    const windowId = createSurfaceWindow({ clientX, clientY })
    setSurfaces(current=>[
      ...current.flatMap(surface=>{
        if(surface.windowId !== sourceWindowId) return [surface]
        const nextSource = removeTabsFromSurface(surface, movingIds)
        return nextSource ? [nextSource] : []
      }),
      {
        windowId,
        tabs: movingTabs,
        activeTabId: grabbedTabId,
        selectedTabIds: movingTabs.map(tab=>tab.id),
        selectionAnchorTabId: grabbedTabId,
      },
    ])
    if(source.tabs.every(tab=>movingIds.has(tab.id))) closeWindow(sourceWindowId, movingIds)
    wm.focus(windowId)
  }

  function goBackInTab(windowId: string, tabId: string){
    setSurfaces(current=>current.map(surface=>{
      if(surface.windowId !== windowId) return surface
      return { ...surface, tabs: surface.tabs.map(tab=>{
        if(tab.id !== tabId || tab.history.length === 0) return tab
        return {
          ...tab,
          target: tab.history[tab.history.length - 1],
          history: tab.history.slice(0, -1),
          future: [...tab.future, tab.target],
        }
      }) }
    }))
  }

  function goForwardInTab(windowId: string, tabId: string){
    setSurfaces(current=>current.map(surface=>{
      if(surface.windowId !== windowId) return surface
      return { ...surface, tabs: surface.tabs.map(tab=>{
        if(tab.id !== tabId || tab.future.length === 0) return tab
        return {
          ...tab,
          target: tab.future[tab.future.length - 1],
          history: [...tab.history, tab.target],
          future: tab.future.slice(0, -1),
        }
      }) }
    }))
  }

  function closeTab(windowId: string, tabId: string){
    const surface = surfaces.find(candidate=>candidate.windowId === windowId)
    if(surface?.tabs.length === 1 && surface.tabs[0].id === tabId){
      closeWindow(windowId)
      return
    }
    tabRuntimeRef.current.delete(tabId)
    setSurfaces(current=>current.map(surface=>{
      if(surface.windowId !== windowId) return surface
      const closingIndex = surface.tabs.findIndex(tab=>tab.id === tabId)
      const remaining = surface.tabs.filter(tab=>tab.id !== tabId)
      if(remaining.length === 0) return surface
      const remainingSelected = surface.selectedTabIds.filter(id=>id !== tabId)
      const selectionAnchorTabId = surface.selectionAnchorTabId === tabId ? null : surface.selectionAnchorTabId
      if(surface.activeTabId !== tabId){
        return {
          ...surface,
          tabs: remaining,
          selectedTabIds: remainingSelected,
          selectionAnchorTabId,
        }
      }
      const nextActive = remaining[Math.min(closingIndex, remaining.length - 1)]
      return {
        ...surface,
        tabs: remaining,
        activeTabId: nextActive.id,
        selectedTabIds: remainingSelected,
        selectionAnchorTabId,
      }
    }))
  }

  function updateDirectoryTarget(windowId: string, tabId: string, path: string[]){
    const label = path.length === 0 ? 'Home' : path[path.length - 1]
    const target: TabTarget = path.length === 0
      ? { type: 'application', label, appId: 'files' }
      : { type: 'item', label, path, itemType: 'dir', appId: 'files' }
    syncTabTarget(windowId, tabId, target)
  }

  function closeWindow(id: string, preserveTabIds: ReadonlySet<string> = new Set()){
    const closingSurface = surfaces.find(surface=>surface.windowId === id)
    closingSurface?.tabs.forEach(tab=>{
      if(!preserveTabIds.has(tab.id)) tabRuntimeRef.current.delete(tab.id)
    })
    tabStripRefs.current.delete(id)
    setSurfaces(current=>current.filter(surface=>surface.windowId !== id))
    wm.close(id)
  }

  return (
    <WindowManagerProvider value={wm}>
      <div className="desktop">
        <div ref={wallpaperRef} className="wallpaper" style={{position:'absolute',inset:0,background:'transparent'}} onPointerDown={onDesktopPointerDown} />
        <div className="window-layer">
          {wm.windows.map(w=>{
            const surface = surfaces.find(candidate=>candidate.windowId === w.id)
            const app = w.appId ? findApp(w.appId) : undefined
            const Comp = app?.component
            const activeWindow = !w.minimized && w.z === Math.max(...wm.windows.filter(window=>!window.minimized).map(window=>window.z))
            const appProps = w.appId === 'files'
              ? { vfs, initialPath: w.initialPath, active: activeWindow, onOpenItem: executeItem, onCreateTextFile: newTextFile, onCreateFolder: newFolder, onRenameItem: renameItem, onDeleteItem: deleteItem, pathMigration, windowId: w.id, onTitleChange: wm.setTitle }
              : w.appId === 'text-viewer'
                ? { vfs, initialItemPath: w.initialItemPath, active: activeWindow, onSave: saveFile }
                : undefined
            const activeSurfaceTab = surface?.tabs.find(tab=>tab.id === surface.activeTabId)
            return (
              <Window
                key={w.id}
                state={w}
                onClose={closeWindow}
                onFocus={wm.focus}
                onMove={wm.setPos}
                onResize={wm.setSize}
                onMinimize={wm.toggleMinimize}
                onMaximize={wm.toggleMaximize}
                contentClassName={surface ? 'surface-window-content' : undefined}
                previewable={!!surface}
                titlebarTitle={surface ? (
                  <SurfaceTitle name={w.title} onRename={name=>wm.setTitle(w.id, name)} />
                ) : undefined}
                titlebarLeading={surface ? (
                  <div className="surface-window-navigation" data-window-drag="false">
                    <button
                      className="button surface-window-navigation-button"
                      aria-label="Back in Tab"
                      title="Back in this Tab"
                      disabled={!activeSurfaceTab?.history.length}
                      onClick={()=>goBackInTab(w.id, surface.activeTabId)}
                    >🡄</button>
                    <button
                      className="button surface-window-navigation-button"
                      aria-label="Forward in Tab"
                      title="Forward in this Tab"
                      disabled={!activeSurfaceTab?.future.length}
                      onClick={()=>goForwardInTab(w.id, surface.activeTabId)}
                    >🡆</button>
                  </div>
                ) : undefined}
              >
                {surface
                  ? <SurfaceWorkspace
                      surface={surface}
                      apps={apps}
                      vfs={vfs}
                      items={surfaceItems}
                      recent={recentTargets}
                      maxRecent={MAX_RECENT_TARGETS}
                      active={activeWindow}
                      onExecute={(tabId, result, mode)=>executeSurfaceResult(w.id, tabId, result, mode)}
                      onOpenItem={(tabId, path, item)=>executeItemInTab(w.id, tabId, path, item)}
                      onCreateTextFile={newTextFile}
                      onCreateFolder={newFolder}
                      onRenameItem={renameItem}
                      onDeleteItem={deleteItem}
                      pathMigration={pathMigration}
                      onSaveItem={saveFile}
                      onDirectoryChange={(tabId, path)=>updateDirectoryTarget(w.id, tabId, path)}
                      onAddTab={()=>addTab(w.id)}
                      onSelectTab={(tabId, mode)=>selectTab(w.id, tabId, mode)}
                      onFocusSurface={()=>wm.focus(w.id)}
                      onCloseTab={tabId=>closeTab(w.id, tabId)}
                      onReorderTabs={(tabIds, insertionIndex)=>reorderTabs(w.id, tabIds, insertionIndex)}
                      onTransferTabs={(tabIds, grabbedTabId, targetWindowId, insertionIndex)=>transferTabs(w.id, targetWindowId, tabIds, grabbedTabId, insertionIndex)}
                      onDetachTabs={(tabIds, grabbedTabId, clientX, clientY)=>detachTabs(w.id, tabIds, grabbedTabId, clientX, clientY)}
                      onFindDropDestination={(clientX, clientY)=>findTabDropDestination(w.id, clientX, clientY)}
                      onDragEnd={()=>setExternalTabDrop(null)}
                      registerTabStrip={element=>{
                        if(element) tabStripRefs.current.set(w.id, element)
                        else tabStripRefs.current.delete(w.id)
                      }}
                      externalDropInsertionIndex={externalTabDrop?.windowId === w.id ? externalTabDrop.insertionIndex : null}
                      getTabRuntime={getTabRuntime}
                      onBack={tabId=>goBackInTab(w.id, tabId)}
                    />
                  : Comp ? <Comp {...appProps} /> : <div className="generic-workspace"><p>What do you want to do?</p></div>}
              </Window>
            )
          })}
        </div>

        <div className="system-bar">
          <div style={{display:'flex',alignItems:'center'}}>
            {/* Taskbar */}
            <Taskbar
              apps={apps}
              wm={{...wm, close: closeWindow}}
              showApplicationLaunchers={false}
              surfaceWindowIds={surfaces.map(surface=>surface.windowId)}
            />
            <button className="button" onClick={openSurface} title="Open Surface">＋ Surface</button>
          </div>
          <div style={{flex:1}} />
          <div style={{color:'var(--muted)'}}>Echo OS</div>
        </div>
      </div>
    </WindowManagerProvider>
  )
}
