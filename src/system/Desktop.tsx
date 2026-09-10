import React, { useMemo, useRef, useEffect, useState } from 'react'
import useWindowManager from './WindowManager'
import Window from './Window'
import Taskbar from './Taskbar'
import { WindowManagerProvider } from './WindowManagerContext'
import { getApps, findApp } from '../apps/registry'
import { getInitialVfs, updateFileContent, VEntry } from '../vfs/vfs'
import { type SurfaceResult } from './UniversalSurface'
import SurfaceWorkspace, { type SurfaceState, type SurfaceTab, type TabTarget } from './SurfaceWorkspace'

type RecentItem = Extract<SurfaceResult, { type: 'Item' }>

const MAX_RECENT_ITEMS = 5
let nextTabId = 1

function createEmptyTab(): SurfaceTab{
  return { id: `tab-${nextTabId++}`, target: { type: 'empty' } }
}

export default function Desktop(){
  const wm = useWindowManager()
  const apps = getApps()
  const [surfaces, setSurfaces] = useState<SurfaceState[]>([])
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [vfs, setVfs] = useState(getInitialVfs)

  function openSurface(){
    const windowId = wm.openGeneric('Surface')
    const tab = createEmptyTab()
    setSurfaces(current=>[...current, { windowId, tabs: [tab], activeTabId: tab.id }])
  }

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
    const recentItem: RecentItem = {
      type: 'Item',
      label: item.name,
      path: path.join('/'),
      itemType: item.type,
    }
    setRecentItems(items=> [
      recentItem,
      ...items.filter(existing=> existing.path !== recentItem.path),
    ].slice(0, MAX_RECENT_ITEMS))
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
    if(item.type === 'dir') return { type: 'item', label: item.name, path, itemType: item.type, appId: 'files' }
    if(item.name.toLowerCase().endsWith('.txt')) return { type: 'item', label: item.name, path, itemType: item.type, appId: 'text-viewer' }
    return null
  }

  function replaceTabTarget(windowId: string, tabId: string, target: TabTarget){
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: surface.tabs.map(tab=>tab.id === tabId ? { ...tab, target } : tab) }
      : surface
    ))
  }

  function addTargetTab(windowId: string, target: TabTarget, activate = false){
    const tab: SurfaceTab = { id: `tab-${nextTabId++}`, target }
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: [...surface.tabs, tab], activeTabId: activate ? tab.id : surface.activeTabId }
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
          const existingTab = surface?.tabs.find(tab=>
            tab.target.type === 'item' &&
            tab.target.path.length === path.length &&
            tab.target.path.every((part, index)=>part === path[index])
          )
          if(existingTab) activateTab(windowId, existingTab.id)
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

  function addTab(windowId: string){
    const tab = createEmptyTab()
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId
      ? { ...surface, tabs: [...surface.tabs, tab], activeTabId: tab.id }
      : surface
    ))
  }

  function activateTab(windowId: string, tabId: string){
    setSurfaces(current=>current.map(surface=>surface.windowId === windowId ? { ...surface, activeTabId: tabId } : surface))
  }

  function closeTab(windowId: string, tabId: string){
    setSurfaces(current=>current.map(surface=>{
      if(surface.windowId !== windowId) return surface
      const closingIndex = surface.tabs.findIndex(tab=>tab.id === tabId)
      const remaining = surface.tabs.filter(tab=>tab.id !== tabId)
      if(remaining.length === 0){
        const emptyTab = createEmptyTab()
        return { ...surface, tabs: [emptyTab], activeTabId: emptyTab.id }
      }
      if(surface.activeTabId !== tabId) return { ...surface, tabs: remaining }
      const nextActive = remaining[Math.min(closingIndex, remaining.length - 1)]
      return { ...surface, tabs: remaining, activeTabId: nextActive.id }
    }))
  }

  function updateDirectoryTarget(windowId: string, tabId: string, path: string[]){
    const label = path.length === 0 ? 'Files' : path[path.length - 1]
    const target: TabTarget = path.length === 0
      ? { type: 'application', label, appId: 'files' }
      : { type: 'item', label, path, itemType: 'dir', appId: 'files' }
    replaceTabTarget(windowId, tabId, target)
  }

  function closeWindow(id: string){
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
            const appProps = w.appId === 'files'
              ? { vfs, initialPath: w.initialPath, onOpenItem: executeItem, windowId: w.id, onTitleChange: wm.setTitle }
              : w.appId === 'text-viewer'
                ? { vfs, initialItemPath: w.initialItemPath, onSave: saveFile }
                : undefined
            return (
              <Window key={w.id} state={w} onClose={closeWindow} onFocus={wm.focus} onMove={wm.setPos} onResize={wm.setSize} onMinimize={wm.toggleMinimize} onMaximize={wm.toggleMaximize}>
                {surface
                  ? <SurfaceWorkspace
                      surface={surface}
                      apps={apps}
                      vfs={vfs}
                      items={surfaceItems}
                      recent={recentItems}
                      onExecute={(tabId, result, mode)=>executeSurfaceResult(w.id, tabId, result, mode)}
                      onOpenItem={(tabId, path, item)=>executeItemInTab(w.id, tabId, path, item)}
                      onSaveItem={saveFile}
                      onDirectoryChange={(tabId, path)=>updateDirectoryTarget(w.id, tabId, path)}
                      onAddTab={()=>addTab(w.id)}
                      onActivateTab={tabId=>activateTab(w.id, tabId)}
                      onCloseTab={tabId=>closeTab(w.id, tabId)}
                    />
                  : Comp ? <Comp {...appProps} /> : <div className="generic-workspace"><p>What do you want to do?</p></div>}
              </Window>
            )
          })}
        </div>

        <div className="system-bar">
          <div style={{display:'flex',alignItems:'center'}}>
            {/* Taskbar */}
            <Taskbar apps={apps} wm={{...wm, close: closeWindow}} showApplicationLaunchers={false} />
            <button className="button" onClick={openSurface} title="Open Surface">＋ Surface</button>
          </div>
          <div style={{flex:1}} />
          <div style={{color:'var(--muted)'}}>Echo OS</div>
        </div>
      </div>
    </WindowManagerProvider>
  )
}
