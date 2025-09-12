import { config } from '../config/index.js'
import { requestAuthorizationCodeUrl } from '../auth/auth-code-grant/request-authorization-code-url.js'
import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'

const { organisation: organisationKey } = sessionKeys.farmerApplyData

//This plugin will be registered only when running in a local dev environment. It's purpose is to provide a way of passing essential session info
//between the apps locally, as they do not have a shared cache. In deployed environments the real auth plugin will be registered instead
export const localDevAuthPlugin = {
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
          return requestAuthorizationCodeUrl(request)
        },
        validateFunc: async (request) => {
          let hasValueInSessionWhichIndicatesSignedIn = Boolean(getEndemicsClaim(request, organisationKey))

          if (!hasValueInSessionWhichIndicatesSignedIn && request.query?.org) {
            setEndemicsClaim(request, organisationKey, JSON.parse(Buffer.from(request.query.org, 'base64').toString('ascii')))
            hasValueInSessionWhichIndicatesSignedIn = Boolean(getEndemicsClaim(request, organisationKey))
          }
          return { valid: hasValueInSessionWhichIndicatesSignedIn }
        }
      })
      server.auth.default({ strategy: 'session', mode: 'required' })
    }
  }
}
