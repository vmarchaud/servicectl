import { SystemdJob } from './job'

export enum SystemdInterfacesType {
  UNIT = 'org.freedesktop.systemd1.Unit',
  SERVICE = 'org.freedesktop.systemd1.Service'
}

export const hasInterface = (object: any, interfaceType: SystemdInterfacesType) => {
  return object.interfaces[interfaceType] !== undefined
}

export interface SystemdUnit {

  readonly Id: string
  readonly Following: string
  readonly LoadState: string
  readonly ActiveState: string
  readonly SubState: string
  readonly Description: string
  readonly SourcePath: string
  readonly Job: [number, string]

  readonly Names: string[]
  readonly Requires: string[]
  readonly RequiresOverridable: string[]
  readonly Requisite: string[]
  readonly RequisiteOverridable: string[]
  readonly Wants: string[]
  readonly BindsTo: string[]
  readonly PartOf: string[]
  readonly RequiredBy: string[]
  readonly RequiredByOverridable: string[]
  readonly WantedBy: string[]
  readonly BoundBy: string[]
  readonly ConsistsOf: string[]
  readonly Conflicts: string[]
  readonly ConflictedBy: string[]
  readonly Before: string[]
  readonly After: string[]
  readonly OnFailure: string[]
  readonly Triggers: string[]
  readonly TriggeredBy: string[]
  readonly PropagatesReloadTo: string[]
  readonly ReloadPropagatedFrom: string[]
  readonly RequiresMountsFor: string[]
  readonly DropInPaths: string[]
  readonly Documentation: string[]
  readonly FragmentPath: string
  readonly UnitFileState: string
  readonly InactiveExitTimestamp: number
  readonly InactiveExitTimestampMonotonic: number
  readonly ActiveEnterTimestamp: number
  readonly ActiveEnterTimestampMonotonic: number
  readonly ActiveExitTimestamp: number
  readonly ActiveExitTimestampMonotonic: number
  readonly InactiveEnterTimestamp: number
  readonly InactiveEnterTimestampMonotonic: number
  readonly CanStart: boolean
  readonly CanStop: boolean
  readonly CanReload: boolean
  readonly CanIsolate: boolean
  readonly StopWhenUnneeded: boolean
  readonly RefuseManualStart: boolean
  readonly RefuseManualStop: boolean
  readonly AllowIsolate: boolean
  readonly DefaultDependencies: boolean
  readonly OnFailureIsolate: boolean
  readonly IgnoreOnIsolate: boolean
  readonly IgnoreOnSnapshot: boolean
  readonly NeedDaemonReload: boolean
  readonly JobTimeoutUSec: Date
  readonly ConditionTimestamp: Date
  readonly ConditionTimestampMonotonic: Date
  readonly ConditionResult: boolean
  readonly Conditions: Array<[string, boolean, boolean, string, number]>
  readonly LoadError: [string, string]
  readonly Transient: boolean

  Start (mode: string): SystemdJob
  Stop (mode: string): SystemdJob
  Reload (mode: string): SystemdJob
  Restart (mode: string): SystemdJob
  TryRestart (mode: string): SystemdJob
  ReloadOrRestart (mode: string): SystemdJob
  ReloadOrTryRestart (mode: string): SystemdJob
  Kill (who: string, signal: number): void
  ResetFailed (): void
  SetProperties (runtime: boolean, properties: Array<[string, any]>)
}
