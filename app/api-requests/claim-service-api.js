import wreck from '@hapi/wreck'
import appInsights from 'applicationinsights'
import { config } from '../config/index.js'
import { claimConstants } from '../constants/claim.js'
import { isWithin10Months } from '../lib/date-utils.js'
import { getEndemicsClaim } from '../session/index.js'
import { getReviewType } from '../lib/get-review-type.js'

const { claimType, livestockTypes, dateOfVetVisitExceptions } = claimConstants

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
  const { dateOfVisit, previousClaims, latestVetVisitApplication, typeOfLivestock } = getEndemicsClaim(request)
  const reviewWithinLast10Months = getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication, typeOfLivestock)
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
