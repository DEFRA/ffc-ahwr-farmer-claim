const Joi = require('joi')
const session = require('../../session')
const { urlPrefix } = require('../../config')
const {
  endemicsTestUrn,
  endemicsVetRCVS,
  endemicsVaccination,
  endemicsVetVisitsReviewTestResults
} = require('../../config/routes')
const { endemicsClaim: { vetVisitsReviewTestResults: vetVisitsReviewTestResultsKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')
const { livestockTypes } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`
const previousPageUrl = `${urlPrefix}/${endemicsVetRCVS}`
const nextPageURL = (request) => {
  const { typeOfLivestock } = session.getEndemicsClaim(request)

  switch (typeOfLivestock) {
    case livestockTypes.pigs:
      return `${urlPrefix}/${endemicsVaccination}`
    case livestockTypes.beef:
    case livestockTypes.dairy:
      return `${urlPrefix}/${endemicsTestUrn}`
  }
}

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { vetVisitsReviewTestResults } = session.getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'vetVisitsReviewTestResults')([{ value: 'positive', text: 'Positive', checked: vetVisitsReviewTestResults === 'positive' }, { value: 'negative', text: 'Negative', checked: vetVisitsReviewTestResults === 'negative' }])
      return h.view(endemicsVetVisitsReviewTestResults, { backLink: previousPageUrl, ...positiveNegativeRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        vetVisitsReviewTestResults: Joi.string().valid('positive', 'negative').required()
      }),
      failAction: async (request, h, error) => {
        const positiveNegativeRadios = radios('', 'vetVisitsReviewTestResults', 'Select a test result')([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])
        return h.view(endemicsVetVisitsReviewTestResults, {
          ...request.payload,
          backLink: previousPageUrl,
          ...positiveNegativeRadios,
          errorMessage: {
            text: 'Select a test result',
            href: '#vetVisitsReviewTestResults'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { vetVisitsReviewTestResults } = request.payload

      session.setEndemicsClaim(request, vetVisitsReviewTestResultsKey, vetVisitsReviewTestResults)
      return h.redirect(nextPageURL(request))
    }
  }
}]
