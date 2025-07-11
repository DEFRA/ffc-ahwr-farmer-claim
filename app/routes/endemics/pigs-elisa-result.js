import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'

const urlPrefix = config.urlPrefix
const { endemicsPigsElisaResult, endemicsBiosecurity, endemicsNumberOfSamplesTested } = links
const { endemicsClaim: { pigsElisaTestResult } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPigsElisaResult}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { pigsElisaTestResult } = getEndemicsClaim(request)

      return h.view(endemicsPigsElisaResult, {
        previousAnswer: pigsElisaTestResult,
        backLink: `${urlPrefix}/${endemicsNumberOfSamplesTested}`
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
        elisaResult: Joi.string().valid('negative', 'positive').required()
      }),
      failAction: (_request, h, _err) => {
        const errorMessage = { text: 'Select the result of the test' }

        return h
          .view(endemicsPigsElisaResult, {
            errorMessage,
            backLink: `${urlPrefix}/${endemicsNumberOfSamplesTested}`
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { elisaResult } = request.payload

      setEndemicsClaim(
        request,
        pigsElisaTestResult,
        elisaResult
      )

      return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
    }
  }
}

export const pigsElisaResultHandlers = [getHandler, postHandler]
