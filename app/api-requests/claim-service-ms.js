const config = require('../config')
const { dateOfVetVisitExceptions, claimType } = require('../constants/claim')
const { READY_TO_PAY, PAID } = require('../constants/status')
const { isWithin10Months } = require('../lib/date-utils')


/*
  I think this is what the application looks like
  {
    data: { 
      visitDate: date,
      whichReview: 'beef'
    },
    statusId,
    
  }
*/
const getMostRecentClaim = (oldWorldApp) => ({
  statusId: oldWorldApp.statusId,
  data: {
    claimType: oldWorldApp.data.whichReview,
    dateOfVisit: oldWorldApp.data.visitDate,
  }
})

function isValidDateOfVisit(dateOfVisit, isReview, previousClaims, oldWorldApp, typeOfLivestock) {
  // const relevantClaims = previousClaims.filter((claim) => claim.data.typeOfLivestock === typeOfLivestock)
  // const mostRecentClaim = relevantClaims[0]
  const mostRecentClaim = previousClaims
    ? previousClaims.find((claim) => claim.data.typeOfLivestock === typeOfLivestock)
    : getMostRecentClaim(oldWorldApp) // TODO handle no previous claims on old world, need to find out which field to validate there wasnt any

  if (!mostRecentClaim) {
    if (isReview) {
      return { isValid: true, reason: '' }
    }

    return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
  }

  // at least one claim of same species

  if (!isReview) {

    if (mostRecentClaim.data.claimType === claimType.endemics) {
      return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
    }

    if (![READY_TO_PAY, PAID].includes(mostRecentClaim.statusId) && config.reviewClaimApprovedStatus.enabled) { // this env var check could go
      return { isValid: false, reason: dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment }
    }

    const dateOfClaimVisit = mostRecentClaim.data.dateOfVisit

    if (!isWithin10Months(dateOfVisit, dateOfClaimVisit)) {
      return { isValid: false, reason: dateOfVetVisitExceptions.endemicsWithin10 }
    }
  }

  if (mostRecentClaim.data.claimType === claimType.review) {
    const dateOfClaimVisit = mostRecentClaim.data.dateOfVisit

    if (isWithin10Months(dateOfVisit, dateOfClaimVisit)) {
      return { isValid: false, reason: dateOfVetVisitExceptions.reviewWithin10 }
    }
  }

  return { isValid: true, reason: '' }
}

module.exports = { isValidDateOfVisit }
