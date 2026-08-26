import React, { useState, useCallback } from 'react'
import { AppDescriptor } from '../apps/registry'

export type WindowState = {
  id: string
  appId: string
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

let nextWindowId = 1

export default function useWindowManager(){
  const [windows, setWindows] = useState<WindowState[]>([])

  const open = useCallback((app: AppDescriptor)=>{
    const id = `win-${nextWindowId++}`
    setWindows(ws=>[...ws, { id, appId: app.id, title: app.name, x:80+ws.length*20, y:60+ws.length*20, w:520, h:360, z: (ws.length? Math.max(...ws.map(w=>w.z))+1:1), minW:300, minH:120 }])
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

  return { windows, open, close, focus, setPos, setSize, toggleMinimize, toggleMaximize }
}
