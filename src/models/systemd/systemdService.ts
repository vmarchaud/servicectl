
import { Service, ServiceLimit, ServiceUsage, ServiceProcesses, ServiceMode, ServiceState } from '../../types/service'
import { SystemdManager, SystemdService, fetchProperty, SystemdInterfacesType } from './utils/dbus'

export class SimpleSystemdService implements Service {

  private dbusObject: SystemdService

  name: string
  pid: number
  description: string
  state: ServiceState
  mode = ServiceMode.EXEC

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

  async logs (limit: number, offet: number): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  async usage (): Promise<ServiceUsage> {
    throw new Error('Method not implemented.')
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
