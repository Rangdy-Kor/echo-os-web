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
  onClose: () => void
  onExecute: (result: SurfaceResult) => void
}

export default function UniversalSurface({ apps, items, recent = [], onClose, onExecute }: Props){
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const results = useMemo<SurfaceResult[]>(()=>{
    const actions: SurfaceResult[] = []
    const candidates: SurfaceResult[] = [
      ...actions,
      ...apps
        .filter(app=> app.surfaceVisible !== false)
        .map(app=>({ type: 'Application' as const, label: app.name, appId: app.id })),
      ...items,
    ]
    const normalized = query.trim().toLowerCase()
    return normalized ? candidates.filter(result=> result.label.toLowerCase().includes(normalized)) : recent
  }, [apps, items, query, recent])

  useEffect(()=>{
    inputRef.current?.focus()
  },[])

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
      if(result) onExecute(result)
    } else if(e.key === 'Escape'){
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="universal-surface-backdrop" onMouseDown={e=>{ if(e.target === e.currentTarget) onClose() }}>
      <div className="universal-surface" role="dialog" aria-label="Universal Surface">
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
          {!query.trim() && <div className="universal-surface-section-label">Recent</div>}
          {results.length === 0 && (
            <div className="universal-surface-empty">
              {query.trim() ? 'No results' : 'No recent items yet'}
            </div>
          )}
          {results.map((result, index)=>(
            <button
              key={`${result.type}-${result.label}-${'appId' in result ? result.appId : result.path}`}
              className={`universal-surface-result${index === selectedIndex ? ' selected' : ''}`}
              onMouseEnter={()=>setSelectedIndex(index)}
              onClick={()=>onExecute(result)}
            >
              <span>{result.label}</span>
              <span className="universal-surface-result-type">{result.type}</span>
            </button>
          ))}
        </div>
        <div className="universal-surface-hint">↑↓ Select · Enter Open · Esc Close</div>
      </div>
    </div>
  )
}
