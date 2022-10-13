const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { vetRcvs: rcvsKey } } = require('../session/keys')
const { rcvs: rcvsErrorMessages } = require('../../app/lib/error-messages')

module.exports = [{
  method: 'GET',
  path: '/claim/vet-rcvs',
  options: {
    handler: async (request, h) => {
      const rcvs = session.getClaim(request, rcvsKey)
      return h.view('vet-rcvs', { rcvs })
    }
  }
}, {
  method: 'POST',
  path: '/claim/vet-rcvs',
  options: {
    validate: {
      payload: Joi.object({
        rcvs: Joi.string().trim().pattern(/^\d{6}[\dX]{1}$/i).required()
          .messages({
            'any.required': rcvsErrorMessages.enterRCVS,
            'string.base': rcvsErrorMessages.enterRCVS,
            'string.empty': rcvsErrorMessages.enterRCVS,
            'string.pattern.base': rcvsErrorMessages.validRCVS
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('vet-rcvs', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { rcvs } = request.payload
      session.setClaim(request, rcvsKey, rcvs)
      return h.redirect('/urn-result')
    }
  }
}]
