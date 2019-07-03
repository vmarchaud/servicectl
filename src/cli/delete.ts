
import { Command, flags } from '@oclif/command'
import { ServiceAPI } from '../api'

export default class DeleteCommand extends Command {
  static description = 'Stop and remove a service'

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = [
    {
      name: 'name',
      required: true,
      description: 'Name of the service you want to fetch logs from'
    }
  ]

  async run () {
    const { args, flags } = this.parse(DeleteCommand)
    const api = await ServiceAPI.init()
    if (process.getuid() !== 0) {
      throw new Error(`You must use sudo with servicectl for it to work properly.`)
    }
    await api.delete(args.name)
    console.log(`Succesfully removed service: ${args.name}`)
    await api.destroy()
  }
}
