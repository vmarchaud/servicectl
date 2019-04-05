
import { SystemdManagerImpl } from './models/manager'
import {StartMode} from './types/manager';

const run = async () => {
  const manager = await SystemdManagerImpl.init()
  const toto = await manager.ListUnits()
  await manager.ReloadUnit('docker.service', StartMode.REPLACE)
  manager.destroy()
}

run()
