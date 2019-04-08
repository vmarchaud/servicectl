import { SystemdService } from '../types/service'
import { getSystemBus } from '../utils/bus'
import { map } from 'async'
import { fetchProperties } from '../utils/properties'
import {fetchMethods} from '../utils/methods'

export const fetchService = async (path: string): Promise<SystemdService> => {
  const bus = getSystemBus()
  const unitObject = await bus.getProxyObject('org.freedesktop.systemd1', path)
  const props = await fetchProperties(unitObject)
  const methods = await fetchMethods(unitObject)
  const unitInterface = unitObject.getInterface('org.freedesktop.systemd1.Unit')
  const serviceInterface = unitObject.getInterface('org.freedesktop.systemd1.Service')
  const getProp = unitObject.getInterface('org.freedesktop.DBus.Properties').Get
  const unitProps = await map(unitInterface['$properties'], async(prop, next: Function) => {
    const variant = await getProp('org.freedesktop.systemd1.Unit', prop.name)
    const obj = {}
    obj[prop.name] = variant.value
    return next(null , obj)
  })
  const unitProps = await map(unitInterface['$properties'], async(prop, next: Function) => {
    const variant = await getProp('org.freedesktop.systemd1.Unit', prop.name)
    const obj = {}
    obj[prop.name] = variant.value
    return next(null , obj)
  })
  const unit = Object.assign({}, ...unitInterface, ...props) as SystemdService
  unit['$methods'] = undefined
  unit['$properties'] = undefined
  return unit
}