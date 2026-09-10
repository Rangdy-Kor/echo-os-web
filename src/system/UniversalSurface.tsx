import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { AppDescriptor } from '../apps/registry'
import type { VEntry } from '../vfs/vfs'

export type SurfaceResult =
  | { type: 'Application'; label: string; appId: string }
  | { type: 'Item'; label: string; path: string; itemType: VEntry['type'] }
  | { type: 'Action'; label: string; appId: string }

type Props = {
  apps: AppDescriptor[]
  items: SurfaceResult[]
  recent?: SurfaceResult[]
  maxRecent?: number
  active?: boolean
  onExecute: (result: SurfaceResult, mode?: 'current' | 'background-tab') => void
}

function resultTypeLabel(result: SurfaceResult){
  if(result.type !== 'Item') return result.type
  if(result.itemType === 'dir') return 'Folder'
  if(result.label.toLowerCase().endsWith('.txt')) return 'Text'
  return 'File'
}

const suggestedItems: { label: string; itemType: VEntry['type'] }[] = [
  { label: 'welcome.txt', itemType: 'file' },
  { label: 'Documents', itemType: 'dir' },
  { label: 'Pictures', itemType: 'dir' },
]

function sameResultIdentity(a: SurfaceResult, b: SurfaceResult){
  if(a.type !== b.type) return false
  if(a.type === 'Item' && b.type === 'Item'){
    const aPath = a.path.split('/').filter(Boolean).join('/')
    const bPath = b.path.split('/').filter(Boolean).join('/')
    return aPath === bPath
  }
  if(a.type === 'Application' && b.type === 'Application') return a.appId === b.appId
  return a.type === 'Action' && b.type === 'Action' && a.appId === b.appId
}

export default function UniversalSurface({ apps, items, recent = [], maxRecent = 5, active = true, onExecute }: Props){
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const { results, recentResults, suggestedResults } = useMemo(()=>{
    const actions: SurfaceResult[] = []
    const candidates: SurfaceResult[] = [
      ...actions,
      ...apps
        .filter(app=> app.surfaceVisible !== false)
        .map(app=>({ type: 'Application' as const, label: app.name, appId: app.id })),
      ...items,
    ]
    const normalized = query.trim().toLowerCase()
    if(normalized){
      const results = candidates.filter(result=> result.label.toLowerCase().includes(normalized))
      return { results, recentResults: [], suggestedResults: [] }
    }

    const suggested: SurfaceResult[] = suggestedItems.flatMap(suggestion=>{
      const item = items.find(result=>
        result.type === 'Item' &&
        result.label === suggestion.label &&
        result.itemType === suggestion.itemType
      )
      return item ? [item] : []
    })
    const about = apps.find(app=>app.name === 'About' && app.surfaceVisible !== false)
    if(about) suggested.push({ type: 'Application', label: about.name, appId: about.id })

    const recentResults = recent.slice(0, maxRecent)
    const suggestedResults = suggested
      .filter(suggestion=>!recentResults.some(target=>sameResultIdentity(target, suggestion)))
      .slice(0, Math.max(0, maxRecent - recentResults.length))
    return { results: [...recentResults, ...suggestedResults], recentResults, suggestedResults }
  }, [apps, items, maxRecent, query, recent])

  useEffect(()=>{
    if(active) inputRef.current?.focus()
  },[active])

  useEffect(()=>{
    setSelectedIndex(index=> results.length ? Math.min(index, results.length - 1) : 0)
  },[results.length])

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
    if(e.key === 'ArrowDown'){
      e.preventDefault()
      setSelectedIndex(index=> results.length ? (index + 1) % results.length : 0)
    } else if(e.key === 'ArrowUp'){
      e.preventDefault()
      setSelectedIndex(index=> results.length ? (index - 1 + results.length) % results.length : 0)
    } else if(e.key === 'Enter'){
      e.preventDefault()
      const result = results[selectedIndex]
      if(result) onExecute(result, 'current')
    }
  }

  return (
      <div className="universal-surface" role="search" aria-label="Universal Surface">
        <input
          ref={inputRef}
          className="universal-surface-input"
          value={query}
          onChange={e=>{ setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={onKeyDown}
          placeholder="Search, open, or start something..."
          aria-label="Search"
        />
        <div className="universal-surface-results">
          {results.length === 0 && (
            <div className="universal-surface-empty">
              {query.trim() ? 'No results' : 'No suggestions available'}
            </div>
          )}
          {!query.trim() && recentResults.length > 0 && <div className="universal-surface-section-label">Recent</div>}
          {(query.trim() ? results : recentResults).map((result, index)=>(
            <button
              key={`${result.type}-${result.label}-${'appId' in result ? result.appId : result.path}`}
              className={`universal-surface-result${index === selectedIndex ? ' selected' : ''}`}
              onMouseEnter={()=>setSelectedIndex(index)}
              onClick={()=>onExecute(result, 'current')}
              onAuxClick={event=>{ if(event.button === 1){ event.preventDefault(); onExecute(result, 'background-tab') } }}
            >
              <span>{result.label}</span>
              <span className="universal-surface-result-type">{resultTypeLabel(result)}</span>
            </button>
          ))}
          {!query.trim() && suggestedResults.length > 0 && <div className="universal-surface-section-label">Suggested</div>}
          {!query.trim() && suggestedResults.map((result, index)=>(
            <button
              key={`${result.type}-${result.label}-${'appId' in result ? result.appId : result.path}`}
              className={`universal-surface-result${index + recentResults.length === selectedIndex ? ' selected' : ''}`}
              onMouseEnter={()=>setSelectedIndex(index + recentResults.length)}
              onClick={()=>onExecute(result, 'current')}
              onAuxClick={event=>{ if(event.button === 1){ event.preventDefault(); onExecute(result, 'background-tab') } }}
            >
              <span>{result.label}</span>
              <span className="universal-surface-result-type">{resultTypeLabel(result)}</span>
            </button>
          ))}
        </div>
      </div>
  )
}
