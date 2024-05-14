const Joi = require('joi')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { endemicsClaim: { typeOfReview: typeOfReviewKey, typeOfLivestock: typeOfLivestockKey } } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults, endemicsWhichTypeOfReviewDairyFollowUpException } = require('../../config/routes')
const { getClaimsByApplicationReference, isFirstTimeEndemicClaimForActiveOldWorldReviewClaim } = require('../../api-requests/claim-service-api')
const { getLatestApplicationsBySbi } = require('../../api-requests/application-service-api')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = claimDashboard

const getTypeOfLivestockFromPastClaims = async (sbi) => {
  const applications = await getLatestApplicationsBySbi(sbi)

  const endemicsApplication = applications[0]
  const { reference } = endemicsApplication
  const claims = await getClaimsByApplicationReference(reference)

  if (claims?.length) {
    return claims[0].data?.typeOfLivestock
  }

  const latestVetVisitsApplication = applications.filter((application) => application.type === 'VV')[0]
  return latestVetVisitsApplication.data?.whichReview
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { organisation, typeOfReview } = getEndemicsClaim(request)
        const typeOfLivestock = await getTypeOfLivestockFromPastClaims(organisation.sbi)
        setEndemicsClaim(request, typeOfLivestockKey, typeOfLivestock)

        const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`
        return h.view(endemicsWhichTypeOfReview, {
          backLink,
          typeOfLivestock: formattedTypeOfLivestock,
          previousAnswer: typeOfReview === claimType.review ? 'review' : 'endemics'
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          typeOfReview: Joi.string()
            .valid('review', 'endemics')
            .required()
        }),
        failAction: (_request, h, _err) => {
          return h
            .view(endemicsWhichTypeOfReview, {
              errorMessage: { text: 'Select which type of review you are claiming for', href: '#typeOfReview' },
              backLink
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfReview } = request.payload
        const { typeOfLivestock } = getEndemicsClaim(request)
        setEndemicsClaim(request, typeOfReviewKey, claimType[typeOfReview])

        // If user has an old world application within last 10 months
        if (isFirstTimeEndemicClaimForActiveOldWorldReviewClaim(request)) return h.redirect(`${urlPrefix}/${endemicsVetVisitsReviewTestResults}`)

        // Dairy follow up claim
        if (claimType[typeOfReview] === claimType.endemics && typeOfLivestock === livestockTypes.dairy) {
          return h
            .view(endemicsWhichTypeOfReviewDairyFollowUpException, {
              backLink: pageUrl,
              claimDashboard,
              ruralPaymentsAgency
            })
            .code(400)
            .takeover()
        }

        return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
      }
    }
  }
]
