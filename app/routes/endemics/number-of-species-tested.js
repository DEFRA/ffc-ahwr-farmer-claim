const Joi = require('joi')
const session = require('../../session')
const config = require('../../config')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsNumberOfSpeciesException,
  endemicsVetName,
  endemicsLambErrorException
} = require('../../config/routes')
const {
  endemicsClaim: { numberAnimalsTested: numberAnimalsTestedKey }
} = require('../../session/keys')
const {
  thresholds: {
    minimumNumberOFBeefTested,
    minimumNumberOFPigsTested,
    minimumNumberOFSheepTested
  }
} = require('../../constants/amounts')
const { livestockTypes } = require('../../constants/claim')
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
              'string.pattern.base': 'Number of animals tested must only include numbers'
            })
        }),
        failAction: async (request, h, error) => {
          return h
            .view(endemicsNumberOfSpeciesTested, {
              ...request.payload,
              backLink,
              errorMessage: { text: error.details[0].message, href: `#${numberAnimalsTestedKey}}` }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { numberAnimalsTested } = request.payload
        const { typeOfLivestock } = session.getEndemicsClaim(request)
        const eligibleBeef = livestockTypes.beef === typeOfLivestock && numberAnimalsTested >= minimumNumberOFBeefTested
        const eligiblePigs = livestockTypes.pigs === typeOfLivestock && numberAnimalsTested >= minimumNumberOFPigsTested
        const eligibleSheep = livestockTypes.sheep === typeOfLivestock && numberAnimalsTested >= minimumNumberOFSheepTested

        session.setEndemicsClaim(request, numberAnimalsTestedKey, numberAnimalsTested)

        if (typeOfLivestock === livestockTypes.sheep && !eligibleSheep) {
          return h.view(endemicsLambErrorException, { ruralPaymentsAgency: config.ruralPaymentsAgency, continueClaimLink: nextPageURL, backLink: pageUrl }).code(400).takeover()
        }

        if (eligibleBeef || eligiblePigs || eligibleSheep) {
          return h.redirect(nextPageURL)
        }
        return h.view(endemicsNumberOfSpeciesException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
      }
    }
  }
]
