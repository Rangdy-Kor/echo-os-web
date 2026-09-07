import React, { useEffect, useRef, useState } from 'react'
import type { AppDescriptor } from '../apps/registry'
import type { WindowState } from './WindowManager'

type WM = {
  windows: WindowState[]
  open: (app: AppDescriptor)=>void
  focus: (id:string)=>void
  toggleMinimize: (id:string)=>void
  close: (id:string)=>void
}

export default function Taskbar({ apps, wm, showApplicationLaunchers = true }: { apps: AppDescriptor[], wm: WM, showApplicationLaunchers?: boolean }){
  const { windows } = wm
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menu, setMenu] = useState<{anchorRect: DOMRect, winId:string}|null>(null)
  const [menuPos, setMenuPos] = useState<{left:number,top:number} | null>(null)

  // close on outside click
  useEffect(()=>{
    function onDocClick(){ setMenu(null); setMenuPos(null) }
    document.addEventListener('click', onDocClick)
    return ()=> document.removeEventListener('click', onDocClick)
  },[])

  // close on Escape
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key === 'Escape'){ setMenu(null); setMenuPos(null) } }
    if(menu) document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[menu])

  function topWindowForApp(appId: string){
    const list = windows.filter(w=> w.appId === appId)
    if(list.length===0) return null
    return list.reduce((a,b)=> a.z>b.z? a:b)
  }

  function isFocused(win: WindowState){
    const topZ = windows.length? Math.max(...windows.map(w=>w.z)): -Infinity
    return win.z === topZ
  }

  const genericWindows = windows.filter(w=> !w.appId)
  const taskbarWindows = showApplicationLaunchers ? genericWindows : windows

  // pointer handling to prevent selection and to contain pointer events within taskbar
  useEffect(()=>{
    const el = containerRef.current
    if(!el) return
    function onPointerDown(e: PointerEvent){
      // only primary button
      if(e.button !== 0) return
      e.stopPropagation()
      try{ (e.target as Element).setPointerCapture((e as any).pointerId) }catch{}
      document.body.style.userSelect = 'none'
      function up(ev: PointerEvent){
        document.body.style.userSelect = ''
        try{ (e.target as Element).releasePointerCapture((ev as any).pointerId) }catch{}
        document.removeEventListener('pointerup', up)
      }
      document.addEventListener('pointerup', up)
    }
    el.addEventListener('pointerdown', onPointerDown)
    return ()=> el.removeEventListener('pointerdown', onPointerDown)
  },[])

  // when menu anchor changes, compute a position that keeps menu inside viewport and above the taskbar
  useEffect(()=>{
    if(!menu) return
    const anchor = menu.anchorRect
    const menuEl = menuRef.current
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const menuW = menuEl ? menuEl.offsetWidth : 160
    const menuH = menuEl ? menuEl.offsetHeight : 120

    // prefer above the taskbar: place menu so its bottom is a few px above anchor.top
    const gap = 6
    let left = Math.round(anchor.left + (anchor.width - menuW)/2)
    left = Math.max(4, Math.min(left, viewportW - menuW - 4))

    let top = Math.round(anchor.top - menuH - gap)
    // if not enough space above, try placing above but clamp to 4
    if(top < 4){
      // place it above the bottom (ensure visible) — clamp to 4
      top = Math.max(4, Math.min(anchor.top + gap, viewportH - menuH - 4))
    }

    setMenuPos({ left, top })
  },[menu])

  return (
    <div ref={containerRef} style={{display:'flex',alignItems:'center',gap:8}}>
      {showApplicationLaunchers && apps.map(a=>{
        const top = topWindowForApp(a.id)
        const running = !!top
        const minimized = !!top && top!.minimized
        const focused = !!top && !minimized && isFocused(top!)

        const cls = [ 'task-item' ]
        if(focused) cls.push('focused')
        if(running && !focused && !minimized) cls.push('running')
        if(minimized) cls.push('minimized')

        return (
          <div key={a.id}
            className={cls.join(' ')}
            onClick={(e)=>{
              e.stopPropagation()
              if(!running){ wm.open(a); return }
              // running
              if(minimized){ wm.toggleMinimize(top!.id); wm.focus(top!.id); return }
              wm.focus(top!.id)
            }}
            onContextMenu={(e)=>{
              e.preventDefault(); e.stopPropagation()
              if(!running) return
              const rect = (e.currentTarget as Element).getBoundingClientRect()
              setMenu({ anchorRect: rect, winId: top!.id })
            }}
            title={a.name}
          >
            <span className="app-icon" />
            {/* subtle indicator for running */}
            { running && !focused && !minimized && <span className="running-dot"/> }
          </div>
        )
      })}

      {taskbarWindows.map(win=>{
        const focused = !win.minimized && isFocused(win)
        const cls = ['task-item']
        if(focused) cls.push('focused')
        if(win.minimized) cls.push('minimized')

        return (
          <div
            key={win.id}
            className={cls.join(' ')}
            onClick={(e)=>{
              e.stopPropagation()
              if(win.minimized) wm.toggleMinimize(win.id)
              wm.focus(win.id)
            }}
            onContextMenu={(e)=>{
              e.preventDefault(); e.stopPropagation()
              const rect = (e.currentTarget as Element).getBoundingClientRect()
              setMenu({ anchorRect: rect, winId: win.id })
            }}
            title={win.title}
          >
            <span className="app-icon" />
          </div>
        )
      })}

      {menu && menuPos && (
        <div ref={menuRef} className="task-menu" style={{left:menuPos.left,top:menuPos.top,position:'fixed'}} onClick={(e)=>e.stopPropagation()}>
          {(() => {
            const win = windows.find(w=> w.id===menu.winId)
            if(!win) return null
            return (
              <div>
                {win.minimized ? <div className="task-menu-item" onClick={()=>{ wm.toggleMinimize(win.id); wm.focus(win.id); setMenu(null); setMenuPos(null) }}>Restore</div> : <div className="task-menu-item" onClick={()=>{ wm.toggleMinimize(win.id); setMenu(null); setMenuPos(null) }}>Minimize</div> }
                <div className="task-menu-item" onClick={()=>{ wm.close(win.id); setMenu(null); setMenuPos(null) }}>Close</div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
