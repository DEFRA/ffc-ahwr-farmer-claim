import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'

const { urlPrefix } = config
const {
  endemicsEnterHerdName,
  endemicsSelectTheHerd,
  endemicsEnterCphNumber
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const previousPageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`

const { endemicsClaim: { herdName: herdNameKey } } = sessionKeys

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdName } = getEndemicsClaim(request)
      return h.view(endemicsEnterHerdName, {
        backLink: previousPageUrl,
        herdName
      })
    }
  }
}

const minHerdNameLength = 2
const maxHerdNameLength = 35

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        herdName: Joi.string().trim().min(minHerdNameLength).max(maxHerdNameLength).required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })

        return h.view(endemicsEnterHerdName, {
          ...request.payload,
          errorMessage: {
            text: `Name must be between ${minHerdNameLength} and ${maxHerdNameLength} characters`,
            href: '#herdName'
          },
          backLink: previousPageUrl
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdName } = request.payload
      setEndemicsClaim(request, herdNameKey, herdName)
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterHerdNameHandlers = [getHandler, postHandler]
