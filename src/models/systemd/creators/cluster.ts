
import { ServiceCreator, ServiceCreatorFile } from './types'
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { generateServiceFile, generateSocketFile } from '../utils/generator'
import {
  locateInterpreterForFile,
  getRepositoryPath,
  mkdirRecursive,
  getPermissionsOptions,
  getLogsPath
} from '../utils/common'
import * as path from 'path'
import { StartMode, SystemdManager } from '../utils/dbus'
import { SimpleSystemdService } from '../systemdService'
import { Service } from '../../../types/service'

export class ClusterServiceCreator implements ServiceCreator {

  private async generateSocketFile (serviceName: string, options: ServiceCreateOptions): Promise<ServiceCreatorFile> {
    if (options.port === undefined) {
      throw new Error(`You must define the port you want to use when using the cluster mode`)
    }
    const fileContent = await generateSocketFile({
      Service: `servicectl.${serviceName}@%i.service`,
      ReusePort: true,
      ListenStream: options.port
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const socketFilename = `servicectl.${serviceName}@.socket`
    const socketFilepath = path.resolve(repositoryPath, socketFilename)
    return {
      path: socketFilepath,
      content: fileContent
    }
  }

  async generateServiceFile (serviceName: string, options: ServiceCreateOptions): Promise<ServiceCreatorFile> {
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
        Requires: `servicectl.${serviceName}@%i.socket`
      },
      permissions: getPermissionsOptions(options.permissionMode),
      exec: {
        StandardOutput: `append:${logsPath}${path.sep}${serviceName}.out.%i.log`,
        StandardError: `append:${logsPath}${path.sep}${serviceName}.err.%i.log`
      }
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${serviceName}@.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    return {
      path: serviceFilepath,
      content: fileContent
    }
  }

  async generateFiles (serviceName: string, options: ServiceCreateOptions) {
    const serviceFile = await this.generateServiceFile(serviceName, options)
    const socketFile = await this.generateSocketFile(serviceName, options)
    return [ serviceFile, socketFile ]
  }

  async start (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager) {
    if (options.port === undefined) {
      throw new Error(`You must define the port you want to use when using the cluster mode`)
    }
    if (options.count === undefined) options.count = 1
    const services: Service[] = []
    for (let i = 0; i < options.count; i++) {
      const socketFilename = `servicectl.${serviceName}@${i}.socket`
      const serviceFilename = `servicectl.${serviceName}@${i}.service`
      await manager.Reload()
      await manager.StartUnit(socketFilename, StartMode.REPLACE)
      await manager.StartUnit(serviceFilename, StartMode.REPLACE)
      const service = await SimpleSystemdService.fromSystemd(manager, serviceFilename)
      services.push(service)
    }
    return services
  }
}
