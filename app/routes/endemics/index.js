const config = require('../../config')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { endemicsIndex } = require('../../config/routes')
const { requestAuthorizationCodeUrl } = require('../../auth')
const logout = require('../../lib/logout')
const {
  getLatestApplicationsBySbi
} = require('../../api-requests/application-service-api')
const {
  isWithin10Months,
  getClaimsByApplicationReference
} = require('../../api-requests/claim-service-api')
const {
  endemicsWhichSpecies,
  endemicsWhichTypeOfReview
} = require('../../config/routes')
const {
  endemicsClaim: {
    landingPage: landingPageKey,
    latestEndemicsApplication: latestEndemicsApplicationKey,
    latestVetVisitApplication: latestVetVisitApplicationKey,
    previousClaims: previousClaimsKey,
    reference: referenceKey
  }
} = require('../../session/keys')
const createClaimReference = require('../../lib/create-temp-claim-reference')

const endemicsWhichTypeOfReviewURI = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const endemicsWhichSpeciesURI = `${urlPrefix}/${endemicsWhichSpecies}`

module.exports = {
  method: 'GET',
  path: `${config.urlPrefix}/${endemicsIndex}`,
  options: {
    auth: false,
    handler: async (request, h) => {
      if (request.query?.from === 'dashboard' && request.query?.sbi) {
        const application = await getLatestApplicationsBySbi(request.query?.sbi)
        const latestEndemicsApplication = application.find((application) => {
          return application.type === 'EE'
        })
        const latestVetVisitApplication = application.find((application) => {
          // TODO AHWR-15 endemics application must have been created within 10 months of vetvisit application visit date, key learning!
          return application.type === 'VV' && isWithin10Months(application.data?.visitDate, latestEndemicsApplication.createdAt)
        })
        const claims = await getClaimsByApplicationReference(
          latestEndemicsApplication.reference
        )
        const tempClaimId = createClaimReference()
        session.setEndemicsClaim(request, latestVetVisitApplicationKey, latestVetVisitApplication)
        session.setEndemicsClaim(request, latestEndemicsApplicationKey, latestEndemicsApplication)
        session.setEndemicsClaim(request, previousClaimsKey, claims)
        session.setEndemicsClaim(request, referenceKey, tempClaimId)

        // new user
        if ((!Array.isArray(claims) || !claims?.length) && latestVetVisitApplication === undefined) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new claims
        if (Array.isArray(claims) && claims?.length) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          // TODO AHWR-15 still given option of new review when already have new world claim, ok for now?
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }

        // old claims NO new claims
        if (latestVetVisitApplication) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }
      }

      logout()

      return h.view(`${endemicsIndex}/index`, {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
