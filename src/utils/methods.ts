
import { map } from 'async'

type PropertyArray = Array<{ [key: string]: Function }>

export const fetchMethods = async (object: any): Promise<PropertyArray> => {
  const nestedMethods: PropertyArray[] = await map(Object.entries(object.interfaces), async([name, content], nextInterface) => {
    const methods = await map(content['$methods'], async (method, nextMethod) => {
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