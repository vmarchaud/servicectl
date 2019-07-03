
import {
  ServiceBackend,
  BackendConfig,
  ServiceCreateOptions
} from '../../types/serviceBackend'
import { Service, ServiceMode } from '../../types/service'
import * as fs from 'fs'
import { SystemdManager, getManager } from './utils/dbus'
import { SimpleSystemdService } from './systemdService'
import { getCreatorForMode } from './utils/common'
import * as path from 'path'

export class SystemdBackend implements ServiceBackend {

  private backend: SystemdManager

  async init (config: BackendConfig) {
    this.backend = await getManager()
    return this
  }

  async destroy () {
    if (this.backend.bus !== undefined) {
      await this.backend.bus.disconnect()
    }
  }

  async create (options: ServiceCreateOptions): Promise<Service[]> {
    const creator = await getCreatorForMode(options.mode)
    const scriptFilename = options.script.split(path.sep).pop()
    const scriptName = scriptFilename ? scriptFilename.split('.').splice(0, 1)[0] : 'no-name'
    const serviceName = options.name || scriptName
    const files = await creator.generateFiles(serviceName, options)
    // create all files for given paths
    await Promise.all(files.map(async file => {
      const exists = fs.existsSync(file.path)
      if (exists === true) {
        throw new Error(`The service already exists, please use restart or update if you want to change the configuration`)
      }
      fs.writeFileSync(file.path, file.content)
    }))
    // start them
    const services = await creator.enable(serviceName, options, this.backend)
    return services
  }

  async start (name: string): Promise<Service[]> {
    throw new Error('Method not implemented.')
  }

  async restart (name: string): Promise<Service[]> {
    const services = await this.get(name)
    await Promise.all(services.map(service => service.restart()))
    return services
  }

  async get (name: string): Promise<Service[]> {
    const units = await this.backend.ListUnits()
    const rawServices = units
      .filter(unit => unit[0].indexOf('servicectl') !== -1)
      .filter(unit => unit[0].indexOf('.service') !== -1)
    if (rawServices.length === 0) {
      throw new Error(`Service name ${name} not found on the system`)
    }
    const services: Service[] = []

    await Promise.all(rawServices.map(async unit => {
      const object = await this.backend.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
      const service = await SimpleSystemdService.fromSystemdObject(this.backend, object)
      services.push(service)
    }))
    return services
  }

  async stop (name: string): Promise<Service[]> {
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
