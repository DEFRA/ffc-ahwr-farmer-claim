const Joi = require('joi')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { endemicsClaim: { typeOfReview: typeOfReviewKey } } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults, endemicsWhichTypeOfReviewDairyFollowUpException, endemicsWhichSpecies, endemicsWhichTypeOfReviewException } = require('../../config/routes')
const { urlPrefix, ruralPaymentsAgency, optionalPIHunt } = require('../../config')
const { getOldWorldClaimFromApplication } = require('../../lib')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = `${urlPrefix}/${endemicsWhichSpecies}`

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
      const { typeOfLivestock, previousClaims, latestVetVisitApplication: oldWorldApplication } = getEndemicsClaim(request)

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

      const relevantClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

      const oldWorldClaimTypeOfLivestock = oldWorldApplication?.data?.whichReview

      if (claimType[typeOfReview] === claimType.endemics) {
        const prevReviewClaim = relevantClaims.find(claim => claim.type === claimType.review) || getOldWorldClaimFromApplication(oldWorldApplication, typeOfLivestock)

        if (!prevReviewClaim) {
          raiseInvalidDataEvent(
            request,
            typeOfReviewKey,
            'Cannot claim for endemics without a previous review.'
          )

          return h
            .view(`${endemicsWhichTypeOfReviewException}-ms`, {
              backLink: pageUrl,
              backToPageMessage: 'Tell us if you are claiming for a review or follow up.'
            })
            .code(400)
            .takeover()
        }
      }

      const isCattleEndemicsClaimForOldWorldReview =
        claimType[typeOfReview] === claimType.endemics &&
        [livestockTypes.beef, livestockTypes.dairy].includes(oldWorldClaimTypeOfLivestock) &&
        relevantClaims.length === 0 &&
        typeOfLivestock === oldWorldClaimTypeOfLivestock

      if (isCattleEndemicsClaimForOldWorldReview) {
        return h.redirect(`${urlPrefix}/${endemicsVetVisitsReviewTestResults}`)
      }

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
