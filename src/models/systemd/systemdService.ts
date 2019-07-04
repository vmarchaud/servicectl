
import { Service, ServiceLimit, ServiceUsage, ServiceProcesses, ServiceMode, ServiceState, ServiceTimestamps, ServiceLogs } from '../../types/service'
import { SystemdManager, SystemdService, fetchProperty, SystemdInterfacesType, StartMode, getSocketForService } from './utils/dbus'
import * as fs from 'fs'
import { getLogsPath, getCreatorForMode, watchFileUpdate } from './utils/common'
import { RetrieveLogsOptions } from '../../types/serviceBackend'
import of from 'await-of'
import { promisify } from 'util'
const fsStats = promisify(fs.stat)

export class SimpleSystemdService implements Service {

  private dbusObject: SystemdService
  private manager: SystemdManager

  name: string
  pid: number
  description: string
  state: ServiceState
  mode: ServiceMode = ServiceMode.EXEC
  timestamps: ServiceTimestamps
  instance: string = ''

  constructor (dbusObject: SystemdService, manager: SystemdManager) {
    this.dbusObject = dbusObject
    this.manager = manager
  }

  async start (): Promise<Service> {
    await this.dbusObject.Start(StartMode.REPLACE)
    await this._load()
    return this
  }

  async stop (): Promise<Service> {
    await this.dbusObject.Stop(StartMode.REPLACE)
    await this._load()
    return this
  }

  async restart (): Promise<Service> {
    await this.dbusObject.Restart(StartMode.REPLACE)
    await this._load()
    return this
  }

  async kill (signal: number): Promise<Service> {
    this.dbusObject.Kill('servicectl', signal)
    await this._load()
    return this
  }

  async logs (options: RetrieveLogsOptions): Promise<ServiceLogs> {
    const logsPath = await getLogsPath()
    const filesType = [ 'out', 'err' ]
    let outLines: string[] = []
    let errorLines: string[] = []
    const getLogPath = (type) => {
      let path: string
      if (this.instance.length > 0) {
        path = `${logsPath}/${this.name}.${type}.${this.instance}.log`
      } else {
        path = `${logsPath}/${this.name}.${type}.log`
      }
      return path
    }

    await Promise.all(filesType.map(async (type) => {
      const path = getLogPath(type)
      const [ stats, err ] = await of(fsStats(path))
      if (err) {
        return {
          output: [],
          error: [],
          service: this
        }
      }
      const start = stats.size - (options.limit * 100)
      const stream = fs.createReadStream(path, {
        start: start < 0 ? 0 : start
      })
      return new Promise((resolve, reject) => {
        const chunks: string[] = []
        stream.on('data', (chunk) => chunks.push(chunk.toString()))
        stream.on('error', reject)
        stream.on('close', () => {
          const lines: string[] = chunks.join('').split('\n').filter(line => line.length > 0)
          if (type === 'out') {
            outLines = lines.slice(lines.length - options.limit, lines.length)
          } else {
            errorLines = lines.slice(lines.length - options.limit, lines.length)
          }
          return resolve()
        })
      })
    }))
    // handle log follow
    let cancelFollows: Function[] = []
    if (options.follow && typeof options.followCallback === 'function') {
      await Promise.all(filesType.map(async type => {
        const cancel = await watchFileUpdate(getLogPath(type), (line: string) => {
          // @ts-ignore will not be removed
          options.followCallback(line, type, this)
        })
        cancelFollows.push(cancel)
      }))
    }
    let cancelFollow = () => cancelFollows.forEach(fn => fn())
    return {
      output: outLines,
      error: errorLines,
      service: this,
      cancelFollow: cancelFollows.length > 0 ? cancelFollow : undefined
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
    const instanceNameRegex = /@([0-9])./.exec(name)
    if (instanceNameRegex !== null && instanceNameRegex[1].length > 0) {
      const instanceName = instanceNameRegex[1]
      this.instance = instanceNameRegex[1]
      this.name = this.name.replace(`@${instanceName}`, '')
      this.mode = ServiceMode.CLUSTER
    }
    this.pid = await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'MainPID')
    this.description = await fetchProperty(this.dbusObject, SystemdInterfacesType.UNIT, 'Description')
    this.state = await fetchProperty(this.dbusObject, SystemdInterfacesType.UNIT, 'ActiveState')

    const startedAt: bigint = await fetchProperty(this.dbusObject, SystemdInterfacesType.SERVICE, 'ExecMainStartTimestamp')
    this.timestamps = {
      // by default it's in microseconds, we can use milliseconds here
      startedAt: Math.round(Number(startedAt) / 1000)
    }
  }

  async delete () {
    const creator = await getCreatorForMode(this.mode)
    await creator.disable(this, this.manager)
    await creator.removeFiles(this)
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
    let object = await manager.bus.getProxyObject('org.freedesktop.systemd1', unit[6])
    const unitMethods = await object.getInterface('org.freedesktop.systemd1.Unit')
    const serviceMethods = await object.getInterface('org.freedesktop.systemd1.Service')
    object = Object.assign(object, unitMethods, serviceMethods)
    const simpleService = new SimpleSystemdService(object, manager)
    await simpleService._load()
    return simpleService
  }

  /**
   * Construct a SimpleSystemdService from the dbus object
   */
  static async fromSystemdObject (manager: SystemdManager, object: any): Promise<SimpleSystemdService> {
    const unitMethods = await object.getInterface('org.freedesktop.systemd1.Unit')
    const serviceMethods = await object.getInterface('org.freedesktop.systemd1.Service')
    object = Object.assign(object, unitMethods, serviceMethods)
    const simpleService = new SimpleSystemdService(object, manager)
    await simpleService._load()
    return simpleService
  }
}
