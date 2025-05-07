import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'

const { urlPrefix } = config
const {
  endemicsEnterCphNumber,
  endemicsEnterHerdName,
  endemicsHerdOthersOnSbi
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const nextPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`

const { endemicsClaim: { herdCph: herdCphKey } } = sessionKeys

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdCph, typeOfLivestock } = getEndemicsClaim(request)
      return h.view(endemicsEnterCphNumber, {
        backLink: previousPageUrl,
        herdCph,
        herdOrFlock: getHerdOrFlock(typeOfLivestock)
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
        herdCph: Joi.string().pattern(/^\d{2}\/\d{3}\/\d{4}$/).required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })

        return h.view(endemicsEnterCphNumber, {
          ...request.payload,
          errorMessage: {
            text: 'Enter the CPH for this herd, format should be nn/nnn/nnnn',
            href: '#herdCph'
          },
          backLink: previousPageUrl
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdCph } = request.payload
      setEndemicsClaim(request, herdCphKey, herdCph)
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterCphNumber = [getHandler, postHandler]
