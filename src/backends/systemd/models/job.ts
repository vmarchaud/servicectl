
import { SystemdJob, SystemdJobState } from '../types/job'
import { getSystemBus } from '../utils/bus'

export class SystemdJobImpl implements SystemdJob {

  private _id: number
  private _unit: string
  private _type: SystemdJobState
  private _state: string
  private _path: string

  name: string

  constructor (id: number, name: string, unit: string, type: string, state: string, jobPath: string) {
    this._id = id
    this._unit = unit
    this._type = SystemdJobState[type]
    this._state = state
    this._path = jobPath
  }

  get Id (): number {
    return this._id
  }

  get Unit () {
    return this._unit
  }

  get JobType () {
    return this._type
  }

  get State () {
    return this._state
  }

  Cancel () {
    throw new Error('not implemented')
  }
}

/**
 * Parse raw data from dbus and construct our higher level class
 * @param raw array of raw data from dbus
 */
export const parseRawJob = (raw: Array<any>): SystemdJob => {
  const id = raw[0] as number
  const name = raw[1] as string
  const type = raw[2] as string
  const state = raw[3] as string
  const jobPath = raw[4] as string
  const unitPath = raw[5] as string
  return new SystemdJobImpl(id, name, unitPath, type, state, jobPath)
}
