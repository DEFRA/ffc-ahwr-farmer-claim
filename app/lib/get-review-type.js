import { claimConstants } from '../constants/claim.js'

export const getReviewType = (typeOfReview) => {
  return {
    isReview: typeOfReview === claimConstants.claimType.review,
    isEndemicsFollowUp: typeOfReview === claimConstants.claimType.endemics
  }
}
