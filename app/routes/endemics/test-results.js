const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsTestResults,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsDiseaseStatus,
  endemicsBiosecurity,
  endemicsNumberOfOralFluidSamples
} = require('../../config/routes')
const { endemicsClaim: { testResults: testResultsKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')
const { claimType, livestockTypes } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsTestResults}`
const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

  if (typeOfReview === claimType.endemics) {
    if (typeOfLivestock === livestockTypes.sheep) return `${urlPrefix}/${endemicsDiseaseStatus}`
    if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsTestUrn}`
  }

  if (typeOfReview === claimType.review) {
    if (typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
    if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsTestUrn}`
  }
}
const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

  if (typeOfReview === claimType.endemics) {
    if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsBiosecurity}`
  }

  return `${urlPrefix}/${endemicsCheckAnswers}`
}
const pageTitle = (request) => {
  const { typeOfReview } = session.getEndemicsClaim(request)
  return typeOfReview === claimType.endemics ? 'What was the endemic disease test result?' : 'What was the test result?'
}

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { testResults } = session.getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'testResults')([{ value: 'positive', text: 'Positive', checked: testResults === 'positive' }, { value: 'negative', text: 'Negative', checked: testResults === 'negative' }])
      return h.view(endemicsTestResults, { title: pageTitle(request), backLink: previousPageUrl(request), ...positiveNegativeRadios })
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
        const positiveNegativeRadios = radios('', 'testResults', 'Select a test result')([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])
        return h.view(endemicsTestResults, {
          ...request.payload,
          title: pageTitle(request),
          backLink: previousPageUrl(request),
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
      return h.redirect(nextPageURL(request))
    }
  }
}]
