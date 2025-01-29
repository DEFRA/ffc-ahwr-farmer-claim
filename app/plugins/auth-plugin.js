const config = require('../config')
const auth = require('../auth')
const session = require('../session')
const { organisation: organisationKey } = require('../session/keys').farmerApplyData

module.exports = {
  plugin: {
    name: 'auth',
    register: async (server, _) => {
      server.auth.strategy('session', 'cookie', {
        cookie: {
          isSameSite: config.cookie.isSameSite,
          isSecure: config.cookie.isSecure,
          name: config.cookie.cookieNameAuth,
          password: config.cookie.password,
          path: config.cookiePolicy.path,
          ttl: config.cookie.ttl
        },
        keepAlive: true,
        redirectTo: (request) => {
          return auth.requestAuthorizationCodeUrl(session, request)
        },
        validateFunc: async (request, _) => ({ valid: !!session.getEndemicsClaim(request, organisationKey) })
      })
      server.auth.default({ strategy: 'session', mode: 'required' })
    }
  }
}
