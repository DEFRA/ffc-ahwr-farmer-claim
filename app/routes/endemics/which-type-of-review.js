import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { claimConstants } from '../../constants/claim.js'
import links from '../../config/routes.js'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { canChangeSpecies, getTypeOfLivestockFromLatestClaim } from '../../lib/context-helper.js'
import { isCattleEndemicsClaimForOldWorldReview } from '../../api-requests/claim-service-api.js'

const { endemicsClaim: { typeOfReview: typeOfReviewKey, typeOfLivestock: typeOfLivestockKey } } = sessionKeys
const { claimType } = claimConstants
const { claimDashboard, endemicsWhichTypeOfReview, endemicsDateOfVisit, endemicsVetVisitsReviewTestResults, endemicsWhichSpecies } = links
const { urlPrefix } = config

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = claimDashboard

const getPreviousAnswer = (typeOfReview) => {
  if (typeOfReview === claimType.review) {
    return 'review'
  } else if (typeOfReview === claimType.endemics) {
    return 'endemics'
  } else {
    return undefined
  }
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      // this can come after the which species page, or before
      const { typeOfReview } = getEndemicsClaim(request)
      const typeOfLivestock = getTypeOfLivestockFromLatestClaim(request)

      // Don't like this being set here but leaving it for now to not break the old routes
      setEndemicsClaim(request, typeOfLivestockKey, typeOfLivestock)

      return h.view(endemicsWhichTypeOfReview, {
        backLink,
        previousAnswer: getPreviousAnswer(typeOfReview)
      })
    }
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

      // if doing a review and currently locked (to disappear with MS introduced)
      if (canChangeSpecies(request, typeOfReview)) {
        return h.redirect(`${urlPrefix}/${endemicsWhichSpecies}`)
      }

      setEndemicsClaim(request, typeOfReviewKey, claimType[typeOfReview])

      // If user has an old world application within last 10 months
      if (isCattleEndemicsClaimForOldWorldReview(request)) {
        return h.redirect(`${urlPrefix}/${endemicsVetVisitsReviewTestResults}`)
      }

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

export const whichReviewHandlers = [getHandler, postHandler]
