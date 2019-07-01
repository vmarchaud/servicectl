
import {
  ServiceBackend,
  BackendConfig,
  ServiceCreateOptions
} from '../../types/serviceBackend'
import { Service, ServiceMode } from '../../types/service'
import { ServiceAPIMode } from '../../api'
import * as fs from 'fs'
import { SystemdManager, getManager } from './utils/dbus'
import { SimpleSystemdService } from './systemdService'
import { ExecServiceCreator } from './creators/exec'
import { ClusterServiceCreator } from './creators/cluster'
import { ServiceCreator, getServiceCreator } from './creators/types'

export class SystemdBackend implements ServiceBackend {

  private backend: SystemdManager
  private mode: ServiceAPIMode

  async init (config: BackendConfig) {
    this.mode = config.mode
    this.backend = await getManager(this.mode)
    return this
  }

  async destroy () {
    if (this.backend.bus !== undefined) {
      await this.backend.bus.disconnect()
    }
  }

  async create (options: ServiceCreateOptions): Promise<Service[]> {
    let creator: ServiceCreator
    switch (options.mode) {
      case ServiceMode.EXEC: {
        creator = getServiceCreator(ExecServiceCreator, options, this.mode)
        break
      }
      case ServiceMode.CLUSTER: {
        creator = getServiceCreator(ClusterServiceCreator, options, this.mode)
        break
      }
      default: {
        throw new Error(`Invalid service mode specified: ${options.mode}`)
      }
    }

    const files = await creator.generateFiles()
    // create all files for given paths
    await Promise.all(files.map(async file => {
      const exists = fs.existsSync(file.path)
      if (exists === true) {
        throw new Error(`The service already exists, please use restart or update if you want to change the configuration`)
      }
      fs.writeFileSync(file.path, file.content)
    }))
    // start them
    const services = await creator.start(this.backend)
    return services
  }

  async start (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async restart (name: string): Promise<Service> {
    const service = await this.get(name)
    await service.restart()
    return service
  }

  async get (name: string): Promise<Service> {
    const units = await this.backend.ListUnits()
    const rawService = units.find(unit => {
      return unit[0].indexOf(`servicectl.${name}`) !== -1 && unit[0].indexOf(`.service`)
    })
    if (rawService === undefined) {
      throw new Error(`Service name ${name} not found on the system`)
    }
    const object = await this.backend.bus.getProxyObject('org.freedesktop.systemd1', rawService[6])
    const service = await SimpleSystemdService.fromSystemdObject(this.backend, object)
    return service
  }

  async stop (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async list (): Promise<Service[]> {
    const units = await this.backend.ListUnits()
    const rawServices = units
      .filter(unit => unit[0].indexOf('servicectl') !== -1)
      .filter(unit => unit[0].indexOf('.service') !== -1)
    const services: Service[] = []

    await Promise.all(rawServices.map(async unit => {
      const object = await this.backend.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
      const service = await SimpleSystemdService.fromSystemdObject(this.backend, object)
      services.push(service)
    }))
    return services
  }
}
