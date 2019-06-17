
import { Command, flags } from '@oclif/command'
import { ServiceAPI, ServiceAPIMode } from '../api'
import { cli } from 'cli-ux'
import * as path from 'path'
import ListCommand from './list'

export default class CreateCommand extends Command {
  static description = 'register your application to the init system and run it'

  static flags = {
    help: flags.help({ char: 'h' }),
    interpreter: flags.string({
      description: 'interpreter to use when launching your script (either binary name or absolute path to it)'
    }),
    as: flags.string({
      description: 'Choose permission to assign to the service (either user (default), nobody or root)'
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
    const { args, flags } = this.parse(CreateCommand)
    const scriptPath = path.resolve(process.cwd(), args.filename)
    const api = await ServiceAPI.init(ServiceAPIMode[(flags.as || 'user').toUpperCase()])
    if (process.getuid() !== 0) {
      throw new Error(`You must use sudo with servicectl for it to work properly.`)
    }

    const service = await api.create({
      script: scriptPath,
      interpreter: flags.interpreter
    })
    const usage = await ListCommand.computeUsage(service)
    cli.table([ Object.assign(service, usage) ], ListCommand.headers)
    await api.destroy()
  }
}
