
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'
import { cli } from 'cli-ux'
import * as path from 'path'
import ListCommand from './list'
import { Service } from '../types/service'
import { PM2Configuration, convertPM2ToService } from '../utils/converter'

export default class CreateCommand extends Command {
  static description = 'import an application declaration from another tool configuration.'

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = [
    {
      name: 'tool',
      required: true,
      description: 'Name of the tool that you wish to import from'
    },
    {
      name: 'file',
      required: true,
      description: 'Path of the file where the definition of your app is'
    }
  ]

  static strict = false

  async run () {
    const { args, flags } = this.parse(CreateCommand)
    const api = await ServiceAPI.init()
    if (process.getuid() !== 0) {
      throw new Error(`You must use sudo with servicectl for it to work properly.`)
    }
    const filePath = path.resolve(process.cwd(), args.file)
    switch (args.tool) {
      case 'pm2': {
        const configs = require(filePath).apps as PM2Configuration[]
        const services: Service[] = []
        await Promise.all(configs.map(async conf => {
          const translatedConf = convertPM2ToService(conf)
          try {
            const tmpServices = await api.create(translatedConf)
            tmpServices.forEach(service => services.push(service))
            console.error(`Successfully imported application: ${conf.name}`)
          } catch (err) {
            console.error(`Failed to import application: ${conf.name}`, err.message)
          }
        }))
        const servicesWithUsage = await ListCommand.getUsageForServices(services)
        cli.table(servicesWithUsage, ListCommand.headers)
        break
      }
      default: {
        throw new Error(`Sorry but you cannot currently import from ${args.tool}.`)
      }
    }
    await api.destroy()
  }
}
