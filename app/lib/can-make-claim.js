const { READY_TO_PAY, PAID, REJECTED } = require('../constants/status')
const { isWithin10Months } = require('./date-utils')

const canMakeReviewClaim = (dateOfVisit, prevReviewClaimDateOfVisit) => {
  if (!prevReviewClaimDateOfVisit) {
    return ''
  }

  if (isWithin10Months(dateOfVisit, prevReviewClaimDateOfVisit)) {
    return 'There must be at least 10 months between your reviews.'
  }

  return ''
}

const canMakeEndemicsClaim = (dateOfVisit, prevReviewClaim, prevEndemicsClaimDateOfVisit, organisation, formattedTypeOfLivestock) => {
  if (!isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return 'There must be no more than 10 months between your reviews and follow-ups.'
  }

  if (prevReviewClaim.statusId === REJECTED) {
    return `${organisation.name} - SBI ${organisation.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
  }

  if (![READY_TO_PAY, PAID].includes(prevReviewClaim.statusId)) {
    return 'Your review claim must have been approved before you claim for the follow-up that happened after it.'
  }

  if (prevEndemicsClaimDateOfVisit && isWithin10Months(dateOfVisit, prevEndemicsClaimDateOfVisit)) {
    return 'There must be at least 10 months between your follow-ups.'
  }

  return ''
}

module.exports = {
  canMakeReviewClaim,
  canMakeEndemicsClaim
}
