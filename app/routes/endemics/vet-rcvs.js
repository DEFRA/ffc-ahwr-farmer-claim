import Joi from 'joi'
import { config } from '../../config/index.js'
import { errorMessages } from '../../lib/error-messages.js'
import { claimConstants } from '../../constants/claim.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../constants/constants.js'

const { optionalPIHunt, urlPrefix } = config
const { rcvs: rcvsErrorMessages } = errorMessages
const { claimType, livestockTypes } = claimConstants

const {
  endemicsVetName,
  endemicsVetRCVS,
  endemicsTestUrn,
  endemicsVaccination,
  endemicsBiosecurity,
  endemicsPIHunt,
  endemicsSheepEndemicsPackage,
  endemicsVetVisitsReviewTestResults
} = links
const {
  endemicsClaim: { vetRCVSNumber: vetRCVSNumberKey, dateOfVisit: dateOfVisitKey },
} = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsVetRCVS}`
const backLink = `${urlPrefix}/${endemicsVetName}`

const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview, relevantReviewForEndemics } = getEndemicsClaim(request)
  const { isBeef, isDairy, isSheep } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)
  if (isReview) return `${urlPrefix}/${endemicsTestUrn}`
  if (isEndemicsFollowUp) {
    if (relevantReviewForEndemics.type === claimType.vetVisits && typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`
    if (isSheep) return `${urlPrefix}/${endemicsSheepEndemicsPackage}`
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestUrn}`
    if (typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVaccination}`
  }

  return `${urlPrefix}/${endemicsTestUrn}`
}

const isPIHuntEnabledAndVisitDateAfterGoLive = (request) => {
  return optionalPIHunt.enabled && new Date(getEndemicsClaim(request, dateOfVisitKey)) >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { vetRCVSNumber } = getEndemicsClaim(request)
      return h.view(endemicsVetRCVS, {
        vetRCVSNumber,
        backLink
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
        vetRCVSNumber: Joi.string()
          .trim()
          .pattern(/^\d{6}[\dX]$/i)
          .required()
          .messages({
            'any.required': rcvsErrorMessages.enterRCVS,
            'string.base': rcvsErrorMessages.enterRCVS,
            'string.empty': rcvsErrorMessages.enterRCVS,
            'string.pattern.base': rcvsErrorMessages.validRCVS
          })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h
          .view(endemicsVetRCVS, {
            ...request.payload,
            backLink,
            errorMessage: { text: err.details[0].message, href: `#${vetRCVSNumberKey}}` }
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { vetRCVSNumber } = request.payload
      const { reviewTestResults, typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
      const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      const { isNegative, isPositive } = getTestResult(reviewTestResults)

      setEndemicsClaim(request, vetRCVSNumberKey, vetRCVSNumber)

      if (isPIHuntEnabledAndVisitDateAfterGoLive(request) && isEndemicsFollowUp && (isBeef || isDairy)) {
        return h.redirect(`${urlPrefix}/${endemicsPIHunt}`)
      }

      if (isBeef || isDairy) {
        if (isPositive) return h.redirect(`${urlPrefix}/${endemicsPIHunt}`)
        if (isNegative) return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
      }

      return h.redirect(nextPageURL(request))
    }
  }
}

export const vetRCVSHandlers = [getHandler, postHandler]
