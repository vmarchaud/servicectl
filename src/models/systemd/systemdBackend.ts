
import {
  ServiceBackend,
  BackendConfig,
  ServiceCreateOptions
} from '../../types/serviceBackend'
import { Service } from '../../types/service'
import { generateServiceFile } from './utils/generator'
import {
  locateInterpreterForFile,
  getRepositoryPath,
  mkdirRecursive,
  getPermissionsOptions,
  getLogsPath
} from './utils/common'
import * as fs from 'fs'
import { ServiceAPIMode } from '../../api'
import * as path from 'path'
import { SystemdManager, getManager, StartMode } from './utils/dbus'
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
    const name = options.name || scriptName
    const logsPath = await getLogsPath()
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${options.script}`,
        Restart: 'on-failure'
      },
      unit: {
        Description: 'Service managed by servicectl'
      },
      permissions: getPermissionsOptions(this.mode),
      exec: {
        StandardOutput: `append:${logsPath}${path.sep}${name}.out.log`,
        StandardError: `append:${logsPath}${path.sep}${name}.err.log`
      }
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    mkdirRecursive(logsPath)
    const serviceFilename = `servicectl.${name}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    const exists = fs.existsSync(serviceFilepath)
    if (exists === true) {
      throw new Error(`The service already exists, please use restart or update if you want to change the configuration`)
    }

    // write the service file
    fs.writeFileSync(serviceFilepath, fileContent)
    // start it
    await this.backend.Reload()
    await this.backend.StartUnit(serviceFilename, StartMode.REPLACE)
    const service = await SimpleSystemdService.fromSystemd(this.backend, serviceFilename)
    return service
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
    const rawService = units.find(unit => unit[0].indexOf(`servicectl.${name}`) !== -1)
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
    const rawServices = units.filter(unit => unit[0].indexOf('servicectl') !== -1)
    const services: Service[] = []

    await Promise.all(rawServices.map(async unit => {
      const object = await this.backend.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
      const service = await SimpleSystemdService.fromSystemdObject(this.backend, object)
      services.push(service)
    }))
    return services
  }
}
