
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { Service } from '../../../types/service'
import { SystemdManager } from '../utils/dbus'
import { ServiceAPIMode } from '../../../api'

export type ServiceCreatorFile = {
  path: string,
  content: string
}

export interface ServiceCreatorConstructor {
  new (options: ServiceCreateOptions, mode: ServiceAPIMode): ServiceCreator
}

export interface ServiceCreator {

  generateFiles (): Promise<ServiceCreatorFile[]>

  start (manager: SystemdManager): Promise<Service[]>
}

export const getServiceCreator = (Impl: ServiceCreatorConstructor, options: ServiceCreateOptions, mode: ServiceAPIMode) => {
  return new Impl(options, mode)
}
