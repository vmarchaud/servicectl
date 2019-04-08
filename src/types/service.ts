import { SystemdUnit } from "./unit"

export interface SystemdService extends SystemdUnit {

  readonly Type: string
  readonly PIDFile: string
  readonly NotifyAccess: string
  readonly RestartUSec: bigint
  readonly TimeoutUSec: bigint
  readonly WatchdogUSec : bigint
  readonly WatchdogTimestamp: bigint
  readonly WatchdogTimestampMonotonic: bigint
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
  readonly EnvironmentFiles: Array<[ string, boolean]>
  readonly UMask: number
  readonly LimitCPU: bigint
  readonly LimitFSIZE: bigint
  readonly LimitDATA: bigint
  readonly LimitSTACK: bigint
  readonly LimitCORE: bigint
  readonly LimitRSS: bigint
  readonly LimitNOFILE: bigint
  readonly LimitAS: bigint
  readonly LimitNPROC: bigint
  readonly LimitMEMLOCK: bigint
  readonly LimitLOCKS: bigint
  readonly LimitSIGPENDING: bigint
  readonly LimitMSGQUEUE: bigint
  readonly LimitNICE: bigint
  readonly LimitRTPRIO: bigint
  readonly LimitRTTIME: bigint
  readonly WorkingDirectory: string
  readonly RootDirectory: string
  readonly OOMScoreAdjust: number
  readonly Nice: number
  readonly IOScheduling: number
  readonly CPUSchedulingPolicy: number
  readonly CPUSchedulingPriority: number
  readonly CPUAffinity: any[]
  readonly TimerSlackNSec: bigint
  readonly CPUSchedulingResetOnFork: boolean
  readonly NonBlocking: boolean
  readonly StandardInput: string
  readonly StandardOutput: string
  readonly StandardError: string
  readonly TTYPath: string
  readonly TTYReset: boolean
  readonly TTYVHangup: boolean
  readonly TTYVTDisallocate: boolean
  readonly SyslogPriority: number
  readonly SyslogIdentifier: string
  readonly SyslogLevelPrefix: boolean
  readonly Capabilities: string
  readonly SecureBits: number
  readonly CapabilityBoundingSet: bigint
  readonly User: string
  readonly Group: string
  readonly SupplementaryGroups: string[];
  readonly TCPWrapName: string;
  readonly PAMName: string
  readonly ReadWriteDirectories: string[]
  readonly ReadOnlyDirectories: string[]
  readonly InaccessibleDirectories: string[]
  readonly MountFlags: bigint
  readonly PrivateTmp: boolean
  readonly PrivateNetwork: boolean
  readonly SameProcessGroup: boolean
  readonly UtmpIdentifier: string
  readonly IgnoreSIGPIPE: boolean
  readonly NoNewPrivileges: boolean
  readonly SystemCallFilter: number[]
  readonly KillMode: string
  readonly KillSignal: number
  readonly SendSIGKILL: boolean
  readonly SendSIGHUP: boolean
  readonly CPUAccounting: boolean
  readonly CPUShares: bigint
  readonly BlockIOAccounting: boolean
  readonly BlockIOWeight: bigint
  readonly BlockIODeviceWeight: Array<[string, bigint]>
  readonly BlockIOReadBandwidth: Array<[string, bigint]>
  readonly BlockIOWriteBandwidth: Array<[string, bigint]>
  readonly MemoryAccounting: boolean
  readonly MemoryLimit: bigint
  readonly DevicePolicy: string
  readonly DeviceAllow: Array<[string, string]>
  readonly PermissionsStartOnly: boolean
  readonly RootDirectoryStartOnly: boolean
  readonly RemainAfterExit: boolean
  readonly ExecMainStartTimestamp: bigint
  readonly ExecMainStartTimestampMonotonic: bigint
  readonly ExecMainExitTimestamp: bigint
  readonly ExecMainExitTimestampMonotonic: bigint
  readonly ExecMainPID: number
  readonly ExecMainCode: number
  readonly ExecMainStatus: number
  readonly MainPID: number
  readonly ControlPID: number
  readonly BusName: string
  readonly StatusText: string
  readonly Result: string

  AttachProcesses(one: string, two: number[])
  GetProcesses(): Array<[string, number, string]>
}