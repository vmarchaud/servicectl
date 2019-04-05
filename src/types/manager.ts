
import { SystemdUnit } from './unit'
import {SystemdJob} from './job';

export interface SystemdManagerRaw {

  GetUnit (name: string): Promise<{}>
  GetUnitByPID (pid: number): Promise<{}>
  LoadUnit (name: string): Promise<{}>
  StartUnit (name: string, mode: string): Promise<{}>
  StartUnitReplace (oldUnit: string, newUnit: string, mode: string): Promise<{}>
  StopUnit (name: string, mode: string): Promise<string>
  ReloadUnit (name: string, mode: string): Promise<string>
  RestartUnit (name: string, mode: string): Promise<string>
  TryRestartUnit (name: string, mode: string): Promise<string>
  ReloadOrRestartUnit (name: string, mode: string): Promise<string>
  ReloadOrTryRestartUnit (name: string, mode: string): Promise<string>
  KillUnit (name: string, who: string, signal: number): void
  ResetFailedUnit (name: string)

  GetJob (id: number): Promise<{}>
  CancelJob (id: number): Promise<{}>
  ClearJobs (): void
  ResetFailed (): void

  ListUnits (): Promise<Array<any>>
  ListJobs (): Promise<Array<any>>

  Subscribe ()
  Unsubscribe ()
  Reload ()
  Exit ()
  Reboot ()
}

export enum StartMode {
  REPLACE = 'replace',
  FAIL = 'fail',
  ISOLATE = 'isolate',
  IGNORE_DEPENDENCIES = 'ingore-dependencies',
  IGNORE_REQUIREMENT = 'ignore-requirement'
}

export interface SystemdManager {

  /* GetUnit (name: string): SystemdUnit
  GetUnitByPID (pid: number): SystemdUnit
  LoadUnit (name: string): SystemdUnit
  StartUnit (name: string, mode: StartMode): SystemdJob
  StartUnitReplace (oldUnit: string, newUnit: string, mode: StartMode): SystemdJob
  StopUnit (name: string, mode: StartMode): SystemdJob
  ReloadUnit (name: string, mode: StartMode): SystemdJob
  RestartUnit (name: string, mode: StartMode): SystemdJob
  TryRestartUnit (name: string, mode: StartMode): SystemdJob
  ReloadOrRestartUnit (name: string, mode: StartMode): SystemdJob
  ReloadOrTryRestartUnit (name: string, mode: StartMode): SystemdJob
  KillUnit (name: string, who: string, signal: number): void
  ResetFailedUnit (name: string)

  GetJob (id: number): SystemdJob
  CancelJob (id: number): SystemdJob
  ClearJobs (): void
  ResetFailed (): void*/
 
  ListUnits (): Promise<Array<SystemdUnit>>
  ListJobs (): Promise<Array<SystemdJob>>
}
