
import { map } from 'async'

export const fetchProperties = async (object: any): Promise<Array<{ [key: string]: string }>> => {
  const getProp = object.getInterface('org.freedesktop.DBus.Properties').Get
  const nestedProps = await map(Object.entries(object.interfaces), async ([name, content], nextInterface) => {
    const props = await map(content['$properties'], async (prop, nextProp) => {
      const variant = await getProp(name, prop.name)
      const obj = {}
      obj[prop.name] = variant.value
      return nextProp(null, obj)
    })
    return nextInterface(null, props)
  })
  return nestedProps.reduce((allProps, props) => {
    return allProps.concat(props)
  }, [])
}