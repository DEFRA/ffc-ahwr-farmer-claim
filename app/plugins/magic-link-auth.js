const { getByEmail } = require('../api-requests/users')
const { cookie: cookieConfig, cookiePolicy } = require('../config')
const { getClaim, setClaim } = require('../session')
const { organisation: organisationKey } = require('../session/keys').farmerApplyData

module.exports = {
  plugin: {
    name: 'auth',
    register: async (server, _) => {
      server.auth.strategy('session', 'cookie', {
        cookie: {
          isSameSite: cookieConfig.isSameSite,
          isSecure: cookieConfig.isSecure,
          name: cookieConfig.cookieNameAuth,
          password: cookieConfig.password,
          path: cookiePolicy.path,
          ttl: cookieConfig.ttl
        },
        keepAlive: true,
        redirectTo: (request) => {
          return '/claim/login'
        },
        validateFunc: async (request, session) => {
          const result = { valid: false }

          if (getClaim(request, organisationKey)) {
            result.valid = true
          } else {
            const organisation = (await getByEmail(session.email)) ?? {}
            setClaim(request, organisationKey, organisation)
            result.valid = !!organisation
          }

          return result
        }
      })
      server.auth.default({ strategy: 'session', mode: 'required' })
    }
  }
}
