
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'
import { cli } from 'cli-ux'
import { Service } from '../types/service'

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
    }
  }

  async run () {
    const { args, flags } = this.parse(ListCommand)
    const api = await ServiceAPI.init(ServiceAPIMode.USER)
    const services = await api.list()
    cli.table(services, ListCommand.headers, { ...flags })
    await api.destroy()
  }
}
