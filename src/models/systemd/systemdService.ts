
import { Service, ServiceLimit, ServiceUsage, ServiceProcesses, ServiceMode, ServiceState, ServiceTimestamps, ServiceLogs } from '../../types/service'
import { SystemdManager, SystemdService, fetchProperty, SystemdInterfacesType } from './utils/dbus'
import * as fs from 'fs'
import { getLogsPath } from './utils/common'
import { RetrieveLogsOptions } from '../../types/serviceBackend'

export class SimpleSystemdService implements Service {

  private dbusObject: SystemdService

  name: string
  pid: number
  description: string
  state: ServiceState
  mode = ServiceMode.EXEC
  timestamps: ServiceTimestamps
  instance = 0

  constructor (dbusObject: SystemdService) {
    this.dbusObject = dbusObject
  }

  async start (): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async stop (): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async restart (): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async kill (signal: number): Promise<Service> {
    throw new Error('Method not implemented.')
  }

  async logs (options: RetrieveLogsOptions): Promise<ServiceLogs> {
    const logsPath = await getLogsPath()
    const filesType = [ 'out', 'err' ]
    let outLines: string[] = []
    let errorLines: string[] = []

    await Promise.all(filesType.map((type) => {
      const path = `${logsPath}/${this.name}.${type}.log`
      const size = fs.statSync(path).size
      const stream = fs.createReadStream(path, {
        start: size - (options.limit * 100)
      })
      return new Promise((resolve, reject) => {
        const chunks: string[] = []
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('close', () => {
          const lines: string[] = chunks.join('').split('\n').filter(line => line.length > 0)
          if (type === 'out') {
            outLines = lines.slice(lines.length - 1 - options.limit, lines.length - 1)
          } else {
            errorLines = lines.slice(lines.length - 1 - options.limit, lines.length - 1)
          }
          return resolve()
        })
      })
    }))
    return {
      output: outLines,
      error: errorLines
    }
  }

  async usage (): Promise<ServiceUsage> {
    const usage: ServiceUsage = {
      cpu: await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'CPUUsageNSec'),
      memory: await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'MemoryCurrent') / 1024n,
      tasks: await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'TasksCurrent')
    }
    return usage
  }

  async limit (): Promise<ServiceLimit> {
    throw new Error('Method not implemented.')
  }

  async processes (): Promise<ServiceProcesses[]> {
    const processes = this.dbusObject.GetProcesses().map(raw => {
      return {
        argv: raw[2].split(' '),
        pid: raw[1]
      } as ServiceProcesses
    })
    return processes
  }

  /**
   * Used to load lazy properties
   */
  async _load () {
    const name: string = await fetchProperty(this.dbusObject, SystemdInterfacesType.UNIT, 'Id')
    this.name = name.replace('servicectl.', '').replace('.service', '')
    this.pid = await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'MainPID')
    this.description = await fetchProperty(this.dbusObject, SystemdInterfacesType.UNIT, 'Description')
    this.state = await fetchProperty(this.dbusObject, SystemdInterfacesType.UNIT, 'ActiveState')

    const startedAt: bigint = await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'ExecMainStartTimestamp')
    this.timestamps = {
      // by default it's in microseconds, we can use milliseconds here
      startedAt: Math.round(Number(startedAt) / 1000)
    }
  }

  async getProperty (name: string) {
    const value = await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, name)
    return value
  }

  /**
   * Fetch a service by its name and construct a SimpleSystemdService with the dbus object
   */
  static async fromSystemd (manager: SystemdManager, service: string): Promise<SimpleSystemdService> {
    const units = await manager.ListUnits()
    const unit = units.find(unit => unit[0] === service)
    const object = await manager.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
    const simpleService = new SimpleSystemdService(object)
    await simpleService._load()
    return simpleService
  }

  /**
   * Construct a SimpleSystemdService from the dbus object
   */
  static async fromSystemdObject (manager: SystemdManager, object: any): Promise<SimpleSystemdService> {
    const simpleService = new SimpleSystemdService(object)
    await simpleService._load()
    return simpleService
  }
}
