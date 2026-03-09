import { type PrimaryKeyType } from '@rvoh/dream/types'
import c from 'yoctocolors'
import DreamCliLogger from '../logger/DreamCliLogger.js'
import addClientApp from './addClientApp.js'
import apiOnlyOptions from './apiOnlyOptions.js'
import gitInit from './gitInit.js'
import logo from './logo.js'
import buildNewPsychicAppOptionsWithPrompt from './new/buildNewPsychicAppOptionsWithPrompt.js'
import copyApiBoilerplate from './new/copyApiBoilerplate.js'
import initialGitCommit from './new/initialGitCommit.js'
import installApiDependencies from './new/installApiDependencies.js'
import welcomeMessage from './new/welcomeMessage.js'
import sleep from './sleep.js'

export const cliClientAppTypes = ['nextjs', 'react', 'vue', 'nuxt', 'none'] as const

export const psychicPackageManagers = ['pnpm', 'yarn', 'npm'] as const
export const initTemplates = ['none', 'nextjs'] as const
export const importExtensions = ['.js', '.ts', 'none'] as const
export type PsychicPackageManager = (typeof psychicPackageManagers)[number]

export interface NewPsychicAppCliOptions {
  packageManager: PsychicPackageManager
  primaryKeyType: PrimaryKeyType
  client: (typeof cliClientAppTypes)[number]
  adminClient: (typeof cliClientAppTypes)[number]
  internalClient: (typeof cliClientAppTypes)[number]
  workers: boolean
  websockets: boolean
}

export interface InitPsychicAppCliOptions {
  dreamOnly: boolean
  template: (typeof initTemplates)[number]
  importExtension: (typeof importExtensions)[number]
  packageManager: PsychicPackageManager
  primaryKeyType: PrimaryKeyType
  client: (typeof cliClientAppTypes)[number]
  adminClient: (typeof cliClientAppTypes)[number]
  internalClient: (typeof cliClientAppTypes)[number]
  workers: boolean
  websockets: boolean
  serializersPath: string
  typesPath: string
  modelsPath: string
  servicesPath: string
  controllersPath: string
  confPath: string
  factoriesPath: string
  modelSpecsPath: string
  controllerSpecsPath: string
  dbPath: string
  openapiPath: string
  utilsPath: string
  executablesPath: string
}

function testEnv() {
  return process.env.NODE_ENV === 'test'
}

const logger = new DreamCliLogger()

export default async function newPsychicApp(appName: string, options: NewPsychicAppCliOptions) {
  if (!testEnv()) {
    logger.log(c.greenBright(`${appName}`), {
      logPrefix: '☼',
      logPrefixColor: 'greenBright',
    })
    logger.log(
      c.greenBright(
        `${appName
          .split('')
          .map(() => '')
          .join('-')}-`,
      ),
      {
        logPrefix: ' ',
        logPrefixColor: 'greenBright',
      },
    )
  }

  await buildNewPsychicAppOptionsWithPrompt(options)

  if (!testEnv()) {
    logger.log(`Installing psychic framework to ./${appName}`)
    logger.logStartProgress(`copying boilerplate...`)
  }

  const rootPath = `./${appName}`

  await copyApiBoilerplate(appName, options)

  if (!testEnv()) {
    logger.logEndProgress()
    logger.logStartProgress(`installing api dependencies...`)
  }

  await installApiDependencies(appName, { options, logger })

  if (!testEnv()) {
    // sleeping here because yarn has a delayed print that we need to clean up after install completes
    await sleep(1000)
    await gitInit(appName, logger)
  }

  // don't sync yet, since we need to run migrations first
  // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)

  if (options.client !== 'none') {
    await addClientApp({
      sourceColor: 'magenta',
      logger,
      client: options.client,
      clientRootFolderName: 'client',
      appName,
      options,
      rootPath,
      port: 3000,
    })
  }

  if (options.adminClient !== 'none') {
    await addClientApp({
      sourceColor: 'blue',
      logger,
      client: options.adminClient,
      clientRootFolderName: 'admin',
      appName,
      options,
      rootPath,
      port: 3001,
    })
  }

  if (options.internalClient !== 'none') {
    await addClientApp({
      sourceColor: 'cyan',
      logger,
      client: options.internalClient,
      clientRootFolderName: 'internal',
      appName,
      options,
      rootPath,
      port: 3002,
    })
  }

  if (!testEnv()) {
    await initialGitCommit(appName, logger)

    logger.log(logo(), { logPrefix: '' })
    logger.log(welcomeMessage(apiOnlyOptions(options) ? appName : appName + '/api', options.packageManager), {
      logPrefix: '',
    })
  }
}
