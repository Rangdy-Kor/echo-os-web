import React, { useEffect, useRef, useState } from 'react'
import { findEntry, VEntry } from '../vfs/vfs'

type Props = {
  vfs: VEntry
  initialItemPath?: string[]
  pathMigration?: { id: number; oldPath: string[]; newPath: string[] } | null
  onSave: (path: string[], content: string) => void
  onDirtyChange?: (dirty: boolean) => void
  onBack?: () => void
  active?: boolean
  initialDraft?: string
  onDraftChange?: (draft: string) => void
}

function pathsMatch(a: string[], b: string[]){
  return a.length === b.length && a.every((part, index)=>part === b[index])
}

function migratePath(path: string[], migration: NonNullable<Props['pathMigration']>){
  return path.length >= migration.oldPath.length && migration.oldPath.every((part, index)=>path[index] === part)
    ? [...migration.newPath, ...path.slice(migration.oldPath.length)]
    : path
}

export default function TextViewerApp({ vfs, initialItemPath = [], pathMigration, onSave, onDirtyChange, onBack, active = true, initialDraft, onDraftChange }: Props){
  const itemPath = initialItemPath.join('/')
  const item = findEntry(initialItemPath, vfs)
  const savedContent = item?.type === 'file' ? item.content ?? '' : ''
  const [draft, setDraft] = useState(initialDraft ?? savedContent)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previousItemPathRef = useRef(initialItemPath)
  const previousSavedContentRef = useRef(savedContent)

  useEffect(()=>{
    const previousPath = previousItemPathRef.current
    const previousSavedContent = previousSavedContentRef.current
    const sameItem = pathsMatch(previousPath, initialItemPath) || !!pathMigration && pathsMatch(migratePath(previousPath, pathMigration), initialItemPath)
    setDraft(current=>sameItem
      ? current === previousSavedContent ? savedContent : current
      : savedContent
    )
    previousItemPathRef.current = initialItemPath
    previousSavedContentRef.current = savedContent
  },[itemPath, savedContent, pathMigration?.id])

  const dirty = item?.type === 'file' && draft !== savedContent

  useEffect(()=>onDraftChange?.(draft),[draft])

  useEffect(()=>{
    onDirtyChange?.(dirty)
  },[dirty, itemPath, active])

  useEffect(()=>()=>onDirtyChange?.(false),[])

  useEffect(()=>{
    if(!active || !item || item.type !== 'file') return
    function onKeyDown(event: KeyboardEvent){
      const editor = editorRef.current
      const editorFocused = !!editor && document.activeElement === editor && event.target === editor
      const target = event.target instanceof HTMLElement ? event.target : null
      const editableTarget = !!target?.closest('input, textarea, select, [contenteditable="true"]')

      if(event.key === 'Backspace' && !editorFocused && !editableTarget && onBack){
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
