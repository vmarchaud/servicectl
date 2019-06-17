
import { ServiceBackend, BackendConfig, ServiceCreateOptions } from '../../types/serviceBackend'
import { Service } from '../../types/service'
import { generateServiceFile } from './utils/generator'
import { locateInterpreterForFile, getRepositoryPath, mkdirRecursive, getExecOptions } from './utils/common'
import * as fs from 'fs'
import { ServiceAPIMode } from '../../api'
import * as path from 'path'
import { SystemdManager, getManager, getUnit, StartMode } from './utils/dbus'
import { SimpleSystemdService } from './systemdService'

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

  async create (options: ServiceCreateOptions): Promise<Service> {
    const interpreter = options.interpreter ? options.interpreter : await locateInterpreterForFile(options.script)
    const scriptFilename = options.script.split(path.sep).pop()
    const scriptName = scriptFilename ? scriptFilename.split('.').splice(0, 1)[0] : 'no-name'
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${options.script}`,
        Restart: 'on-failure'
      },
      unit: {
        Description: 'Service managed by servicectl'
      },
      exec: getExecOptions(this.mode)
    })
    const repositoryPath = await getRepositoryPath(this.mode)
    // be sure that the path exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${options.name || scriptName}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    const exists = fs.existsSync(serviceFilepath)
    if (exists === true) {
      throw new Error(`The service already exists, please use restart or update if you want to change the configuration`)
    }

    // write the service file
    await fs.promises.writeFile(serviceFilepath, fileContent)
    // start it
    await this.backend.StartUnit(serviceFilename, StartMode.REPLACE)
    const service = await SimpleSystemdService.fromSystemd(this.backend, serviceFilename)
    return service
  }

  async start (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async restart (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async get (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async stop (name: string): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async list (): Promise<Service[]> {
    const units = await this.backend.ListUnits()
    units.forEach(unit => console.log(unit))
    const rawServices = units.filter(unit => unit[0].indexOf('.service') !== -1)
    const services: Service[] = []

    await Promise.all(rawServices.map(async unit => {
      const object = await this.backend.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
      const service = await SimpleSystemdService.fromSystemdObject(this.backend, object)
      services.push(service)
    }))
    return services
  }
}
