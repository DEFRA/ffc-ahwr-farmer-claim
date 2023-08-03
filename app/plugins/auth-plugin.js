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
        validateFunc: async (request, s) => {
          const result = { valid: false }

          if (session.getClaim(request, organisationKey)) {
            result.valid = true
          }

          return result
        }
      })
      server.auth.default({ strategy: 'session', mode: 'required' })
    }
  }
}
