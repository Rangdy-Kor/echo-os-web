import React, { useMemo, useRef, useEffect, useState } from 'react'
import useWindowManager from './WindowManager'
import Window from './Window'
import Taskbar from './Taskbar'
import { WindowManagerProvider } from './WindowManagerContext'
import { getApps, findApp } from '../apps/registry'
import { getInitialVfs, VEntry } from '../vfs/vfs'
import UniversalSurface, { SurfaceResult } from './UniversalSurface'

type RecentItem = Extract<SurfaceResult, { type: 'Item' }>

const MAX_RECENT_ITEMS = 5

export default function Desktop(){
  const wm = useWindowManager()
  const apps = getApps()
  const [surfaceOpen, setSurfaceOpen] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const vfs = useMemo(getInitialVfs, [])

  function openApp(id:string){
    const app = findApp(id)
    if(app) wm.open(app)
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
      const windowId = wm.openGeneric()
      wm.attachApplication(windowId, 'text-viewer', item.name, undefined, path)
      recordRecentItem(path, item)
      return true
    }
    return false
  }

  function executeSurfaceResult(result: SurfaceResult){
    if(result.type === 'Item'){
      const path = result.path.split('/').filter(Boolean)
      if(executeItem(path, { name: result.label, type: result.itemType })) setSurfaceOpen(false)
      return
    }
    const windowId = wm.openGeneric()
    const title = result.type === 'Action' ? result.label : findApp(result.appId)?.name
    wm.attachApplication(windowId, result.appId, title)
    setSurfaceOpen(false)
  }

  return (
    <WindowManagerProvider value={wm}>
      <div className="desktop">
        <div ref={wallpaperRef} className="wallpaper" style={{position:'absolute',inset:0,background:'transparent'}} onPointerDown={onDesktopPointerDown} />
        <div className="window-layer">
          {wm.windows.map(w=>{
            const app = w.appId ? findApp(w.appId) : undefined
            const Comp = app?.component
            const appProps = w.appId === 'files'
              ? { initialPath: w.initialPath, onOpenItem: executeItem }
              : w.appId === 'text-viewer'
                ? { initialItemPath: w.initialItemPath }
                : undefined
            return (
              <Window key={w.id} state={w} onClose={wm.close} onFocus={wm.focus} onMove={wm.setPos} onResize={wm.setSize} onMinimize={wm.toggleMinimize} onMaximize={wm.toggleMaximize}>
                {Comp ? <Comp {...appProps} /> : <div className="generic-workspace"><p>What do you want to do?</p></div>}
              </Window>
            )
          })}
        </div>

        <div className="system-bar">
          <div style={{display:'flex',alignItems:'center'}}>
            {/* Taskbar */}
            <Taskbar apps={apps} wm={wm} showApplicationLaunchers={false} />
            <button className="button" onClick={()=>setSurfaceOpen(true)} title="Open Surface">＋ Surface</button>
          </div>
          <div style={{flex:1}} />
          <div style={{color:'var(--muted)'}}>Echo OS</div>
        </div>
        {surfaceOpen && (
          <UniversalSurface
            apps={apps}
            items={surfaceItems}
            recent={recentItems}
            onClose={()=>setSurfaceOpen(false)}
            onExecute={executeSurfaceResult}
          />
        )}
      </div>
    </WindowManagerProvider>
  )
}
