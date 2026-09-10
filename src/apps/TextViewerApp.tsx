import React, { useEffect, useRef, useState } from 'react'
import { findEntry, VEntry } from '../vfs/vfs'

type Props = {
  vfs: VEntry
  initialItemPath?: string[]
  onSave: (path: string[], content: string) => void
}

export default function TextViewerApp({ vfs, initialItemPath = [], onSave }: Props){
  const item = findEntry(initialItemPath, vfs)
  const savedContent = item?.type === 'file' ? item.content ?? '' : ''
  const [draft, setDraft] = useState(savedContent)
  const previousSavedContentRef = useRef(savedContent)

  useEffect(()=>{
    setDraft(current=>current === previousSavedContentRef.current ? savedContent : current)
    previousSavedContentRef.current = savedContent
  },[savedContent])

  if(!item || item.type !== 'file'){
    return <p>Text item not found.</p>
  }

  const dirty = draft !== savedContent

  return (
    <div className="text-viewer">
      <div className="text-editor-header">
        <h3>{item.name}</h3>
        {dirty && <span className="text-editor-dirty">Unsaved</span>}
        <button className="button text-editor-save" disabled={!dirty} onClick={()=>onSave(initialItemPath, draft)}>Save</button>
      </div>
      <textarea className="text-editor-input" aria-label={`${item.name} content`} value={draft} onChange={event=>setDraft(event.target.value)} />
    </div>
  )
}
