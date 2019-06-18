
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { Service } from '../../../types/service'
import { SystemdManager } from '../utils/dbus'
import { ServiceAPIMode } from '../../../api'

export type ServiceCreatorFile = {
  path: string,
  content: string
}

export interface ServiceCreator {

  // new (options: ServiceCreateOptions, mode: ServiceAPIMode)

  generateFiles (): Promise<ServiceCreatorFile[]>

  start (manager: SystemdManager): Promise<Service[]>
}
