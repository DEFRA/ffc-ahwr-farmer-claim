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
const getOldWorldClaimFromApplication = (oldWorldApp) => ([{
  statusId: oldWorldApp.statusId,
  data: {
    claimType: oldWorldApp.data.whichReview,
    dateOfVisit: oldWorldApp.data.visitDate
  }
}])

const canMakeReviewClaim = (dateOfVisit, mostRecentClaim, secondMostRecentClaim) => {
  if (!mostRecentClaim) {
    return { isValid: true, reason: '' }
  }

  if (mostRecentClaim.data.claimType === claimType.review) {
    const dateOfClaimVisit = mostRecentClaim.data.dateOfVisit

    if (isWithin10Months(dateOfVisit, dateOfClaimVisit)) {
      return { isValid: false, reason: dateOfVetVisitExceptions.reviewWithin10 }
    }
  }

  if (mostRecentClaim.data.claimType === claimType.endemics) {
    if (isWithin10Months(dateOfVisit, secondMostRecentClaim.data.dateOfVisit)) {
      return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
    }
  }

  return { isValid: true, reason: '' }
}

const canMakeEndemicsClaim = (dateOfVisit, mostRecentClaim, secondMostRecentClaim) => {
  if (!mostRecentClaim || mostRecentClaim.data.claimType === claimType.endemics) {
    return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
  }

  // if we get here, mostRecentClaim must be a review claim
  // secondMostRecentClaim is either undefined, or an endemics claim

  if (![READY_TO_PAY, PAID].includes(mostRecentClaim.statusId)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment }
  }

  const dateOfClaimVisit = mostRecentClaim.data.dateOfVisit

  if (!isWithin10Months(dateOfVisit, dateOfClaimVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
  }

  if (secondMostRecentClaim && isWithin10Months(dateOfVisit, secondMostRecentClaim.data.dateOfVisit)) {
    return { isValid: false, reason: dateOfVetVisitExceptions.endemicsWithin10 }
  }
}

const isValidDateOfVisit = (dateOfVisit, isReview, previousClaims, oldWorldApp, typeOfLivestock) => {
  const [mostRecentClaim, secondMostRecentClaim] = previousClaims.length !== 0
    ? previousClaims.filter((claim) => claim.data.typeOfLivestock === typeOfLivestock)
    : getOldWorldClaimFromApplication(oldWorldApp) // TODO handle no previous claims on old world, need to find out which field to validate there wasnt any

  if (isReview) {
    // user is trying to make a review claim
    return canMakeReviewClaim(dateOfVisit, mostRecentClaim, secondMostRecentClaim)
  }

  // user is trying to make an endemics claim
  return canMakeEndemicsClaim(dateOfVisit, mostRecentClaim, secondMostRecentClaim)
}

module.exports = { isValidDateOfVisit }
