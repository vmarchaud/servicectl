
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
  EXEC = 'exec',
  FORK = 'fork',
  CLUSTER = 'cluster'
}

export interface Service {

  start (): Promise<Service>
  stop (): Promise<Service>
  restart (): Promise<Service>
  kill (code: number): Promise<Service>

  logs (limit: number, offet: number): Promise<string[]>

  usage (): Promise<ServiceUsage>
  limit (): Promise<ServiceLimit>

  processes (): Promise<ServiceProcesses[]>

  pid: number
  active: boolean
  description: string
  name: string
  mode: ServiceMode
}
