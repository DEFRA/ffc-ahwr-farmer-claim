const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsTestResults,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsVetRCVS,
  endemicsDiseaseStatus,
  endemicsBiosecurity,
  endemicsVaccination,
  endemicsNumberOfOralFluidSamples
} = require('../../config/routes')
const { endemicsClaim: { testResults: testResultsKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')
const { claimType, livestockTypes } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsTestResults}`
const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview, latestVetVisitApplication } = session.getEndemicsClaim(request)

  if (latestVetVisitApplication) {
    if (typeOfReview === claimType.endemics && [livestockTypes.beef, livestockTypes.pigs].includes(typeOfLivestock)) return `${urlPrefix}/${endemicsVetRCVS}`
  }
  if (typeOfReview === claimType.review && typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
  if (typeOfReview === claimType.review && typeOfLivestock === livestockTypes.beef) return `${urlPrefix}/${endemicsTestUrn}`
  if (typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.sheep) return `${urlPrefix}/${endemicsDiseaseStatus}`
  if (typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVetRCVS}`
}
const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview, latestVetVisitApplication } = session.getEndemicsClaim(request)

  if (latestVetVisitApplication) {
    if (typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.pigs) return `${urlPrefix}/${endemicsVaccination}`
    if (typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.beef) return `${urlPrefix}/${endemicsTestUrn}`
  }
  if (typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.beef) return `${urlPrefix}/${endemicsBiosecurity}`

  return `${urlPrefix}/${endemicsCheckAnswers}`
}

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { testResults } = session.getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'testResults')([{ value: 'positive', text: 'Positive', checked: testResults === 'positive' }, { value: 'negative', text: 'Negative', checked: testResults === 'negative' }])
      return h.view(endemicsTestResults, { backLink: previousPageUrl(request), ...positiveNegativeRadios })
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
