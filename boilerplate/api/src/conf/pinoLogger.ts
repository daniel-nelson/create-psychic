import AppEnv from '@conf/AppEnv.js'
import pino from 'pino'

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
