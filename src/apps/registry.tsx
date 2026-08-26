import AboutApp from './AboutApp'
import FilesApp from './FilesApp'

export type AppDescriptor = {
  id: string
  name: string
  icon?: React.ReactNode
  component: React.ComponentType<any>
  singleInstance?: boolean
}

const apps: AppDescriptor[] = [
  { id: 'about', name: 'About', component: AboutApp, singleInstance: true },
  { id: 'files', name: 'Files', component: FilesApp, singleInstance: true },
]

export function getApps(){
  return apps
}

export function findApp(id: string){
  return apps.find(a=>a.id===id)
}
