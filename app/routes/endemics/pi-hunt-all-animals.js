const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const radios = require('../models/form-component/radios')
const { getTestResult } = require('../../lib/get-test-result')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { endemicsPIHuntRecommended, endemicsDateOfTesting, endemicsPIHuntAllAnimals, endemicsPIHunt, endemicsPIHuntAllAnimalsException, endemicsBiosecurity } = require('../../config/routes')
const { endemicsClaim: { piHuntAllAnimals: piHuntAllAnimalsKey } } = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')

const pageUrl = `${urlPrefix}/${endemicsPIHuntAllAnimals}`
const backLink = (request) => {
  const { reviewTestResults } = getEndemicsClaim(request)
  const { isPositive } = getTestResult(reviewTestResults)

  if (isPositive) return `${urlPrefix}/${endemicsPIHunt}`

  return `${urlPrefix}/${endemicsPIHuntRecommended}`
}
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`
const claimPaymentNoPiHunt = '[placeholder amount]'
const getLivestockText = (typeOfLivestock) => {
  const { isBeef } = getLivestockTypes(typeOfLivestock)
  return isBeef ? 'beef' : 'dairy'
}
const getQuestionText = (typeOfLivestock) => `Was the PI hunt done on all ${getLivestockText(typeOfLivestock)} cattle in the herd?`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, piHuntAllAnimals } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntAllAnimals')([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])
      const questionText = getQuestionText(typeOfLivestock)
      return h.view(endemicsPIHuntAllAnimals, { questionText, backLink: backLink(request), ...yesOrNoRadios })
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
        const questionText = getQuestionText(typeOfLivestock)

        return h.view(endemicsPIHuntAllAnimals, {
          ...yesOrNoRadios,
          questionText,
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
      const { typeOfLivestock } = getEndemicsClaim(request)
      console.log('typeOfLivestock', typeOfLivestock)
      setEndemicsClaim(request, piHuntAllAnimalsKey, piHuntAllAnimals)

      if (piHuntAllAnimals === 'no') {
        const livestockText = getLivestockText(typeOfLivestock)
        raiseInvalidDataEvent(request, piHuntAllAnimalsKey, `Value ${piHuntAllAnimalsKey} should be yes for PI hunt all cattle tested`)
        return h.view(endemicsPIHuntAllAnimalsException, { claimPaymentNoPiHunt, livestockText, ruralPaymentsAgency, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl   })
      } else return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}]
