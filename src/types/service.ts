
export interface ServiceUsage {
  cpu: number,
  mem: number,
  tasks: number
}

export interface ServiceLimit {
  cpu: number,
  mem: number,
  tasks: number
}

export interface ServiceProcesses {
  argv: string[],
  pid: number
}

export interface Service {

  start (): Promise<ThisType<Service>>
  stop (): Promise<ThisType<Service>>
  restart (): Promise<ThisType<Service>>
  kill (string: number): Promise<ThisType<Service>>

  logs (limit: number, offet: number): Promise<string[]>

  usage (): Promise<ServiceUsage>
  limit (): Promise<ServiceLimit>

  processes (): Promise<ServiceProcesses[]>

  pid: number
  active: boolean
  description: string
  name: string
}