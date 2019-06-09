
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'
import * as path from 'path'

export default class StartCommand extends Command {
  static description = 'register your application to the init system and run it'

  static flags = {
    help: flags.help({ char: 'h' }),
    interpreter: flags.string({
      description: 'interpreter to use when launching your script (either binary name or absolute path to it)'
    }),
    system: flags.boolean({
      description: 'connect to the root init system (means that your process will be started as root)'
    })
  }

  static args = [
    {
      name: 'filename',
      required: true,
      description: 'Path of the file to run by the init system'
    }
  ]

  async run () {
    const { args, flags } = this.parse(StartCommand)
    const api = await ServiceAPI.init(flags.system ? ServiceAPIMode.SYSTEM : ServiceAPIMode.USER)
    const scriptPath = path.resolve(process.cwd(), args.filename)
    await api.create({
      script: scriptPath,
      interpreter: flags.interpreter
    })
    await api.destroy()
  }
}
