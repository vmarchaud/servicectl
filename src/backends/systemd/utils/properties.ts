
import { map } from 'async'

export const fetchAllProperties = async (object: any): Promise<{ [key: string]: any }> => {
  const interfaces = Object.keys(object.interfaces)
  const allProps = await map(interfaces, async (interfaceName) => {
    const props = await fetchPropertiesForInterface(object, interfaceName)
    return props
  })
  return Object.assign({}, ...allProps)
}

export const fetchPropertiesForInterface = async (object: any, interfaceName: string): Promise<{ [key: string]: any }> => {
  const getProp = object.getInterface('org.freedesktop.DBus.Properties').Get
  const _interface = object.interfaces[interfaceName]
  if (_interface === undefined) throw new Error(`Interface ${interfaceName} not found`)
  const props = {}
  await Promise.all(_interface['$properties'].map(async (prop: { name: string }) => {
    const variant = await getProp(interfaceName, prop.name)
    props[prop.name] = variant.value
  }))
  return props
}
