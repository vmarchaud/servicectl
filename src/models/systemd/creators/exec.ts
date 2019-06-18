
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
import { ServiceAPIMode } from '../../../api'
import * as path from 'path'
import { StartMode, SystemdManager } from '../utils/dbus'
import { SimpleSystemdService } from '../systemdService'

export class ExecServiceCreator implements ServiceCreator {

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

  async generateFiles () {
    const options = this.options
    const interpreter = options.interpreter ? options.interpreter : await locateInterpreterForFile(options.script)
    const logsPath = await getLogsPath()
    mkdirRecursive(logsPath)
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
        StandardOutput: `append:${logsPath}${path.sep}${this.serviceName}.out.log`,
        StandardError: `append:${logsPath}${path.sep}${this.serviceName}.err.log`
      }
    })
    const repositoryPath = await getRepositoryPath()
    // be sure that the paths exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${this.serviceName}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    return [
      {
        path: serviceFilepath,
        content: fileContent
      }
    ]
  }

  async start (manager: SystemdManager) {
    const serviceFilename = `servicectl.${this.serviceName}.service`
    await manager.Reload()
    await manager.StartUnit(serviceFilename, StartMode.REPLACE)
    const service = await SimpleSystemdService.fromSystemd(manager, serviceFilename)
    return [ service ]
  }
}
