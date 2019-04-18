
import { Service, ServiceLimit, ServiceUsage, ServiceProcesses } from '../../types/service'
import { SystemdService } from '../../backends/systemd/types/service'
import { StartMode } from '../../backends/systemd/types/manager'

export class SimpleSystemdService implements Service {

  private _backendService: SystemdService

  constructor (rawService: SystemdService) {
    this._backendService = rawService
  }

  async start (): Promise<ThisType<Service>> {
    await this._backendService.Start(StartMode.REPLACE)
    return this
  }

  async stop (): Promise<ThisType<Service>> {
    await this._backendService.Stop(StartMode.REPLACE)
    return this
  }

  async restart (): Promise<ThisType<Service>> {
    await this._backendService.Restart(StartMode.REPLACE)
    return this
  }

  async kill (signal: number): Promise<ThisType<Service>> {
    await this._backendService.Kill('one', signal)
    return this
  }

  async logs (limit: number, offet: number): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  async usage (): Promise<ServiceUsage> {
    throw new Error('Method not implemented.')
  }

  async limit (): Promise<ServiceLimit> {
    throw new Error('Method not implemented.')
  }

  async processes (): Promise<ServiceProcesses[]> {
    const processes = await this._backendService.GetProcesses().map(raw => {
      return {
        argv: raw[2].split(' '),
        pid: raw[1]
      } as ServiceProcesses
    })
    return processes
  }

  get pid (): number {
    return this._backendService.MainPID
  }

  get active (): boolean {
    return this._backendService.ActiveState === 'active'
  }

  get description (): string {
    return this._backendService.Description
  }

  get name (): string {
    return this._backendService.Id
  }

  static async fromSystemd (service: SystemdService) {
    return new SimpleSystemdService(service)
  }
}
