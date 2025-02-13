import { status } from '../constants/constants.js'
import { isWithin10Months } from './date-utils.js'

export const canMakeReviewClaim = (dateOfVisit, prevReviewClaimDateOfVisit) => {
  if (!prevReviewClaimDateOfVisit) {
    return ''
  }

  if (isWithin10Months(dateOfVisit, prevReviewClaimDateOfVisit)) {
    return 'There must be at least 10 months between your reviews.'
  }

  return ''
}

export const canMakeEndemicsClaim = (dateOfVisit, prevReviewClaim, prevEndemicsClaimDateOfVisit, organisation, formattedTypeOfLivestock) => {
  if (!isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return 'There must be no more than 10 months between your reviews and follow-ups.'
  }

  if (prevReviewClaim.statusId === status.REJECTED) {
    return `${organisation.name} - SBI ${organisation.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
  }

  if (![status.READY_TO_PAY, status.PAID].includes(prevReviewClaim.statusId)) {
    return 'Your review claim must have been approved before you claim for the follow-up that happened after it.'
  }

  if (prevEndemicsClaimDateOfVisit && isWithin10Months(dateOfVisit, prevEndemicsClaimDateOfVisit)) {
    return 'There must be at least 10 months between your follow-ups.'
  }

  return ''
}
