
import { getSystemBus } from '../utils/bus'
import { fetchProperties } from '../utils/properties'
import { fetchMethods } from '../utils/methods'
import { SystemdUnit } from '../types/unit'

export const parseRawUnit = async (raw: any[]): Promise<SystemdUnit> => {
  const name = raw[0] as string
  const path = raw[6] as string
  const unit = await fetchUnit(path)
  return unit
}

export const fetchUnit = async (path: string): Promise<SystemdUnit> => {
  const bus = getSystemBus()
  const unitObject = await bus.getProxyObject('org.freedesktop.systemd1', path)
  const props = await fetchProperties(unitObject)
  const methods = await fetchMethods(unitObject)
  const unit = Object.assign(
    {},
    { interfaces: unitObject.interfaces },
    ...props,
    ...methods) as SystemdUnit
  return unit
}
