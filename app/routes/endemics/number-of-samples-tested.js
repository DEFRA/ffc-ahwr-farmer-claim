const Joi = require('joi')
const session = require('../../session')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../config')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsTestUrn,
  endemicsNumberOfSamplesTested,
  endemicsNumberOfSamplesTestedException,
  endemicsDiseaseStatus
} = require('../../config/routes')
const {
  endemicsClaim: { numberOfSamplesTested: numberOfSamplesTestedKey }
} = require('../../session/keys')
const { thresholds: { positiveReviewNumberOfSamplesTested, negativeReviewNumberOfSamplesTested } } = require('../../constants/amounts')

const pageUrl = `${urlPrefix}/${endemicsNumberOfSamplesTested}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { numberOfSamplesTested } = session.getEndemicsClaim(request)
      return h.view(endemicsNumberOfSamplesTested, {
        numberOfSamplesTested,
        backLink: `${urlPrefix}/${endemicsTestUrn}`
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        numberOfSamplesTested: Joi.string().pattern(/^\d+$/).max(4).required()
          .messages({
            'string.base': 'Enter the number of samples tested',
            'string.empty': 'Enter the number of samples tested',
            'string.max': 'The number of samples tested should not exceed 9999',
            'string.pattern.base': 'Number of samples tested must only include numbers'
          })
      }),
      failAction: async (request, h, error) => {
        return h
          .view(endemicsNumberOfSamplesTested, {
            ...request.payload,
            errorMessage: { text: error.details[0].message, href: '#numberOfSamplesTested' },
            backLink: `${urlPrefix}/${endemicsTestUrn}`
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { numberOfSamplesTested } = request.payload
      session.setEndemicsClaim(request, numberOfSamplesTestedKey, numberOfSamplesTested)

      const endemicsClaim = session.getEndemicsClaim(request)
      const lastReviewTestResults = endemicsClaim.vetVisitsReviewTestResults ?? endemicsClaim.relevantReviewForEndemics?.data?.testResults

      const threshold = lastReviewTestResults === 'positive' ? positiveReviewNumberOfSamplesTested : negativeReviewNumberOfSamplesTested
      if (numberOfSamplesTested !== threshold) {
        await raiseInvalidDataEvent(request, numberOfSamplesTestedKey, `Value ${numberOfSamplesTested} is not equal to required value ${threshold}`)
        return h.view(endemicsNumberOfSamplesTestedException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsDiseaseStatus}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
