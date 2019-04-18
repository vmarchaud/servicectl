import { ServiceBackend } from './types/serviceBackend'
import { platform } from 'os'
import { SystemdBackend } from './models/systemd/systemdBackend'

export class ServiceAPI {

  private backend: ServiceBackend

  constructor (backend: ServiceBackend) {
    this.backend = backend
  }

  static async init () {
    let backend: ServiceBackend
    switch (platform().toString()) {
      case 'linux': {
        backend = await new SystemdBackend().init({})
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
}
