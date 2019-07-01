
import { ServiceCreator, ServiceCreatorFile } from './types'
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { generateServiceFile, generateSocketFile } from '../utils/generator'
import {
  locateInterpreterForFile,
  getRepositoryPath,
  mkdirRecursive,
  getPermissionsOptions,
  getLogsPath,
  getInterpreterByExtension
} from '../utils/common'
import { ServiceAPIMode } from '../../../api'
import * as path from 'path'
import { StartMode, SystemdManager } from '../utils/dbus'
import { SimpleSystemdService } from '../systemdService'
import { Service } from '../../../types/service'
import { createConnection } from 'net'

export class ClusterServiceCreator implements ServiceCreator {

  private options: ServiceCreateOptions
  private serviceName: string
  private mode: ServiceAPIMode

  constructor (options: ServiceCreateOptions, mode: ServiceAPIMode) {
    this.options = options
    this.mode = mode
    const scriptFilename = options.script.split(path.sep).pop()
    const scriptName = scriptFilename ? scriptFilename.split('.').splice(0, 1)[0] : 'no-name'
    this.serviceName = options.name || scriptName
  }

  private async generateSocketFile (): Promise<ServiceCreatorFile> {
    if (this.options.port === undefined) {
      throw new Error(`You must define the port you want to use when using the cluster mode`)
    }
    const fileContent = await generateSocketFile({
      Service: `servicectl.${this.serviceName}@%i.service`,
      ReusePort: true,
      ListenStream: this.options.port
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const socketFilename = `servicectl.${this.serviceName}@.socket`
    const socketFilepath = path.resolve(repositoryPath, socketFilename)
    return {
      path: socketFilepath,
      content: fileContent
    }
  }

  async generateServiceFile (): Promise<ServiceCreatorFile> {
    const options = this.options
    const interpreter = options.interpreter ? options.interpreter : await locateInterpreterForFile(options.script)
    const logsPath = await getLogsPath()
    mkdirRecursive(logsPath)
    let additionalArguments = ''
    if (interpreter && interpreter.indexOf('node') > -1) {
      additionalArguments += `-r ${path.join(__dirname, path.sep, 'cluster', path.sep, 'node-handle-socket.js')}`
      additionalArguments += ' '
    }
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${additionalArguments}${options.script}`,
        Restart: 'on-failure'
      },
      unit: {
        Description: 'Service managed by servicectl (instance: %i)',
        Requires: `servicectl.${this.serviceName}@%i.socket`
      },
      permissions: getPermissionsOptions(this.mode),
      exec: {
        StandardOutput: `append:${logsPath}${path.sep}${this.serviceName}.out.%i.log`,
        StandardError: `append:${logsPath}${path.sep}${this.serviceName}.err.%i.log`
      }
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${this.serviceName}@.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    return {
      path: serviceFilepath,
      content: fileContent
    }
  }

  async generateFiles () {
    const serviceFile = await this.generateServiceFile()
    const socketFile = await this.generateSocketFile()
    return [ serviceFile, socketFile ]
  }

  async start (manager: SystemdManager) {
    if (this.options.port === undefined) {
      throw new Error(`You must define the port you want to use when using the cluster mode`)
    }
    if (this.options.count === undefined) this.options.count = 1
    const services: Service[] = []
    for (let i = 0; i < this.options.count; i++) {
      const socketFilename = `servicectl.${this.serviceName}@${i}.socket`
      const serviceFilename = `servicectl.${this.serviceName}@${i}.service`
      await manager.Reload()
      await manager.StartUnit(socketFilename, StartMode.REPLACE)
      await manager.StartUnit(serviceFilename, StartMode.REPLACE)
      const service = await SimpleSystemdService.fromSystemd(manager, serviceFilename)
      services.push(service)
    }
    return services
  }
}
