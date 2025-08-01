import links from '../../config/routes.js'
import { ONLY_HERD_ON_SBI } from '../../constants/constants.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { getEndemicsClaim } from '../../session/index.js'
import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'
import { skipOtherHerdsOnSbiPage, skipSameHerdPage } from '../../lib/context-helper.js'
import { getNextMultipleHerdsPage } from '../../lib/get-next-multiple-herds-page.js'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsCheckHerdDetails,
  endemicsEnterHerdDetails,
  endemicsSameHerd,
  endemicsEnterCphNumber,
  endemicsHerdOthersOnSbi
} = links

const pageUrl = prefixUrl(endemicsCheckHerdDetails)
const enterHerdDetailsPageUrl = prefixUrl(endemicsEnterHerdDetails)
const herdOthersOnSbiPageUrl = prefixUrl(endemicsHerdOthersOnSbi)
const sameHerdPageUrl = prefixUrl(endemicsSameHerd)
const herdCphLink = prefixUrl(endemicsEnterCphNumber)

const getHerdReasonsText = (herdReasons) => {
  return herdReasons?.map(key => MULTIPLE_HERD_REASONS[key]).join('<br>')
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdId, herdName, herdCph, herdReasons, isOnlyHerdOnSbi, typeOfLivestock, herds } = getEndemicsClaim(request)
      const herdReasonsText = isOnlyHerdOnSbi === ONLY_HERD_ON_SBI.YES ? undefined : getHerdReasonsText(herdReasons)

      return h.view(endemicsCheckHerdDetails, {
        backLink: isOnlyHerdOnSbi === ONLY_HERD_ON_SBI.YES ? herdOthersOnSbiPageUrl : enterHerdDetailsPageUrl,
        herdName,
        herdCph,
        herdReasons: herdReasonsText,
        isOnlyHerdOnSbi: skipOtherHerdsOnSbiPage(herds, herdId) ? undefined : isOnlyHerdOnSbi,
        herdCphLink,
        herdReasonsLink: enterHerdDetailsPageUrl,
        isOnlyHerdOnSbiLink: herdOthersOnSbiPageUrl,
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
      const nextPageUrl = skipSameHerdPage(previousClaims, typeOfLivestock) ? getNextMultipleHerdsPage(request) : sameHerdPageUrl
      return h.redirect(nextPageUrl)
    }
  }
}

export const checkHerdDetailsHandlers = [getHandler, postHandler]
