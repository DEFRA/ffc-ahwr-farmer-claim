const Joi = require('joi')
const {getEndemicsClaim, setEndemicsClaim} = require('../../session')
const { urlPrefix } = require('../../config')
const radios = require('../models/form-component/radios')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { endemicsPIHuntRecommended, endemicsPIHunt, endemicsPIHuntAllAnimals } = require('../../config/routes')
const { endemicsClaim: { piHuntRecommended: piHuntRecommendedKey } } = require('../../session/keys')


const pageUrl = `${urlPrefix}/${endemicsPIHuntRecommended}`
const backLink = `${urlPrefix}/${endemicsPIHunt}`

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

      return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
    }
  }
}]
