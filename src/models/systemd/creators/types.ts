
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { Service } from '../../../types/service'
import { SystemdManager } from '../utils/dbus'

export type ServiceCreatorFile = {
  path: string,
  content: string
}

export interface ServiceCreator {

  generateFiles (serviceName: string, options: ServiceCreateOptions): Promise<ServiceCreatorFile[]>

  start (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager): Promise<Service[]>

  // removeFiles (): Promise<void>

  // delete (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager): Promise<void>
}
