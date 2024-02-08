const { REJECTED } = require('../../constants/application-status')
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

const endemicsYouCannotClaimURI = `${urlPrefix}/${endemicsYouCannotClaim}`
const endemicsWhichTypeOfReviewURI = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const endemicsWhichReviewAnnualURI = `${urlPrefix}/${endemicsWhichReviewAnnual}`

module.exports = {
  method: 'GET',
  path: `${config.urlPrefix}/${endemicsIndex}`,
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      session.clear(request)

      request.query.sbi = 113557240;
      request.query.from = 'dashboard';
      if (request.query?.from === 'dashboard' && request.query?.sbi) {
        const application = await getLatestApplicationsBySbi(request.query?.sbi)
        const latestApplication = application.find((application) => {
          return application.type === 'EE'
        })
        const claims = await getClaimsByApplicationReference(
          latestApplication.reference
        )

        if (
          isWithInLastTenMonths(latestApplication) &&
          latestApplication?.statusId === REJECTED
        ) {
          return h.redirect(endemicsYouCannotClaimURI)
        }

        if (claims?.length) {
          const latestClaim = claims.find((claim) => {
            return claim.type === 'R' || claim.type === 'E'
          })

          if (isWithInLastTenMonths(latestClaim) && latestClaim?.statusId === REJECTED) {
            return h.redirect(endemicsYouCannotClaimURI)
          } else {
            return h.redirect(endemicsWhichTypeOfReviewURI)
          }
        }

        if (isWithInLastTenMonths(latestApplication)) {
          return h.redirect(endemicsWhichTypeOfReviewURI)
        }

        if (!isWithInLastTenMonths(latestApplication)) {
          return h.redirect(endemicsWhichReviewAnnualURI)
        }
      }
      return h.view(`${endemicsIndex}/index`, {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
