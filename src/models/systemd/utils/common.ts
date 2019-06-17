
import * as path from 'path'
import * as fs from 'fs'
import { ServiceAPIMode } from '../../../api'
import { ExecTemplateOptions } from '../types'

const getInterpreterByExtension = (extension: string): string | undefined => {
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
      await fs.promises.access(interpreterPath, fs.constants.X_OK)
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
export const getRepositoryPath = async (mode: ServiceAPIMode): Promise<string> => {
  return `/etc/systemd/system/`
}

/**
 * Recursively creat directory paths if they don't exist
 */
export const mkdirRecursive = (targetDir: string) => {
  const sep = path.sep
  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir)
    try {
      fs.mkdirSync(curDir)
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
export const getExecOptions = (mode: ServiceAPIMode): ExecTemplateOptions => {
  switch (mode) {
    case ServiceAPIMode.USER: {
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
    case ServiceAPIMode.NOBODY: {
      return { DynamicUser: true }
    }
    case ServiceAPIMode.ROOT: {
      return {
        User: 0,
        Group: 0
      }
    }
  }
}
