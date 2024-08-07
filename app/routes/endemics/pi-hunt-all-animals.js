const Joi = require('joi')
const {getEndemicsClaim, setEndemicsClaim} = require('../../session')
const { urlPrefix } = require('../../config')
const radios = require('../models/form-component/radios')
const { getTestResult } = require('../../lib/get-test-result')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { endemicsPIHuntRecommended, endemicsDateOfTesting, endemicsPIHuntAllAnimals, endemicsPIHunt } = require('../../config/routes')
const { endemicsClaim: { piHuntAllAnimals: piHuntAllAnimalsKey } } = require('../../session/keys')


const pageUrl = `${urlPrefix}/${endemicsPIHuntAllAnimals}`
const backLink =(request)=> {
  const { reviewTestResults } = getEndemicsClaim(request)
  const { isPositive } = getTestResult(reviewTestResults)

  if (isPositive) return `${urlPrefix}/${endemicsPIHunt}`
  
  return `${urlPrefix}/${endemicsPIHuntRecommended}`
}
const questionText = (typeOfLivestock) => {
  const {isBeef} = getLivestockTypes(typeOfLivestock)

  if (isBeef) {
    return 'Was the PI hunt done on all beef cattle in the herd?'
  }

  return 'Was the PI hunt done on all dairy cattle in the herd?'
}

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, piHuntAllAnimals } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntAllAnimals')([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])
      return h.view(endemicsPIHuntAllAnimals, { questionText: questionText(typeOfLivestock), backLink: backLink(request), ...yesOrNoRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHuntAllAnimals: Joi.string().valid('yes', 'no').required()
      }),
      failAction: async (request, h, error) => {
        const { typeOfLivestock, piHuntAllAnimals } = getEndemicsClaim(request)
        const yesOrNoRadios = radios('', 'piHuntAllAnimals')([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])

        return h.view(endemicsPIHuntAllAnimals, {
          ...yesOrNoRadios,
          questionText: questionText(typeOfLivestock),
          backLink: backLink(request),
          errorMessage: {
            text: 'Select yes or no',
            href: '#piHuntAllAnimals'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { piHuntAllAnimals } = request.payload

      setEndemicsClaim(request, piHuntAllAnimalsKey, piHuntAllAnimals)

      return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}]
