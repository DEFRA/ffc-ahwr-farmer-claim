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

const getHandler = {
  method: 'GET',
  path: `${config.urlPrefix}/${endemicsIndex}`,
  options: {
    auth: false,
    handler: async (request, h) => {
      request.logger.setBindings({ sbi: request.query.sbi })
      if (request.query?.from === 'dashboard' && request.query.sbi) {
        const applications = await getLatestApplicationsBySbi(request.query.sbi, request.logger)
        const latestEndemicsApplication = applications.find((application) => {
          return application.type === 'EE'
        })
        const latestVetVisitApplication = applications.find((application) => {
          // endemics application must have been created within 10 months of vetvisit application visit date
          return (
            application.type === 'VV' &&
            isWithin10Months(
              application.data?.visitDate,
              latestEndemicsApplication.createdAt
            )
          )
        })
        const claims = await getClaimsByApplicationReference(
          latestEndemicsApplication.reference,
          request.logger
        )
        const tempClaimId = createClaimReference()
        session.setEndemicsClaim(
          request,
          latestVetVisitApplicationKey,
          latestVetVisitApplication
        )
        session.setEndemicsClaim(
          request,
          latestEndemicsApplicationKey,
          latestEndemicsApplication
        )
        session.setEndemicsClaim(request, previousClaimsKey, claims)
        session.setEndemicsClaim(request, referenceKey, tempClaimId)

        // new user
        if (claims && (claims.length === 0) && latestVetVisitApplication === undefined) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichSpeciesURI)
          return h.redirect(endemicsWhichSpeciesURI)
        }

        // new claims
        if (claims && claims.length > 0) {
          session.setEndemicsClaim(request, landingPageKey, endemicsWhichTypeOfReviewURI)
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }

        // old claims NO new claims
        if (latestVetVisitApplication) {
          session.setEndemicsClaim(
            request,
            landingPageKey,
            endemicsWhichTypeOfReviewURI
          )
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

module.exports = { handlers: [getHandler] }
