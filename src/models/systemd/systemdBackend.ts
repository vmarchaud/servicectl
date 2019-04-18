
import { ServiceBackend, BackendConfig } from '../../types/serviceBackend'
import { Service } from '../../types/service'
import { SystemdManagerImpl } from '../../backends/systemd/models/manager'
import { SimpleSystemdService } from './systemdService'

export class SystemdBackend implements ServiceBackend {

  private backend: SystemdManagerImpl

  async init (config: BackendConfig) {
    this.backend = await SystemdManagerImpl.init()
    return this
  }

  async destroy () {
    await this.backend.destroy()
  }

  async create (): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async start (name: string): Promise<Service> {
    if (name.indexOf('.service') === -1) {
      name += '.service'
    }
    const service = await SimpleSystemdService.fromSystemd(await this.backend.GetService(name))
    service.start()
    return service
  }

  async restart (name: string): Promise<Service> {
    if (name.indexOf('.service') === -1) {
      name += '.service'
    }
    const service = await SimpleSystemdService.fromSystemd(await this.backend.GetService(name))
    service.restart()
    return service
  }

  async get (name: string): Promise<Service> {
    if (name.indexOf('.service') === -1) {
      name += '.service'
    }
    const service = await this.backend.GetService(name)
    return SimpleSystemdService.fromSystemd(service)
  }

  async stop (name: string): Promise<Service> {
    if (name.indexOf('.service') === -1) {
      name += '.service'
    }
    const service = await SimpleSystemdService.fromSystemd(await this.backend.GetService(name))
    service.stop()
    return service
  }
}
