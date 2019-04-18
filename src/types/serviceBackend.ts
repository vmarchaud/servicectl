
import { Service } from './service'

export type BackendConfig = {

}

export interface ServiceBackend {

  init (config: BackendConfig): Promise<ThisType<ServiceBackend>>
  destroy (): Promise<void>

  create (): Promise<Service>
  start (name: string): Promise<Service>
  restart (name: string): Promise<Service>
  stop (name: string): Promise<Service>

  get (name: string): Promise<Service>
}
