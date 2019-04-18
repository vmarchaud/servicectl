
export enum SystemdJobState {
  START = 'start',
  VERIFY_ACTIVE = 'verify-active',
  STOP = 'stop',
  RELOAD = 'reload',
  RESTART = 'restart',
  TRY_RESTART = 'try-restart',
  RELOAD_OR_START = 'reload-or-start'
}

export interface SystemdJob {
  /**
   * Cancel() cancels the job. Note that this will remove a job from the queue
   * if it is not yet executed but generally will not cause a job that is
   * already in the process of being executed to be aborted.
   */
  Cancel (): void

  /**
   * Id is the numeric Id of the job.
   * During the runtime of a systemd instance each numeric ID is only assigned once.
   */
  readonly Id: number
  /**
   * Unit refers to the unit this job belongs two.
   * It is a structure consisting of the name of the unit and a bus path to the unit's object.
   */
  readonly Unit: string
  /**
   * JobType refers to the job's type and is one of :
   * start, verify-active, stop, reload, restart, try-restart, reload-or-start.
   * Note that later versions might define additional values.
   */
  readonly JobType: SystemdJobState
  /**
   * State refers to the job's state and is one of waiting and running.
   * The former indicates that a job is currently queued but has not begun to execute yet,
   * the latter indicates that a job is currently being executed.
   */
  readonly State: string
}
