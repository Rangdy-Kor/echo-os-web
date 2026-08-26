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
