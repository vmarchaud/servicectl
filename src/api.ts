import { ServiceBackend, ServiceCreateOptions } from './types/serviceBackend'
import { platform } from 'os'
import { SystemdBackend } from './models/systemd/systemdBackend'

export enum ServiceAPIMode {
  USER,
  SYSTEM
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
    const service = await this.backend.restart(name)
    console.log(`Restarted ${service.name}, pid: ${service.pid}`)
  }

  async status () {
    const services = await this.backend.list()
    console.log(services.map(service => service.name))
  }

  async create (options: ServiceCreateOptions) {
    const service = await this.backend.create(options)
  }
}
