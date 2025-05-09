import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { claimConstants } from '../../constants/claim.js'
import links from '../../config/routes.js'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getOldWorldClaimFromApplication } from '../../lib/index.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { isPIHuntEnabled } from '../../lib/context-helper.js'

const { endemicsClaim: { typeOfReview: typeOfReviewKey } } = sessionKeys
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults, endemicsWhichTypeOfReviewDairyFollowUpException, endemicsWhichSpecies, endemicsWhichTypeOfReviewException } = links
const { urlPrefix, ruralPaymentsAgency } = config
const { livestockTypes, claimType } = claimConstants

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

export const whichReviewMSHandlers = [
  {
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

        if (!isPIHuntEnabled()) {
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
]
