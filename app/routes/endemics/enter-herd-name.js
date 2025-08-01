import Joi from 'joi'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { sendHerdEvent } from '../../event/send-herd-event.js'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsEnterHerdName,
  endemicsSelectTheHerd,
  endemicsEnterCphNumber,
  endemicsDateOfVisit
} = links

const pageUrl = prefixUrl(endemicsEnterHerdName)
const selectTheHerdPageUrl = prefixUrl(endemicsSelectTheHerd)
const dateOfVisitPageUrl = prefixUrl(endemicsDateOfVisit)
const nextPageUrl = prefixUrl(endemicsEnterCphNumber)

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

const ERROR_MESSAGES = {
  NAME_LENGTH: `Name must be between ${minHerdNameLength} and ${maxHerdNameLength} characters`,
  NAME_PATTERN: 'Name must only include letters a to z, numbers and special characters such as hyphens, spaces and apostrophes.',
  NAME_UNIQUE: 'You have already used this name, the name must be unique'
}

const isHerdNameEmpty = (errorType) => errorType === 'any.required' || errorType === 'string.base' || errorType === 'string.empty'

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        herdName: Joi.string()
          .trim()
          .min(minHerdNameLength)
          .max(maxHerdNameLength)
          .pattern(/^[A-Za-z0-9&,' \-/()]+$/)
          .messages({
            'string.min': ERROR_MESSAGES.NAME_LENGTH,
            'string.max': ERROR_MESSAGES.NAME_LENGTH,
            'string.pattern.base': ERROR_MESSAGES.NAME_PATTERN
          })
          .required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { herds, typeOfLivestock } = getEndemicsClaim(request)
        const herdOrFlock = getHerdOrFlock(typeOfLivestock)
        const errorType = err.details[0].type

        const errorText = isHerdNameEmpty(errorType)
          ? `Enter the ${herdOrFlock} name`
          : err.details[0].message

        return h.view(endemicsEnterHerdName, {
          ...request.payload,
          errorMessage: {
            text: errorText,
            href: '#herdName'
          },
          backLink: getBackLink(herds),
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdName } = request.payload
      const { herdId, herdVersion, previousClaims, herds, typeOfLivestock } = getEndemicsClaim(request)

      if (previousClaims?.some((claim) => claim.herd?.herdName === herdName.trim())) {
        return h.view(endemicsEnterHerdName, {
          ...request.payload,
          errorMessage: {
            text: ERROR_MESSAGES.NAME_UNIQUE,
            href: '#herdName'
          },
          backLink: getBackLink(herds),
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }

      setEndemicsClaim(request, herdNameKey, herdName.trim(), { shouldEmitEvent: false })
      await sendHerdEvent({
        request,
        type: 'herd-name',
        message: 'Herd name collected from user',
        data: {
          herdId,
          herdVersion,
          herdName
        }
      })

      return h.redirect(nextPageUrl)
    }
  }
}

export const enterHerdNameHandlers = [getHandler, postHandler]
