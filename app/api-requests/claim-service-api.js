import wreck from '@hapi/wreck'
import appInsights from 'applicationinsights'
import { config } from '../config/index.js'
import { claimConstants } from '../constants/claim.js'
import { status } from '../constants/constants.js'
import { isWithin10Months } from '../lib/date-utils.js'
import { getEndemicsClaim } from '../session/index.js'
import { getReviewType } from '../lib/get-review-type.js'

const { claimType, livestockTypes, dateOfVetVisitExceptions } = claimConstants
const { REJECTED, READY_TO_PAY, PAID } = status

export async function getClaimsByApplicationReference (applicationReference, logger) {
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

export async function isURNUnique (data, logger) {
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

export async function getAmount (data, logger) {
  const { type, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals, dateOfVisit } = data
  const endpoint = `${config.applicationApiUri}/claim/get-amount`

  try {
    const { payload } = await wreck.post(endpoint, {
      payload: { type, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals, dateOfVisit },
      json: true
    })

    return payload
  } catch (err) {
    logger.setBindings({ err, endpoint })
    appInsights.defaultClient.trackException({ exception: err })
    throw err
  }
}

export async function submitNewClaim (data, logger) {
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

export const isWithIn4MonthsBeforeOrAfterDateOfVisit = (dateOfVisit, dateOfTesting) => {
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

export const isDateOfTestingLessThanDateOfVisit = (dateOfVisit, dateOfTesting) => {
  return new Date(dateOfTesting) < new Date(dateOfVisit)
}

const getPastReviewClaimsForSpeciesAndHerd = (previousClaims = [], dateOfVisit, typeOfLivestock, herdId) => previousClaims.filter(prevClaim =>
  new Date(prevClaim.data.dateOfVisit) <= new Date(dateOfVisit) &&
  prevClaim.type === claimType.review &&
  typeOfLivestock === prevClaim.data.typeOfLivestock &&
  (herdId ? herdId === prevClaim.herd?.id : true) // Only filtering on this if herdId is present, as we may not be on a MultiHerds journey
)

export const getReviewWithinLast10Months = (dateOfVisit, previousClaims, vetVisitReview, typeOfLivestock, herdId) => {
  console.log(previousClaims)
  const pastReviewClaims = getPastReviewClaimsForSpeciesAndHerd(previousClaims, dateOfVisit, typeOfLivestock, herdId)
  if (vetVisitReview?.data?.whichReview === typeOfLivestock) {
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

export const getReviewTestResultWithinLast10Months = (request) => {
  const { dateOfVisit, previousClaims, latestVetVisitApplication, typeOfLivestock, herdId } = getEndemicsClaim(request)
  const reviewWithinLast10Months = getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication, typeOfLivestock, herdId)
  if (!reviewWithinLast10Months) return undefined

  return reviewWithinLast10Months?.data?.testResults
}

export const isAClaimTypeWithin10Months = (typeOfClaim, dateOfVisit, previousClaims, vetVisitReview) => {
  const allClaimTypeClaims =
    previousClaims?.filter((prevClaim) => prevClaim.type === typeOfClaim)?.map((prevReviewClaim) => ({ dateOfVisit: prevReviewClaim.data.dateOfVisit })) ?? []
  if (vetVisitReview && typeOfClaim === claimType.review) {
    allClaimTypeClaims.push({ dateOfVisit: vetVisitReview?.data?.visitDate })
  }

  const allClaimTypeClaimsWithin10Months = allClaimTypeClaims?.filter((claim) => isWithin10Months(new Date(dateOfVisit), new Date(claim.dateOfVisit)))
  return allClaimTypeClaimsWithin10Months.length > 0
}

export const getDateOfVetVisitException = (claimType) => {
  const { isReview } = getReviewType(claimType)
  return isReview ? dateOfVetVisitExceptions.reviewWithin10 : dateOfVetVisitExceptions.endemicsWithin10
}

export const isValidClaimWithin10Months = (claimType, dateOfVisit, previousClaims, vetVisitReview) => {
  const isValid = !isAClaimTypeWithin10Months(claimType, dateOfVisit, previousClaims, vetVisitReview)
  return { isValid, ...(!isValid && { reason: getDateOfVetVisitException(claimType) }) }
}

export const isValidDateOfVisit = (dateOfVisit, typeOfClaim, previousClaims, vetVisitReview) => {
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

export const isCattleEndemicsClaimForOldWorldReview = (request) => {
  const { latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock } = getEndemicsClaim(request)
  const oldWorldReview = latestVetVisitApplication?.data
  const previousReviewIsCattle = oldWorldReview?.whichReview === livestockTypes.beef || oldWorldReview?.whichReview === livestockTypes.dairy
  const previousReviewIsSameSpeciesAsCurrentClaim = oldWorldReview?.whichReview === typeOfLivestock
  return (
    typeOfReview === claimType.endemics &&
    previousReviewIsCattle &&
    previousReviewIsSameSpeciesAsCurrentClaim &&
    !previousClaims?.length
  )
}
