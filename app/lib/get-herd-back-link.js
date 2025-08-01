import links from '../config/routes.js'
import { skipSameHerdPage } from './context-helper.js'
import { prefixUrl } from '../routes/utils/page-utils.js'

const { endemicsCheckHerdDetails, endemicsSameHerd } = links

export const getHerdBackLink = (typeOfLivestock, previousClaims) => {
  return skipSameHerdPage(previousClaims, typeOfLivestock)
    ? prefixUrl(endemicsCheckHerdDetails)
    : prefixUrl(endemicsSameHerd)
}
