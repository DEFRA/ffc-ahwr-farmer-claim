import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getHerdOrFlock } from '../../lib/display-helpers.js'

const { urlPrefix } = config
const {
  endemicsEnterHerdName,
  endemicsSelectTheHerd,
  endemicsEnterCphNumber,
  endemicsDateOfVisit
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const selectTheHerdPageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const dateOfVisitPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`

const { endemicsClaim: { herdName: herdNameKey } } = sessionKeys

const getBackLink = (herds) => !herds?.length ? dateOfVisitPageUrl : selectTheHerdPageUrl

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdName, herds, typeOfLivestock } = getEndemicsClaim(request)
      return h.view(endemicsEnterHerdName, {
        backLink: getBackLink(herds),
        herdName,
        herdOrFlock: getHerdOrFlock(typeOfLivestock)
      })
    }
  }
}

const minHerdNameLength = 2
const maxHerdNameLength = 30

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
        const { herds, typeOfLivestock } = getEndemicsClaim(request)

        return h.view(endemicsEnterHerdName, {
          ...request.payload,
          errorMessage: {
            text: `Name must be between ${minHerdNameLength} and ${maxHerdNameLength} characters`,
            href: '#herdName'
          },
          backLink: getBackLink(herds),
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdName } = request.payload
      setEndemicsClaim(request, herdNameKey, herdName.trim())
      return h.redirect(nextPageUrl)
    }
  }
}

export const enterHerdNameHandlers = [getHandler, postHandler]
