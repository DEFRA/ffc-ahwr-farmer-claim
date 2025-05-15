import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { OTHERS_ON_SBI } from '../../constants/herd.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { getEndemicsClaim } from '../../session/index.js'
import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'
import { isPreviousClaimsWithoutHerdAssigned } from '../../lib/context-helper.js'

const { urlPrefix } = config
const {
  endemicsCheckHerdDetails,
  endemicsEnterHerdDetails,
  endemicsSameHerd,
  endemicsDateOfTesting,
  endemicsEnterCphNumber,
  endemicsHerdOthersOnSbi
} = links

const pageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const enterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const herdOthersOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const sameHerdPageUrl = `${urlPrefix}/${endemicsSameHerd}`
const dateOfTestingPageUrl = `${urlPrefix}/${endemicsDateOfTesting}`

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
      const { herdName, herdCph, herdReasons, herdOthersOnSbi, typeOfLivestock } = getEndemicsClaim(request)
      const herdReasonsText = getHerdReasonsText(herdReasons)

      return h.view(endemicsCheckHerdDetails, {
        backLink: herdOthersOnSbi === OTHERS_ON_SBI.YES ? herdOthersOnSbiPageUrl : enterHerdDetailsPageUrl,
        herdName,
        herdCph,
        herdReasons: herdReasonsText,
        herdOthersOnSbi,
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
      const { previousClaims } = getEndemicsClaim(request)
      const nextPageUrl = isPreviousClaimsWithoutHerdAssigned(previousClaims) ? sameHerdPageUrl : dateOfTestingPageUrl
      return h.redirect(nextPageUrl)
    }
  }
}

export const checkHerdDetailsHandlers = [getHandler, postHandler]
