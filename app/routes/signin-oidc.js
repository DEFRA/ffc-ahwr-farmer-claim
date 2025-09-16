import { config } from '../config/index.js'

export const signInHandler = {
  method: 'GET',
  path: '/claim/signin-oidc',
  options: {
    auth: false,
    handler: async (request, h) => {
      const { referer } = request.headers
      const { code, state } = request.query

      const loggerInfo = {
        source: 'claim/signin-oidc',
        referer,
        code,
        state,
        remoteAddress: request.info.remoteAddress,
        userAgent: request.headers['user-agent']
      }

      request.logger.info(loggerInfo, 'Claim signin-oidc handler invoked:')
      request.logger.info('Redirecting user on to dashboard /sign-in')

      return h.redirect(`${config.dashboardServiceUri}/sign-in`)
    }
  }
}
