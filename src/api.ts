import { ServiceBackend, ServiceCreateOptions, RetrieveLogsOptions } from './types/serviceBackend'
import { platform } from 'os'
import { SystemdBackend } from './models/systemd/systemdBackend'
import { Service, ServiceLogs } from './types/service'

export enum ServiceAPIMode {
  USER = 'user',
  NOBODY = 'nobody',
  ROOT = 'root'
}

export class ServiceAPI {

  private backend: ServiceBackend

  constructor (backend: ServiceBackend) {
    this.backend = backend
  }

  static async init (mode: ServiceAPIMode) {
    let backend: ServiceBackend
    switch (platform().toString()) {
      case 'linux': {
        backend = await new SystemdBackend().init({ mode })
        break
      }
      default: {
        throw new Error('Not implemented.')
      }
    }
    return new ServiceAPI(backend)
  }

  async destroy () {
    await this.backend.destroy()
  }

  async restart (name: string) {
    const services = await this.backend.restart(name)
    return services
  }

  async list () {
    const services = await this.backend.list()
    return services
  }

  async create (options: ServiceCreateOptions): Promise<Service[]> {
    const service = await this.backend.create(options)
    return service
  }

  async retrieveLogs (name: string, options: RetrieveLogsOptions): Promise<ServiceLogs[]> {
    const services = await this.backend.get(name)
    const serviceLogs: ServiceLogs[] = []
    await Promise.all(services.map(async service => {
      const serviceLog = await service.logs(options)
      serviceLogs.push(serviceLog)
    }))
    return serviceLogs
  }
}
