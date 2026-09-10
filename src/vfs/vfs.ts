export type VEntry = {
  name: string
  type: 'file' | 'dir'
  content?: string
  children?: VEntry[]
}

const initialVfs: VEntry = {
  name: '/',
  type: 'dir',
  children: [
    { name: 'Documents', type: 'dir', children: [
      { name: 'welcome.txt', type: 'file', content: 'Welcome to Echo OS!\nThis is a virtual file.' }
    ]},
    { name: 'Pictures', type: 'dir', children: [] }
  ]
}

export function getInitialVfs(){
  return structuredClone(initialVfs)
}

export function findEntry(pathParts: string[], root: VEntry): VEntry | null{
  if(pathParts.length===0 || (pathParts.length===1 && pathParts[0]==='')) return root
  let node: VEntry | undefined = root
  for(const part of pathParts){
    if(!node || node.type!=='dir') return null
    node = node.children?.find(c=>c.name===part)
  }
  return node ?? null
}

export function updateFileContent(root: VEntry, pathParts: string[], content: string): VEntry{
  function updateEntry(entry: VEntry, pathIndex: number): VEntry{
    if(pathIndex === pathParts.length){
      if(entry.type !== 'file' || entry.content === content) return entry
      return { ...entry, content }
    }

    if(entry.type !== 'dir' || !entry.children) return entry

    const childIndex = entry.children.findIndex(child=>child.name === pathParts[pathIndex])
    if(childIndex === -1) return entry

    const child = entry.children[childIndex]
    const updatedChild = updateEntry(child, pathIndex + 1)
    if(updatedChild === child) return entry

    const children = entry.children.slice()
    children[childIndex] = updatedChild
    return { ...entry, children }
  }

  return updateEntry(root, 0)
}

export function createTextFile(root: VEntry, directoryPath: string[], fileName: string): VEntry{
  const trimmedName = fileName.trim()
  if(!trimmedName || trimmedName.includes('/')) return root

  const name = trimmedName.toLowerCase().endsWith('.txt') ? trimmedName : `${trimmedName}.txt`

  function createInDirectory(entry: VEntry, pathIndex: number): VEntry{
    if(pathIndex === directoryPath.length){
      if(entry.type !== 'dir' || entry.children?.some(child=>child.name === name)) return entry
      return { ...entry, children: [...(entry.children ?? []), { name, type: 'file', content: '' }] }
    }

    if(entry.type !== 'dir' || !entry.children) return entry

    const childIndex = entry.children.findIndex(child=>child.name === directoryPath[pathIndex])
    if(childIndex === -1) return entry

    const child = entry.children[childIndex]
    const updatedChild = createInDirectory(child, pathIndex + 1)
    if(updatedChild === child) return entry

    const children = entry.children.slice()
    children[childIndex] = updatedChild
    return { ...entry, children }
  }

  return createInDirectory(root, 0)
}
