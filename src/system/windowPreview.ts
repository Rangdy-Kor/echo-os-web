import { toPng } from 'html-to-image'

export type WindowPreviewSnapshot = {
  dataUrl: string
  width: number
  height: number
}

const snapshots = new Map<string, WindowPreviewSnapshot>()
const pendingCaptures = new Map<string, Promise<WindowPreviewSnapshot | null>>()

export function getWindowPreview(windowId: string){
  return snapshots.get(windowId) ?? null
}

export function removeWindowPreview(windowId: string){
  snapshots.delete(windowId)
  pendingCaptures.delete(windowId)
}

export function findWindowElement(windowId: string){
  return document.querySelector<HTMLElement>(`.window[data-window-id="${CSS.escape(windowId)}"]`)
}

export function captureWindowPreview(windowId: string, element: HTMLElement){
  const existing = pendingCaptures.get(windowId)
  if(existing) return existing

  const content = Array.from(element.children).find(child=>child.classList.contains('content')) as HTMLElement | undefined
  const captureTarget = content ?? element
  const rect = captureTarget.getBoundingClientRect()
  if(rect.width === 0 || rect.height === 0 || getComputedStyle(element).display === 'none'){
    return Promise.resolve(getWindowPreview(windowId))
  }

  const capture = toPng(captureTarget, {
    width: rect.width,
    height: rect.height,
    pixelRatio: 1,
    cacheBust: false,
    style: {
      position: 'static',
      left: '0',
      top: '0',
      right: 'auto',
      bottom: 'auto',
      margin: '0',
      transform: 'none',
      backgroundColor: getComputedStyle(element).backgroundColor,
    },
  }).then(dataUrl=>{
    const snapshot = { dataUrl, width: rect.width, height: rect.height }
    snapshots.set(windowId, snapshot)
    return snapshot
  }).catch(()=>getWindowPreview(windowId)).finally(()=>{
    pendingCaptures.delete(windowId)
  })

  pendingCaptures.set(windowId, capture)
  return capture
}
