const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsEligibility,
  endemicsIneligibility,
  endemicsVetName
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
const pageUrl = `${urlPrefix}/${endemicsEligibility}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbers}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { numberAnimalsTested } = session.getEndemicsClaim(request)
        return h.view(endemicsEligibility, {
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
            .view(endemicsEligibility, {
              ...request.payload,
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
        console.log('&&&&&&&&&&&&&&&&', eligibleBeef, eligiblePigs, eligibleSheep, typeOfLivestock, numberAnimalsTested)

        if (eligibleBeef || eligiblePigs || eligibleSheep) {
          return h.redirect(`${urlPrefix}/${endemicsVetName}`)
        }
        return h.view(endemicsIneligibility, { backLink: pageUrl }).code(400).takeover()
      }
    }
  }
]
