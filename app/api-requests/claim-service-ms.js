const { dateOfVetVisitExceptions } = require('../constants/claim')
const { READY_TO_PAY, PAID, REJECTED } = require('../constants/status')
const { isWithin10Months } = require('../lib/date-utils')

const canMakeReviewClaim = (dateOfVisit, prevReviewClaim) => {
  if (!prevReviewClaim) {
    return { isValid: true, reason: '' }
  }

  if (isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.reviewWithin10 }
  }

  return { isValid: true, reason: '' }
}

const canMakeEndemicsClaim = (dateOfVisit, prevReviewClaim, prevEndemicsClaim) => {
  if (!prevReviewClaim || !isWithin10Months(dateOfVisit, prevReviewClaim.data.dateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
  }

  console.log({prevReviewClaim});
  console.log({prevEndemicsClaim});

  if (![READY_TO_PAY, PAID].includes(prevReviewClaim.statusId)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment }
  }

  if (prevReviewClaim.statusId === REJECTED) {
    return { isValid: false, reason: dateOfVetVisitExceptions.rejectedReview }
  }

  if (prevEndemicsClaim && isWithin10Months(dateOfVisit, prevEndemicsClaim.data.dateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.endemicsWithin10 }
  }

  return { isValid: true, reason: '' }
}

// const isValidDateOfVisit = (dateOfVisit, isReview, mostRecentClaim, secondMostRecentClaim) => {
//   if (isReview) {
//     // user is trying to make a review claim
//     return canMakeReviewClaim(dateOfVisit, mostRecentClaim, secondMostRecentClaim)
//   }

//   // user is trying to make an endemics claim
//   return canMakeEndemicsClaim(dateOfVisit, mostRecentClaim, secondMostRecentClaim)
// }

module.exports = {
  canMakeReviewClaim,
  canMakeEndemicsClaim
}