import { EnvironmentEntry } from '../../types/serviceBackend'

export type ServiceType = 'simple' | 'exec' | 'forking' | 'oneshot' | 'dbus' | 'notify' | 'idle'
export type ServiceRestartBehavior = 'no' | 'always' | 'on-success' | 'on-failure' | 'on-abnormal' | 'on-abort' | 'on-watchdog'

export type UnitTemplateOptions = {
  Description: string
  Requires?: string
}

export type ServiceTemplateOptions = {
  Type: ServiceType
  ExecStart: string
  ExecStartPre?: string
  ExecStartPost?: string
  ExecReload?: string
  ExecStop?: string
  RestartSec?: string
  Restart: ServiceRestartBehavior
}

export type PermissionsTemplateOptions = {
  User?: number
  Group?: number
  DynamicUser?: boolean
}

export type ExecTemplateOptions = {
  StandardOutput: string
  StandardError: string
}

export type TemplateOptions = {
  unit: UnitTemplateOptions
  service: ServiceTemplateOptions
  permissions: PermissionsTemplateOptions
  exec: ExecTemplateOptions
  environment: EnvironmentEntry[]
}

export type SocketTemplateOptions = {
  ReusePort: boolean
  ListenStream: number
  Service: string
}
