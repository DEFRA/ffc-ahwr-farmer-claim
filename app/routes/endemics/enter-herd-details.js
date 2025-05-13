import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
// TODO MultiHerds use this to create checkboxes:
// import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'
import { getHerdOrFlock } from '../../lib/display-helpers.js'

const { urlPrefix } = config
const {
  endemicsEnterHerdDetails,
  endemicsHerdOthersOnSbi,
  endemicsCheckHerdDetails,
  endemicsEnterCphNumber
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const herdOtherOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const enterCphNumberPageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`

const nextPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

const { endemicsClaim: { herdReasons: herdReasonsKey } } = sessionKeys

const getPreviousPageUrl = (herds) => herds?.length ? enterCphNumberPageUrl : herdOtherOnSbiPageUrl

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdReasons, typeOfLivestock, herds } = getEndemicsClaim(request)
      return h.view(endemicsEnterHerdDetails, {
        backLink: getPreviousPageUrl(herds),
        herdReasons: herdReasons ?? [],
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
        herdReasons: Joi.alternatives().try(
          Joi.string(),
          Joi.array().items(Joi.string()).min(1)
        ).required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock, herds } = getEndemicsClaim(request)

        return h.view(endemicsEnterHerdDetails, {
          ...request.payload,
          errorMessage: {
            text: `Select the reasons for this separate ${getHerdOrFlock(typeOfLivestock)}`,
            href: '#herdReasons'
          },
          backLink: getPreviousPageUrl(herds),
          herdReasons: [].concat(request.payload.herdReasons),
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
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
