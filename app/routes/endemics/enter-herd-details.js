import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'

const { urlPrefix } = config
const {
  endemicsEnterHerdDetails,
  endemicsHerdOthersOnSbi,
  endemicsCheckHerdDetails
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const previousPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const nextPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

const { endemicsClaim: { herdReasons: herdReasonsKey } } = sessionKeys

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdReasons } = getEndemicsClaim(request)
      return h.view(endemicsEnterHerdDetails, {
        backLink: previousPageUrl,
        herdReasons: [].concat(herdReasons)
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
        herdReasons: Joi.alternatives().try(
          Joi.string(),
          Joi.array().items(Joi.string()).min(1)
        ).required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })

        return h.view(endemicsEnterHerdDetails, {
          ...request.payload,
          errorMessage: {
            text: 'Select the reasons for this separate herd',
            href: '#herdReasons'
          },
          backLink: previousPageUrl,
          herdReasons: [].concat(request.payload.herdReasons)
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdReasons } = request.payload
      setEndemicsClaim(request, herdReasonsKey, [].concat(herdReasons))
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterHerdDetailsHandlers = [getHandler, postHandler]
