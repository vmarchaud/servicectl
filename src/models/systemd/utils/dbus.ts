
import { ServiceAPIMode } from '../../../api'
import * as dbus from 'dbus-next'

const connectDbus = () => {
  return dbus.systemBus()
}

export const getManager = async (mode: ServiceAPIMode): Promise<SystemdManager> => {
  const bus = connectDbus()
  const proxy = await bus.getProxyObject('org.freedesktop.systemd1', '/org/freedesktop/systemd1')
  const managerAPI = await proxy.getInterface('org.freedesktop.systemd1.Manager')
  managerAPI.bus = bus
  return managerAPI as SystemdManager
}

export const getUnit = async (manager: SystemdManager, path: string): Promise<SystemdUnit> => {
  const object = await manager.bus.getProxyObject('org.freedesktop.systemd1', path)
  const unit = await object.getInterface('org.freedesktop.systemd1.Unit')
  return unit as SystemdUnit
}

export const fetchPropertiesForInterface = async (object: any, interfaceName: string): Promise<{ [key: string]: any }> => {
  const getProp = object.getInterface('org.freedesktop.DBus.Properties').Get
  const _interface = object.interfaces[interfaceName]
  if (_interface === undefined) throw new Error(`Interface ${interfaceName} not found`)
  const props = {}
  await Promise.all(_interface['$properties'].map(async (prop: { name: string }) => {
    const variant = await getProp(interfaceName, prop.name)
    props[prop.name] = variant.value
  }))
  return props
}

export const fetchProperty = async (object: any, _interface: string, property: string) => {
  const getProp = object.getInterface('org.freedesktop.DBus.Properties').Get
  const variant = await getProp(_interface, property)
  return typeof variant === 'object' ? variant.value : variant
}

export enum StartMode {
  REPLACE = 'replace',
  FAIL = 'fail',
  ISOLATE = 'isolate',
  IGNORE_DEPENDENCIES = 'ingore-dependencies',
  IGNORE_REQUIREMENT = 'ignore-requirement'
}

export enum SystemdInterfacesType {
  UNIT = 'org.freedesktop.systemd1.Unit',
  SERVICE = 'org.freedesktop.systemd1.Service'
}

export interface SystemdManager {

  bus: any

  GetUnit (name: string): Promise<string>
  GetUnitByPID (pid: number): Promise<string>
  LoadUnit (name: string): Promise<string>
  StartUnit (name: string, mode: StartMode): Promise<string>
  StartUnitReplace (oldUnit: string, newUnit: string, mode: StartMode): Promise<string>
  StopUnit (name: string, mode: StartMode): Promise<string>
  ReloadUnit (name: string, mode: StartMode): Promise<string>
  RestartUnit (name: string, mode: StartMode): Promise<string>
  TryRestartUnit (name: string, mode: StartMode): Promise<string>
  ReloadOrRestartUnit (name: string, mode: StartMode): Promise<string>
  ReloadOrTryRestartUnit (name: string, mode: StartMode): Promise<string>
  KillUnit (name: string, who: string, signal: number): void
  ResetFailedUnit (name: string): void

  GetJob (id: number): Promise<string>
  CancelJob (id: number): Promise<string>
  ClearJobs (): void
  ResetFailed (): void

  ListUnits (): Promise<Array<any>>
  ListJobs (): Promise<Array<any>>

  Reload (): Promise<void>
}

export interface SystemdUnit {
  Start (mode: StartMode): Promise<string>
  Stop (mode: StartMode): Promise<string>
  Reload (mode: StartMode): Promise<string>
  Restart (mode: StartMode): Promise<string>
  TryRestart (mode: StartMode): Promise<string>
  ReloadOrRestart (mode: StartMode): Promise<string>
  ReloadOrTryRestart (mode: StartMode): Promise<string>
  Kill (who: string, signal: number): void
  ResetFailed (): void
  SetProperties (runtime: boolean, properties: Array<[string, any]>): void
}

export interface SystemdService extends SystemdUnit {
  AttachProcesses (one: string, two: number[])
  GetProcesses (): Array<[string, number, string]>
}

export enum SystemdJobState {
  START = 'start',
  VERIFY_ACTIVE = 'verify-active',
  STOP = 'stop',
  RELOAD = 'reload',
  RESTART = 'restart',
  TRY_RESTART = 'try-restart',
  RELOAD_OR_START = 'reload-or-start'
}

export interface SystemdJob {
  readonly Id: number
  readonly Unit: string
  readonly JobType: SystemdJobState
  readonly State: string
}
