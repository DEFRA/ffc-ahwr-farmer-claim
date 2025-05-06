import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'

const { urlPrefix } = config
const {
  endemicsHerdOthersOnSbi,
  endemicsEnterCphNumber,
  endemicsEnterHerdDetails
} = links

const pageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`

const { endemicsClaim: { herdOthersOnSbi: herdOthersOnSbiKey } } = sessionKeys

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdOthersOnSbi } = getEndemicsClaim(request)
      return h.view(endemicsHerdOthersOnSbi, {
        backLink: previousPageUrl,
        herdOthersOnSbi
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
        herdOthersOnSbi: Joi.string().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.view(endemicsHerdOthersOnSbi, {
          ...request.payload,
          errorMessage: {
            text: 'Select yes if this is the only sheep flock associated with this SBI',
            href: '#herdOthersOnSbi'
          },
          backLink: previousPageUrl
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdOthersOnSbi } = request.payload
      setEndemicsClaim(request, herdOthersOnSbiKey, herdOthersOnSbi)
      return h.redirect(nextPageUrl)
    }
  }
}

export const herdOthersOnSbiHandlers = [getHandler, postHandler]
