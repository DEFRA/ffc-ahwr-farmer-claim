import Joi from 'joi'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { ONLY_HERD, ONLY_HERD_ON_SBI } from '../../constants/constants.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { sendHerdEvent } from '../../event/send-herd-event.js'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsHerdOthersOnSbi,
  endemicsEnterCphNumber,
  endemicsEnterHerdDetails,
  endemicsCheckHerdDetails
} = links

const pageUrl = prefixUrl(endemicsHerdOthersOnSbi)
const previousPageUrl = prefixUrl(endemicsEnterCphNumber)
const enterEnterHerdDetailsPageUrl = prefixUrl(endemicsEnterHerdDetails)
const checkHerdDetailsPageUrl = prefixUrl(endemicsCheckHerdDetails)

const { endemicsClaim: { isOnlyHerdOnSbi: isOnlyHerdOnSbiKey, herdReasons: herdReasonsKey } } = sessionKeys

const getSpeciesGroupText = (typeOfLivestock) => {
  const textByLivestock = {
    beef: 'beef cattle herd',
    dairy: 'dairy cattle herd',
    pigs: 'pigs herd',
    sheep: 'flock of sheep'
  }
  return textByLivestock[typeOfLivestock]
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { isOnlyHerdOnSbi, typeOfLivestock } = getEndemicsClaim(request)
      return h.view(endemicsHerdOthersOnSbi, {
        backLink: previousPageUrl,
        isOnlyHerdOnSbi,
        herdOrFlock: getHerdOrFlock(typeOfLivestock),
        speciesGroupText: getSpeciesGroupText(typeOfLivestock)
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
        isOnlyHerdOnSbi: Joi.string().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock } = getEndemicsClaim(request)

        return h.view(endemicsHerdOthersOnSbi, {
          ...request.payload,
          errorMessage: {
            text: `Select yes if this is the only ${getSpeciesGroupText(typeOfLivestock)} associated with this SBI`,
            href: '#isOnlyHerdOnSbi'
          },
          backLink: previousPageUrl,
          herdOrFlock: getHerdOrFlock(typeOfLivestock),
          speciesGroupText: getSpeciesGroupText(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { isOnlyHerdOnSbi } = request.payload
      setEndemicsClaim(request, isOnlyHerdOnSbiKey, isOnlyHerdOnSbi, { shouldEmitEvent: false })

      if (isOnlyHerdOnSbi === ONLY_HERD_ON_SBI.YES) {
        setEndemicsClaim(request, herdReasonsKey, [ONLY_HERD], { shouldEmitEvent: false })
        const { herdId, herdVersion } = getEndemicsClaim(request)
        await sendHerdEvent({
          request,
          type: 'herd-reasons',
          message: 'Only herd for user',
          data: {
            herdId,
            herdVersion,
            herdReasonManagementNeeds: false,
            herdReasonUniqueHealth: false,
            herdReasonDifferentBreed: false,
            herdReasonOtherPurpose: false,
            herdReasonKeptSeparate: false,
            herdReasonOnlyHerd: true,
            herdReasonOther: false
          }
        })

        return h.redirect(checkHerdDetailsPageUrl)
      }

      return h.redirect(enterEnterHerdDetailsPageUrl)
    }
  }
}

export const herdOthersOnSbiHandlers = [getHandler, postHandler]
