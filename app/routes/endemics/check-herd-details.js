import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim } from '../../session/index.js'

const { urlPrefix } = config
const {
  endemicsCheckHerdDetails,
  endemicsEnterHerdDetails,
  endemicsDateOfTesting,
  endemicsEnterCphNumber
} = links

const pageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const previousPageUrl = `${urlPrefix}/${endemicsEnterHerdDetails}`
const nextPageUrl = `${urlPrefix}/${endemicsDateOfTesting}`

const herdReasonsLink = previousPageUrl
const herdCphLink = `${urlPrefix}/${endemicsEnterCphNumber}`

const getHerdReasonsText = (herdReasons) => {
  const herdReasonDescriptions = {
    separateManagementNeeds: 'They have separate management needs',
    uniqueHealthNeeds: 'They have unique health needs to other herds on the farm (if present)',
    differentBreed: 'They are a different breed',
    differentPurpose: 'They are used for another purpose than the other herd(s) (e.g. milking cattle)',
    keptSeparate: 'They have been kept completely separate from any other herds',
    other: 'Other'
  }
  return herdReasons?.map(key => herdReasonDescriptions[key]).join(',<br>')
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { herdName, herdCph, herdReasons } = getEndemicsClaim(request)
      const herdReasonsText = getHerdReasonsText(herdReasons)
      return h.view(endemicsCheckHerdDetails, {
        backLink: previousPageUrl,
        herdName,
        herdCph,
        herdReasons: herdReasonsText,
        herdCphLink,
        herdReasonsLink
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    handler: async (_request, h) => {
      return h.redirect(nextPageUrl)
    }
  }
}

export const checkHerdDetailsHandlers = [getHandler, postHandler]
