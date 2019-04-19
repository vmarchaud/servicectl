
import { map } from 'async'

export const fetchProperties = async (object: any): Promise<Array<{ [key: string]: string }>> => {
  const getProp = object.getInterface('org.freedesktop.DBus.Properties').Get
  const nestedProps = await map(Object.entries(object.interfaces), ([name, content], nextInterface) => {
    map(content['$properties'], (prop, nextProp) => {
      getProp(name, prop.name).then(variant => {
        const obj = {}
        obj[prop.name] = variant.value
        return nextProp(null, obj)
      })
    }, nextInterface)
  })
  return nestedProps.reduce((allProps, props) => {
    return allProps.concat(props)
  }, [])
}
