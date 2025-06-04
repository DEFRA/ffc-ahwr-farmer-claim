import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { OTHERS_ON_SBI } from '../../constants/herd.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { getEndemicsClaim } from '../../session/index.js'
import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'
import { skipSameHerdPage, skipOtherHerdsOnSbiPage } from '../../lib/context-helper.js'
import { getNextPage } from './date-of-visit-mh.js'

const { urlPrefix } = config
const {
  endemicsCheckHerdDetails,
  endemicsEnterHerdDetails,
  endemicsSameHerd,
  endemicsEnterCphNumber,
  endemicsHerdOthersOnSbi
} = links

const pageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const enterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const herdOthersOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const sameHerdPageUrl = `${urlPrefix}/${endemicsSameHerd}`
const herdCphLink = `${urlPrefix}/${endemicsEnterCphNumber}`

const getHerdReasonsText = (herdReasons) => {
  return herdReasons?.map(key => MULTIPLE_HERD_REASONS[key]).join('<br>')
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdId, herdName, herdCph, herdReasons, herdOthersOnSbi, typeOfLivestock, herds } = getEndemicsClaim(request)
      const herdReasonsText = getHerdReasonsText(herdReasons)

      return h.view(endemicsCheckHerdDetails, {
        backLink: herdOthersOnSbi === OTHERS_ON_SBI.YES ? herdOthersOnSbiPageUrl : enterHerdDetailsPageUrl,
        herdName,
        herdCph,
        herdReasons: herdReasonsText,
        herdOthersOnSbi: skipOtherHerdsOnSbiPage(herds, herdId) ? undefined : herdOthersOnSbi,
        herdCphLink,
        herdReasonsLink: enterHerdDetailsPageUrl,
        herdOthersOnSbiLink: herdOthersOnSbiPageUrl,
        herdOrFlock: getHerdOrFlock(typeOfLivestock)
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { previousClaims, typeOfLivestock } = getEndemicsClaim(request)
      const nextPageUrl = skipSameHerdPage(previousClaims, typeOfLivestock) ? getNextPage(request) : sameHerdPageUrl
      return h.redirect(nextPageUrl)
    }
  }
}

export const checkHerdDetailsHandlers = [getHandler, postHandler]
