
import { SystemdUnit } from '../types/unit'
import * as dbus from 'dbus-next'

export class SystemdUnitImpl implements SystemdUnit {

  private _name: string
  private _description: string
  private _following: string
  private _activeState: string
  private _loaded: string
  private _substate: string
  private _path: string
  private _jobId?: number
  private _jobPath: string

  constructor (name, desc, following, active, loaded, substate, path, jobId, jobPath) {
    this._name = name
    this._description = desc
    this._following = following
    this._activeState = active
    this._loaded = loaded
    this._substate = substate
    this._path = path
    this._jobId = jobId
    this._jobPath = jobPath
  }

  get Id (): string {
    return this._name
  }
  get Following (): string{
    return this._following
  }
  get LoadState (): string{
    return this._loaded
  }
  get ActiveState (): string{
    return this._activeState
  }
  get SubState (): string{
    return this._substate
  }
  get Description (): string{
    return this._description
  }
  get SourcePath (): string {
    return this._path
  }
  get Job (): [number, string] {
    return [ this._jobId || 0, this._jobPath]
  }

  Start (mode: string) {
    return null
  }

  Stop (mode: string) {
    return null
  }

  Reload (mode: string) {
    const bus = dbus.systemBus()
    return null
  }

  Restart (mode: string) {
    return null
  }

  TryRestart (mode: string) {
    return null
  }

  ReloadOrRestart (mode: string) {
    return null
  }

  ReloadOrTryRestart (mode: string) {
    return null
  }

  Kill (who: string, signal: number) {

  }

  ResetFailed () {

  }

  SetProperties(runtime: boolean, properties: Array<[string, any]>) {

  }
}

export const parseRawUnit = (raw: any[]): SystemdUnit => {
  const name = raw[0] as string
  const description = raw[1] as string
  const loadState = raw[2] as string
  const activeState = raw[3] as string
  const subState = raw[4] as string
  const following = raw[5] as string
  const path = raw[6] as string
  const jobNumber = raw[7] as number
  const jobPath = raw[9] as string
  return new SystemdUnitImpl(name, description, following, activeState,
      loadState, subState, path, jobNumber, jobPath)
}

export const fetchUnit = async (path: string): Promise<SystemdUnit> => {
  const bus = dbus.systemBus()
  let unit = await bus.getProxyObject('org.freedesktop.systemd1', path)
  console.log(unit)
  return parseRawUnit(unit)
}