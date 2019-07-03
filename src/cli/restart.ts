
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'
import { cli } from 'cli-ux'
import ListCommand from './list'

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
    const services = await api.restart(args.name)
    console.log(`Succesfully restarted service: ${args.name}`)
    const servicesWithUsage = await ListCommand.getUsageForServices(services)
    cli.table(servicesWithUsage, ListCommand.headers)
    await api.destroy()
  }
}
