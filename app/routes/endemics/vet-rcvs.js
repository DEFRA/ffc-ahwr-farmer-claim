const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { rcvs: rcvsErrorMessages } = require('../../../app/lib/error-messages')
const { claimType, livestockTypes } = require('../../constants/claim')
const { isWithInLastTenMonths } = require('../../api-requests/claim-service-api')
const {
  endemicsVetName,
  endemicsVetRCVS,
  endemicsTestUrn,
  endemicsTestResults,
  endemicsVaccination,
  endemicsEndemicsPackage
} = require('../../config/routes')
const {
  endemicsClaim: { vetRCVSNumber: vetRCVSNumberKey }
} = require('../../session/keys')
const pageUrl = `${urlPrefix}/${endemicsVetRCVS}`
const backLink = `${urlPrefix}/${endemicsVetName}`

const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview, latestVetVisitApplication } = session.getEndemicsClaim(request)
  if (typeOfReview === claimType.review) return `${urlPrefix}/${endemicsTestUrn}`
  if (typeOfReview === claimType.endemics) {
    if ((isWithInLastTenMonths(latestVetVisitApplication?.createdAt))) {
      if ([livestockTypes.beef, livestockTypes.pigs, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsTestResults}`
    }
    if (typeOfLivestock === livestockTypes.sheep) return `${urlPrefix}/${endemicsEndemicsPackage}`
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
          vetRCVSNumber: Joi.string().trim().pattern(/^\d{6}[\dX]$/i).required()
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
        session.setEndemicsClaim(request, vetRCVSNumberKey, vetRCVSNumber)
        return h.redirect(nextPageURL(request))
      }
    }
  }
]
