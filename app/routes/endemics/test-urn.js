import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { isURNUnique } from '../../api-requests/claim-service-api.js'

const { urlPrefix, ruralPaymentsAgency, optionalPIHunt } = config
const {
  endemicsVetRCVS,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsVaccination,
  endemicsTestUrnException,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfSamplesTested,
  endemicsTestResults,
  endemicsPIHunt,
  endemicsDateOfTesting
} = links
const {
  endemicsClaim: { laboratoryURN: laboratoryURNKey }
} = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsTestUrn}`

const title = (request) => {
  const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isBeef || isDairy) { return 'What’s the laboratory unique reference number (URN) or certificate number of the test results?' }
  }

  return 'What’s the laboratory unique reference number (URN) for the test results?'
}

const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview, reviewTestResults } = getEndemicsClaim(request)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isPositive } = getTestResult(reviewTestResults)

  if (optionalPIHunt.enabled && isEndemicsFollowUp && (isBeef || isDairy)) return `${urlPrefix}/${endemicsDateOfTesting}`
  if (isReview) return `${urlPrefix}/${endemicsVetRCVS}`
  if (isEndemicsFollowUp && isPigs) return `${urlPrefix}/${endemicsVaccination}`
  if ((isBeef || isDairy) && isPositive) return `${urlPrefix}/${endemicsPIHunt}`

  return `${urlPrefix}/${endemicsVetRCVS}`
}

const nextPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isPigs && isReview) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
  if (isPigs && isEndemicsFollowUp) return `${urlPrefix}/${endemicsNumberOfSamplesTested}`
  if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestResults}`

  return `${urlPrefix}/${endemicsCheckAnswers}`
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { laboratoryURN } = getEndemicsClaim(request)
      return h.view(endemicsTestUrn, {
        title: title(request),
        laboratoryURN,
        backLink: previousPageUrl(request)
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
        laboratoryURN: Joi.string()
          .trim()
          .max(50)
          .pattern(/^[A-Za-z0-9-]+$/)
          .required()
          .messages({
            'any.required': 'Enter the URN',
            'string.base': 'Enter the URN',
            'string.empty': 'Enter the URN',
            'string.max': 'URN must be 50 characters or fewer',
            'string.pattern.base': 'URN must only include letters a to z, numbers and a hyphen'
          })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
        const { isEndemicsFollowUp } = getReviewType(typeOfReview)
        const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
        const isBeefOrDairyEndemics = (isBeef || isDairy) && isEndemicsFollowUp
        const errorMessage = (err.details[0].message === 'Enter the URN' && isBeefOrDairyEndemics) ? 'Enter the URN or certificate number' : err.details[0].message
        return h
          .view(endemicsTestUrn, {
            ...request.payload,
            title: title(request),
            errorMessage: { text: errorMessage, href: '#laboratoryURN' },
            backLink: previousPageUrl(request)
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { laboratoryURN } = request.payload
      const { organisation, typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
      const isBeefOrDairyEndemics = (isBeef || isDairy) && isEndemicsFollowUp
      const response = await isURNUnique({ sbi: organisation.sbi, laboratoryURN }, request.logger)
      setEndemicsClaim(request, laboratoryURNKey, laboratoryURN)

      if (!response?.isURNUnique) {
        raiseInvalidDataEvent(request, laboratoryURNKey, 'urnReference entered is not unique')
        return h.view(endemicsTestUrnException, { backLink: pageUrl, ruralPaymentsAgency, isBeefOrDairyEndemics }).code(400).takeover()
      }

      return h.redirect(nextPageUrl(request))
    }
  }
}

export const testUrnHandlers = [getHandler, postHandler]
