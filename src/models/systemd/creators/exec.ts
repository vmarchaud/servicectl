
import { ServiceCreator } from './types'
import { ServiceCreateOptions } from '../../../types/serviceBackend'
import { generateServiceFile } from '../utils/generator'
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
import { promisify } from 'util'
import * as fs from 'fs'
import of from 'await-of'
import { Service } from '../../../types/service'

export class ExecServiceCreator implements ServiceCreator {

  async generateFiles (serviceName: string, options: ServiceCreateOptions) {
    const interpreter = options.interpreter ? options.interpreter : await locateInterpreterForFile(options.script)
    const logsPath = await getLogsPath()
    mkdirRecursive(logsPath)
    let postArgs = ''
    for (let i of options.arguments) {
      postArgs += ` ${i}`
    }
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${options.script}${postArgs}`,
        Restart: 'on-failure'
      },
      unit: {
        Description: 'Service managed by servicectl'
      },
      permissions: getPermissionsOptions(options.permissionMode),
      exec: {
        StandardOutput: `append:${logsPath}${path.sep}${serviceName}.out.log`,
        StandardError: `append:${logsPath}${path.sep}${serviceName}.err.log`
      }
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${serviceName}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    return [
      {
        path: serviceFilepath,
        content: fileContent
      }
    ]
  }

  async removeFiles (service: Service) {
    const repositoryPath = await getRepositoryPath()
    const serviceFilename = `servicectl.${service.name}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    const [ _, err ] = await of(promisify(fs.unlink)(serviceFilepath))
    // dont handle error, we just want to remove the file, fine if already the case
  }

  async enable (serviceName: string, options: ServiceCreateOptions, manager: SystemdManager) {
    const serviceFilename = `servicectl.${serviceName}.service`
    await manager.Reload()
    await manager.StartUnit(serviceFilename, StartMode.REPLACE)
    const service = await SimpleSystemdService.fromSystemd(manager, serviceFilename)
    return [ service ]
  }

  async disable (service: Service, manager: SystemdManager) {
    const serviceFilename = `servicectl.${service.name}.service`
    await of(manager.StopUnit(serviceFilename, StartMode.FAIL))
    await of(manager.DisableUnitFiles([serviceFilename], false))
    await manager.Reload()
  }
}
