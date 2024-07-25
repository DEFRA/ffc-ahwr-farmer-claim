const Wreck = require('@hapi/wreck')
const session = require('../session')
const appInsights = require('applicationinsights')
const config = require('../config')
const { livestockTypes, claimType, dateOfVetVisitExceptions } = require('../constants/claim')
const { REJECTED, READY_TO_PAY, PAID } = require('../constants/status')
const { getReviewType } = require('../lib/get-review-type')

async function getClaimsByApplicationReference (applicationReference) {
  try {
    const response = await Wreck.get(`${config.applicationApiUri}/claim/get-by-application-reference/${applicationReference}`, { json: true })
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} Getting claims for application with reference ${applicationReference} failed`)
    return null
  }
}

async function isURNUnique (data) {
  try {
    const response = await Wreck.post(`${config.applicationApiUri}/claim/is-urn-unique`, {
      payload: data,
      json: true
    })

    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }

    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} URN check failed`)
    appInsights.defaultClient.trackException({ exception: error })
    return null
  }
}

async function submitNewClaim (data) {
  try {
    const response = await Wreck.post(`${config.applicationApiUri}/claim`, {
      payload: data,
      json: true
    })
    if (response.res.statusCode !== 200) {
      appInsights.defaultClient.trackException({ exception: response.res.statusMessage })
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} claim submission failed`)
    appInsights.defaultClient.trackException({ exception: error })
    return null
  }
}

const isWithin10Months = (a, b) => {
  const [dateA, dateB] = [new Date(a), new Date(b)]
  const [firstDate, secondDate] = dateA < dateB ? [dateA, dateB] : [dateB, dateA]
  const firstDatePlus10Months = firstDate.setMonth(firstDate.getMonth() + 10)
  return firstDatePlus10Months >= secondDate
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
  const { latestVetVisitApplication, typeOfReview, previousClaims } = session.getEndemicsClaim(request)

  return (
    typeOfReview === claimType.endemics &&
    latestVetVisitApplication &&
    (latestVetVisitApplication?.data?.whichReview === livestockTypes.beef || latestVetVisitApplication?.data?.whichReview === livestockTypes.dairy) &&
    !previousClaims?.find((claim) => claim.type === claimType.endemics)
  )
}

module.exports = {
  isURNUnique,
  submitNewClaim,
  isWithin10Months,
  isValidDateOfVisit,
  getReviewWithinLast10Months,
  getClaimsByApplicationReference,
  isDateOfTestingLessThanDateOfVisit,
  getReviewTestResultWithinLast10Months,
  isWithIn4MonthsBeforeOrAfterDateOfVisit,
  isFirstTimeEndemicClaimForActiveOldWorldReviewClaim
}
