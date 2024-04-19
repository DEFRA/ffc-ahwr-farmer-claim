const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { name: nameErrorMessages } = require('../../../app/lib/error-messages')
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsVetName,
  endemicsVetRCVS
} = require('../../config/routes')
const {
  endemicsClaim: { vetsName: vetsNamedKey }
} = require('../../session/keys')
const pageUrl = `${urlPrefix}/${endemicsVetName}`

const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  if (typeOfLivestock === livestockTypes.dairy && typeOfReview === claimType.review) return `${urlPrefix}/${endemicsSpeciesNumbers}`
  
  return `${urlPrefix}/${endemicsNumberOfSpeciesTested}`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { vetsName } = session.getEndemicsClaim(request)
        return h.view(endemicsVetName, {
          vetsName,
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
          vetsName: Joi.string().trim().max(50).pattern(/^[A-Za-z0-9&,' \-/()]+$/).required()
            .messages({
              'any.required': nameErrorMessages.enterName,
              'string.base': nameErrorMessages.enterName,
              'string.empty': nameErrorMessages.enterName,
              'string.max': nameErrorMessages.nameLength,
              'string.pattern.base': nameErrorMessages.namePattern
            })
        }),
        failAction: async (request, h, error) => {
          return h
            .view(endemicsVetName, {
              ...request.payload,
              backLink: previousPageUrl(request),
              errorMessage: { text: error.details[0].message, href: `#${vetsNamedKey}}` }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { vetsName } = request.payload
        session.setEndemicsClaim(request, vetsNamedKey, vetsName)
        return h.redirect(`${urlPrefix}/${endemicsVetRCVS}`)
      }
    }
  }
]
