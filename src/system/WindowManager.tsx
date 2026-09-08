import React, { useState, useCallback } from 'react'
import { AppDescriptor } from '../apps/registry'

export type WindowState = {
  id: string
  appId?: string
  initialPath?: string[]
  initialItemPath?: string[]
  title: string
  x:number
  y:number
  w:number
  h:number
  z:number
  minimized?:boolean
  maximized?:boolean
  minW?: number
  minH?: number
}

export type WindowManagerAPI = {
  windows: WindowState[]
  open: (app: AppDescriptor, opts?: { singleInstance?: boolean })=> string
  openGeneric: (title?: string)=> string
  attachApplication: (windowId: string, appId: string, title?: string, initialPath?: string[], initialItemPath?: string[])=>void
  close: (id:string)=>void
  focus: (id:string)=>void
  setPos: (id:string, x:number,y:number)=>void
  setSize: (id:string, w:number,h:number,x?:number,y?:number)=>void
  toggleMinimize: (id:string)=>void
  toggleMaximize: (id:string)=>void
}

let nextWindowId = 1

export default function useWindowManager(): WindowManagerAPI{
  const [windows, setWindows] = useState<WindowState[]>([])

  const open = useCallback((app: AppDescriptor, opts?: { singleInstance?: boolean })=>{
    // Determine single-instance behavior: opts override registry metadata
    const shouldSingle = opts?.singleInstance ?? app.singleInstance ?? false

    if(shouldSingle){
      const existing = windows
        .filter(w=> w.appId === app.id)
        .reduce<WindowState | null>((a,b)=> !a || a.z > b.z ? a : b, null)
      if(existing){
        // if minimized, restore
        setWindows(ws=> ws.map(w=> w.id===existing.id ? {...w, minimized: false} : w))
        // focus existing
        setWindows(ws=>{
          const top = ws.length? Math.max(...ws.map(w=>w.z)):1
          return ws.map(w=> w.id===existing.id ? {...w, z: top+1} : w)
        })
        return existing.id
      }
    }

    const id = `win-${nextWindowId++}`
    setWindows(ws=>[...ws, { id, appId: app.id, title: app.name, x:80+ws.length*20, y:60+ws.length*20, w:520, h:360, z: (ws.length? Math.max(...ws.map(w=>w.z))+1:1), minW:300, minH:120 }])
    return id
  },[windows])

  const openGeneric = useCallback((title = 'Workspace')=>{
    const id = `win-${nextWindowId++}`
    setWindows(ws=>[...ws, {
      id,
      title,
      x:80+ws.length*20,
      y:60+ws.length*20,
      w:520,
      h:360,
      z: (ws.length? Math.max(...ws.map(w=>w.z))+1:1),
      minW:300,
      minH:120,
    }])
    return id
  },[])

  const attachApplication = useCallback((windowId: string, appId: string, title?: string, initialPath?: string[], initialItemPath?: string[])=>{
    setWindows(ws=> ws.map(win=> win.id === windowId
      ? { ...win, appId, title: title ?? win.title, initialPath, initialItemPath }
      : win
    ))
  },[])

  const close = useCallback((id:string)=> setWindows(ws=>ws.filter(w=>w.id!==id)),[])
  const focus = useCallback((id:string)=> setWindows(ws=>{
    const top = ws.length? Math.max(...ws.map(w=>w.z)):1
    return ws.map(w=> w.id===id ? {...w, z: top+1} : w)
  }),[])

  const setPos = useCallback((id:string, x:number,y:number)=> setWindows(ws=> ws.map(w=> w.id===id?{...w,x,y}:w)),[])
  const setSize = useCallback((id:string, w:number,h:number, x?:number,y?:number)=> setWindows(ws=> ws.map(win=> win.id===id?{...win, w: Math.max(w, win.minW ?? 0), h: Math.max(h, win.minH ?? 0), x: x!==undefined?x:win.x, y: y!==undefined?y:win.y}:win)),[])
  const toggleMinimize = useCallback((id:string)=> setWindows(ws=> ws.map(w=> w.id===id?{...w, minimized: !w.minimized}:w)),[])
  const toggleMaximize = useCallback((id:string)=> setWindows(ws=> ws.map(w=> w.id===id?{...w, maximized: !w.maximized}:w)),[])

  return { windows, open, openGeneric, attachApplication, close, focus, setPos, setSize, toggleMinimize, toggleMaximize }
}
