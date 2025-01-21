const config = require('../../config')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { endemicsIndex } = require('../../config/routes')
const { requestAuthorizationCodeUrl } = require('../../auth')
const logout = require('../../lib/logout')
const { endemicsWhichSpecies, endemicsWhichTypeOfReview } = require('../../config/routes')
const { endemicsClaim: { landingPage: landingPageKey, reference: referenceKey } } = require('../../session/keys')
const { refreshApplications, refreshClaims } = require('../../lib/context-helper')
const createClaimReference = require('../../lib/create-temp-claim-reference')

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

        const claims = await refreshClaims(request, latestEndemicsApplication.reference)

        const tempClaimId = createClaimReference()
        session.setEndemicsClaim(request, referenceKey, tempClaimId)

        if (config.multiSpecies.enabled) {
          // for MS we want to always go through same flow, so just redirect straight there
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new user (has no claims, and no relevant old world application)
        if (claims.length === 0 && latestVetVisitApplication === undefined) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new claims (already made at least 1 claim in new world)
        if (claims.length > 0) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI) // this was going straight to which type of review, skipping species
        }

        // old claim, but NO new world claims - NOTE this is only if the old claim is less than 10 months old
        if (latestVetVisitApplication) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }
      }

      logout()

      const loginView = config.devLogin.enabled ? `${endemicsIndex}/devindex` : `${endemicsIndex}/index`
      const devLogin = config.devLogin.enabled ? `${urlPrefix}/${endemicsIndex}/dev-sign-in` : undefined

      return h.view(loginView, {
        devLogin,
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}

module.exports = { handlers: [getHandler] }
