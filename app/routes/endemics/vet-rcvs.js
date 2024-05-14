const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { rcvs: rcvsErrorMessages } = require('../../../app/lib/error-messages')
const { claimType, livestockTypes } = require('../../constants/claim')

const {
  endemicsVetName,
  endemicsVetRCVS,
  endemicsTestUrn,
  endemicsVaccination,
  endemicsBiosecurity,
  endemicsPIHunt,
  endemicsSheepEndemicsPackage,
  endemicsVetVisitsReviewTestResults
} = require('../../config/routes')
const {
  endemicsClaim: { vetRCVSNumber: vetRCVSNumberKey }
} = require('../../session/keys')
const pageUrl = `${urlPrefix}/${endemicsVetRCVS}`
const backLink = `${urlPrefix}/${endemicsVetName}`

const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview, relevantReviewForEndemics } = session.getEndemicsClaim(request)
  if (typeOfReview === claimType.review) return `${urlPrefix}/${endemicsTestUrn}`
  if (typeOfReview === claimType.endemics) {
    if (relevantReviewForEndemics.type === claimType.vetVisits && typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`
    if (typeOfLivestock === livestockTypes.sheep) return `${urlPrefix}/${endemicsSheepEndemicsPackage}`
    if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsTestUrn}`
    if (typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVaccination}`
  }

  return `${urlPrefix}/${endemicsTestUrn}`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { vetRCVSNumber } = session.getEndemicsClaim(request)
        return h.view(endemicsVetRCVS, {
          vetRCVSNumber,
          backLink
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
        failAction: async (request, h, error) => {
          return h
            .view(endemicsVetRCVS, {
              ...request.payload,
              backLink,
              errorMessage: { text: error.details[0].message, href: `#${vetRCVSNumberKey}}` }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { vetRCVSNumber } = request.payload
        const { reviewTestResults } = session.getEndemicsClaim(request)
        session.setEndemicsClaim(request, vetRCVSNumberKey, vetRCVSNumber)

        if (reviewTestResults === 'positive') return h.redirect(`${urlPrefix}/${endemicsPIHunt}`)
        if (reviewTestResults === 'negative') return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)

        return h.redirect(nextPageURL(request))
      }
    }
  }
]
