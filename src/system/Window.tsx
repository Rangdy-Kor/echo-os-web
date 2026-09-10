import React, { useRef, useEffect } from 'react'
import type { WindowState } from './WindowManager'

type Props = {
  state: WindowState
  onClose: (id:string)=>void
  onFocus: (id:string)=>void
  onMove: (id:string,x:number,y:number)=>void
  onResize: (id:string,w:number,h:number,x?:number,y?:number)=>void
  onMinimize: (id:string)=>void
  onMaximize: (id:string)=>void
  titlebarLeading?: React.ReactNode
  children?: React.ReactNode
}

export default function Window({ state, onClose, onFocus, onMove, onResize, onMinimize, onMaximize, titlebarLeading, children }: Props){
  const ref = useRef<HTMLDivElement | null>(null)
  const resizingRef = useRef<{dir:string, startX:number, startY:number, orig: {x:number,y:number,w:number,h:number}} | null>(null)

  useEffect(()=>{
    const el = ref.current
    if(!el) return
    const title = el.querySelector('.titlebar') as HTMLElement | null
    if(!title) return
    let dragging = false
    let startX=0,startY=0,origX=0,origY=0
    function onDown(e:MouseEvent){
      dragging = true
      startX = e.clientX; startY = e.clientY
      origX = state.x; origY = state.y
      // prevent text selection during drag
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMoveDoc)
      document.addEventListener('mouseup', onUp)
    }
    function onMoveDoc(e:MouseEvent){
      if(!dragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      onMove(state.id, origX + dx, origY + dy)
    }
    function onUp(){
      dragging=false
      document.removeEventListener('mousemove', onMoveDoc)
      document.removeEventListener('mouseup', onUp)
      // restore text selection
      document.body.style.userSelect = ''
    }
    title.addEventListener('mousedown', onDown)
    return ()=> title.removeEventListener('mousedown', onDown)
  },[state, onMove])

  useEffect(()=>{
    // cleanup if unmounted while resizing
    return ()=>{
      const cur = resizingRef.current
      if(cur){
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.body.style.userSelect = ''
        resizingRef.current = null
      }
    }
  },[])

  function clampSize(w:number,h:number){
    const minW = state.minW ?? 0
    const minH = state.minH ?? 0
    return { w: Math.max(w, minW), h: Math.max(h, minH) }
  }

  function onPointerMove(e: PointerEvent){
    const r = resizingRef.current
    if(!r) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    let newX = r.orig.x
    let newY = r.orig.y
    let newW = r.orig.w
    let newH = r.orig.h

    switch(r.dir){
      case 'right':
        newW = r.orig.w + dx
        break
      case 'left':
        newW = r.orig.w - dx
        newX = r.orig.x + dx
        break
      case 'bottom':
        newH = r.orig.h + dy
        break
      case 'top':
        newH = r.orig.h - dy
        newY = r.orig.y + dy
        break
      case 'top-right':
        // width increases to the right, height decreases from top
        newW = r.orig.w + dx
        newH = r.orig.h - dy
        newY = r.orig.y + dy
        break
      case 'top-left':
        // width decreases from left, height decreases from top
        newW = r.orig.w - dx
        newX = r.orig.x + dx
        newH = r.orig.h - dy
        newY = r.orig.y + dy
        break
      case 'bottom-right':
        // width increases to right, height increases to bottom
        newW = r.orig.w + dx
        newH = r.orig.h + dy
        break
      case 'bottom-left':
        // width decreases from left, height increases to bottom
        newW = r.orig.w - dx
        newX = r.orig.x + dx
        newH = r.orig.h + dy
        break
    }

    const clamped = clampSize(newW, newH)
    // adjust X/Y if clamping prevented width/height changes to avoid jumps
    if((r.dir === 'left' || r.dir === 'top-left' || r.dir === 'bottom-left') && clamped.w > newW){
      newX = r.orig.x + (r.orig.w - clamped.w)
    }
    if((r.dir === 'top' || r.dir === 'top-left' || r.dir === 'top-right') && clamped.h > newH){
      newY = r.orig.y + (r.orig.h - clamped.h)
    }

    onResize(state.id, clamped.w, clamped.h, newX, newY)
  }

  function onPointerUp(e: PointerEvent){
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.body.style.userSelect = ''
    const cur = resizingRef.current
    if(cur){
      try{ (cur as any).target?.releasePointerCapture((e as any).pointerId) }catch{}
    }
    resizingRef.current = null
  }

  function startResize(dir:string, e: React.PointerEvent){
    if(state.minimized || state.maximized) return
    e.preventDefault()
    const el = ref.current
    if(!el) return
    // store starting values
    resizingRef.current = { dir, startX: e.clientX, startY: e.clientY, orig: { x: state.x, y: state.y, w: state.w, h: state.h } }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.body.style.userSelect = 'none'
    try{ (e.target as Element).setPointerCapture(e.pointerId) }catch{}
  }

  const style: React.CSSProperties = state.minimized
    ? { display: 'none' }
    : state.maximized
      ? {left:0,top:0,right:0,bottom:48,position:'absolute'}
      : {left:state.x,top:state.y,width:state.w,height:state.h}

  // don't render resize handles for maximized windows
  const showHandles = !state.maximized

  const handleStyleBase: React.CSSProperties = { position: 'absolute', background: 'transparent' }

  return (
    <div ref={ref} className="window" style={{...style, zIndex: state.z}} onMouseDown={()=> onFocus(state.id)}>
      <div className="titlebar">
        {titlebarLeading}
        <div style={{flex:1}}>{state.title}</div>
        <div style={{display:'flex',gap:8}}>
          <button className="button" onClick={()=>onMinimize(state.id)}>—</button>
          <button className="button" onClick={()=>onMaximize(state.id)}>{state.maximized? '🗗':'🗖'}</button>
          <button className="button" onClick={()=>onClose(state.id)}>✕</button>
        </div>
      </div>
      <div className="content">
        {children}
      </div>

      {showHandles && (
        <>
          {/* corners */}
          <div onPointerDown={(e)=> startResize('top-left', e)} style={{...handleStyleBase,left:0,top:0,width:12,height:12,cursor:'nwse-resize'}} />
          <div onPointerDown={(e)=> startResize('top-right', e)} style={{...handleStyleBase,right:0,top:0,width:12,height:12,cursor:'nesw-resize'}} />
          <div onPointerDown={(e)=> startResize('bottom-left', e)} style={{...handleStyleBase,left:0,bottom:0,width:12,height:12,cursor:'nesw-resize'}} />
          <div onPointerDown={(e)=> startResize('bottom-right', e)} style={{...handleStyleBase,right:0,bottom:0,width:12,height:12,cursor:'nwse-resize'}} />

          {/* left */}
          <div onPointerDown={(e)=> startResize('left', e)} style={{...handleStyleBase,left:0,top:12,bottom:12,width:8,cursor:'ew-resize'}} />
          {/* right */}
          <div onPointerDown={(e)=> startResize('right', e)} style={{...handleStyleBase,right:0,top:12,bottom:12,width:8,cursor:'ew-resize'}} />
          {/* top */}
          <div onPointerDown={(e)=> startResize('top', e)} style={{...handleStyleBase,top:0,left:12,right:12,height:8,cursor:'ns-resize'}} />
          {/* bottom */}
          <div onPointerDown={(e)=> startResize('bottom', e)} style={{...handleStyleBase,bottom:0,left:12,right:12,height:8,cursor:'ns-resize'}} />
        </>
      )}
    </div>
  )
}
