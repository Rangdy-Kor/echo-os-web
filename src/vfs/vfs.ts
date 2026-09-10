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

export function getCollisionSafeName(requestedName: string, siblingNames: string[], currentName: string){
  const occupiedNames = new Set(siblingNames.filter(name=>name !== currentName))
  if(!occupiedNames.has(requestedName)) return requestedName

  const extensionIndex = requestedName.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const stem = hasExtension ? requestedName.slice(0, extensionIndex) : requestedName
  const extension = hasExtension ? requestedName.slice(extensionIndex) : ''
  let collisionIndex = 1
  let candidate = `${stem} (${collisionIndex})${extension}`
  while(occupiedNames.has(candidate)){
    collisionIndex += 1
    candidate = `${stem} (${collisionIndex})${extension}`
  }
  return candidate
}

export function getNewTextFileRenameCandidate(rawName: string, siblingNames: string[], currentName: string){
  const trimmedName = rawName.trim()
  if(!trimmedName) return ''

  const normalizedName = trimmedName.toLowerCase().endsWith('.txt') ? trimmedName : `${trimmedName}.txt`
  return getCollisionSafeName(normalizedName, siblingNames, currentName)
}

export function renameEntry(root: VEntry, pathParts: string[], newName: string): VEntry{
  const name = newName.trim()
  if(pathParts.length === 0 || !name || name.includes('/')) return root

  const parentPath = pathParts.slice(0, -1)
  const oldName = pathParts[pathParts.length - 1]

  function renameInParent(entry: VEntry, pathIndex: number): VEntry{
    if(pathIndex === parentPath.length){
      if(entry.type !== 'dir' || !entry.children) return entry
      const targetIndex = entry.children.findIndex(child=>child.name === oldName)
      if(targetIndex === -1 || entry.children.some((child, index)=>index !== targetIndex && child.name === name)) return entry

      const target = entry.children[targetIndex]
      if(target.name === name) return entry
      const children = entry.children.slice()
      children[targetIndex] = { ...target, name }
      return { ...entry, children }
    }

    if(entry.type !== 'dir' || !entry.children) return entry
    const childIndex = entry.children.findIndex(child=>child.name === parentPath[pathIndex])
    if(childIndex === -1) return entry

    const child = entry.children[childIndex]
    const updatedChild = renameInParent(child, pathIndex + 1)
    if(updatedChild === child) return entry

    const children = entry.children.slice()
    children[childIndex] = updatedChild
    return { ...entry, children }
  }

  return renameInParent(root, 0)
}
