import React, { useState } from 'react'
import type { AppDescriptor } from '../apps/registry'
import { findApp } from '../apps/registry'
import type { VEntry } from '../vfs/vfs'
import UniversalSurface, { type SurfaceResult } from './UniversalSurface'

export type TabTarget =
  | { type: 'empty' }
  | { type: 'item'; label: string; path: string[]; itemType: VEntry['type']; appId: 'files' | 'text-viewer' }
  | { type: 'application'; label: string; appId: string }

export type SurfaceTab = {
  id: string
  target: TabTarget
}

export type SurfaceState = {
  windowId: string
  tabs: SurfaceTab[]
  activeTabId: string
}

type Props = {
  surface: SurfaceState
  apps: AppDescriptor[]
  vfs: VEntry
  items: SurfaceResult[]
  recent: SurfaceResult[]
  onExecute: (tabId: string, result: SurfaceResult, mode: 'current' | 'background-tab') => void
  onOpenItem: (tabId: string, path: string[], item: VEntry) => void
  onCreateTextFile: (directoryPath: string[], fileName: string) => void
  onSaveItem: (path: string[], content: string) => void
  onDirectoryChange: (tabId: string, path: string[]) => void
  onAddTab: () => void
  onActivateTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
}

function tabLabel(tab: SurfaceTab, dirty = false){
  const label = tab.target.type === 'empty' ? 'New Tab' : tab.target.label
  return dirty ? `${label}*` : label
}

export default function SurfaceWorkspace({ surface, apps, vfs, items, recent, onExecute, onOpenItem, onCreateTextFile, onSaveItem, onDirectoryChange, onAddTab, onActivateTab, onCloseTab }: Props){
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, { path: string; dirty: boolean }>>({})

  function setTabDirty(tabId: string, path: string, dirty: boolean){
    setDirtyTabs(current=>current[tabId]?.path === path && current[tabId].dirty === dirty
      ? current
      : { ...current, [tabId]: { path, dirty } }
    )
  }

  return (
    <div className="surface-workspace">
      <div className="surface-tabs" role="tablist" aria-label="Surface tabs">
        {surface.tabs.map(tab=>{
          const active = tab.id === surface.activeTabId
          const path = tab.target.type === 'item' ? tab.target.path.join('/') : null
          const dirty = path !== null && dirtyTabs[tab.id]?.path === path && dirtyTabs[tab.id].dirty
          const label = tabLabel(tab, dirty)
          return (
            <div key={tab.id} className={`surface-tab${active ? ' active' : ''}`} role="tab" aria-selected={active} onClick={()=>onActivateTab(tab.id)}>
              <span className="surface-tab-label">{label}</span>
              <button className="surface-tab-close" aria-label={`Close ${label}`} onClick={event=>{ event.stopPropagation(); onCloseTab(tab.id) }}>×</button>
            </div>
          )
        })}
        <button className="button surface-add-tab" aria-label="New Tab" title="New Tab" onClick={onAddTab}>＋</button>
      </div>
      <div className="surface-tab-content">
        {surface.tabs.map(tab=>{
          const active = tab.id === surface.activeTabId
          const target = tab.target
          let content: React.ReactNode

          if(target.type === 'empty'){
            content = <UniversalSurface apps={apps} items={items} recent={recent} active={active} onExecute={(result, mode = 'current')=>onExecute(tab.id, result, mode)} />
          } else {
            const app = findApp(target.appId)
            const Comp = app?.component
            if(!Comp){
              content = <p>Target is unavailable.</p>
            } else if(target.appId === 'files'){
              const initialPath = target.type === 'item' ? target.path : []
              content = <Comp vfs={vfs} initialPath={initialPath} onOpenItem={(path: string[], item: VEntry)=>onOpenItem(tab.id, path, item)} onCreateTextFile={onCreateTextFile} onPathChange={(path: string[])=>onDirectoryChange(tab.id, path)} />
            } else if(target.appId === 'text-viewer' && target.type === 'item'){
              const path = target.path.join('/')
              content = <Comp key={path} vfs={vfs} initialItemPath={target.path} onSave={onSaveItem} onDirtyChange={(dirty: boolean)=>setTabDirty(tab.id, path, dirty)} />
            } else {
              content = <Comp />
            }
          }

          return <div key={tab.id} className="surface-tab-panel" role="tabpanel" hidden={!active}>{content}</div>
        })}
      </div>
    </div>
  )
}
