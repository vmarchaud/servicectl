
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'
import { cli } from 'cli-ux'
import { Service } from '../types/service'
import * as async from 'async'
import * as moment from 'moment'

export default class ListCommand extends Command {
  static description = 'List current loaded services'

  static flags = {
    help: flags.help({ char: 'h' }),
    ...cli.table.flags()
  }

  static headers = {
    name: {
      minWidth: 7,
      get: (service: Service) => service.name
    },
    state: {
      get: (service: Service) => service.state
    },
    mode: {
      get: (service: Service) => service.mode
    },
    cpu: {
      header: 'CPU (%)'
    },
    memory: {
      header: 'Memory (MB)'
    }
  }

  async run () {
    const { args, flags } = this.parse(ListCommand)
    const api = await ServiceAPI.init(ServiceAPIMode.USER)
    const services = await api.list()
    const servicesWithUsage = await async.mapLimit(services, 5, (service: Service, next) => {
      service.usage().then(usage => {
        // convert it to milliseconds
        const cpuUsage = Number(usage.cpu / 1000000n)
        // compute how much time passed since it started in ms
        const msElapsed = Date.now() - service.timestamps.startedAt
        return next(null, Object.assign(service, {
          cpu: (cpuUsage / msElapsed).toFixed(0),
          // convert it to MB
          memory: (Number(usage.memory) / 1024).toFixed(2)
        }))
      }).catch(next)
    })
    cli.table(servicesWithUsage, ListCommand.headers, { ...flags })
    await api.destroy()
  }
}
