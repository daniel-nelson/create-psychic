import { primaryKeyTypes } from '@rvoh/dream/system'
import * as path from 'node:path'
import {
  importExtensions,
  InitPsychicAppCliOptions,
  initTemplates,
  psychicPackageManagers,
} from '../newPsychicApp.js'
import prompt from '../prompt.js'
import Select from '../select.js'

export default async function buildInitPsychicAppOptionsWithPrompt(options: InitPsychicAppCliOptions) {
  if (options.dreamOnly === undefined) {
    const answer = await new Select(
      'Do you want a dream-only integration? Doing this would omit psychic as a dependency.',
      ['no', 'yes'] as const,
    ).run()
    options.dreamOnly = answer === 'yes'

    if (answer === 'yes') {
      options.workers = false
      options.websockets = false
    }
  }

  if (options.template === undefined) {
    const answer = await new Select('Select a template to use for your initialization', initTemplates).run()
    options.template = answer

    if (answer === 'nextjs') {
      options.importExtension = 'none'
    }
  }

  if (options.importExtension === undefined) {
    const answer = await new Select(
      'What import suffix would you like to use for your files?',
      importExtensions,
    ).run()
    options.importExtension = answer
  }

  if (!options.packageManager || !psychicPackageManagers.includes(options.packageManager)) {
    const answer = await new Select(
      'what package manager would you like to use?',
      psychicPackageManagers,
    ).run()
    options.packageManager = answer
  }

  if (!options.primaryKeyType || !primaryKeyTypes.includes(options.primaryKeyType)) {
    const answer = await new Select(
      'what primary key type would you like to use? (uuid7 requires Postgres 18)',
      primaryKeyTypes,
    ).run()
    options.primaryKeyType = answer
  }

  if (options.workers === undefined && !options.dreamOnly) {
    const answer = await new Select('background workers?', ['yes', 'no'] as const).run()
    options.workers = answer === 'yes'
  }

  if (options.websockets === undefined && !options.dreamOnly) {
    const answer = await new Select('websockets?', ['yes', 'no'] as const).run()
    options.websockets = answer === 'yes'
  }

  if (options.confPath === undefined) {
    const defaultVal = path.join('.', 'src', 'conf')
    const answer = await prompt(`What would you like your conf path to be? (defaults to ${defaultVal}`)
    options.confPath = answer || defaultVal
  }

  if (options.factoriesPath === undefined) {
    const defaultVal = path.join('.', 'spec', 'factories')
    const answer = await prompt(
      `What would you like your spec factories path to be? (defaults to ${defaultVal}`,
    )
    options.factoriesPath = answer || defaultVal
  }

  if (options.dbPath === undefined) {
    const defaultVal = path.join('.', 'src', 'db')
    const answer = await prompt(`What would you like your db path to be? (defaults to ${defaultVal}`)
    options.dbPath = answer || defaultVal
  }

  // executablesPath: string
  if (options.openapiPath === undefined && !options.dreamOnly) {
    const defaultVal = path.join('.', 'src', 'openapi')
    const answer = await prompt(`What would you like your openapi path to be? (defaults to ${defaultVal}`)
    options.openapiPath = answer || defaultVal
  }

  if (options.utilsPath === undefined) {
    const defaultVal = path.join('.', 'src', 'utils')
    const answer = await prompt(`What would you like your utils path to be? (defaults to ${defaultVal}`)
    options.utilsPath = answer || defaultVal
  }

  if (options.executablesPath === undefined && !options.dreamOnly) {
    const defaultVal = path.join('.', 'src')
    const answer = await prompt(
      `What would you like your top-level executables path to be? (defaults to ${defaultVal}`,
    )
    options.executablesPath = answer || defaultVal
  }

  if (options.serializersPath === undefined) {
    const defaultVal = path.join('.', 'src', 'app', 'serializers')
    const answer = await prompt(`What would you like your serializers path to be? (defaults to ${defaultVal}`)
    options.serializersPath = answer || defaultVal
  }

  if (options.servicesPath === undefined && !options.dreamOnly) {
    const defaultVal = path.join('.', 'src', 'app', 'services')
    const answer = await prompt(`What would you like your services path to be? (defaults to ${defaultVal}`)
    options.servicesPath = answer || defaultVal
  }

  if (options.typesPath === undefined) {
    const defaultVal = path.join('.', 'src', 'types')
    const answer = await prompt(`What would you like your types path to be? (defaults to ${defaultVal}`)
    options.typesPath = answer || defaultVal
  }

  if (options.controllersPath === undefined && !options.dreamOnly) {
    const defaultVal = path.join('.', 'src', 'app', 'controllers')
    const answer = await prompt(`What would you like your controllers path to be? (defaults to ${defaultVal}`)
    options.controllersPath = answer || defaultVal
  }

  if (options.modelsPath === undefined) {
    const defaultVal = path.join('.', 'src', 'app', 'models')
    const answer = await prompt(`What would you like your models path to be? (defaults to ${defaultVal}`)
    options.modelsPath = answer || defaultVal
  }

  if (options.controllerSpecsPath === undefined && !options.dreamOnly) {
    const defaultVal = path.join('.', 'spec', 'unit', 'controllers')
    const answer = await prompt(
      `What would you like your controller spec path to be? (defaults to ${defaultVal}`,
    )
    options.controllerSpecsPath = answer || defaultVal
  }

  if (options.modelSpecsPath === undefined) {
    const defaultVal = path.join('.', 'spec', 'unit', 'models')
    const answer = await prompt(`What would you like your model spec path to be? (defaults to ${defaultVal}`)
    options.modelSpecsPath = answer || defaultVal
  }
}
