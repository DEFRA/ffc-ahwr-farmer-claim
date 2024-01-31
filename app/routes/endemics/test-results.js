const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsTestResults,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsNumberOfTests
} = require('../../config/routes')
const { endemicsClaim: { testResults: testResultsKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')

const pageUrl = `${urlPrefix}/${endemicsTestResults}`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, testResults } = session.getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'testResults')([{ value: 'positive', text: 'Positive', checked: testResults === 'positive' }, { value: 'negative', text: 'Negative', checked: testResults === 'negative' }])
      const backLink = typeOfLivestock === 'pigs' ? `${urlPrefix}/${endemicsNumberOfTests}` : `${urlPrefix}/${endemicsTestUrn}`
      return h.view(endemicsTestResults, { backLink, ...positiveNegativeRadios })
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
        const { typeOfLivestock } = session.getEndemicsClaim(request)
        const positiveNegativeRadios = radios('', 'testResults', 'Select a test result')([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])
        const backLink = typeOfLivestock === 'pigs' ? `${urlPrefix}/${endemicsNumberOfTests}` : `${urlPrefix}/${endemicsTestUrn}`
        return h.view(endemicsTestResults, {
          ...request.payload,
          backLink,
          ...positiveNegativeRadios,
          errorMessage: {
            text: 'Select a test result',
            href: '#testResults'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { testResults } = request.payload

      session.setEndemicsClaim(request, testResultsKey, testResults)
      return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
    }
  }
}]
