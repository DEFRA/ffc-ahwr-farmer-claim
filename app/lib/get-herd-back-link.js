import { skipSameHerdPage } from './context-helper'
import { config } from '../config/index.js'
import links from '../config/routes.js'

const { urlPrefix } = config
const { endemicsCheckHerdDetails, endemicsSameHerd } = links

export const getHerdBackLink = (typeOfLivestock, previousClaims) => {
  return skipSameHerdPage(previousClaims, typeOfLivestock)
    ? `${urlPrefix}/${endemicsCheckHerdDetails}`
    : `${urlPrefix}/${endemicsSameHerd}`
}
