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
      console.log('%%%%%%%%%%%%%%', request.query)
      if (request.query?.from === 'dashboard' && request.query?.sbi) {
        const application = await getLatestApplicationsBySbi(request.query?.sbi)
        const latestEndemicsApplication = application.find((application) => {
          return application.type === 'EE'
        })
        // const latestReviewApplication = application.find((application) => {
        //   return application.type === 'VV'
        // })
        const claims = await getClaimsByApplicationReference(
          latestEndemicsApplication.reference
        )

        if (
          isWithInLastTenMonths(latestEndemicsApplication) &&
          latestEndemicsApplication?.statusId === REJECTED
        ) {
          return h.redirect(endemicsYouCannotClaimURI)
        }

        if (claims?.length) {
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
      return h.view(`${endemicsIndex}/index`, {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
