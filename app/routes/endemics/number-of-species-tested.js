const Joi = require('joi')
const session = require('../../session')
const config = require('../../config')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsNumberOfSpeciesException,
  endemicsVetName,
  endemicsNumberOfSpeciesSheepException
} = require('../../config/routes')
const {
  endemicsClaim: { numberAnimalsTested: numberAnimalsTestedKey }
} = require('../../session/keys')
const { thresholds: { numberOfSpeciesTested: numberOfSpeciesTestedThreshold } } = require('../../constants/amounts')
const { livestockTypes } = require('../../constants/claim')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const pageUrl = `${urlPrefix}/${endemicsNumberOfSpeciesTested}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbers}`
const nextPageURL = `${urlPrefix}/${endemicsVetName}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { numberAnimalsTested } = session.getEndemicsClaim(request)

        return h.view(endemicsNumberOfSpeciesTested, {
          numberAnimalsTested,
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
          numberAnimalsTested: Joi.string().pattern(/^\d+$/).max(4).required()
            .messages({
              'string.base': 'Enter the number of animals tested',
              'string.empty': 'Enter the number of animals tested',
              'string.max': 'The number of animals tested should not exceed 9999',
              'string.pattern.base': 'The number of animals samples were taken from must only include numbers'
            })
        }),
        failAction: async (request, h, error) => {
          return h
            .view(endemicsNumberOfSpeciesTested, {
              ...request.payload,
              backLink,
              errorMessage: { text: error.details[0].message, href: `#${numberAnimalsTestedKey}` }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { numberAnimalsTested } = request.payload
        const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

        const threshold = numberOfSpeciesTestedThreshold[typeOfLivestock][typeOfReview]
        const isEligible = numberAnimalsTested >= threshold

        session.setEndemicsClaim(request, numberAnimalsTestedKey, numberAnimalsTested)

        if (isEligible) return h.redirect(nextPageURL)

        if (numberAnimalsTested === '0') {
          return h.view(endemicsNumberOfSpeciesTested, { ...request.payload, backLink, errorMessage: { text: 'The number of animals tested cannot be 0', href: `#${numberAnimalsTestedKey}` } }).code(400).takeover()
        }

        if (typeOfLivestock === livestockTypes.sheep) {
          raiseInvalidDataEvent(request, numberAnimalsTestedKey, `Value ${numberAnimalsTested} is less than required value ${threshold} for ${typeOfLivestock}`)
          return h.view(endemicsNumberOfSpeciesSheepException, { ruralPaymentsAgency: config.ruralPaymentsAgency, continueClaimLink: nextPageURL, backLink: pageUrl }).code(400).takeover()
        }

        raiseInvalidDataEvent(request, numberAnimalsTestedKey, `Value ${numberAnimalsTested} is less than required value ${threshold} for ${typeOfLivestock}`)
        return h.view(endemicsNumberOfSpeciesException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
      }
    }
  }
]
