const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { claimType, livestockTypes } = require('../../constants/claim')
const {
  endemicsVetRCVS,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsVaccination,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfSamplesTested,
  endemicsTestResults,
  endemicsVetVisitsReviewTestResults
} = require('../../config/routes')
const {
  endemicsClaim: { laboratoryURN: laboratoryURNKey }
} = require('../../session/keys')

const pageUrl = `${urlPrefix}/${endemicsTestUrn}`

const title = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

  if (typeOfReview === claimType.endemics) {
    if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return 'What’s the laboratory unique reference number (URN) or certificate number of the test results?'
  }

  return 'What’s the laboratory unique reference number (URN) for the test results?'
}

const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview, latestVetVisitApplication } = session.getEndemicsClaim(request)

  if (typeOfReview === claimType.review) return `${urlPrefix}/${endemicsVetRCVS}`
  if (typeOfReview === claimType.endemics) {
    if (latestVetVisitApplication) {
      if (typeOfLivestock === livestockTypes.dairy) return `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`
    }
    if (typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVaccination}`
  }
  return `${urlPrefix}/${endemicsVetRCVS}`
}

const nextPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

  if (typeOfLivestock === livestockTypes.pigs && typeOfReview === claimType.review) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
  if (typeOfLivestock === livestockTypes.pigs && typeOfReview === claimType.endemics) return `${urlPrefix}/${endemicsNumberOfSamplesTested}`
  if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsTestResults}`

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
          return h
            .view(endemicsTestUrn, {
              ...request.payload,
              title: title(request),
              errorMessage: { text: error.details[0].message, href: '#laboratoryURN' },
              backLink: previousPageUrl(request)
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { laboratoryURN } = request.payload

        session.setEndemicsClaim(request, laboratoryURNKey, laboratoryURN)

        return h.redirect(nextPageUrl(request))
      }
    }
  }
]
