import React, { useState } from 'react'
import { findEntry, getInitialVfs } from '../vfs/vfs'

export default function TextViewerApp({ initialItemPath = [] }: { initialItemPath?: string[] }){
  const [vfs] = useState(getInitialVfs)
  const item = findEntry(initialItemPath, vfs)

  if(!item || item.type !== 'file'){
    return <p>Text item not found.</p>
  }

  return (
    <div className="text-viewer">
      <h3>{item.name}</h3>
      <pre style={{whiteSpace:'pre-wrap',font:'inherit'}}>{item.content ?? ''}</pre>
    </div>
  )
}
