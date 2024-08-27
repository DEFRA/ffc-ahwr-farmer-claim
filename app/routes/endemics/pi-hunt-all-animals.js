const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const radios = require('../models/form-component/radios')
const { getAmount } = require('../../api-requests/claim-service-api')
const { getTestResult } = require('../../lib/get-test-result')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { endemicsPIHuntRecommended, endemicsDateOfTesting, endemicsPIHuntAllAnimals, endemicsPIHunt, endemicsPIHuntAllAnimalsException, endemicsBiosecurity } = require('../../config/routes')
const { endemicsClaim: { piHuntAllAnimals: piHuntAllAnimalsKey } } = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const { clearPiHuntSessionOnChange } = require('../../lib/clearPiHuntSessionOnChange')

const pageUrl = `${urlPrefix}/${endemicsPIHuntAllAnimals}`
const backLink = (reviewTestResults) => {
  const { isPositive } = getTestResult(reviewTestResults)
  return isPositive ? `${urlPrefix}/${endemicsPIHunt}` : `${urlPrefix}/${endemicsPIHuntRecommended}`
}
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`
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
      const { typeOfLivestock, piHuntAllAnimals, reviewTestResults } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntAllAnimals')([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])
      const questionText = getQuestionText(typeOfLivestock)
      return h.view(endemicsPIHuntAllAnimals, { questionText, backLink: backLink(reviewTestResults), ...yesOrNoRadios })
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
        const { typeOfLivestock, piHuntAllAnimals, reviewTestResults } = getEndemicsClaim(request)
        const yesOrNoRadios = radios('', 'piHuntAllAnimals')([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])
        const questionText = getQuestionText(typeOfLivestock)

        return h.view(endemicsPIHuntAllAnimals, {
          ...yesOrNoRadios,
          questionText,
          backLink: backLink(reviewTestResults),
          errorMessage: {
            text: 'Select yes or no',
            href: '#piHuntAllAnimals'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfReview, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals: previousAnswer } = getEndemicsClaim(request)
      const { piHuntAllAnimals } = request.payload

      setEndemicsClaim(request, piHuntAllAnimalsKey, piHuntAllAnimals)

      if (piHuntAllAnimals === 'no') {
        const livestockText = getLivestockText(typeOfLivestock)
        const claimPaymentNoPiHunt = await getAmount({ type: typeOfReview, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals: 'no' })
        raiseInvalidDataEvent(request, piHuntAllAnimalsKey, `Value ${piHuntAllAnimalsKey} should be yes for PI hunt all cattle tested`)

        if (piHuntAllAnimals !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHuntAllAnimals')
        }

        return h.view(endemicsPIHuntAllAnimalsException, { claimPaymentNoPiHunt, livestockText, ruralPaymentsAgency, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl }).code(400).takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}]
