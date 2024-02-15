const { REJECTED } = require('../../constants/application-status')
const { claimType } = require('../../constants/claim')
const config = require('../../config')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { endemicsIndex } = require('../../config/routes')
const { requestAuthorizationCodeUrl } = require('../../auth')
const {
  getLatestApplicationsBySbi
} = require('../../api-requests/application-service-api')
const {
  isWithInLastTenMonths,
  getClaimsByApplicationReference
} = require('../../api-requests/claim-service-api')
const {
  endemicsWhichReviewAnnual,
  endemicsWhichTypeOfReview,
  endemicsYouCannotClaim
} = require('../../config/routes')
const {
  endemicsClaim: { latestEndemicsApplication: latestEndemicsApplicationKey, latestReviewApplication: latestReviewApplicationKey, previousClaims: previousClaimsKey }
} = require('../../session/keys')

const endemicsYouCannotClaimURI = `${urlPrefix}/${endemicsYouCannotClaim}`
const endemicsWhichTypeOfReviewURI = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const endemicsWhichReviewAnnualURI = `${urlPrefix}/${endemicsWhichReviewAnnual}`

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
        const latestReviewApplication = application.find((application) => {
          return application.type === 'VV'
        })
        const claims = await getClaimsByApplicationReference(
          latestEndemicsApplication.reference
        )
        session.setEndemicsClaim(request, latestReviewApplicationKey, latestReviewApplication)
        session.setEndemicsClaim(request, latestEndemicsApplicationKey, latestEndemicsApplication)
        session.setEndemicsClaim(request, previousClaimsKey, claims)

        if (latestReviewApplication) {
          if (
            isWithInLastTenMonths(latestReviewApplication) &&
            latestReviewApplication?.statusId === REJECTED
          ) {
            return h.redirect(endemicsYouCannotClaimURI)
          }
        }
        if (Array.isArray(claims) && claims?.length) {
          const latestClaim = claims.find((claim) => {
            return claim.type === claimType.review || claim.type === claimType.endemics
          })

          if (isWithInLastTenMonths(latestClaim) && latestClaim?.statusId === REJECTED) {
            return h.redirect(endemicsYouCannotClaimURI)
          } else {
            return h.redirect(endemicsWhichTypeOfReviewURI)
          }
        }

        if (isWithInLastTenMonths(latestEndemicsApplication)) {
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }

        if (!isWithInLastTenMonths(latestEndemicsApplication)) {
          return h.redirect(endemicsWhichReviewAnnualURI)
        }
      }

      request.cookieAuth.clear()
      session.clear(request)

      return h.view(`${endemicsIndex}/index`, {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
