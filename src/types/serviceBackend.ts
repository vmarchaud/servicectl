
import { Service, ServiceMode } from './service'
import { ServiceAPIMode } from '../api'

export type BackendConfig = {
  mode: ServiceAPIMode
}

export type ServiceCreateOptions = {
  name?: string
  script: string
  interpreter?: string
  mode: ServiceMode
  count?: number
  port?: number
}

export type RetrieveLogsOptions = {
  limit: number
  follow: boolean
}

export interface ServiceBackend {

  init (config: BackendConfig): Promise<ServiceBackend>
  destroy (): Promise<void>

  create (options: ServiceCreateOptions): Promise<Service[]>
  start (name: string): Promise<Service>
  restart (name: string): Promise<Service>
  stop (name: string): Promise<Service>

  get (name: string): Promise<Service>
  list (): Promise<Service[]>
}
