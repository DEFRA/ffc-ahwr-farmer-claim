import { config } from '../../config/index.js'
import { setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { refreshApplications, resetEndemicsClaimSession } from '../../lib/context-helper.js'
import { logout } from '../../lib/logout.js'
import { requestAuthorizationCodeUrl } from '../../auth/auth-code-grant/request-authorization-code-url.js'
import { RPA_CONTACT_DETAILS } from 'ffc-ahwr-common-library'

const urlPrefix = config.urlPrefix
const { endemicsIndex, endemicsWhichSpecies } = links
const { endemicsClaim: { landingPage: landingPageKey } } = sessionKeys

const endemicsWhichSpeciesURI = `${urlPrefix}/${endemicsWhichSpecies}`

const getHandler = {
  method: 'GET',
  path: `${config.urlPrefix}/${endemicsIndex}`,
  options: {
    auth: false,
    handler: async (request, h) => {
      request.logger.setBindings({ sbi: request.query.sbi })
      if (request.query?.from === 'dashboard' && request.query.sbi) {
        // fetch latest new world (always) and latest old world (if relevant) application
        const { latestEndemicsApplication } = await refreshApplications(request)

        await resetEndemicsClaimSession(request, latestEndemicsApplication.reference)

        setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
        return h.redirect(endemicsWhichSpeciesURI)
      }

      logout()

      const loginView = config.devLogin.enabled ? `${endemicsIndex}/devindex` : `${endemicsIndex}/index`
      const devLogin = config.devLogin.enabled ? `${urlPrefix}/${endemicsIndex}/dev-sign-in` : undefined

      return h.view(loginView, {
        devLogin,
        defraIdLogin: requestAuthorizationCodeUrl(request),
        ruralPaymentsAgency: RPA_CONTACT_DETAILS
      })
    }
  }
}

export const indexHandlers = [getHandler]
