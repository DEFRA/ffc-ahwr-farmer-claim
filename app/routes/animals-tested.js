const Joi = require('joi')
const session = require('../session')
const { claim: { animalsTested: animalsTestedKey } } = require('../session/keys')
const { animalsTested: atErrorMessages } = require('../../app/lib/error-messages')
const { thresholdPerClaimType } = require('../constants/claim')

const getHandler = {
  method: 'GET',
  path: '/claim/animals-tested',
  options: {
    handler: async (request, h) => {
      const animalsTested = session.getClaim(request, animalsTestedKey)
      return h.view('animals-tested', { animalsTested })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: '/claim/animals-tested',
  options: {
    validate: {
      payload: Joi.object({
        animalsTested: Joi.string().pattern(/^\d+$/).max(6).required()
          .messages({
            'string.base': atErrorMessages.enterNumber,
            'string.empty': atErrorMessages.enterNumber,
            'string.max': atErrorMessages.numberMax,
            'string.pattern.base': atErrorMessages.numberPattern
          })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.view('animals-tested', {
          ...request.payload,
          errorMessage: {
            text: err.details[0].message,
            href: '#number-of-animals-tested'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { animalsTested } = request.payload
      const claimType = session.getClaim(request, 'data')
      if (
        !!claimType &&
        !!claimType.whichReview &&
        Object.hasOwn(thresholdPerClaimType, claimType.whichReview) &&
        thresholdPerClaimType[claimType.whichReview] <= animalsTested
      ) {
        session.setClaim(request, animalsTestedKey, animalsTested)
        return h.redirect('/claim/vet-name')
      } else {
        session.setClaim(request, animalsTestedKey, animalsTested, 'fail-threshold')
        return h.redirect('/claim/number-of-animals-ineligible')
      }
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
