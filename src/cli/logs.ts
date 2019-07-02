
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
    const serviceLogs = await api.retrieveLogs(args.name, {
      limit: flags.lines || 15,
      follow: false
    })
    if (serviceLogs.length === 1) {
      const { error, output } = serviceLogs[0]
      error.forEach(line => console.error(`[ERROR] ${line}`))
      output.forEach(line => console.log(`[OUT] ${line}`))
    } else {
      serviceLogs.forEach(serviceLog => {
        const { error, output, service } = serviceLog
        error.forEach(line => console.error(`[${service.instance}] [ERROR] ${line}`))
        output.forEach(line => console.log(`[${service.instance}] [OUT] ${line}`))
      })
    }
    await api.destroy()
  }
}
