const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { endemicsClaim: { testResults: testResultsKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')

const pageRoute = 'endemics/test-results'
const pageUrl = `${urlPrefix}/${pageRoute}`

const positiveNegativeRadios = radios('', 'testResults')([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, testResults } = session.getClaim(request)
      const backLink = typeOfLivestock === 'pigs' ? `${urlPrefix}/number-of-tests` : `${urlPrefix}/laboratory-urn`
      return h.view(pageRoute, { testResults, backLink, ...positiveNegativeRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        testResults: Joi.string().valid('positive', 'negative').required()
      }),
      failAction: async (request, h, error) => {
        const { typeOfLivestock } = session.getClaim(request)
        const backLink = typeOfLivestock === 'pigs' ? `${urlPrefix}/number-of-tests` : `${urlPrefix}/laboratory-urn`
        return h.view(pageRoute, {
          ...request.payload,
          backLink,
          ...positiveNegativeRadios,
          errorMessage: {
            text: 'Select a test result',
            href: '#test-results'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { testResults } = request.payload

      session.setClaim(request, testResultsKey, testResults)
      return h.redirect('/claim/endemics/check-answers')
    }
  }
}]
