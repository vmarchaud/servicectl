
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { Service } from '../../../types/service'
import { SystemdManager } from '../utils/dbus'

export type ServiceCreatorFile = {
  path: string,
  content: string
}

export interface ServiceCreator {

  generateFiles (serviceName: string, options: ServiceCreateOptions): Promise<ServiceCreatorFile[]>

  enable (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager): Promise<Service[]>

  removeFiles (service: Service): Promise<void>

  disable (service: Service, manager: SystemdManager): Promise<void>
}
