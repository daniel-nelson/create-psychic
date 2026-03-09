import AppEnv from '@conf/AppEnv.js'
import type Koa from 'koa'
import pino from 'pino'
import pinoHttpModule, { type Options } from 'pino-http'

const pinoHttp = pinoHttpModule.default ?? pinoHttpModule

export default function pinoLogger() {
  return pino({
    level: 'info',
    base: { service: AppEnv.boolean('WORKER_SERVICE') ? 'worker' : 'web' },
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.authentication',
      'req.body.authorization',
      'req.body.secret',
    ],
    serializers: {
      req(req) {
        const { id, method, url, remoteAddress, remotePort } = req
        return { id, method, url, remoteAddress, remotePort }
      },
    },
  })
}

export interface KoaPinoMiddleware extends Koa.Middleware {
  logger: pino.Logger
}

export function koaPinoMiddleware(
  opts?: Options,
  stream?: pino.DestinationStream
): KoaPinoMiddleware {
  const wrap = pinoHttp(opts, stream)

  const middleware: KoaPinoMiddleware = Object.assign(
    (ctx: Koa.Context, next: Koa.Next) => {
      wrap(ctx.req, ctx.res)
      ctx.log = ctx.request.log = ctx.response.log = ctx.req.log
      return next().catch((err: Error) => {
        ctx.log.error({ err })
        throw err
      })
    },
    { logger: wrap.logger }
  )

  return middleware
}

declare module 'koa' {
  interface ExtendableContext {
    log: pino.Logger
  }

  interface Request {
    log: pino.Logger
  }

  interface Response {
    log: pino.Logger
  }
}
