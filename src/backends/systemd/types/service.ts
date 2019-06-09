import { SystemdUnit } from './unit'

export interface SystemdService extends SystemdUnit {

  readonly Type: string
  readonly PIDFile: string
  readonly NotifyAccess: string
  readonly RestartUSec: bigint
  readonly TimeoutUSec: bigint
  readonly WatchdogUSec: bigint
  readonly StartLimitInterval: bigint
  readonly StartLimitBurst: number
  readonly StartLimitAction: string
  readonly Slice: string
  readonly ControlGroup: string
  readonly ExecStartPre: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly ExecStart: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly ExecStartPost: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly ExecReload: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly ExecStop: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly ExecStopPost: Array<[string, string[], boolean, bigint, bigint, number, number]>
  readonly Environment: string[]
  readonly EnvironmentFiles: Array<[string, boolean]>
  readonly UMask: number
  readonly WorkingDirectory: string
  readonly RootDirectory: string
  readonly StandardInput: string
  readonly StandardOutput: string
  readonly StandardError: string
  readonly User: string
  readonly Group: string
  readonly KillSignal: number
  readonly SendSIGKILL: boolean
  readonly SendSIGHUP: boolean
  readonly MemoryAccounting: boolean
  readonly MemoryLimit: bigint
  readonly ExecMainStartTimestamp: bigint
  readonly ExecMainExitTimestamp: bigint
  readonly ExecMainPID: number
  readonly ExecMainCode: number
  readonly ExecMainStatus: number
  readonly MainPID: number
  readonly ControlPID: number
  readonly BusName: string
  readonly StatusText: string
  readonly Result: string

  AttachProcesses (one: string, two: number[])
  GetProcesses (): Array<[string, number, string]>
}

export type ServiceTemplate = {
  Type: 'simple' | 'exec' | 'forking' | 'oneshot' | 'dbus' | 'notify' | 'idle'
  ExecStart: string
  ExecStartPre?: string
  ExecStartPost?: string
  ExecReload?: string
  ExecStop?: string
  RestartSec?: string
}
