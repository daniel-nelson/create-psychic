import * as fs from 'node:fs'
import * as path from 'node:path'
import AppConfigBuilder from '../../file-builders/AppConfigBuilder.js'
import DreamConfigBuilder from '../../file-builders/DreamConfigBuilder.js'
import EnvBuilder from '../../file-builders/EnvBuilder.js'
import SrcPathHelperBuilder from '../../file-builders/SrcPathHelperBuilder.js'
import TsConfigBuilder from '../../file-builders/TsConfigBuilder.js'
import copyRecursive from '../copyRecursive.js'
import internalSrcPath from '../internalSrcPath.js'
import { importExtensions, InitPsychicAppCliOptions } from '../newPsychicApp.js'
import rewriteEsmImports from '../rewriteEsmImports.js'
import addRootPathForCoreSpecs from './addRootPathForCoreSpecs.js'

export default async function copyInitApiBoilerplate(appName: string, options: InitPsychicAppCliOptions) {
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'app', 'models'),
    options.modelsPath,
    options.importExtension,
  )
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'app', 'serializers'),
    options.serializersPath,
    options.importExtension,
  )
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'db'),
    options.dbPath,
    options.importExtension,
  )
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'utils'),
    options.utilsPath,
    options.importExtension,
  )
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'conf'),
    options.confPath,
    options.importExtension,
  )
  copyRecursiveSync(
    internalSrcPath('..', 'boilerplate', 'api', 'src', 'types'),
    options.typesPath,
    options.importExtension,
  )

  prependOrWriteFileSync(path.join('.', '.env'), EnvBuilder.build({ appName, env: 'development' }))
  prependOrWriteFileSync(path.join('.', '.env.test'), EnvBuilder.build({ appName, env: 'test' }))

  if (options.dreamOnly) {
    // if --dream-only flag is passed, we need to remove all psychic boilerplate
    // and swap out problematic files so that dream can drive the application instead
    rmFileSync(path.join(options.confPath, 'system', 'initializePsychicApp.ts'))
    rmFileSync(path.join(options.confPath, 'app.ts'))
    rmFileSync(path.join(options.confPath, 'routes.ts'))
    rmFileSync(path.join(options.confPath, 'routes.admin.ts'))
    rmFileSync(path.join(options.confPath, 'routes.internal.ts'))
    rmFileSync(path.join(options.utilsPath, 'i18n.ts'))
    rmFileSync(path.join(options.confPath, 'pinoLogger.ts'))

    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'additional', 'dream-only', 'repl.ts'),
      path.join(options.confPath, 'repl.ts'),
      options.importExtension,
    )
    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'additional', 'dream-only', 'cli.ts'),
      path.join(options.confPath, 'system', 'cli.ts'),
      options.importExtension,
    )
    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'additional', 'dream-only', 'initializeDreamApp.ts'),
      path.join(options.confPath, 'system', 'initializeDreamApp.ts'),
      options.importExtension,
    )
  } else {
    // otherwise, we need to add all of the existing boilerplate for a psychic app
    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'api', 'src', 'app', 'controllers'),
      options.controllersPath,
      options.importExtension,
    )

    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'api', 'src', 'app', 'services'),
      options.servicesPath,
      options.importExtension,
    )

    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'api', 'src', 'main.ts'),
      path.join(options.executablesPath, 'main.ts'),
      options.importExtension,
    )

    writeFileSync(
      path.join(options.confPath, 'app.ts'),
      await AppConfigBuilder.buildForInit({ appName, options }),
    )

    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'api', 'src', 'openapi'),
      options.openapiPath,
      options.importExtension,
    )
    writeFileSync(path.join(options.openapiPath, '.gitkeep'), '')
    copyRecursiveSync(
      internalSrcPath('..', 'boilerplate', 'api', 'src', 'worker.ts'),
      path.join(options.executablesPath, 'worker.ts'),
      options.importExtension,
    )
  }

  TsConfigBuilder.build({ options })

  if (!options.workers) {
    rmFileSync(path.join(options.confPath, 'initializers', 'workers.ts'))
    rmFileSync(path.join(options.typesPath, 'workers.ts'))
    rmFileSync(path.join(options.modelsPath, 'ApplicationBackgroundedModel.ts'))

    // services folder only exists if dreamOnly is false
    if (!options.dreamOnly) {
      rmFileSync(path.join(options.executablesPath, 'worker.ts'))
      rmFileSync(path.join(options.servicesPath, 'ApplicationBackgroundedService.ts'))
      rmFileSync(path.join(options.servicesPath, 'ApplicationScheduledService.ts'))
    }
  }

  if (!options.websockets) {
    rmFileSync(path.join(options.confPath, 'initializers', 'websockets.ts'))
    rmFileSync(path.join(options.utilsPath, 'AppWs.ts'))
  }

  switch (options.template) {
    case 'nextjs': {
      // we do not want instrumentation files unless we have psychic,
      // since the only purpose of the instrumentation file is to sidecar
      // a psychic server to the starting of the nextjs dev server
      const srcPath = fs.existsSync(path.join('.', 'src')) ? path.join('.', 'src') : path.join('.')

      if (options.dreamOnly) {
        copyRecursiveSync(
          internalSrcPath(
            '..',
            'boilerplate',
            'additional',
            'templates',
            'nextjs',
            'maybeInitializeDreamApp.ts',
          ),
          path.join(options.confPath, 'system', 'maybeInitializeDreamApp.ts'),
          options.importExtension,
        )
      } else {
        copyRecursiveSync(
          internalSrcPath('..', 'boilerplate', 'additional', 'templates', 'nextjs', 'instrumentation.ts'),
          path.join(srcPath, 'instrumentation.mts'),
          options.importExtension,
        )
        copyRecursiveSync(
          internalSrcPath(
            '..',
            'boilerplate',
            'additional',
            'templates',
            'nextjs',
            'instrumentation-node.ts',
          ),
          path.join(srcPath, 'instrumentation-node.mts'),
          options.importExtension,
        )
        copyRecursiveSync(
          internalSrcPath(
            '..',
            'boilerplate',
            'additional',
            'templates',
            'nextjs',
            'maybeInitializePsychicApp.ts',
          ),
          path.join(options.confPath, 'system', 'maybeInitializePsychicApp.ts'),
          options.importExtension,
        )
      }
      break
    }
  }

  writeFileSync(
    path.join(options.confPath, 'dream.ts'),
    await DreamConfigBuilder.buildForInit({ appName, options }),
  )
  writeFileSync(
    path.join(options.confPath, 'system', 'srcPath.ts'),
    await SrcPathHelperBuilder.build(options),
  )
}

function copyRecursiveSync(path: string, dest: string, importExtension: (typeof importExtensions)[number]) {
  copyRecursive(path, addRootPathForCoreSpecs(dest), fileContents =>
    rewriteEsmImports(fileContents, importExtension),
  )
}

function writeFileSync(path: string, contents: string) {
  fs.writeFileSync(addRootPathForCoreSpecs(path), contents)
}

function prependOrWriteFileSync(path: string, contents: string) {
  const fullPath = addRootPathForCoreSpecs(path)

  if (fs.existsSync(fullPath)) {
    const existingContents = fs.readFileSync(fullPath, 'utf8')
    fs.writeFileSync(fullPath, contents + existingContents)
  } else {
    fs.writeFileSync(fullPath, contents)
  }
}

function rmFileSync(path: string) {
  fs.rmSync(addRootPathForCoreSpecs(path))
}
