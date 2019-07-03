
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'
import { Service } from '../types/service'

export default class LogsCommand extends Command {
  static description = 'Get the log from a service'

  static aliases = ['log', 'logs']

  static flags = {
    help: flags.help({ char: 'h' }),
    lines: flags.integer({
      default: 15,
      char: 'n'
    }),
    follow: flags.boolean({
      default: false,
      char: 'f'
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
    const api = await ServiceAPI.init()
    const follow = flags.follow || false
    const followCallback = (line: string, type: string, service: Service) => {
      const log = type === 'out' ? console.log : console.error
      log(`[${service.instance || 0}] [${type.toUpperCase()}] ${line}`)
    }
    const serviceLogs = await api.retrieveLogs(args.name, {
      limit: flags.lines || 15,
      follow,
      followCallback
    })
    serviceLogs.forEach(serviceLog => {
      const { error, output, service } = serviceLog
      error.forEach(line => console.error(`[${service.instance || 0}] [ERROR] ${line}`))
      output.forEach(line => console.log(`[${service.instance || 0}] [OUT] ${line}`))
    })
    await api.destroy()
  }
}
