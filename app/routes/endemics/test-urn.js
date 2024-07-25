const Joi = require('joi')
const session = require('../../session')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const {
  endemicsVetRCVS,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsVaccination,
  endemicsTestUrnException,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfSamplesTested,
  endemicsTestResults,
  endemicsPIHunt
} = require('../../config/routes')
const {
  endemicsClaim: { laboratoryURN: laboratoryURNKey }
} = require('../../session/keys')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getReviewType } = require('../../lib/get-review-type')
const { getTestResult } = require('../../lib/get-test-result')
const { isURNUnique } = require('../../api-requests/claim-service-api')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')

const pageUrl = `${urlPrefix}/${endemicsTestUrn}`

const title = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isBeef || isDairy) { return 'What’s the laboratory unique reference number (URN) or certificate number of the test results?' }
  }

  return 'What’s the laboratory unique reference number (URN) for the test results?'
}

const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview, reviewTestResults } = session.getEndemicsClaim(request)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isPositive } = getTestResult(reviewTestResults)

  if (isReview) return `${urlPrefix}/${endemicsVetRCVS}`
  if (isEndemicsFollowUp && isPigs) return `${urlPrefix}/${endemicsVaccination}`
  if ((isBeef || isDairy) && isPositive) return `${urlPrefix}/${endemicsPIHunt}`

  return `${urlPrefix}/${endemicsVetRCVS}`
}

const nextPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isPigs && isReview) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
  if (isPigs && isEndemicsFollowUp) return `${urlPrefix}/${endemicsNumberOfSamplesTested}`
  if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestResults}`

  return `${urlPrefix}/${endemicsCheckAnswers}`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { laboratoryURN } = session.getEndemicsClaim(request)
        return h.view(endemicsTestUrn, {
          title: title(request),
          laboratoryURN,
          backLink: previousPageUrl(request)
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
        failAction: async (request, h, error) => {
          const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
          const { isEndemicsFollowUp } = getReviewType(typeOfReview)
          const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
          const isBeefOrDairyEndemics = (isBeef || isDairy) && isEndemicsFollowUp
          const errorMessage = (error.details[0].message === 'Enter the URN' && isBeefOrDairyEndemics) ? 'Enter the URN or certificate number' : error.details[0].message
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
        const { organisation, typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
        const { isEndemicsFollowUp } = getReviewType(typeOfReview)
        const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
        const isBeefOrDairyEndemics = (isBeef || isDairy) && isEndemicsFollowUp
        const response = await isURNUnique({ sbi: organisation.sbi, laboratoryURN })

        session.setEndemicsClaim(request, laboratoryURNKey, laboratoryURN)

        if (!response?.isURNUnique) {
          raiseInvalidDataEvent(request, laboratoryURNKey, 'urnReference entered is not unique')
          return h.view(endemicsTestUrnException, { backLink: pageUrl, ruralPaymentsAgency, isBeefOrDairyEndemics }).code(400).takeover()
        }

        return h.redirect(nextPageUrl(request))
      }
    }
  }
]
