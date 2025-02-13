import { config } from '../../config/index.js'
import { setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { refreshApplications, resetEndemicsClaimSession } from '../../lib/context-helper.js'
import { logout } from '../../lib/logout.js'
import { requestAuthorizationCodeUrl } from '../../auth/auth-code-grant/request-authorization-code-url.js'

const urlPrefix = config.urlPrefix
const { endemicsIndex, endemicsWhichSpecies, endemicsWhichTypeOfReview } = links
const { endemicsClaim: { landingPage: landingPageKey } } = sessionKeys

const endemicsWhichTypeOfReviewURI = `${urlPrefix}/${endemicsWhichTypeOfReview}`
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
        const { latestEndemicsApplication, latestVetVisitApplication } = await refreshApplications(request)

        const claims = await resetEndemicsClaimSession(request, latestEndemicsApplication.reference)

        if (config.multiSpecies.enabled) {
          // for MS we want to always go through same flow, so just redirect straight there
          setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new user (has no claims, and no relevant old world application)
        if (claims.length === 0 && latestVetVisitApplication === undefined) {
          setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new claims (already made at least 1 claim in new world)
        if (claims.length > 0) {
          setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI) // this was going straight to which type of review, skipping species
        }

        // old claim, but NO new world claims - NOTE this is only if the old claim is less than 10 months old
        if (latestVetVisitApplication) {
          setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }
      }

      logout()

      const loginView = config.devLogin.enabled ? `${endemicsIndex}/devindex` : `${endemicsIndex}/index`
      const devLogin = config.devLogin.enabled ? `${urlPrefix}/${endemicsIndex}/dev-sign-in` : undefined

      return h.view(loginView, {
        devLogin,
        defraIdLogin: requestAuthorizationCodeUrl(request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}

export const indexHandlers = [getHandler]
