import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { refreshApplications, resetEndemicsClaimSession } from '../../lib/context-helper.js'
import { logout } from '../../lib/logout.js'
import { requestAuthorizationCodeUrl } from '../../auth/auth-code-grant/request-authorization-code-url.js'
import { prefixUrl } from '../utils/page-utils.js'

const { endemicsIndex, endemicsWhichSpecies } = links
const { endemicsClaim: { landingPage: landingPageKey } } = sessionKeys

const endemicsWhichSpeciesURI = prefixUrl(endemicsWhichSpecies)

const getHandler = {
  method: 'GET',
  path: prefixUrl(endemicsIndex),
  options: {
    auth: { mode: 'try' },
    handler: async (request, h) => {
      // utilise same mechanism the auth plugin does to decide if user is logged in
      if (getEndemicsClaim(request)?.organisation) {
        const { organisation } = getEndemicsClaim(request)

        request.logger.setBindings({ sbi: organisation.sbi })

        // fetch latest new world (always) and latest old world (if relevant) application
        const { latestEndemicsApplication } = await refreshApplications(organisation.sbi, request)

        await resetEndemicsClaimSession(request, latestEndemicsApplication.reference)

        setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
        return h.redirect(endemicsWhichSpeciesURI)
      }

      // the reason this allows both a logged in and logged out version of the handler (see auth: try above), is because this handler
      // renders the entry/start page for non logged in users, but is also the point a logged in user can go from dashboard to
      // the claim journey. During the 3.0.0 refactor this will disappear with the single sign in point, but for now it has to stay

      logout()

      const loginView = config.devLogin.enabled ? `${endemicsIndex}/devindex` : `${endemicsIndex}/index`
      const devLogin = config.devLogin.enabled ? prefixUrl(`${endemicsIndex}/dev-sign-in`) : undefined

      return h.view(loginView, {
        devLogin,
        defraIdLogin: requestAuthorizationCodeUrl(request)
      })
    }
  }
}

export const indexHandlers = [getHandler]
