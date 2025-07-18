import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import HttpStatus from 'http-status-codes'
import { claimConstants } from '../../constants/claim.js'

const urlPrefix = config.urlPrefix
const { endemicsPigsElisaResult, endemicsBiosecurity, endemicsNumberOfSamplesTested } = links
const { endemicsClaim: { pigsElisaTestResult, pigsGeneticSequencing } } = sessionKeys
const { result: { negative, positive } } = claimConstants

const pageUrl = `${urlPrefix}/${endemicsPigsElisaResult}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { pigsElisaTestResult: testResult } = getEndemicsClaim(request)

      return h.view(endemicsPigsElisaResult, {
        previousAnswer: testResult,
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
        elisaResult: Joi.string().valid(negative, positive).required()
      }),
      failAction: (_request, h, _err) => {
        const errorMessage = { text: 'Select the result of the test' }

        return h
          .view(endemicsPigsElisaResult, {
            errorMessage,
            backLink: `${urlPrefix}/${endemicsNumberOfSamplesTested}`
          })
          .code(HttpStatus.BAD_REQUEST)
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

      // Clearing this from the session in-case they filled it out, then went back.
      // Not emitting because its just clearing that part of the session
      setEndemicsClaim(request, pigsGeneticSequencing, undefined, { shouldEmitEvent: false })

      return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
    }
  }
}

export const pigsElisaResultHandlers = [getHandler, postHandler]
