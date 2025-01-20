const { dateOfVetVisitExceptions } = require('../constants/claim')
const { READY_TO_PAY, PAID, REJECTED } = require('../constants/status')
const { isWithin10Months } = require('../lib/date-utils')

const canMakeReviewClaim = (dateOfVisit, prevReviewClaimDateOfVisit) => {
  if (!prevReviewClaimDateOfVisit) {
    return { isValid: true, reason: '' }
  }

  if (isWithin10Months(dateOfVisit, prevReviewClaimDateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.reviewWithin10 }
  }

  return { isValid: true, reason: '' }
}

const canMakeEndemicsClaim = (dateOfVisit, prevReviewClaim, prevEndemicsClaimDateOfVisit) => {
  if (!prevReviewClaim || !isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
  }

  if (prevReviewClaim.statusId === REJECTED) {
    return { isValid: false, reason: dateOfVetVisitExceptions.rejectedReview }
  }

  if (![READY_TO_PAY, PAID].includes(prevReviewClaim.statusId)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment }
  }

  if (prevEndemicsClaimDateOfVisit && isWithin10Months(dateOfVisit, prevEndemicsClaimDateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.endemicsWithin10 }
  }

  return { isValid: true, reason: '' }
}

module.exports = {
  canMakeReviewClaim,
  canMakeEndemicsClaim
}
