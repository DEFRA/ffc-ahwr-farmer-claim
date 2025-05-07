import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getEndemicsClaim } from '../../session/index.js'
import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'

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
  return herdReasons?.map(key => MULTIPLE_HERD_REASONS[key]).join(',<br>')
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
