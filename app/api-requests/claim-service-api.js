const Wreck = require('@hapi/wreck')
const appInsights = require('applicationinsights')
const config = require('../config')
const { REJECTED } = require('../constants/status')
const { claimType, dateOfVetVisitExceptions } = require('../constants/claim')

async function getClaimsByApplicationReference (applicationReference) {
  try {
    const response = await Wreck.get(
      `${config.applicationApiUri}/claim/get-by-application-reference/${applicationReference}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} Getting claims for application with reference ${applicationReference} failed`)
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
      throw new Error(
        `HTTP ${response.res.statusCode} (${response.res.statusMessage})`
      )
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

const isWithIn4MonthsAfterDateOfVisit = (dateOfVisit, dateOfTesting) => {
  const startDate = new Date(dateOfVisit)
  const endDate = new Date(dateOfVisit)

  // +4 months from dateOfVisit
  endDate.setMonth(endDate.getMonth() + 4)
  endDate.setHours(23, 59, 59, 999)

  return new Date(dateOfTesting) >= startDate && new Date(dateOfTesting) <= endDate
}

const getReviewWithinLast10Months = (dateOfVisit, previousClaims, vetVisitReview) => {
  const pastReviewClaims = previousClaims?.filter((prevClaim) => (new Date(prevClaim.data.dateOfVisit) <= new Date(dateOfVisit) && prevClaim.type === claimType.review)) ?? []
  if (vetVisitReview) {
    pastReviewClaims.push(
      {
        ...vetVisitReview,
        data: {
          ...vetVisitReview?.data,
          dateOfVisit: vetVisitReview?.data?.visitDate
        }
      }
    )
  }
  const pastReviewClaimsWithin10Months = pastReviewClaims?.filter((pastReviewClaim) => isWithin10Months(new Date(pastReviewClaim.data.dateOfVisit), new Date(dateOfVisit)))
  return pastReviewClaimsWithin10Months?.[0]
}

const isAClaimTypeWithin10Months = (typeOfClaim, dateOfVisit, previousClaims, vetVisitReview) => {
  const allClaimTypeClaims = previousClaims?.filter((prevClaim) => prevClaim.type === typeOfClaim)?.map((prevReviewClaim) => ({ dateOfVisit: prevReviewClaim.data.dateOfVisit })) ?? []
  if (vetVisitReview && typeOfClaim === claimType.review) {
    allClaimTypeClaims.push({ dateOfVisit: vetVisitReview?.data?.visitDate })
  }

  const allClaimTypeClaimsWithin10Months = allClaimTypeClaims?.filter((claim) => isWithin10Months(new Date(dateOfVisit), new Date(claim.dateOfVisit)))
  return allClaimTypeClaimsWithin10Months.length > 0
}

const isValidDateOfVisit = (dateOfVisit, typeOfClaim, previousClaims, vetVisitReview) => {
  if (typeOfClaim === claimType.review) {
    // Cannot have another review dateOfVisit +- 10 months
    const isValid = !isAClaimTypeWithin10Months(claimType.review, dateOfVisit, previousClaims, vetVisitReview)
    return { isValid, reason: !isValid ? dateOfVetVisitExceptions.reviewWithin10 : undefined }
  } else if (typeOfClaim === claimType.endemics) {
    const pastClaims = previousClaims?.filter((prevClaim) => new Date(prevClaim.data.dateOfVisit) <= new Date(dateOfVisit))
    if (isAClaimTypeWithin10Months(claimType.review, dateOfVisit, pastClaims, vetVisitReview)) {
      // Review within 10 months is REJECTED
      if (getReviewWithinLast10Months(dateOfVisit, previousClaims, vetVisitReview)?.statusId === REJECTED) {
        return { isValid: false, reason: dateOfVetVisitExceptions.rejectedReview }
      }

      // Cannot have another endemics dateOfVisit +- 10 months
      const isValid = !isAClaimTypeWithin10Months(claimType.endemics, dateOfVisit, previousClaims, vetVisitReview)
      return { isValid, reason: !isValid ? dateOfVetVisitExceptions.endemicsWithin10 : undefined }
    } else {
      // Need a review within the last 10 months for an endemics
      return { isValid: false, reason: dateOfVetVisitExceptions.noReview }
    }
  } else {
    // typeOfClaim was not review or endemics
    return { isValid: false }
  }
}

module.exports = {
  submitNewClaim,
  isWithin10Months,
  isValidDateOfVisit,
  getReviewWithinLast10Months,
  getClaimsByApplicationReference,
  isWithIn4MonthsAfterDateOfVisit,
  isWithIn4MonthsBeforeOrAfterDateOfVisit
}
