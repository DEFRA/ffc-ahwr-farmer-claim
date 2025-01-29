const wreck = require('@hapi/wreck')
const session = require('../session')
const appInsights = require('applicationinsights')
const config = require('../config')
const { livestockTypes, claimType, dateOfVetVisitExceptions } = require('../constants/claim')
const { REJECTED, READY_TO_PAY, PAID } = require('../constants/status')
const { getReviewType } = require('../lib/get-review-type')
const { isWithin10Months } = require('../lib/date-utils')

async function getClaimsByApplicationReference (applicationReference, logger) {
  const endpoint = `${config.applicationApiUri}/claim/get-by-application-reference/${applicationReference}`

  try {
    const { payload } = await wreck.get(endpoint, { json: true })
    return payload
  } catch (err) {
    if (err.output.statusCode === 404) {
      return []
    }
    logger.setBindings({ err, endpoint })
    throw err
  }
}

async function isURNUnique (data, logger) {
  const endpoint = `${config.applicationApiUri}/claim/is-urn-unique`
  try {
    const { payload } = await wreck.post(endpoint, {
      payload: data,
      json: true
    })

    return payload
  } catch (err) {
    logger.setBindings({ err, endpoint })
    appInsights.defaultClient.trackException({ exception: err })
    throw err
  }
}

async function getAmount (data, logger) {
  const { type, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals } = data
  const endpoint = `${config.applicationApiUri}/claim/get-amount`

  try {
    const { payload } = await wreck.post(endpoint, {
      payload: { type, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals },
      json: true
    })

    return payload
  } catch (err) {
    logger.setBindings({ err, endpoint })
    appInsights.defaultClient.trackException({ exception: err })
    throw err
  }
}

async function submitNewClaim (data, logger) {
  const endpoint = `${config.applicationApiUri}/claim`

  try {
    const { payload } = await wreck.post(endpoint, {
      payload: data,
      json: true
    })

    return payload
  } catch (err) {
    logger.setBindings({ err, endpoint })
    appInsights.defaultClient.trackException({ exception: err })
    throw err
  }
}

const isWithIn4MonthsBeforeOrAfterDateOfVisit = (dateOfVisit, dateOfTesting) => {
  const startDate = new Date(dateOfVisit)
  const endDate = new Date(dateOfVisit)

  // -4 months before dateOfVisit
  startDate.setMonth(startDate.getMonth() - 4)
  startDate.setHours(0, 0, 0, 0)

  // +4 months from dateOfVisit
  endDate.setMonth(endDate.getMonth() + 4)
  endDate.setHours(23, 59, 59, 999)

  return new Date(dateOfTesting) >= startDate && new Date(dateOfTesting) <= endDate
}

const isDateOfTestingLessThanDateOfVisit = (dateOfVisit, dateOfTesting) => {
  return new Date(dateOfTesting) < new Date(dateOfVisit)
}

const getReviewWithinLast10Months = (dateOfVisit, previousClaims, vetVisitReview) => {
  const pastReviewClaims = previousClaims?.filter((prevClaim) => new Date(prevClaim.data.dateOfVisit) <= new Date(dateOfVisit) && prevClaim.type === claimType.review) ?? []
  if (vetVisitReview) {
    pastReviewClaims.push({
      ...vetVisitReview,
      data: {
        ...vetVisitReview?.data,
        dateOfVisit: vetVisitReview?.data?.visitDate
      }
    })
  }
  const pastReviewClaimsWithin10Months = pastReviewClaims?.filter((pastReviewClaim) => isWithin10Months(new Date(pastReviewClaim.data.dateOfVisit), new Date(dateOfVisit)))
  return pastReviewClaimsWithin10Months?.[0]
}

const getReviewTestResultWithinLast10Months = (request) => {
  const { dateOfVisit, previousClaims, latestVetVisitApplication } = session.getEndemicsClaim(request)
  const reviewWithinLast10Months = getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication)

  if (!reviewWithinLast10Months) return undefined

  return reviewWithinLast10Months?.data?.testResults
}

const isAClaimTypeWithin10Months = (typeOfClaim, dateOfVisit, previousClaims, vetVisitReview) => {
  const allClaimTypeClaims =
    previousClaims?.filter((prevClaim) => prevClaim.type === typeOfClaim)?.map((prevReviewClaim) => ({ dateOfVisit: prevReviewClaim.data.dateOfVisit })) ?? []
  if (vetVisitReview && typeOfClaim === claimType.review) {
    allClaimTypeClaims.push({ dateOfVisit: vetVisitReview?.data?.visitDate })
  }

  const allClaimTypeClaimsWithin10Months = allClaimTypeClaims?.filter((claim) => isWithin10Months(new Date(dateOfVisit), new Date(claim.dateOfVisit)))
  return allClaimTypeClaimsWithin10Months.length > 0
}

const getDateOfVetVisitException = (claimType) => {
  const { isReview } = getReviewType(claimType)
  return isReview ? dateOfVetVisitExceptions.reviewWithin10 : dateOfVetVisitExceptions.endemicsWithin10
}

const isValidClaimWithin10Months = (claimType, dateOfVisit, previousClaims, vetVisitReview) => {
  const isValid = !isAClaimTypeWithin10Months(claimType, dateOfVisit, previousClaims, vetVisitReview)
  return { isValid, ...(!isValid && { reason: getDateOfVetVisitException(claimType) }) }
}

const isValidDateOfVisit = (dateOfVisit, typeOfClaim, previousClaims, vetVisitReview) => {
  switch (typeOfClaim) {
    case claimType.review:
      // Cannot have another review dateOfVisit +- 10 months
      return isValidClaimWithin10Months(claimType.review, dateOfVisit, previousClaims, vetVisitReview)
    case claimType.endemics: {
      const pastClaims = previousClaims?.filter((prevClaim) => new Date(prevClaim.data.dateOfVisit) <= new Date(dateOfVisit))
      if (isAClaimTypeWithin10Months(claimType.review, dateOfVisit, pastClaims, vetVisitReview)) {
        // Review within 10 months is REJECTED
        if (getReviewWithinLast10Months(dateOfVisit, previousClaims, vetVisitReview)?.statusId === REJECTED) {
          return { isValid: false, reason: dateOfVetVisitExceptions.rejectedReview }
        }
        // Claim endemics before review status is READY_TO_PAY
        if (![READY_TO_PAY, PAID].includes(getReviewWithinLast10Months(dateOfVisit, previousClaims, vetVisitReview)?.statusId)) {
          return { isValid: false, reason: dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment }
        }
        // Cannot have another endemics dateOfVisit +- 10 months
        return isValidClaimWithin10Months(claimType.endemics, dateOfVisit, previousClaims, vetVisitReview)
      }
      // Need a review within the last 10 months for an endemics
      return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
    }
    default:
      // typeOfClaim was not review or endemics
      return { isValid: false }
  }
}

const isFirstTimeEndemicClaimForActiveOldWorldReviewClaim = (request) => {
  const { typeOfReview, previousClaims, typeOfLivestock, latestVetVisitApplication } = session.getEndemicsClaim(request)
  return (
    typeOfReview === claimType.endemics &&
    latestVetVisitApplication &&
    (latestVetVisitApplication.data?.whichReview === livestockTypes.beef || latestVetVisitApplication.data?.whichReview === livestockTypes.dairy) &&
    latestVetVisitApplication.data?.whichReview === typeOfLivestock &&
    !previousClaims?.find((claim) => claim.type === claimType.endemics || claim.type === claimType.review)
  )
}

module.exports = {
  getAmount,
  isURNUnique,
  submitNewClaim,
  isValidDateOfVisit,
  getReviewWithinLast10Months,
  getClaimsByApplicationReference,
  isDateOfTestingLessThanDateOfVisit,
  getReviewTestResultWithinLast10Months,
  isWithIn4MonthsBeforeOrAfterDateOfVisit,
  isFirstTimeEndemicClaimForActiveOldWorldReviewClaim
}
