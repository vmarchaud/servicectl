
export type ServiceUsage = {
  cpu: bigint,
  memory: bigint,
  tasks: number
}

export type ServiceLimit = {
  cpu: number,
  mem: number,
  tasks: number
}

export type ServiceProcesses = {
  argv: string[],
  pid: number
}

export enum ServiceMode {
  EXEC = 'exec'
}

export type ServiceState = 'active' | 'reloading' | 'inactive' | 'failed' | 'activating' | 'deactivating'

export type ServiceTimestamps = {
  startedAt: number
}

export interface Service {

  start (): Promise<Service>
  stop (): Promise<Service>
  restart (): Promise<Service>
  kill (code: number): Promise<Service>

  logs (limit: number, offset: number): Promise<string[]>

  usage (): Promise<ServiceUsage>
  limit (): Promise<ServiceLimit>

  processes (): Promise<ServiceProcesses[]>

  getProperty (name: string): Promise<any>

  pid: number
  state: ServiceState
  description: string
  name: string
  mode: ServiceMode

  timestamps: ServiceTimestamps
}
