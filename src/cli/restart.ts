
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'
import { cli } from 'cli-ux'
import ListCommand from './list'
import { Service } from '../types/service'

export default class RestartCommand extends Command {
  static description = 'Restart a service'

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = [
    {
      name: 'name',
      required: true,
      description: 'Name of the service you want to restart'
    }
  ]

  async run () {
    const { args, flags } = this.parse(RestartCommand)
    const api = await ServiceAPI.init()
    if (process.getuid() !== 0) {
      throw new Error(`You must use sudo with servicectl for it to work properly.`)
    }
    let services: Service[] = []
    if (args.name === 'all') {
      services = await api.list()
      await Promise.all(services.map(service => service.restart()))
      services.forEach(service => {
        console.log(`Succesfully restarted service: ${service.name}`)
      })
    } else {
      services = await api.restart(args.name)
      console.log(`Succesfully restarted service: ${args.name}`)
    }
    const servicesWithUsage = await ListCommand.getUsageForServices(services)
    cli.table(servicesWithUsage, ListCommand.headers)
    await api.destroy()
  }
}
