const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { rcvs: rcvsErrorMessages } = require('../../../app/lib/error-messages')
const {
  endemicsVetName,
  endemicsVetRCVS,
  endemicsTestUrn
} = require('../../config/routes')
const {
  endemicsClaim: { vetRCVSNumber: vetRCVSNumberKey }
} = require('../../session/keys')
const pageUrl = `${urlPrefix}/${endemicsVetRCVS}`
const backLink = `${urlPrefix}/${endemicsVetName}`

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
          vetRCVSNumber: Joi.string().trim().pattern(/^\d{6}[\dX]{1}$/i).required()
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
        return h.redirect(`${urlPrefix}/${endemicsTestUrn}`)
      }
    }
  }
]
