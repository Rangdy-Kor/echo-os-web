import React, { useRef, useEffect } from 'react'
import useWindowManager from './WindowManager'
import Window from './Window'
import Taskbar from './Taskbar'
import { getApps, findApp } from '../apps/registry'

export default function Desktop(){
  const wm = useWindowManager()
  const apps = getApps()

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

  return (
    <div className="desktop">
      <div ref={wallpaperRef} className="wallpaper" style={{position:'absolute',inset:0,background:'transparent'}} onPointerDown={onDesktopPointerDown} />
      <div className="window-layer">
        {wm.windows.map(w=>{
          const app = findApp(w.appId)
          const Comp = app?.component
          return (
            <Window key={w.id} state={w} onClose={wm.close} onFocus={wm.focus} onMove={wm.setPos} onResize={wm.setSize} onMinimize={wm.toggleMinimize} onMaximize={wm.toggleMaximize}>
              {Comp ? <Comp /> : <div>App not found</div>}
            </Window>
          )
        })}
      </div>

      <div className="system-bar">
        <div style={{display:'flex',alignItems:'center'}}>
          {/* Taskbar */}
          <Taskbar apps={apps} wm={wm} />
        </div>
        <div style={{flex:1}} />
        <div style={{color:'var(--muted)'}}>Echo OS</div>
      </div>
    </div>
  )
}
