const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { urnResult: urnResultKey } } = require('../session/keys')
const { urn: urnErrorMessages } = require('../../app/lib/error-messages')

module.exports = [{
  method: 'GET',
  path: '/urn-result',
  options: {
    handler: async (request, h) => {
      const urn = session.getClaim(request, urnResultKey)
      return h.view('urn-result', { urn })
    }
  }
}, {
  method: 'POST',
  path: '/urn-result',
  options: {
    validate: {
      payload: Joi.object({
        urn: Joi.string().trim().max(100).required()
          .messages({
            'any.required': urnErrorMessages.enterUrn,
            'string.base': urnErrorMessages.enterUrn,
            'string.empty': urnErrorMessages.enterUrn,
            'string.max': urnErrorMessages.urnLength
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('urn-result', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { urn } = request.payload
      session.setClaim(request, urnResultKey, urn)
      return h.redirect('/check-answers')
    }
  }
}]
