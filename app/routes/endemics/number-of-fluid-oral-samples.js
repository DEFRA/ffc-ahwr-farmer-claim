import Joi from 'joi'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { thresholds } from '../../constants/amounts.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'

const urlPrefix = config.urlPrefix
const {
  endemicsTestUrn,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfOralFluidSamplesException,
  endemicsTestResults
} = links
const {
  endemicsClaim: { numberOfOralFluidSamples: numberOfOralFluidSamplesKey }
} = sessionKeys
const { minimumNumberFluidOralSamples } = thresholds

const pageUrl = `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { numberOfOralFluidSamples } = getEndemicsClaim(request)
      return h.view(endemicsNumberOfOralFluidSamples, {
        numberOfOralFluidSamples,
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
        numberOfOralFluidSamples: Joi.string().pattern(/^\d+$/).max(4).required()
          .messages({
            'string.base': 'Enter the number of oral fluid samples',
            'string.empty': 'Enter the number of oral fluid samples',
            'string.max': 'The number of oral fluid samples should not exceed 9999',
            'string.pattern.base': 'The amount of oral fluid samples must only include numbers'
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
      setEndemicsClaim(request, numberOfOralFluidSamplesKey, numberOfOralFluidSamples)

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

export const numberOfOralFluidSamplesHandlers = [getHandler, postHandler]
