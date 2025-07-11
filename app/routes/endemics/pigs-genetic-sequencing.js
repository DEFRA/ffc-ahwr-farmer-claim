import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'

const urlPrefix = config.urlPrefix
const { endemicsPigsGeneticSequencing, endemicsPigsPcrResult, endemicsPigsElisaResult, endemicsBiosecurity } = links
const {
  endemicsClaim: {
    pigsGeneticSequencing: pigsGeneticSequencingKey
  }
} = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPigsGeneticSequencing}`

const getBackLink = (pigsFollowUpTest) => {
  let backLink = `${urlPrefix}`

  if (pigsFollowUpTest === 'ELISA') {
    backLink = `${backLink}/${endemicsPigsElisaResult}`
  } else {
    backLink = `${backLink}/${endemicsPigsPcrResult}`
  }

  return backLink
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { pigsGeneticSequencing, pigsFollowUpTest } =
        getEndemicsClaim(request)

      return h.view(endemicsPigsGeneticSequencing, {
        previousAnswer: pigsGeneticSequencing,
        backLink: getBackLink(pigsFollowUpTest)
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
        geneticSequencing: Joi.string()
          .valid('mlv', 'prrs1', 'prrs1Plus', 'recomb', 'prrs2')
          .required()
      }),
      failAction: (request, h, _err) => {
        const errorMessage = {
          text: 'Select the result of the genetic sequencing'
        }

        const { pigsFollowUpTest } = getEndemicsClaim(request)

        return h
          .view(endemicsPigsGeneticSequencing, {
            errorMessage,
            backLink: getBackLink(pigsFollowUpTest)
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { geneticSequencing } = request.payload

      setEndemicsClaim(
        request,
        pigsGeneticSequencingKey,
        geneticSequencing
      )

      return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
    }
  }
}

export const pigsGeneticSequencingHandlers = [getHandler, postHandler]
