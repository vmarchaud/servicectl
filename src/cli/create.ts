
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'
import { cli } from 'cli-ux'
import * as path from 'path'
import ListCommand from './list'
import { ServiceMode } from '../types/service'
import {
  ServiceCreatePermissionMode,
  EnvironmentEntry
} from '../types/serviceBackend'

export default class CreateCommand extends Command {
  static description = 'register your application to the init system and run it'

  static flags = {
    help: flags.help({ char: 'h' }),
    interpreter: flags.string({
      description: 'interpreter to use when launching your script (either binary name or absolute path to it)'
    }),
    as: flags.string({
      description: 'Choose permission to assign to the service (either user (default), nobody or root)'
    }),
    instances: flags.integer({
      description: 'Choose how many instances of the service will be launched'
    }),
    port: flags.integer({
      description: 'If using cluster mode, on which port you want the cluster to listen'
    }),
    name: flags.string({
      description: 'Choose a custom name of your service'
    }),
    'import-env': flags.boolean({
      description: 'Import the current shell environment into the service'
    }),
    env: flags.string({
      description: 'Add custom environment varialbe into the service',
      multiple: true,
      char: 'e'
    }),
    'env-file': flags.string({
      description: 'Specially a file from which environment will be loaded from'
    })
  }

  static args = [
    {
      name: 'filename',
      required: true,
      description: 'Path of the file to run by the init system'
    }
  ]

  static strict = false

  async run () {
    const { args, flags } = this.parse(CreateCommand)
    const scriptPath = path.resolve(process.cwd(), args.filename)
    const api = await ServiceAPI.init()
    if (process.getuid() !== 0) {
      throw new Error(`You must use sudo with servicectl for it to work properly.`)
    }
    console.log(flags.env)
    const customArgvDelimiter = process.argv.findIndex(arg => arg === '--')
    const customArgv = customArgvDelimiter > -1
      ? process.argv.splice(customArgvDelimiter + 1, process.argv.length - customArgvDelimiter) : []
    const currentEnv: EnvironmentEntry[] = Object.keys(process.env).map(key => {
      return { key, value: process.env[key] || '' }
    })
    const customEnv = (flags.env || []).filter(value => {
      if (value.indexOf('=') === -1) {
        console.error(`Invalid env value: ${value}, must contain '=', ignoring.`)
        return false
      }
      return true
    }).map(stringValue => {
      const [ key, value ] = stringValue.split('=')
      return { key, value }
    })
    const services = await api.create({
      name: flags.name,
      script: scriptPath,
      interpreter: flags.interpreter,
      mode: flags.instances ? ServiceMode.CLUSTER : ServiceMode.EXEC,
      count: flags.instances,
      port: flags.port,
      permissionMode: ServiceCreatePermissionMode[(flags.as || 'user').toUpperCase()],
      arguments: customArgv,
      environment: flags['import-env'] ? Object.assign(currentEnv, customEnv) : customEnv,
      enviromentFile: flags['env-file']
    })
    const servicesWithUsage = await ListCommand.getUsageForServices(services)
    cli.table(servicesWithUsage, ListCommand.headers)
    await api.destroy()
  }
}
