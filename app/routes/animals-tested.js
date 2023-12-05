const Joi = require('joi')
const session = require('../session')
const { claim: { animalsTested: animalsTestedKey }, thresholdPerClaimType } = require('../session/keys')
const { animalsTested: atErrorMessages } = require('../../app/lib/error-messages')

module.exports = [{
  method: 'GET',
  path: '/claim/animals-tested',
  options: {
    handler: async (request, h) => {
      const animalsTested = session.getClaim(request, animalsTestedKey)
      return h.view('animals-tested', { animalsTested })
    }
  }
}, {
  method: 'POST',
  path: '/claim/animals-tested',
  options: {
    validate: {
      payload: Joi.object({
        animalsTested: Joi.number().integer().max(99999).required()
          .messages({
            'number.base': atErrorMessages.enterNumber,
            'number.max': atErrorMessages.numberMax
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('animals-tested', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { animalsTested } = request.payload
      session.setClaim(request, animalsTestedKey, animalsTested)
      const claimType = session.getClaim(request, 'data')
      if (
        !!claimType &&
        !!claimType.whichReview &&
        Object.prototype.hasOwnProperty.call(thresholdPerClaimType, claimType.whichReview) &&
        thresholdPerClaimType[claimType.whichReview] <= animalsTested
      ) return h.redirect('/claim/vet-name')
      else return h.redirect('/claim/number-of-animals-ineligible')
    }
  }
}]
