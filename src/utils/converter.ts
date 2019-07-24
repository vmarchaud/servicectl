
import {
  ServiceCreateOptions,
  ServiceCreatePermissionMode,
  EnvironmentEntry
} from '../types/serviceBackend'
import { ServiceMode } from '../types/service'
import * as path from 'path'

export type PM2Configuration = {
  script: string
  name?: string
  cwd?: string
  args?: string[] | string
  exec_interpreter?: string
  out_file?: string
  output?: string
  out?: string
  error_file?: string
  error?: string
  err?: string
  disable_logs?: boolean
  env?: string | {[key: string]: any}
  instances?: number
  exec_mode?: string
  port?: number
  uid?: number
  gid?: number
}

export const convertPM2ToService = (conf: PM2Configuration): ServiceCreateOptions => {
  const mode = conf.exec_mode.includes('cluster') ? ServiceMode.CLUSTER : ServiceMode.EXEC
  let args: string[] = conf.args instanceof Array ? conf.args : []
  if (typeof conf.args === 'string') {
    args = args.concat(conf.args.split(' '))
  }
  const currentEnv: EnvironmentEntry[] = Object.keys(process.env).map(key => {
    return { key, value: JSON.stringify(process.env[key] || '') }
  })
  const injectedEnv: EnvironmentEntry[] = Object.keys(conf.env || {}).map(key => {
    return { key, value: JSON.stringify(process.env[key] || '') }
  })
  const env: EnvironmentEntry[] = currentEnv.concat(injectedEnv)
  const asPermissionSet = conf.uid !== undefined && conf.gid !== undefined
  const standardOutPath = conf.disable_logs === true ?
    '/dev/null' : (conf.out || conf.out_file || conf.output)
  const standardErrPath = conf.disable_logs === true ?
    'dev/null' : (conf.err || conf.error_file || conf.error)
  // translated options to create service
  const serviceCreateOptions: ServiceCreateOptions = {
    name: conf.name,
    script: path.resolve(process.cwd(), conf.script),
    mode,
    count: conf.instances || 1,
    arguments: args,
    environment: env,
    permissionMode: asPermissionSet ? {
      uid: conf.uid,
      gid: conf.gid
    } : ServiceCreatePermissionMode.USER,
    standardOutPath,
    standardErrPath
  }
  return serviceCreateOptions
}
