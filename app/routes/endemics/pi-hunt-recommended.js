const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const radios = require('../models/form-component/radios')
const { getAmount } = require('../../api-requests/claim-service-api')
const { endemicsPIHuntRecommended, endemicsPIHunt, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommendedException } = require('../../config/routes')
const { endemicsClaim: { piHuntRecommended: piHuntRecommendedKey } } = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const { clearPiHuntSessionOnChange } = require('../../lib/clear-pi-hunt-session-on-change')

const pageUrl = `${urlPrefix}/${endemicsPIHuntRecommended}`
const backLink = `${urlPrefix}/${endemicsPIHunt}`
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHuntRecommended } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntRecommended', undefined, { inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
      return h.view(endemicsPIHuntRecommended, { backLink, ...yesOrNoRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHuntRecommended: Joi.string().valid('yes', 'no').required()
      }),
      failAction: async (request, h, error) => {
        const { piHuntRecommended } = getEndemicsClaim(request)
        const errorText = 'Select if the vet recommended the PI hunt'
        const yesOrNoRadios = radios('', 'piHuntRecommended', errorText, { inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
        return h.view(endemicsPIHuntRecommended, {
          ...yesOrNoRadios,
          backLink,
          errorMessage: {
            text: errorText,
            href: '#piHuntRecommended'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfReview, reviewTestResults, typeOfLivestock, piHunt, piHuntRecommended: previousAnswer } = getEndemicsClaim(request)
      const { piHuntRecommended } = request.payload
      setEndemicsClaim(request, piHuntRecommendedKey, piHuntRecommended)

      if (piHuntRecommended === 'no') {
        const claimPaymentNoPiHunt = await getAmount({ type: typeOfReview, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals: 'no' })
        raiseInvalidDataEvent(request, piHuntRecommendedKey, `Value ${piHuntRecommended} should be yes for PI hunt vet recommendation`)
        if (piHuntRecommended !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHuntRecommended')
        }

        return h.view(endemicsPIHuntRecommendedException, { claimPaymentNoPiHunt, ruralPaymentsAgency, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl }).code(400).takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
    }
  }
}]
