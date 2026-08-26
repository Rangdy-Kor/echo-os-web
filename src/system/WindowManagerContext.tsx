import React, { createContext, useContext } from 'react'
import type { WindowManagerAPI } from './WindowManager'

const WindowManagerContext = createContext<WindowManagerAPI | null>(null)

export function WindowManagerProvider({ value, children }: { value: WindowManagerAPI, children: React.ReactNode }){
  return (
    <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>
  )
}

export function useWindowManagerContext(){
  const ctx = useContext(WindowManagerContext)
  if(!ctx) throw new Error('useWindowManagerContext must be used within WindowManagerProvider')
  return ctx
}
