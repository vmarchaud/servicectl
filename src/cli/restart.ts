
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'

export default class RestartCommand extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: 'n', description: 'name to print' }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: 'f' })
  }

  static args = [
    {
      name: 'serviceName',
      required: true
    }
  ]

  async run () {
    const api = await ServiceAPI.init()
    const { args, flags } = this.parse(RestartCommand)
    await api.status()

    await api.destroy()
  }
}
