const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { vetRcvs: rcvsKey } } = require('../session/keys')
const { rcvs: rcvsErrorMessages } = require('../../app/lib/error-messages')

const getHandler = {
  method: 'GET',
  path: '/claim/vet-rcvs',
  options: {
    handler: async (request, h) => {
      const rcvs = session.getClaim(request, rcvsKey)
      return h.view('vet-rcvs', { rcvs })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: '/claim/vet-rcvs',
  options: {
    validate: {
      payload: Joi.object({
        rcvs: Joi.string().trim().pattern(/^\d{6}[\dX]$/i).required()
          .messages({
            'any.required': rcvsErrorMessages.enterRCVS,
            'string.base': rcvsErrorMessages.enterRCVS,
            'string.empty': rcvsErrorMessages.enterRCVS,
            'string.pattern.base': rcvsErrorMessages.validRCVS
          })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.view('vet-rcvs', { ...request.payload, errorMessage: { text: err.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { rcvs } = request.payload
      session.setClaim(request, rcvsKey, rcvs)
      return h.redirect('/claim/urn-result')
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
