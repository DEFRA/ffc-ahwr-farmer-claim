const Joi = require('joi')
const session = require('../../session')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../config')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsTestUrn,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfOralFluidSamplesException,
  endemicsTestResults
} = require('../../config/routes')
const {
  endemicsClaim: { numberOfOralFluidSamples: numberOfOralFluidSamplesKey }
} = require('../../session/keys')
const { thresholds: { minimumNumberFluidOralSamples } } = require('../../constants/amounts')

const pageUrl = `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { numberOfOralFluidSamples } = session.getEndemicsClaim(request)
        return h.view(endemicsNumberOfOralFluidSamples, {
          numberOfOralFluidSamples,
          backLink: `${urlPrefix}/${endemicsTestUrn}`
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          numberOfOralFluidSamples: Joi.string().pattern(/^\d+$/).max(4).required()
            .messages({
              'string.base': 'Enter the number of oral fluid samples',
              'string.empty': 'Enter the number of oral fluid samples',
              'string.max': 'The number of oral fluid samples should not exceed 9999',
              'string.pattern.base': 'The number of oral fluid samples must only include numbers'
            })
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h
            .view(endemicsNumberOfOralFluidSamples, {
              ...request.payload,
              errorMessage: { text: err.details[0].message, href: '#numberOfOralFluidSamples' },
              backLink: `${urlPrefix}/${endemicsTestUrn}`
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { numberOfOralFluidSamples } = request.payload
        session.setEndemicsClaim(request, numberOfOralFluidSamplesKey, numberOfOralFluidSamples)

        if (numberOfOralFluidSamples < minimumNumberFluidOralSamples) {
          raiseInvalidDataEvent(request, numberOfOralFluidSamplesKey, `Value ${numberOfOralFluidSamples} is less than required threshold ${minimumNumberFluidOralSamples}`)
          return h.view(
            endemicsNumberOfOralFluidSamplesException,
            {
              backLink: pageUrl,
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              minimumNumberFluidOralSamples
            }).code(400).takeover()
        }

        return h.redirect(`${urlPrefix}/${endemicsTestResults}`)
      }
    }
  }
]
