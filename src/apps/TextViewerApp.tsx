import React, { useEffect, useRef, useState } from 'react'
import { findEntry, VEntry } from '../vfs/vfs'

type Props = {
  vfs: VEntry
  initialItemPath?: string[]
  onSave: (path: string[], content: string) => void
  onDirtyChange?: (dirty: boolean) => void
  onBack?: () => void
  active?: boolean
}

export default function TextViewerApp({ vfs, initialItemPath = [], onSave, onDirtyChange, onBack, active = true }: Props){
  const item = findEntry(initialItemPath, vfs)
  const savedContent = item?.type === 'file' ? item.content ?? '' : ''
  const [draft, setDraft] = useState(savedContent)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previousSavedContentRef = useRef(savedContent)

  useEffect(()=>{
    setDraft(current=>current === previousSavedContentRef.current ? savedContent : current)
    previousSavedContentRef.current = savedContent
  },[savedContent])

  const dirty = item?.type === 'file' && draft !== savedContent

  useEffect(()=>{
    onDirtyChange?.(dirty)
  },[dirty])

  useEffect(()=>()=>onDirtyChange?.(false),[])

  useEffect(()=>{
    if(!active || !item || item.type !== 'file') return
    function onKeyDown(event: KeyboardEvent){
      const editor = editorRef.current
      const editorFocused = !!editor && document.activeElement === editor && event.target === editor

      if(event.key === 'Backspace' && !editorFocused && onBack){
        event.preventDefault()
        onBack()
      } else if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && editorFocused && dirty){
        event.preventDefault()
        onSave(initialItemPath, draft)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return ()=>document.removeEventListener('keydown', onKeyDown)
  },[active, dirty, draft, item, initialItemPath, onSave, onBack])

  if(!item || item.type !== 'file'){
    return <p>Text item not found.</p>
  }

  return (
    <div className="text-viewer">
      <textarea ref={editorRef} className="text-editor-input" aria-label={`${item.name} content`} value={draft} onChange={event=>setDraft(event.target.value)} />
      {dirty && <button className="button text-editor-save" onClick={()=>onSave(initialItemPath, draft)}>Save</button>}
    </div>
  )
}
