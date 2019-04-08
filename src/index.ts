
import { SystemdManagerImpl } from './models/manager'
import {StartMode} from './types/manager';

const run = async () => {
  const manager = await SystemdManagerImpl.init()
  const unit = await manager.GetService('docker.service')
  console.log(await unit.GetProcesses())
  manager.destroy()
}

run()
