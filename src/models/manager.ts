
import { SystemdManager, SystemdManagerRaw, StartMode } from '../types/manager'
import * as dbus from 'dbus-next'
import {parseRawJob, fetchJob} from './job';
import {parseRawUnit} from './unit';

export class SystemdManagerImpl implements SystemdManager {

  private bus: any
  private _manager: SystemdManagerRaw

  constructor (bus: any, manager: SystemdManagerRaw) {
    this.bus = bus
    this._manager = manager
  }

  static async init (): Promise<SystemdManagerImpl> {
    const bus = dbus.systemBus()
    const proxy = await bus.getProxyObject('org.freedesktop.systemd1', '/org/freedesktop/systemd1')
    const managerAPI = await proxy.getInterface('org.freedesktop.systemd1.Manager')
    return new SystemdManagerImpl(bus, managerAPI)
  }

  async destroy () {
    this.bus.disconnect()
  }

  async ListUnits () {
    const jobs = await this._manager.ListUnits()
    return jobs.map(job => parseRawUnit(job))
  }

  async ListJobs () {
    const jobs = await this._manager.ListJobs()
    return jobs.map(job => parseRawJob(job))
  }

  async ReloadUnit (name: string, mode: StartMode) {
    const jobPath = await this._manager.ReloadUnit(name, mode.toString())
    const job = await fetchJob(jobPath)
    console.log(job)
  }
}