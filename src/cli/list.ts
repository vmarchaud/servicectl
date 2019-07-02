
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'
import { cli } from 'cli-ux'
import { Service, ServiceMode } from '../types/service'
import * as async from 'async'
import { DateTime } from 'luxon'

export default class ListCommand extends Command {
  static description = 'List current loaded services'

  static aliases = ['status', 'ps', 'ls']

  static flags = {
    help: flags.help({ char: 'h' }),
    ...cli.table.flags()
  }

  static headers = {
    name: {
      minWidth: 7,
      get: (service: Service) => {
        return service.mode === ServiceMode.EXEC
          ? service.name : `${service.name}@${service.instance}`
      }
    },
    state: {
      get: (service: Service) => service.state
    },
    mode: {
      get: (service: Service) => service.mode
    },
    uptime: {
      get: (service: Service) => {
        return DateTime
          .fromMillis(service.timestamps.startedAt)
          .toRelative({ style : 'short' })
      }
    },
    cpu: {
      header: 'CPU (%)'
    },
    memory: {
      header: 'Memory (MB)'
    }
  }

  static async computeUsage (service: Service) {
    const usage = await service.usage()
    // convert it to milliseconds
    const cpuUsage = Number(usage.cpu / 1000000n)
    // compute how much time passed since it started in ms
    const msElapsed = Date.now() - service.timestamps.startedAt
    return {
      cpu: (cpuUsage / msElapsed).toFixed(0),
      // convert it to MB
      memory: (Number(usage.memory) / 1024).toFixed(2)
    }
  }

  static async getUsageForServices (services: Service[]) {
    const servicesWithUsage = await async.map(services, (service: Service, next) => {
      ListCommand.computeUsage(service).then(usage => {
        return next(null, Object.assign(service, usage))
      }).catch(next)
    })
    return servicesWithUsage
  }

  async run () {
    const { args, flags } = this.parse(ListCommand)
    const api = await ServiceAPI.init(ServiceAPIMode.USER)
    const services = await api.list()
    const servicesWithUsage = await ListCommand.getUsageForServices(services)
    cli.table(servicesWithUsage, ListCommand.headers, { ...flags })
    await api.destroy()
  }
}
