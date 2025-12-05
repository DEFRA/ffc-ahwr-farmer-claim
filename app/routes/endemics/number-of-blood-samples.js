import Joi from 'joi'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { thresholds } from '../../constants/amounts.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import HttpStatus from 'http-status-codes'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsTypeOfSamplesTaken,
  endemicsNumberOfBloodSamples,
  endemicsNumberOfBloodSamplesException,
  endemicsTestResults
} = links
const {
  endemicsClaim: { numberOfBloodSamples: numberOfBloodSamplesKey }
} = sessionKeys
const { exactNumberBloodSamples } = thresholds

const pageUrl = prefixUrl(endemicsNumberOfBloodSamples)

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { numberOfBloodSamples } = getEndemicsClaim(request)
      return h.view(endemicsNumberOfBloodSamples, {
        numberOfBloodSamples,
        backLink: prefixUrl(endemicsTypeOfSamplesTaken)
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
        numberOfBloodSamples: Joi.string().pattern(/^\d+$/).min(exactNumberBloodSamples).max(exactNumberBloodSamples).required()
          .messages({
            'string.base': 'Enter the number of blood samples',
            'string.empty': 'Enter the number of blood samples',
            'string.max': `The number of blood samples should be exactly ${exactNumberBloodSamples}`,
            'string.pattern.base': 'The amount of blood samples must only include numbers'
          })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h
          .view(endemicsNumberOfBloodSamples, {
            ...request.payload,
            errorMessage: { text: err.details[0].message, href: '#numberOfBloodSamples' },
            backLink: prefixUrl(endemicsTypeOfSamplesTaken)
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { numberOfBloodSamples } = request.payload
      setEndemicsClaim(request, numberOfBloodSamplesKey, numberOfBloodSamples)

      if (numberOfBloodSamples !== exactNumberBloodSamples) {
        raiseInvalidDataEvent(request, numberOfBloodSamplesKey, `Value ${numberOfBloodSamples} is not exactly ${exactNumberBloodSamples}`)
        return h.view(
          endemicsNumberOfBloodSamplesException,
          {
            backLink: pageUrl,
            exactNumberBloodSamples
          }).code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      return h.redirect(prefixUrl(endemicsTestResults))
    }
  }
}

export const numberOfBloodSamplesHandlers = [getHandler, postHandler]
