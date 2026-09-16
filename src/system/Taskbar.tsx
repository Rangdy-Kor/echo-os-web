import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppDescriptor } from '../apps/registry'
import type { WindowState } from './WindowManager'
import { captureWindowPreview, findWindowElement, getWindowPreview, removeWindowPreview, type WindowPreviewSnapshot } from './windowPreview'

type WM = {
  windows: WindowState[]
  open: (app: AppDescriptor)=>void
  focus: (id:string)=>void
  toggleMinimize: (id:string)=>void
  close: (id:string)=>void
}

type PopupTarget = { anchorRect: DOMRect; winId: string }
type PopupPosition = { left: number; top: number }

function positionAboveAnchor(anchor: DOMRect, popup: HTMLElement): PopupPosition{
  const margin = 4
  const gap = 6
  const bounds = popup.getBoundingClientRect()
  let left = Math.round(anchor.left + (anchor.width - bounds.width) / 2)
  left = Math.max(margin, Math.min(left, window.innerWidth - bounds.width - margin))
  let top = Math.round(anchor.top - bounds.height - gap)
  if(top < margin) top = Math.min(anchor.bottom + gap, window.innerHeight - bounds.height - margin)
  return { left, top: Math.max(margin, top) }
}

function previewSize(snapshot: WindowPreviewSnapshot){
  const scale = Math.min(1, 320 / snapshot.width, 220 / snapshot.height)
  return {
    width: Math.round(snapshot.width * scale),
    height: Math.round(snapshot.height * scale),
  }
}

export default function Taskbar({ apps, wm, showApplicationLaunchers = true, surfaceWindowIds = [] }: {
  apps: AppDescriptor[]
  wm: WM
  showApplicationLaunchers?: boolean
  surfaceWindowIds?: string[]
}){
  const { windows } = wm
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const previewWindowIdRef = useRef<string | null>(null)
  const previewRequestRef = useRef(0)
  const openPreviewTimerRef = useRef<number | null>(null)
  const closePreviewTimerRef = useRef<number | null>(null)
  const [menu, setMenu] = useState<PopupTarget | null>(null)
  const [menuPos, setMenuPos] = useState<PopupPosition | null>(null)
  const [preview, setPreview] = useState<PopupTarget | null>(null)
  const [previewPos, setPreviewPos] = useState<PopupPosition | null>(null)
  const [previewSnapshot, setPreviewSnapshot] = useState<WindowPreviewSnapshot | null>(null)
  const surfaceIds = new Set(surfaceWindowIds)

  function cancelPreviewClose(){
    if(closePreviewTimerRef.current === null) return
    window.clearTimeout(closePreviewTimerRef.current)
    closePreviewTimerRef.current = null
  }

  function cancelPreviewOpen(){
    if(openPreviewTimerRef.current === null) return
    window.clearTimeout(openPreviewTimerRef.current)
    openPreviewTimerRef.current = null
  }

  function closePreview(){
    previewRequestRef.current += 1
    cancelPreviewOpen()
    cancelPreviewClose()
    previewWindowIdRef.current = null
    setPreview(null)
    setPreviewPos(null)
    setPreviewSnapshot(null)
  }

  function schedulePreviewClose(){
    cancelPreviewOpen()
    previewRequestRef.current += 1
    if(previewWindowIdRef.current === null) return
    cancelPreviewClose()
    closePreviewTimerRef.current = window.setTimeout(closePreview, 120)
  }

  useEffect(()=>{
    function onDocClick(){ setMenu(null); setMenuPos(null) }
    document.addEventListener('click', onDocClick)
    return ()=>document.removeEventListener('click', onDocClick)
  },[])

  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if(e.key === 'Escape'){
        setMenu(null)
        setMenuPos(null)
        closePreview()
      }
    }
    if(menu || preview) document.addEventListener('keydown', onKey)
    return ()=>document.removeEventListener('keydown', onKey)
  },[menu, preview])

  useEffect(()=>()=>{
    cancelPreviewOpen()
    cancelPreviewClose()
  },[])

  useLayoutEffect(()=>{
    if(menu && menuRef.current) setMenuPos(positionAboveAnchor(menu.anchorRect, menuRef.current))
  },[menu, windows])

  useLayoutEffect(()=>{
    if(preview && previewRef.current && previewSnapshot){
      setPreviewPos(positionAboveAnchor(preview.anchorRect, previewRef.current))
    }
  },[preview, previewSnapshot, windows])

  function topWindowForApp(appId: string){
    const list = windows.filter(w=>w.appId === appId)
    if(list.length === 0) return null
    return list.reduce((a,b)=>a.z > b.z ? a : b)
  }

  function isFocused(win: WindowState){
    const visibleWindows = windows.filter(candidate=>!candidate.minimized)
    const topZ = visibleWindows.length ? Math.max(...visibleWindows.map(candidate=>candidate.z)) : -Infinity
    return win.z === topZ
  }

  function activateWindow(win: WindowState){
    if(win.minimized) wm.toggleMinimize(win.id)
    wm.focus(win.id)
    closePreview()
  }

  function schedulePreviewOpen(win: WindowState, anchor: Element){
    if(menu || !surfaceIds.has(win.id)) return
    cancelPreviewOpen()
    cancelPreviewClose()
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    const anchorRect = anchor.getBoundingClientRect()
    const snapshotPromise = win.minimized
      ? Promise.resolve(getWindowPreview(win.id))
      : (()=>{
          const element = findWindowElement(win.id)
          return element ? captureWindowPreview(win.id, element) : Promise.resolve(null)
        })()
    openPreviewTimerRef.current = window.setTimeout(async ()=>{
      openPreviewTimerRef.current = null
      const snapshot = await snapshotPromise
      if(!snapshot || requestId !== previewRequestRef.current || menu) return
      previewWindowIdRef.current = win.id
      setPreview({ anchorRect, winId: win.id })
      setPreviewPos(null)
      setPreviewSnapshot(snapshot)
    }, 500)
  }

  function openMenu(win: WindowState, anchor: Element){
    if(menu?.winId === win.id){
      closePreview()
      setMenu(null)
      setMenuPos(null)
      return
    }
    closePreview()
    setMenuPos(null)
    setMenu({ anchorRect: anchor.getBoundingClientRect(), winId: win.id })
  }

  function closeWindow(win: WindowState){
    removeWindowPreview(win.id)
    closePreview()
    setMenu(null)
    setMenuPos(null)
    wm.close(win.id)
  }

  function minimizeWindow(win: WindowState){
    setMenu(null)
    setMenuPos(null)
    const element = surfaceIds.has(win.id) ? findWindowElement(win.id) : null
    if(!element){ wm.toggleMinimize(win.id); return }
    void captureWindowPreview(win.id, element).finally(()=>wm.toggleMinimize(win.id))
  }

  function clickTaskbarWindow(win: WindowState, focused: boolean, isSurface: boolean){
    if(isSurface && focused){
      closePreview()
      minimizeWindow(win)
      return
    }
    activateWindow(win)
  }

  const genericWindows = windows.filter(w=>!w.appId)
  const taskbarWindows = showApplicationLaunchers ? genericWindows : windows

  useEffect(()=>{
    const el = containerRef.current
    if(!el) return
    function onPointerDown(e: PointerEvent){
      if(e.button !== 0) return
      e.stopPropagation()
      try{ (e.target as Element).setPointerCapture(e.pointerId) }catch{}
      document.body.style.userSelect = 'none'
      function up(ev: PointerEvent){
        document.body.style.userSelect = ''
        try{ (e.target as Element).releasePointerCapture(ev.pointerId) }catch{}
        document.removeEventListener('pointerup', up)
      }
      document.addEventListener('pointerup', up)
    }
    el.addEventListener('pointerdown', onPointerDown)
    return ()=>el.removeEventListener('pointerdown', onPointerDown)
  },[])

  return (
    <div ref={containerRef} className="taskbar-items">
      {showApplicationLaunchers && apps.map(app=>{
        const top = topWindowForApp(app.id)
        const running = !!top
        const minimized = !!top?.minimized
        const focused = !!top && !minimized && isFocused(top)
        const cls = ['task-item']
        if(focused) cls.push('focused')
        if(running && !focused && !minimized) cls.push('running')
        if(minimized) cls.push('minimized')
        return (
          <div key={app.id} className={cls.join(' ')}
            onClick={event=>{ event.stopPropagation(); if(!top){ wm.open(app); return }; activateWindow(top) }}
            onContextMenu={event=>{ event.preventDefault(); event.stopPropagation(); if(top) openMenu(top, event.currentTarget) }}
            title={app.name}>
            <span className="app-icon" />
            {running && !focused && !minimized && <span className="running-dot" />}
          </div>
        )
      })}

      {taskbarWindows.map(win=>{
        const focused = !win.minimized && isFocused(win)
        const isSurface = surfaceIds.has(win.id)
        const cls = ['task-item']
        if(focused) cls.push('focused')
        if(win.minimized) cls.push('minimized')
        return (
          <div key={win.id} className={cls.join(' ')}
            onMouseEnter={event=>isSurface && schedulePreviewOpen(win, event.currentTarget)}
            onMouseLeave={isSurface ? schedulePreviewClose : undefined}
            onClick={event=>{ event.stopPropagation(); clickTaskbarWindow(win, focused, isSurface) }}
            onContextMenu={event=>{ event.preventDefault(); event.stopPropagation(); openMenu(win, event.currentTarget) }}
            title={isSurface ? undefined : win.title}>
            <span className="app-icon" />
          </div>
        )
      })}

      {preview && previewSnapshot && (()=>{
        const win = windows.find(candidate=>candidate.id === preview.winId)
        if(!win) return null
        const thumbnail = previewSize(previewSnapshot)
        return (
          <div ref={previewRef} className="surface-task-preview"
            style={{ left:previewPos?.left ?? 0, top:previewPos?.top ?? 0, width:thumbnail.width, visibility:previewPos ? 'visible' : 'hidden' }}
            onMouseEnter={cancelPreviewClose} onMouseLeave={schedulePreviewClose} onClick={event=>event.stopPropagation()}>
            <div className="surface-task-preview-header" onClick={()=>activateWindow(win)}>
              <span className="surface-task-preview-title" title={win.title}>{win.title}</span>
              <button className="button surface-task-preview-close" aria-label={`Close ${win.title}`}
                onClick={event=>{ event.stopPropagation(); closeWindow(win) }}>✕</button>
            </div>
            <button className="surface-task-preview-body" style={{height:thumbnail.height}} onClick={()=>activateWindow(win)}>
              <img src={previewSnapshot.dataUrl} alt={`Preview of ${win.title}`} draggable={false} />
            </button>
          </div>
        )
      })()}

      {menu && (()=>{
        const win = windows.find(candidate=>candidate.id === menu.winId)
        if(!win) return null
        const isSurface = surfaceIds.has(win.id)
        return (
          <div ref={menuRef} className="task-menu"
            style={{ left:menuPos?.left ?? 0, top:menuPos?.top ?? 0, position:'fixed', visibility:menuPos ? 'visible' : 'hidden' }}
            onClick={event=>event.stopPropagation()}>
            {isSurface && <><div className="task-menu-title" title={win.title}>{win.title}</div><div className="task-menu-separator" /></>}
            {win.minimized
              ? <div className="task-menu-item" onClick={()=>{ activateWindow(win); setMenu(null); setMenuPos(null) }}>Restore</div>
              : <div className="task-menu-item" onClick={()=>minimizeWindow(win)}>Minimize</div>}
            <div className="task-menu-item" onClick={()=>closeWindow(win)}>Close</div>
          </div>
        )
      })()}
    </div>
  )
}
