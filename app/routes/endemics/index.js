const { REJECTED, READY_TO_PAY } = require('../../constants/application-status')
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
  isWithInLastTenMonths,
  getClaimsByApplicationReference
} = require('../../api-requests/claim-service-api')
const {
  endemicsWhichReviewAnnual,
  endemicsWhichTypeOfReview,
  endemicsYouCannotClaim
} = require('../../config/routes')
const {
  endemicsClaim: { latestEndemicsApplication: latestEndemicsApplicationKey, latestVetVisitApplication: latestVetVisitApplicationKey, previousClaims: previousClaimsKey }
} = require('../../session/keys')

const endemicsYouCannotClaimURI = `${urlPrefix}/${endemicsYouCannotClaim}`
const endemicsWhichTypeOfReviewURI = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const endemicsWhichSpeciesURI = `${urlPrefix}/${endemicsWhichReviewAnnual}`

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
          return application.type === 'VV'
        })
        const claims = await getClaimsByApplicationReference(
          latestEndemicsApplication.reference
        )
        session.setEndemicsClaim(request, latestVetVisitApplicationKey, latestVetVisitApplication)
        session.setEndemicsClaim(request, latestEndemicsApplicationKey, latestEndemicsApplication)
        session.setEndemicsClaim(request, previousClaimsKey, claims)

        console.log('Do we get here')
        // new user
        if ((!Array.isArray(claims) || !claims?.length) && latestVetVisitApplication === undefined) {
          return h.redirect(endemicsWhichSpeciesURI)
        }
        console.log('Do we get here')

        // new claims
        if (Array.isArray(claims) && claims?.length) {
          // new claim rejected in the last 10 months
          if (isWithInLastTenMonths(claims[0].data?.dateOfVisit) && claims[0].statusId === REJECTED) {
            logout()
            return h.redirect(endemicsYouCannotClaimURI)
          } else {
            return h.redirect(endemicsWhichTypeOfReviewURI)
          }
        }
        console.log('Do we get here')

        // old claims NO new claims
        const latestVetVisitApplicationIsWithinLastTenMonths = isWithInLastTenMonths(latestVetVisitApplication?.data?.visitDate)
        if (latestVetVisitApplicationIsWithinLastTenMonths && latestVetVisitApplication.statusId === READY_TO_PAY) {
          console.log('Do we get here READY TO PAY')
          return h.redirect(endemicsWhichTypeOfReviewURI)
        } else if (latestVetVisitApplicationIsWithinLastTenMonths && latestVetVisitApplication.statusId === REJECTED) {
          console.log('Do we get here REJECTED')
          logout()
          return h.redirect(endemicsYouCannotClaimURI)
        } else {
          console.log('Do we get here else')
          return h.redirect(endemicsWhichSpeciesURI)
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
