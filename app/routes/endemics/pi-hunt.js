const Joi = require('joi')
const config = require('../../config')
const { urlPrefix, optionalPIHunt } = require('../../config')
const { endemicsClaim: { piHunt: piHuntKey } } = require('../../session/keys')
const { getTestResult } = require('../../lib/get-test-result')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsVetRCVS, endemicsPIHunt, endemicsPIHuntException, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommended, endemicsTestUrn } = require('../../config/routes')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const { clearPiHuntSessionOnChange } = require('../../lib/clear-pi-hunt-session-on-change')

const backLink = `${urlPrefix}/${endemicsVetRCVS}`
const pageUrl = `${urlPrefix}/${endemicsPIHunt}`
const errorMessageText = 'Select if a PI hunt was done'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHunt: previousAnswer } = getEndemicsClaim(request)
      const titleText = optionalPIHunt.enabled ? 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done?' : 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?'
      return h.view(endemicsPIHunt, { titleText, backLink, previousAnswer })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHunt: Joi.string().valid('yes', 'no').required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
        const { piHunt: previousAnswer } = getEndemicsClaim(request)
        const titleText = optionalPIHunt.enabled ? 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done?' : 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?'
        return h.view(
          endemicsPIHunt,
          {
            titleText,
            backLink,
            previousAnswer,
            errorMessage: { text: errorMessageText, href: '#piHunt' }
          }
        )
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { reviewTestResults, piHunt: previousAnswer } = getEndemicsClaim(request)
      const { isNegative, isPositive } = getTestResult(reviewTestResults)
      const answer = request.payload.piHunt

      setEndemicsClaim(request, piHuntKey, answer)

      if (answer === 'no') {
        await raiseInvalidDataEvent(request, piHuntKey, `Value ${answer} is not equal to required value yes`)

        if (answer !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHunt')
        }

        if (optionalPIHunt.enabled && isNegative) return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)

        return h.view(endemicsPIHuntException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
      }

      if (optionalPIHunt.enabled && isPositive) return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
      if (optionalPIHunt.enabled && isNegative) return h.redirect(`${urlPrefix}/${endemicsPIHuntRecommended}`)

      return h.redirect(`${urlPrefix}/${endemicsTestUrn}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
