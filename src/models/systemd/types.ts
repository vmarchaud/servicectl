
export type ServiceType = 'simple' | 'exec' | 'forking' | 'oneshot' | 'dbus' | 'notify' | 'idle'
export type ServiceRestartBehavior = 'no' | 'always' | 'on-success' | 'on-failure' | 'on-abnormal' | 'on-abort' | 'on-watchdog'

export type UnitTemplateOptions = {
  Description: string
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

export type TemplateOptions = {
  unit: UnitTemplateOptions
  service: ServiceTemplateOptions
}
