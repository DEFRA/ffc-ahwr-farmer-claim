const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { vetName: nameKey } } = require('../session/keys')
const { name: nameErrorMessages } = require('../../app/lib/error-messages')

module.exports = [{
  method: 'GET',
  path: '/claim/vet-name',
  options: {
    handler: async (request, h) => {
      const claim = session.getClaim(request)
      const name = claim?.[`${nameKey}`]
      const backToVetVisitDate = claim?.data?.whichReview === 'dairy'
      return h.view('vet-name', { name, backToVetVisitDate })
    }
  }
}, {
  method: 'POST',
  path: '/claim/vet-name',
  options: {
    validate: {
      payload: Joi.object({
        name: Joi.string().trim().max(50).pattern(/^[A-Za-z0-9&,' \-/()]+$/).required()
          .messages({
            'any.required': nameErrorMessages.enterName,
            'string.base': nameErrorMessages.enterName,
            'string.empty': nameErrorMessages.enterName,
            'string.max': nameErrorMessages.nameLength,
            'string.pattern.base': nameErrorMessages.namePattern
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('vet-name', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { name } = request.payload
      session.setClaim(request, nameKey, name)
      return h.redirect('/claim/vet-rcvs')
    }
  }
}]
