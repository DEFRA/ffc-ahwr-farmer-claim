import Joi from 'joi'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import HttpStatus from 'http-status-codes'
import { PIG_GENETIC_SEQUENCING_VALUES } from 'ffc-ahwr-common-library'
import { claimConstants } from '../../constants/claim.js'
import { prefixUrl } from '../utils/page-utils.js'

const { endemicsPigsGeneticSequencing, endemicsPigsPcrResult, endemicsPigsElisaResult, endemicsBiosecurity } = links
const {
  endemicsClaim: {
    pigsGeneticSequencing: pigsGeneticSequencingKey
  }
} = sessionKeys
const { pigsFollowUpTest: { elisa } } = claimConstants

const pageUrl = prefixUrl(endemicsPigsGeneticSequencing)

const getBackLink = (pigsFollowUpTest) => {
  if (pigsFollowUpTest === elisa) {
    return prefixUrl(endemicsPigsElisaResult)
  }

  return prefixUrl(endemicsPigsPcrResult)
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { pigsGeneticSequencing, pigsFollowUpTest } =
        getEndemicsClaim(request)

      return h.view(endemicsPigsGeneticSequencing, {
        options: PIG_GENETIC_SEQUENCING_VALUES.map(x => (
          {
            ...x,
            text: x.label,
            checked: pigsGeneticSequencing === x.value
          }
        )),
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
          .valid(...PIG_GENETIC_SEQUENCING_VALUES.map(x => x.value))
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
            options: PIG_GENETIC_SEQUENCING_VALUES.map(x => (
              {
                ...x,
                text: x.label
              }
            )),
            backLink: getBackLink(pigsFollowUpTest)
          })
          .code(HttpStatus.BAD_REQUEST)
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

      return h.redirect(prefixUrl(endemicsBiosecurity))
    }
  }
}

export const pigsGeneticSequencingHandlers = [getHandler, postHandler]
