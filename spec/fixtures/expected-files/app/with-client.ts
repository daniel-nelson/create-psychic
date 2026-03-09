import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import { PsychicDevtools } from '@rvoh/psychic/system'

import AppEnv from '@conf/AppEnv.js'
import inflections from '@conf/inflections.js'
import routesCb from '@conf/routes.js'
import importDefault from '@conf/system/importDefault.js'
import srcPath from '@conf/system/srcPath.js'
import * as path from 'node:path'

import pinoLogger from '@conf/pinoLogger.js'
import type Koa from 'koa'
import koaPinoLogger from 'koa-pino-logger'

export default async (psy: PsychicApp) => {
  Error.stackTraceLimit = 50

  const apiRoot = srcPath('..')
  const logger = pinoLogger()
  psy.set('logger', logger)

  await psy.load('controllers', srcPath('app', 'controllers'), path => importDefault(path))
  await psy.load('services', srcPath('app', 'services'), path => importDefault(path))
  await psy.load('initializers', srcPath('conf', 'initializers'), path => importDefault(path))

  psy.set('appName', 'howyadoin')
  psy.set('packageManager', 'yarn')
  psy.set('apiOnly', false)
  psy.set('apiRoot', apiRoot)

  psy.set('encryption', {
    cookies: {
      current: {
        algorithm: 'aes-256-gcm',
        key: AppEnv.string('APP_ENCRYPTION_KEY'),
      },
    },
  })

  psy.set('inflections', inflections)
  psy.set('routes', routesCb)

  /**
   * Configure default headers (e.g.: overriding the default cache-control of 'max-age=0, private, must-revalidate')
   */
  // psy.set('defaultResponseHeaders', { 'cache-control': 'no-cache, no-store' })

  /**
   * Uncomment to automatically replace `<`, `>`, `&`, `/`, `\`, `'`, and `"` with \u00xx unicode
   * representations of those characters when rendering json. Note that parsing the resulting json
   * will restore the original content and is not safe to inject directly into an html document.
   * In the context of modern tooling, enabling sanitization should not be necessary, but security
   * reviews may require it. If that is the case, this config makes it easy to satisfy the requirement.
   */
  // psy.set('sanitizeResponseJson', true)

  psy.set('json', {
    jsonLimit: '20kb',
  })

  // Encryption between the load balancer and your Psychic webservers
  // is an important part of encryption-in-transit. This SSL
  // certificate will be a self-signed certificate. It is separate
  // from the SSL certificate that you'll install on your load balancer.
  if (AppEnv.isProduction) {
    psy.set('ssl', {
      key: AppEnv.string('SSL_KEY_PATH'),
      cert: AppEnv.string('SSL_CERT_PATH'),
    })
  }

  const allowedOrigins = JSON.parse(AppEnv.string('CORS_HOSTS', { optional: true }) || '[]') as string[]
  psy.set('cors', {
    credentials: true,
    origin: (ctx: Koa.Context) => {
      const requestOrigin = ctx.get('Origin')
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : ''
    },
  })

  psy.set('cookie', {
    maxAge: {
      days: 14,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    },
  })

  psy.set('openapi', {
    outputFilepath: path.join('src', 'openapi', 'openapi.json'),
    defaults: {
      components: {
        schemas: {},
      },
    },
    validate: {
      requestBody: true,
      headers: true,
      query: true,
      responseBody: AppEnv.isTest,
    },
  })

  psy.set('openapi', 'mobile', {
    outputFilepath: path.join('src', 'openapi', 'mobile.openapi.json'),
    suppressResponseEnums: true,
    defaults: {
      components: {
        schemas: {},
      },
    },
  })

  psy.set('openapi', 'admin', {
    outputFilepath: path.join('src', 'openapi', 'admin.openapi.json'),
    defaults: {
      components: {
        schemas: {},
      },
    },
    validate: {
      requestBody: true,
      headers: true,
      query: true,
      responseBody: AppEnv.isTest,
    },
  })

  psy.set('openapi', 'internal', {
    outputFilepath: path.join('src', 'openapi', 'internal.openapi.json'),
    defaults: {
      components: {
        schemas: {},
      },
    },
    validate: {
      requestBody: true,
      headers: true,
      query: true,
      responseBody: AppEnv.isTest,
    },
  })

  psy.set('openapi', 'tests', {
    outputFilepath: path.join('src', 'openapi', 'tests.openapi.json'),
    syncTypes: true,
    defaults: {
      components: {
        schemas: {},
      },
    },
  })

  // run a callback when the koa server starts
  psy.on('server:init:after-middleware', psychicServer => {
    const app = psychicServer.koaApp

    if (!AppEnv.isTest || AppEnv.boolean('REQUEST_LOGGING')) {

      app.use(
        koaPinoLogger({
          logger,
          autoLogging: {
            ignore: (req) => req.url === '/health_check',
          },
        }),
      )
    }
  })

  psy.on('server:start', async () => {
    if (AppEnv.isDevelopment && AppEnv.boolean('CLIENT')) {
      DreamCLI.logger.logStartProgress('starting dev server...')
      await PsychicDevtools.launchDevServer('clientApp', { port: 3000, cmd: 'yarn client' })
      DreamCLI.logger.logEndProgress()
    }
  })

  psy.on('server:shutdown', () => {
    if (AppEnv.isDevelopment && AppEnv.boolean('CLIENT')) {
      DreamCLI.logger.logStartProgress('stopping dev server...')
      PsychicDevtools.stopDevServer('clientApp')
      DreamCLI.logger.logEndProgress()
    }
  })

  // run a callback after routes are done processing
  psy.on('server:init:after-routes', () => {})

  // this function will be run any time a server error is encountered
  // that psychic isn't sure how to respond to (i.e. 500 internal server errors)
  psy.on('server:error', (err, ctx) => {
    if (!ctx.headerSent) ctx.status = 500
    else if (AppEnv.isDevelopmentOrTest) throw err
  })
}
