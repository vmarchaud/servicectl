
export type ServiceUsage = {
  cpu: number,
  mem: number,
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

export interface Service {

  start (): Promise<Service>
  stop (): Promise<Service>
  restart (): Promise<Service>
  kill (code: number): Promise<Service>

  logs (limit: number, offset: number): Promise<string[]>

  usage (): Promise<ServiceUsage>
  limit (): Promise<ServiceLimit>

  processes (): Promise<ServiceProcesses[]>

  pid: number
  state: ServiceState
  description: string
  name: string
  mode: ServiceMode
}
