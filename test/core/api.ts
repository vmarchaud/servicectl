
import { ServiceAPI } from '../../src/api'
import * as assert from 'assert'
import { resolve } from 'path'
import { ServiceMode } from '../../src/types/service'
import { ServiceCreatePermissionMode } from '../../src/types/serviceBackend'

describe('High level API', () => {

  let api: ServiceAPI

  after(async () => {
    if (api === undefined) return
    await api.destroy()
  })

  it('.init (return type)', async () => {
    const initReturn = ServiceAPI.init()
    assert(initReturn instanceof Promise)
    const tmp = await initReturn
    await tmp.destroy()
  })

  it('.init (supported platforms)', async () => {
    const platforms: NodeJS.Platform[] = [
      'aix',
      'android',
      'darwin',
      'freebsd',
      'linux',
      'openbsd',
      'sunos',
      'win32',
      'cygwin'
    ]
    const implemented = [ platforms[4] ]
    await Promise.all(platforms.map(async platform => {
      let assertion = implemented.includes(platform)
        ? assert.doesNotReject : assert.rejects
      await assertion(async () => {
        const tmp = await ServiceAPI.init(platform)
        await tmp.destroy()
      })
    }))
  })

  it('.init (works with default platform)', async () => {
    api = await ServiceAPI.init()
  })

  it('.list (should list 0 service)', async () => {
    assert(typeof api.list === 'function')
    const services = await api.list()
    assert(services.length === 0, 'should have no service running')
  })

  it('.create (should works)', async () => {
    const services = await api.create({
      script: resolve(__dirname, '..', './fixtures/toto.js'),
      name: 'toto',
      mode: ServiceMode.EXEC,
      arguments: [],
      permissionMode: ServiceCreatePermissionMode.NOBODY,
      environment: []
    })
    assert(services.length === 1, 'should have started only one process')
    const service = services[0]
    assert(service.name === 'toto')
  })

  it('.list (should find created process in the list)', async () => {
    let list = await api.list()
    assert(list.length === 1, 'should see the process in the list')
    assert(list[0].name === 'toto', 'should be the same process')
  })

  it('.delete (should stop and delete the service)', async () => {
    await api.delete('toto')
  })

  it('.list (should find no process)', async () => {
    let list = await api.list()
    assert(list.length === 0, 'should see 0 process in the list')
  })

  it('should have high level functions implemented', () => {
    assert(typeof api.create === 'function')
    assert(typeof api.delete === 'function')
    assert(typeof api.destroy === 'function')
    assert(typeof api.list === 'function')
    assert(typeof api.restart === 'function')
    assert(typeof api.retrieveLogs === 'function')
  })
})
