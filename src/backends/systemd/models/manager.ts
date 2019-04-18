
import { SystemdManager, SystemdManagerRaw, StartMode } from '../types/manager'
import { getSystemBus } from '../utils/bus'
import { parseRawJob } from './job'
import { fetchUnit } from './unit'
import { SystemdService } from '../types/service'
import { SystemdInterfacesType, hasInterface } from '../types/unit'

export class SystemdManagerImpl implements SystemdManager {

  private _manager: SystemdManagerRaw

  constructor (manager: SystemdManagerRaw) {
    this._manager = manager
  }

  static async init (): Promise<SystemdManagerImpl> {
    const bus = getSystemBus()
    const proxy = await bus.getProxyObject('org.freedesktop.systemd1', '/org/freedesktop/systemd1')
    const managerAPI = await proxy.getInterface('org.freedesktop.systemd1.Manager')
    return new SystemdManagerImpl(managerAPI)
  }

  async destroy () {
    getSystemBus().disconnect()
  }

  async ListUnits () {
    const jobs = await this._manager.ListUnits()
    return []
  }

  async ListJobs () {
    const jobs = await this._manager.ListJobs()
    return jobs.map(job => parseRawJob(job))
  }

  async ReloadUnit (name: string, mode: StartMode) {
    await this._manager.ReloadUnit(name, mode.toString())
    const unitPath = await this._manager.GetUnit(name)
    const unit = await fetchUnit(unitPath)
    return unit
  }

  async GetUnit (name: string) {
    const unitPath = await this._manager.GetUnit(name)
    const unit = await fetchUnit(unitPath)
    return unit
  }

  async GetService (name: string) {
    const unitPath = await this._manager.GetUnit(name)
    const unit = await fetchUnit(unitPath)
    if (!hasInterface(unit, SystemdInterfacesType.SERVICE)) {
      throw new Error(`Unit ${unitPath} isn't a systemd service`)
    }
    return unit as SystemdService
  }
}
