import { InitPsychicAppCliOptions } from '../../src/helpers/newPsychicApp.js'

export default function initPsychicAppDefaults(): InitPsychicAppCliOptions {
  return {
    packageManager: 'npm',
    websockets: false,
    workers: false,
    client: 'none',
    adminClient: 'none',
    internalClient: 'none',
    primaryKeyType: 'bigserial',
    confPath: 'src/api/conf',
    controllersPath: 'src/api/app/controllers',
    modelsPath: 'src/api/app/models',
    servicesPath: 'src/api/app/services',
    serializersPath: 'src/api/app/serializers',
    dbPath: 'src/api/db',
    executablesPath: 'src/api',
    openapiPath: 'src/api/openapi',
    factoriesPath: 'spec/factories',
    typesPath: 'src/types',
    utilsPath: 'src/api/utils',
    controllerSpecsPath: 'spec/unit/controllers',
    modelSpecsPath: 'spec/unit/models',
    dreamOnly: false,
    template: 'none',
    importExtension: '.js',
  }
}
