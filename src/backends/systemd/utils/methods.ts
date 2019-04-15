
import { map } from 'async'

type PropertyArray = Array<{ [key: string]: Function }>

type Method = {
  name: string
}

export const fetchMethods = async (object: any): Promise<PropertyArray> => {
  const nestedMethods: PropertyArray[] = await map(Object.entries(object.interfaces), async([name, content], nextInterface: Function) => {
    const methods = await map(content['$methods'], async (method: Method, nextMethod: Function) => {
      const obj = {}
      obj[method.name] = content[method.name]
      return nextMethod(null, obj)
    })
    return nextInterface(null, methods)
  })
  return nestedMethods.reduce((allMethods: PropertyArray, methods: PropertyArray) => {
    return allMethods.concat(methods)
  }, [])
}