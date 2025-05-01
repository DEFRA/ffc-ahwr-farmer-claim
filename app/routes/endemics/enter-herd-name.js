import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'

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
    handler: async (request, h) => {
      const { herdName } = getEndemicsClaim(request)
      return h.view(endemicsEnterHerdName, {
        backLink: previousPageUrl,
        herdName
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
        herdName: Joi.string().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })

        return h.view(endemicsEnterHerdName, {
          ...request.payload,
          errorMessage: {
            text: 'Select the herd name',
            href: '#herdName'
          },
          backLink: previousPageUrl
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdName } = request.payload
      setEndemicsClaim(request, herdNameKey, herdName)
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterHerdName = [getHandler, postHandler]
