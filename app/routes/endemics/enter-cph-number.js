import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { ONLY_HERD } from './herd-others-on-sbi.js'

const { urlPrefix } = config
const {
  endemicsEnterCphNumber,
  endemicsEnterHerdName,
  endemicsHerdOthersOnSbi,
  endemicsEnterHerdDetails,
  endemicsCheckHerdDetails
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterHerdName}`

const herdOthersOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const enterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const checkHerdDetailsPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

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
        const { typeOfLivestock } = getEndemicsClaim(request)

        return h.view(endemicsEnterCphNumber, {
          ...request.payload,
          errorMessage: {
            text: `Enter the CPH for this ${getHerdOrFlock(typeOfLivestock)}, format should be nn/nnn/nnnn`,
            href: '#herdCph'
          },
          backLink: previousPageUrl,
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdCph } = request.payload
      const { herds, herdOthersOnSbi, herdReasons } = getEndemicsClaim(request)

      setEndemicsClaim(request, herdCphKey, herdCph)

      let nextPageUrl
      if(herds?.length) {
        nextPageUrl = herdReasons == [ONLY_HERD] ? enterHerdDetailsPageUrl : checkHerdDetailsPageUrl
      } else {
        nextPageUrl = herdOthersOnSbiPageUrl
      }

      return h.redirect(nextPageUrl)
    }
  }
}

export const enterCphNumberHandlers = [getHandler, postHandler]
