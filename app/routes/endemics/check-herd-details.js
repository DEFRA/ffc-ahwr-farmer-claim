import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { getEndemicsClaim } from '../../session/index.js'

const { urlPrefix } = config
const {
  endemicsCheckHerdDetails,
  endemicsEnterHerdDetails,
  endemicsDateOfTesting,
  endemicsEnterCphNumber,
  endemicsHerdOthersOnSbi
} = links

const pageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const enterHerdDetailsPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const herdOthersOnSbiPageUrl = `${urlPrefix}/${endemicsHerdOthersOnSbi}`
const nextPageUrl = `${urlPrefix}/${endemicsDateOfTesting}`

const herdCphLink = `${urlPrefix}/${endemicsEnterCphNumber}`

const getHerdReasonsText = (herdReasons) => {
  const herdReasonDescriptions = {
    separateManagementNeeds: 'They have separate management needs',
    uniqueHealthNeeds: 'They have unique health needs',
    differentBreed: 'They are a different breed',
    differentPurpose: 'They are used for another purpose (e.g. breeding)',
    keptSeparate: 'They have been kept completely separate',
    other: 'Other reasons based on my vet\'s judgement'
  }
  return herdReasons?.map(key => herdReasonDescriptions[key]).join(',<br>')
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
        backLink: herdOthersOnSbi === 'yes' ? herdOthersOnSbiPageUrl : enterHerdDetailsPageUrl,
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
      return h.redirect(nextPageUrl)
    }
  }
}

export const checkHerdDetails = [getHandler, postHandler]
