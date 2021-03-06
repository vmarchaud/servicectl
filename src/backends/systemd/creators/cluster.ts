
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
import { promisify } from 'util'
import * as fs from 'fs'
import of from 'await-of'

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
    let preArgs = ''
    if (interpreter && interpreter.indexOf('node') > -1) {
      preArgs += `-r ${path.join(__dirname, path.sep, 'cluster', path.sep, 'node-handle-socket.js')}`
      preArgs += ' '
    }
    let postArgs = ''
    for (let i of options.arguments) {
      postArgs += ` ${i}`
    }
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${preArgs}${options.script}${postArgs}`,
        Restart: 'on-failure',
        EnvironmentFile: options.enviromentFile
      },
      unit: {
        Description: 'Service managed by servicectl (instance: %i)',
        Requires: `servicectl.${serviceName}@%i.socket`
      },
      permissions: typeof options.permissionMode === 'object' ? {
        User: options.permissionMode.uid,
        Group: options.permissionMode.gid
      } : getPermissionsOptions(options.permissionMode),
      exec: {
        StandardOutput: `append:${logsPath}${path.sep}${serviceName}.out.%i.log`,
        StandardError: `append:${logsPath}${path.sep}${serviceName}.err.%i.log`
      },
      environment: options.environment
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

  async removeFiles (service: Service) {
    const repositoryPath = await getRepositoryPath()
    const socketFilename = `servicectl.${service.name}@.socket`
    const serviceFilename = `servicectl.${service.name}@.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    const socketFilepath = path.resolve(repositoryPath, socketFilename)
    // dont handle error, we just want to remove the file, fine if already the case
    let ret = await of(promisify(fs.unlink)(serviceFilepath))
    ret = await of(promisify(fs.unlink)(socketFilepath))
  }

  async enable (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager) {
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

  async disable (service: Service, manager: SystemdManager) {
    const socketFilename = `servicectl.${service.name}@${service.instance}.socket`
    const serviceFilename = `servicectl.${service.name}@${service.instance}.service`
    await manager.StopUnit(serviceFilename, StartMode.REPLACE)
    await manager.StopUnit(socketFilename, StartMode.REPLACE)
    await manager.DisableUnitFiles([ serviceFilename, socketFilename ], false)
  }
}
