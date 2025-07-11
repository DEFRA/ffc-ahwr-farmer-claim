import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'

const urlPrefix = config.urlPrefix
const { endemicsPigsPcrResult, endemicsPigsGeneticSequencing, endemicsNumberOfSamplesTested, endemicsBiosecurity } = links
const { endemicsClaim: { pigsPcrTestResult, pigsGeneticSequencing } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPigsPcrResult}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { pigsPcrTestResult } = getEndemicsClaim(request)

      return h.view(endemicsPigsPcrResult, {
        previousAnswer: pigsPcrTestResult,
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
        pcrResult: Joi.string().valid('negative', 'positive').required()
      }),
      failAction: (_request, h, _err) => {
        const errorMessage = { text: 'Select the result of the test' }

        return h
          .view(endemicsPigsPcrResult, {
            errorMessage,
            backLink: `${urlPrefix}/${endemicsNumberOfSamplesTested}`
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { pcrResult } = request.payload

      setEndemicsClaim(
        request,
        pigsPcrTestResult,
        pcrResult
      )

      if (pcrResult === 'positive') {
        return h.redirect(`${urlPrefix}/${endemicsPigsGeneticSequencing}`)
      }

      // Clearing this from the session incase they filled it out, then went back.
      // Not emitting because its just clearing that part of the session
      setEndemicsClaim(request, pigsGeneticSequencing, undefined, { shouldEmitEvent: false })

      return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
    }
  }
}

export const pigsPcrResultHandlers = [getHandler, postHandler]
