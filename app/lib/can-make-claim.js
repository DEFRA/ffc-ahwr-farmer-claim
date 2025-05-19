import { status } from '../constants/constants.js'
import { isWithin10Months } from './date-utils.js'
import { getLivestockTypes } from './get-livestock-types.js'
import { getOldWorldClaimFromApplication } from './index.js'
import { claimConstants } from '../constants/claim.js'

const { review, endemics } = claimConstants.claimType

export const canMakeReviewClaim = (dateOfVisit, prevReviewClaimDateOfVisit) => {
  if (!prevReviewClaimDateOfVisit) {
    return ''
  }

  if (isWithin10Months(dateOfVisit, prevReviewClaimDateOfVisit)) {
    return 'There must be at least 10 months between your reviews.'
  }

  return ''
}

const formatTypeOfLivestock = (typeOfLivestock) => {
  const { isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
  return isPigs || isSheep ? typeOfLivestock : `${typeOfLivestock} cattle`
}

export const canMakeEndemicsClaim = (dateOfVisit, prevReviewClaim, prevEndemicsClaimDateOfVisit, organisation, typeOfLivestock) => {
  if (!isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return 'There must be no more than 10 months between your reviews and follow-ups.'
  }

  if (prevReviewClaim.statusId === status.REJECTED) {
    return `${organisation.name} - SBI ${organisation.sbi} had a failed review claim for ${formatTypeOfLivestock(typeOfLivestock)} in the last 10 months.`
  }

  if (![status.READY_TO_PAY, status.PAID].includes(prevReviewClaim.statusId)) {
    return 'Your review claim must have been approved before you claim for the follow-up that happened after it.'
  }

  if (prevEndemicsClaimDateOfVisit && isWithin10Months(dateOfVisit, prevEndemicsClaimDateOfVisit)) {
    return 'There must be at least 10 months between your follow-ups.'
  }

  if (new Date(dateOfVisit) < new Date(prevReviewClaim.data.dateOfVisit)) {
    return 'The follow-up must be after your review'
  }

  return ''
}

export const canMakeClaim = ({ prevClaims, typeOfReview, dateOfVisit, organisation, typeOfLivestock, oldWorldApplication }) => {
  const prevReviewClaim = prevClaims.find(claim => claim.type === review) || getOldWorldClaimFromApplication(oldWorldApplication, typeOfLivestock)
  const prevEndemicsClaim = prevClaims.find(claim => claim.type === endemics)

  return typeOfReview === review
    ? canMakeReviewClaim(dateOfVisit, prevReviewClaim?.data.dateOfVisit)
    : canMakeEndemicsClaim(dateOfVisit, prevReviewClaim, prevEndemicsClaim?.data.dateOfVisit, organisation, typeOfLivestock)
}
