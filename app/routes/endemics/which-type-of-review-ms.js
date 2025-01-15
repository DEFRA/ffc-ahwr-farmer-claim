const Joi = require('joi')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { endemicsClaim: { typeOfReview: typeOfReviewKey } } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults, endemicsWhichTypeOfReviewDairyFollowUpException } = require('../../config/routes')
const { isFirstTimeEndemicClaimForActiveOldWorldReviewClaim } = require('../../api-requests/claim-service-api')
const { urlPrefix, ruralPaymentsAgency, optionalPIHunt } = require('../../config')

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = claimDashboard

const getPreviousAnswer = (typeOfReview) => {
  if (typeOfReview === claimType.review) {
    return 'review'
  }
  
  if (typeOfReview === claimType.endemics) {
    return 'endemics'
  }
  
  return undefined
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfReview } = getEndemicsClaim(request)

      return h.view(endemicsWhichTypeOfReview, {
        backLink,
        previousAnswer: getPreviousAnswer(typeOfReview)
      })
    },
    tags: ['ms']
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        typeOfReview: Joi.string()
          .valid('review', 'endemics')
          .required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })

        return h
          .view(endemicsWhichTypeOfReview, {
            errorMessage: { text: 'Select what you are claiming for', href: '#typeOfReview' },
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

      if (!optionalPIHunt.enabled) {
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
      }

      // If user has an old world application within last 10 months
      if (isFirstTimeEndemicClaimForActiveOldWorldReviewClaim(request)) {
        return h.redirect(`${urlPrefix}/${endemicsVetVisitsReviewTestResults}`)
      }

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
