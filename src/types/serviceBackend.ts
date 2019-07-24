
import { Service, ServiceMode } from './service'

export type BackendConfig = {}

export enum ServiceCreatePermissionMode {
  USER = 'user',
  NOBODY = 'nobody',
  ROOT = 'root'
}

export type EnvironmentEntry = {
  key: string
  value: string
}

export type ServiceCreateOptions = {
  name?: string
  script: string
  interpreter?: string
  mode: ServiceMode
  count?: number
  port?: number
  arguments: string[]
  permissionMode: ServiceCreatePermissionMode | { gid: number, uid: number }
  environment: EnvironmentEntry[]
  enviromentFile?: string
  standardOutPath?: string
  standardErrPath?: string
}

export type RetrieveLogsOptions = {
  limit: number
  follow: boolean
  /**
   * If we ask to follow the logs, we will callback when a new line
   * is emitted
   */
  followCallback?: (line: string, type: string, service: Service) => void
}

export interface ServiceBackend {

  init (config: BackendConfig): Promise<ServiceBackend>
  destroy (): Promise<void>

  create (options: ServiceCreateOptions): Promise<Service[]>
  start (name: string): Promise<Service[]>
  restart (name: string): Promise<Service[]>
  stop (name: string): Promise<Service[]>

  get (name: string): Promise<Service[]>
  list (): Promise<Service[]>
}
