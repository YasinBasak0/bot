import chalk from 'chalk'
import path from 'path'

export function getAppDataPath() {
  const homeDir = process.env.HOME || process.env.APPDATA
  if (homeDir) {
    if (process.platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'qbot')
    }

    return path.join(homeDir, 'qbot')
  }

  console.error(
    chalk.red(`Could not determine your HOME directory.
Please set the environment variable "APP_DATA_PATH", then start Qbot`)
  )
  process.exit()
}
