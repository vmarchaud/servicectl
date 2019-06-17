
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'

export default class LogsCommand extends Command {
  static description = 'Get the log from a service'

  static aliases = ['log', 'logs']

  static flags = {
    help: flags.help({ char: 'h' }),
    lines: flags.integer({
      default: 15,
      char: 'n'
    })
  }

  static args = [
    {
      name: 'name',
      required: true,
      description: 'Name of the service you want to fetch logs from'
    }
  ]

  async run () {
    const { args, flags } = this.parse(LogsCommand)
    const api = await ServiceAPI.init(ServiceAPIMode.USER)
    const { error, output } = await api.retrieveLogs(args.name, {
      limit: flags.lines,
      follow: false
    })
    error.forEach(line => console.error(`[ERROR] ${line}`))
    output.forEach(line => console.log(`[OUT] ${line}`))
    await api.destroy()
  }
}
