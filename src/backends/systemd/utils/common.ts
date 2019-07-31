
import * as path from 'path'
import {
  stat,
  watch,
  FSWatcher,
  constants,
  accessSync,
  mkdirSync,
  promises
} from 'fs'
import { PermissionsTemplateOptions } from '../types'
import { ServiceMode } from '../../../types/service'
import { ExecServiceCreator } from '../creators/exec'
import { ClusterServiceCreator } from '../creators/cluster'
import { ServiceCreator } from '../creators/types'
import { ServiceCreatePermissionMode } from '../../../types/serviceBackend'
import of from 'await-of'

export const getInterpreterByExtension = (extension: string): string | undefined => {
  const map = {
    '.js': 'node',
    '.php': 'php',
    '.pl': 'perl',
    '.py': 'python',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.ts': 'ts-node'
  }
  return map[extension]
}

/**
 * Try to locate a binary by its name using the PATH environment entry.
 */
export const locateInterpreter = async (interpreter: string): Promise<string | undefined> => {
  if (path.isAbsolute(interpreter)) return interpreter
  if (process.env.PATH === undefined) return undefined
  const paths = process.env.PATH.split(path.delimiter)
  for (let rootPath of paths) {
    const interpreterPath = path.resolve(rootPath, interpreter)
    try {
      accessSync(interpreterPath, constants.X_OK)
      return interpreterPath
    } catch (err) {
      continue
    }
  }
  return undefined
}

/**
 * Try to resolve an interpreter path for a given filename.
 * We will use the extension of the file to get the correct interpreter to use.
 */
export const locateInterpreterForFile = async (file: string): Promise<string | undefined> => {
  const extension = path.extname(file)
  if (extension.length === 0) return undefined
  let interpreter = getInterpreterByExtension(extension)
  if (interpreter === undefined) return undefined
  const interpreterPath = await locateInterpreter(interpreter)
  return interpreterPath
}

/**
 * Fetch path of the repository to install/get service files.
 */
export const getRepositoryPath = async (): Promise<string> => {
  return `/etc/systemd/system/`
}

/**
 * Fetch path of the repository to install/get service files.
 */
export const getLogsPath = async (): Promise<string> => {
  return `/var/log/servicectl`
}

/**
 * Recursively creat directory paths if they don't exist
 */
export const mkdirRecursive = (targetDir: string) => {
  const sep = path.sep
  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir)
    try {
      mkdirSync(curDir)
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`)
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err // Throw if it's just the last created dir.
      }
    }

    return curDir
  }, sep)
}

/**
 * Depending on the mode of the cli, compute the exec options of the service
 */
export const getPermissionsOptions = (mode: ServiceCreatePermissionMode): PermissionsTemplateOptions => {
  switch (mode) {
    case ServiceCreatePermissionMode.USER: {
      if (process.env.USER === 'root' && process.env.SUDO_UID === undefined) {
        return {
          User: 0,
          Group: 0
        }
      }
      const group = process.env.SUDO_GID
      const user = process.env.SUDO_UID
      if (user === undefined || group === undefined) {
        throw new Error(`Not able to find your true user`)
      }
      return {
        User: parseInt(user, 10),
        Group: parseInt(group, 10)
      }
    }
    case ServiceCreatePermissionMode.NOBODY: {
      return { DynamicUser: true }
    }
    case ServiceCreatePermissionMode.ROOT: {
      return {
        User: 0,
        Group: 0
      }
    }
  }
}

type WatchedFile = {
  offset: number
  handle?: promises.FileHandle
  BUFFER_SIZE: number
  watcher?: FSWatcher
}

/**
 * Watch a file on the filesystem for update, invoke callback with each line
 */
    // we will send each line independently for parsing
export const watchFileUpdate = async (path: string, onUpdate: Function): Promise<Function> => {
  const [ stat ] = await of(promises.stat(path))
  const state: WatchedFile = {
    offset: stat.size || 0,
    BUFFER_SIZE: 2048
  }
  const cancel = async () => {
    if (state.handle !== undefined) {
      await state.handle.close()
    }
    if (state.watcher !== undefined) {
      state.watcher.close()
    }
  }
  const onFileUpdate = async (type: string) => {
    if (type !== 'change') return

    if (state.handle === undefined) {
      state.handle = await promises.open(path, 'r')
    }
    let data = ''
    let { handle, offset } = state
    const maxSize = state.BUFFER_SIZE
    const buf = Buffer.alloc(maxSize)
    let tmp: { bytesRead: number, buffer: Buffer }
    /**
     * We don't know before reading how much bytes we'll need to read.
     * It will read {BUFFER_SIZE} bytes, if it was enough we can stop there.
     */
    while ((tmp = (await handle.read(buf, 0, maxSize, offset))).bytesRead > 0) {
      offset += tmp.bytesRead
      state.offset = offset
      data += buf.slice(0, tmp.bytesRead).toString()
    }
    state.offset = offset

    const lines = data.split('\n').filter(line => line.length > 0)
    for (let line of lines) {
      onUpdate(line)
    }
  }
  state.watcher = watch(path, onFileUpdate)
  return cancel
}

/**
 * Get instance of a service creator depending on the service mode (exec or cluster)
 */
export const getCreatorForMode = async (mode: ServiceMode): Promise<ServiceCreator> => {
  let creator: ServiceCreator
  switch (mode) {
    case ServiceMode.EXEC: {
      creator = new ExecServiceCreator()
      break
    }
    case ServiceMode.CLUSTER: {
      creator = new ClusterServiceCreator()
      break
    }
    default: {
      throw new Error(`Invalid service mode specified: ${mode}`)
    }
  }
  return creator
}
