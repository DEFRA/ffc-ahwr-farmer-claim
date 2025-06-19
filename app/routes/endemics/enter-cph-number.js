import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { sendHerdEvent } from '../../event/send-herd-event.js'
import { ONLY_HERD_ON_SBI } from '../../constants/constants.js'
import { skipOtherHerdsOnSbiPage } from '../../lib/context-helper.js'

const { urlPrefix } = config
const {
  endemicsEnterCphNumber,
  endemicsEnterHerdName,
  endemicsHerdOthersOnSbi,
  endemicsEnterHerdDetails,
  endemicsCheckHerdDetails,
  endemicsSelectTheHerd
} = links

const pageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const enterHerdNamePageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const selectTheHerdPageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`

const herdOthersOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const enterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const checkHerdDetailsPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

const { endemicsClaim: { herdCph: herdCphKey } } = sessionKeys

const getBackLink = (herdVersion) => !herdVersion || herdVersion === 1 ? enterHerdNamePageUrl : selectTheHerdPageUrl

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdCph, typeOfLivestock, herdVersion } = getEndemicsClaim(request)
      return h.view(endemicsEnterCphNumber, {
        backLink: getBackLink(herdVersion),
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
        const { typeOfLivestock, herdVersion } = getEndemicsClaim(request)

        return h.view(endemicsEnterCphNumber, {
          ...request.payload,
          errorMessage: {
            text: `Enter the CPH for this ${getHerdOrFlock(typeOfLivestock)}, format should be nn/nnn/nnnn`,
            href: '#herdCph'
          },
          backLink: getBackLink(herdVersion),
          herdOrFlock: getHerdOrFlock(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdCph } = request.payload
      const { herds, isOnlyHerdOnSbi, herdId, herdVersion } = getEndemicsClaim(request)

      setEndemicsClaim(request, herdCphKey, herdCph, { shouldEmitEvent: false })
      await sendHerdEvent({ request, type: 'herd-cph', message: 'Herd CPH collected from user', data: { herdId, herdVersion, herdCph } })

      let nextPageUrl
      if (skipOtherHerdsOnSbiPage(herds, herdId)) {
        nextPageUrl = isOnlyHerdOnSbi === ONLY_HERD_ON_SBI.NO ? enterHerdDetailsPageUrl : checkHerdDetailsPageUrl
      } else {
        nextPageUrl = herdOthersOnSbiPageUrl
      }

      return h.redirect(nextPageUrl)
    }
  }
}

export const enterCphNumberHandlers = [getHandler, postHandler]
