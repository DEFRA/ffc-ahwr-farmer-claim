const Joi = require('joi')
const config = require('../../config')
const { urlPrefix } = require('../../config')
const { endemicsClaim: { piHunt } } = require('../../session/keys')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsTestUrn, endemicsVetRCVS, endemicsPIHunt, endemicsPIHuntException } = require('../../config/routes')

const backLink = `${urlPrefix}/${endemicsVetRCVS}`
const pageUrl = `${urlPrefix}/${endemicsPIHunt}`
const errorMessageText = 'Select yes or no'

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { piHunt: previousAnswer } = getEndemicsClaim(request)

        return h.view(endemicsPIHunt, { backLink, previousAnswer })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          [piHunt]: Joi.string().valid('yes', 'no').required()
        }),
        failAction: (request, h, _err) => {
          return h.view(
            endemicsPIHunt,
            {
              backLink,
              errorMessage: { text: errorMessageText, href: '#piHunt' }
            }
          )
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const answer = request.payload.piHunt

        setEndemicsClaim(request, piHunt, answer)

        if (answer === 'no') {
          return h.view(endemicsPIHuntException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
        }
        return h.redirect(`${urlPrefix}/${endemicsTestUrn}`)
      }
    }
  }
]
