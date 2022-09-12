const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { vetPractice: practiceKey } } = require('../session/keys')
const { practice: practiceErrorMessages } = require('../../app/lib/error-messages')

module.exports = [{
  method: 'GET',
  path: '/vet-practice',
  options: {
    auth: false,
    handler: async (request, h) => {
      const practice = session.getClaim(request, practiceKey)
      return h.view('vet-practice', { practice })
    }
  }
}, {
  method: 'POST',
  path: '/vet-practice',
  options: {
    auth: false,
    validate: {
      payload: Joi.object({
        practice: Joi.string().trim().max(100).required()
          .messages({
            'any.required': practiceErrorMessages.enterName,
            'string.base': practiceErrorMessages.enterName,
            'string.empty': practiceErrorMessages.enterName,
            'string.max': practiceErrorMessages.nameLength
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('vet-practice', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { practice } = request.payload
      session.setClaim(request, practiceKey, practice)
      return h.redirect('/submit-claim')
    }
  }
}]
