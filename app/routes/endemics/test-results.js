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
const { getReviewType } = require('../../lib/get-review-type')
const { getLivestockTypes } = require('../../lib/get-livestock-types')

const pageUrl = `${urlPrefix}/${endemicsTestResults}`
const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isBeef, isDairy, isSheep, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isSheep) return `${urlPrefix}/${endemicsDiseaseStatus}`
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestUrn}`
  }

  if (isReview) {
    if (isPigs) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestUrn}`
  }
}
const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsBiosecurity}`
  }

  return `${urlPrefix}/${endemicsCheckAnswers}`
}
const pageTitle = (request) => {
  const { typeOfReview } = session.getEndemicsClaim(request)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  return isEndemicsFollowUp ? 'What was the follow-up test result?' : 'What was the test result?'
}

const hintHtml = 'You can find this on the summary the vet gave you.'

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { testResults } = session.getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'testResults', undefined, { hintHtml })([{ value: 'positive', text: 'Positive', checked: testResults === 'positive' }, { value: 'negative', text: 'Negative', checked: testResults === 'negative' }])
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
        const positiveNegativeRadios = radios('', 'testResults', 'Select a test result', { hintHtml })([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])
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
