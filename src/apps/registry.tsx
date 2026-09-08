import AboutApp from './AboutApp'
import FilesApp from './FilesApp'
import TextViewerApp from './TextViewerApp'

export type AppDescriptor = {
  id: string
  name: string
  icon?: React.ReactNode
  component: React.ComponentType<any>
  singleInstance?: boolean
  surfaceVisible?: boolean
}

const apps: AppDescriptor[] = [
  { id: 'about', name: 'About', component: AboutApp, singleInstance: true },
  { id: 'files', name: 'Files', component: FilesApp, singleInstance: true },
  { id: 'text-viewer', name: 'Text Viewer', component: TextViewerApp, surfaceVisible: false },
]

export function getApps(){
  return apps
}

export function findApp(id: string){
  return apps.find(a=>a.id===id)
}
