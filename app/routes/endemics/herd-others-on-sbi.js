import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { OTHERS_ON_SBI } from '../../constants/herd.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'

const { urlPrefix } = config
const {
  endemicsHerdOthersOnSbi,
  endemicsEnterCphNumber,
  endemicsEnterHerdDetails,
  endemicsCheckHerdDetails
} = links

const pageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterCphNumber}`
const enterEnterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const checkHerdDetailsPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

export const ONLY_HERD = 'onlyHerd'

const { endemicsClaim: { herdOthersOnSbi: herdOthersOnSbiKey, herdReasons: herdReasonsKey } } = sessionKeys

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
      const { herdOthersOnSbi, typeOfLivestock } = getEndemicsClaim(request)
      return h.view(endemicsHerdOthersOnSbi, {
        backLink: previousPageUrl,
        herdOthersOnSbi,
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
        herdOthersOnSbi: Joi.string().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock } = getEndemicsClaim(request)

        return h.view(endemicsHerdOthersOnSbi, {
          ...request.payload,
          errorMessage: {
            text: `Select yes if this is the only ${getSpeciesGroupText(typeOfLivestock)} associated with this SBI`,
            href: '#herdOthersOnSbi'
          },
          backLink: previousPageUrl,
          herdOrFlock: getHerdOrFlock(typeOfLivestock),
          speciesGroupText: getSpeciesGroupText(typeOfLivestock)
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdOthersOnSbi } = request.payload
      setEndemicsClaim(request, herdOthersOnSbiKey, herdOthersOnSbi)
      if (herdOthersOnSbi === OTHERS_ON_SBI.YES) {
        setEndemicsClaim(request, herdReasonsKey, [ONLY_HERD])
      }

      return h.redirect(herdOthersOnSbi === OTHERS_ON_SBI.YES ? checkHerdDetailsPageUrl : enterEnterHerdDetailsPageUrl)
    }
  }
}

export const herdOthersOnSbiHandlers = [getHandler, postHandler]
