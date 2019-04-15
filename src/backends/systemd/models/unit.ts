
import { getSystemBus } from '../utils/bus'
import { fetchProperties } from '../utils/properties'
import { fetchMethods } from '../utils/methods'
import { SystemdUnit } from '../types/unit'

/*export const parseRawUnit = (raw: any[]): SystemdUnit => {
  const name = raw[0] as string
  const description = raw[1] as string
  const loadState = raw[2] as string
  const activeState = raw[3] as string
  const subState = raw[4] as string
  const following = raw[5] as string
  const path = raw[6] as string
  const jobNumber = raw[7] as number
  const jobPath = raw[9] as string
  return new SystemdUnitImpl(name, description, following, activeState,
      loadState, subState, path, jobNumber, jobPath)
}*/

export const fetchUnit = async (path: string): Promise<SystemdUnit> => {
  const bus = getSystemBus()
  const unitObject = await bus.getProxyObject('org.freedesktop.systemd1', path)
  const props = await fetchProperties(unitObject)
  const methods = await fetchMethods(unitObject)
  const unit = Object.assign(
    {},
    { interfaces: unitObject.interfaces },
    ...methods,
    ...props) as SystemdUnit
  return unit
}