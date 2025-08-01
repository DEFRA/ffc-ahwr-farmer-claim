import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { config } from '../../config/index.js'

export const getEndemicsClaimDetails = (typeOfLivestock, typeOfReview) => {
  const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp, isReview } = getReviewType(typeOfReview)
  const isBeefOrDairyEndemics = (isBeef || isDairy) && isEndemicsFollowUp

  return { isBeef, isDairy, isPigs, isSheep, isEndemicsFollowUp, isBeefOrDairyEndemics, isReview }
}

export const prefixUrl = (specificUrl) => {
  return `${config.urlPrefix}/${specificUrl}`
}
