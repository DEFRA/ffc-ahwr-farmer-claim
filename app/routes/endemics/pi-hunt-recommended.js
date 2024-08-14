const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const radios = require('../models/form-component/radios')
const { endemicsPIHuntRecommended, endemicsPIHunt, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommendedException } = require('../../config/routes')
const { endemicsClaim: { piHuntRecommended: piHuntRecommendedKey } } = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')

const pageUrl = `${urlPrefix}/${endemicsPIHuntRecommended}`
const backLink = `${urlPrefix}/${endemicsPIHunt}`
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`
const claimPaymentNoPiHunt = '[placeholder amount]'

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHuntRecommended } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntRecommended')([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
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
        const yesOrNoRadios = radios('', 'piHuntRecommended')([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
        return h.view(endemicsPIHuntRecommended, {
          ...yesOrNoRadios,
          backLink,
          errorMessage: {
            text: 'Select yes or no',
            href: '#piHuntRecommended'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { piHuntRecommended } = request.payload

      setEndemicsClaim(request, piHuntRecommendedKey, piHuntRecommended)

      if (piHuntRecommended === 'no') {
        raiseInvalidDataEvent(request, piHuntRecommendedKey, `Value ${piHuntRecommended} should be yes for PI hunt vet recommendation`)
        return h.view(endemicsPIHuntRecommendedException, { claimPaymentNoPiHunt, ruralPaymentsAgency, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl })
      } else return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
    }
  }
}]
