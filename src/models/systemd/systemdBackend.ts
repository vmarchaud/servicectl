
import { ServiceBackend, BackendConfig, ServiceCreateOptions } from '../../types/serviceBackend'
import { Service } from '../../types/service'
import { SystemdManagerImpl } from '../../backends/systemd/models/manager'
import { SimpleSystemdService } from './systemdService'
import { generateServiceFile } from './utils/generator'
import { locateInterpreter, locateInterpreterForFile, getRepositoryPath, mkdirRecursive } from './utils/common'
import * as fs from 'fs'
import { ServiceAPIMode } from '../../api'
import * as path from 'path'

export class SystemdBackend implements ServiceBackend {

  private backend: SystemdManagerImpl
  private mode: ServiceAPIMode

  async init (config: BackendConfig) {
    this.mode = config.mode
    this.backend = await SystemdManagerImpl.init()
    return this
  }

  async destroy () {
    await this.backend.destroy()
  }

  async create (options: ServiceCreateOptions): Promise<Service> {
    const interpreter = options.interpreter ? options.interpreter : await locateInterpreterForFile(options.script)
    const scriptName = options.script.split('.')[0]
    const fileContent = await generateServiceFile({
      service: {
        Type: 'exec',
        ExecStart: `${interpreter ? interpreter + ' ' : ''}${options.script}`,
        Restart: 'on-failure'
      },
      unit: {
        Description: 'Service managed by servicectl'
      }
    })
    const repositoryPath = await getRepositoryPath(this.mode)
    // be sure that the path exist
    mkdirRecursive(repositoryPath)
    const serviceFilename = `servicectl.${options.name || scriptName}.service`
    const serviceFilepath = path.resolve(repositoryPath, serviceFilename)
    // write the service file
    await fs.promises.writeFile(serviceFilepath, fileContent)
    // @ts-ignore
    return undefined
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
    throw new Error('Method not implemented.')
  }
}
