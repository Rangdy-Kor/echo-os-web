import React, { useEffect, useRef, useState } from 'react'
import { findEntry, VEntry } from '../vfs/vfs'

type Props = {
  vfs: VEntry
  initialItemPath?: string[]
  onSave: (path: string[], content: string) => void
  onDirtyChange?: (dirty: boolean) => void
}

export default function TextViewerApp({ vfs, initialItemPath = [], onSave, onDirtyChange }: Props){
  const item = findEntry(initialItemPath, vfs)
  const savedContent = item?.type === 'file' ? item.content ?? '' : ''
  const [draft, setDraft] = useState(savedContent)
  const previousSavedContentRef = useRef(savedContent)

  useEffect(()=>{
    setDraft(current=>current === previousSavedContentRef.current ? savedContent : current)
    previousSavedContentRef.current = savedContent
  },[savedContent])

  const dirty = draft !== savedContent

  useEffect(()=>{
    onDirtyChange?.(dirty)
  },[dirty])

  useEffect(()=>()=>onDirtyChange?.(false),[])

  if(!item || item.type !== 'file'){
    return <p>Text item not found.</p>
  }

  return (
    <div className="text-viewer">
      <textarea className="text-editor-input" aria-label={`${item.name} content`} value={draft} onChange={event=>setDraft(event.target.value)} />
      {dirty && <button className="button text-editor-save" onClick={()=>onSave(initialItemPath, draft)}>Save</button>}
    </div>
  )
}
