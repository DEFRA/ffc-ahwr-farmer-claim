import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'

const { urlPrefix } = config
const {
  endemicsEnterCphNumber,
  endemicsEnterHerdName,
  endemicsEnterHerdDetails
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`

const { endemicsClaim: { herdCph: herdCphKey } } = sessionKeys

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdCph } = getEndemicsClaim(request)
      return h.view(endemicsEnterCphNumber, {
        backLink: previousPageUrl,
        herdCph
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
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdCph } = request.payload
      setEndemicsClaim(request, herdCphKey, herdCph)
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterCphNumberHandlers = [getHandler, postHandler]
