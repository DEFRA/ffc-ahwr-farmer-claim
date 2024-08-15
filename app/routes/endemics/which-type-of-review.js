const Joi = require('joi')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { endemicsClaim: { typeOfReview: typeOfReviewKey, typeOfLivestock: typeOfLivestockKey } } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults } = require('../../config/routes')
const { isFirstTimeEndemicClaimForActiveOldWorldReviewClaim } = require('../../api-requests/claim-service-api')
const { urlPrefix } = require('../../config')

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = claimDashboard

const getTypeOfLivestockFromPastClaims = (previousClaims, latestVetVisitApplication) => {
  if (previousClaims?.length) {
    return previousClaims[0].data?.typeOfLivestock
  }

  return latestVetVisitApplication.data?.whichReview
}

const getPreviousAnswer = (typeOfReview) => {
  if (typeOfReview === claimType.review) {
    return 'review'
  } else if (typeOfReview === claimType.endemics) {
    return 'endemics'
  } else {
    return undefined
  }
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { typeOfReview, previousClaims, latestVetVisitApplication } = getEndemicsClaim(request)
        const typeOfLivestock = getTypeOfLivestockFromPastClaims(previousClaims, latestVetVisitApplication)
        setEndemicsClaim(request, typeOfLivestockKey, typeOfLivestock)

        const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`
        return h.view(endemicsWhichTypeOfReview, {
          backLink,
          typeOfLivestock: formattedTypeOfLivestock,
          previousAnswer: getPreviousAnswer(typeOfReview)
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
        failAction: (request, h, _err) => {
          const { typeOfLivestock } = getEndemicsClaim(request)
          const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`
          return h
            .view(endemicsWhichTypeOfReview, {
              errorMessage: { text: 'Select what you are claiming for', href: '#typeOfReview' },
              backLink,
              typeOfLivestock: formattedTypeOfLivestock
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfReview } = request.payload
        // const { typeOfLivestock } = getEndemicsClaim(request)
        setEndemicsClaim(request, typeOfReviewKey, claimType[typeOfReview])
        // If user has an old world application within last 10 months
        if (isFirstTimeEndemicClaimForActiveOldWorldReviewClaim(request)) return h.redirect(`${urlPrefix}/${endemicsVetVisitsReviewTestResults}`)

        return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
      }
    }
  }
]
