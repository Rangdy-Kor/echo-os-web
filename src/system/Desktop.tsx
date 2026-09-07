import React, { useMemo, useRef, useEffect, useState } from 'react'
import useWindowManager from './WindowManager'
import Window from './Window'
import Taskbar from './Taskbar'
import { WindowManagerProvider } from './WindowManagerContext'
import { getApps, findApp } from '../apps/registry'
import { getInitialVfs, VEntry } from '../vfs/vfs'
import UniversalSurface, { SurfaceResult } from './UniversalSurface'

export default function Desktop(){
  const wm = useWindowManager()
  const apps = getApps()
  const [surfaceOpen, setSurfaceOpen] = useState(false)
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

  function executeSurfaceResult(result: SurfaceResult){
    if(result.type === 'Item'){
      if(result.itemType !== 'dir') return
      const path = result.path.split('/').filter(Boolean)
      const windowId = wm.openGeneric()
      wm.attachApplication(windowId, 'files', 'Files', path)
      setSurfaceOpen(false)
      return
    }
    const windowId = wm.openGeneric()
    wm.attachApplication(windowId, result.appId, result.type === 'Action' ? result.label : undefined)
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
            const appProps = w.appId === 'files' ? { initialPath: w.initialPath } : undefined
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
            recent={[]}
            onClose={()=>setSurfaceOpen(false)}
            onExecute={executeSurfaceResult}
          />
        )}
      </div>
    </WindowManagerProvider>
  )
}
