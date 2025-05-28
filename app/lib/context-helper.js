import { clearEndemicsClaim, getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'
import { isWithin10Months } from './date-utils.js'
import { getAllApplicationsBySbi } from '../api-requests/application-service-api.js'
import { getClaimsByApplicationReference } from '../api-requests/claim-service-api.js'
import { createTempClaimReference } from './create-temp-claim-reference.js'
import { claimConstants } from '../constants/claim.js'
import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE, MULTIPLE_HERDS_RELEASE_DATE } from '../constants/constants.js'

const {
  endemicsClaim: {
    latestEndemicsApplication: latestEndemicsApplicationKey,
    latestVetVisitApplication: latestVetVisitApplicationKey,
    previousClaims: previousClaimsKey,
    reference: referenceKey
  }
} = sessionKeys

export async function refreshApplications (request) {
  const applications = await getAllApplicationsBySbi(request.query.sbi, request.logger)

  // get latest new world
  const latestEndemicsApplication = applications.find((application) => {
    return application.type === 'EE'
  })

  // get latest old world - if there isn't one, or it's not within 10 months of the new world one, then we won't consider it,
  // and thus return undefined
  const latestVetVisitApplication = applications.find((application) => {
    // endemics application must have been created within 10 months of vet-visit application visit date
    return application.type === 'VV' && isWithin10Months(application.data?.visitDate, latestEndemicsApplication.createdAt)
  })

  setEndemicsClaim(request, latestVetVisitApplicationKey, latestVetVisitApplication)
  setEndemicsClaim(request, latestEndemicsApplicationKey, latestEndemicsApplication)

  return { latestEndemicsApplication, latestVetVisitApplication }
}

export async function refreshClaims (request, applicationRef) {
  // fetch all the claims (all species)
  const claims = await getClaimsByApplicationReference(
    applicationRef,
    request.logger
  )

  setEndemicsClaim(request, previousClaimsKey, claims)

  return claims
}

export const resetEndemicsClaimSession = async (request, applicationRef, claimRef) => {
  const tempClaimRef = claimRef ?? createTempClaimReference()

  clearEndemicsClaim(request)
  setEndemicsClaim(request, referenceKey, tempClaimRef)
  return refreshClaims(request, applicationRef)
}

export function getLatestClaimForContext (request) {
  const { previousClaims, latestVetVisitApplication } = getEndemicsClaim(request)

  // When we add the MS code we can layer in here filtering by species
  // const { typeOfLivestock, previousClaims, latestVetVisitApplication } = getEndemicsClaim(request)
  // const latestEEClaim = previousClaims.find(claim => claim.data.typeOfLivestock === typeOfLivestock)
  const latestEEClaim = previousClaims?.find(claim => claim) // for now just latest

  return latestEEClaim ?? latestVetVisitApplication
}

export function getTypeOfLivestockFromLatestClaim (request) {
  const claim = getLatestClaimForContext(request)

  return claim.data?.typeOfLivestock ?? claim.data?.whichReview
}

export function canChangeSpecies (request, typeOfReview) {
  // for now, we obey the following, we can manipulate this to consider MS
  const { previousClaims } = getEndemicsClaim(request)
  return claimConstants.claimType[typeOfReview] === claimConstants.claimType.review && !lockedToSpecies(previousClaims)
}

const lockedToSpecies = (previousEndemicClaims) => {
  // any endemic (new-world) claims means they have missed their opportunity to switch species
  return (previousEndemicClaims && previousEndemicClaims.length > 0)
}

export const isVisitDateAfterPIHuntAndDairyGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

export const isMultipleHerdsUserJourney = (dateOfVisit, agreementFlags) => {
  if (!config.multiHerds.enabled || new Date(dateOfVisit) < MULTIPLE_HERDS_RELEASE_DATE) {
    return false
  }

  // only check for rejected T&Cs flag if MH enabled and visit date on/after golive
  if (agreementFlags && agreementFlags.some(f => f.appliesToMh)) {
    return false
  }

  return true
}

export const skipSameHerdPage = (previousClaims, typeOfLivestock) => {
  const previousClaimsForSpecies = previousClaims.filter(claim => { return claim.data.typeOfLivestock === typeOfLivestock })
  return !previousClaimsForSpecies.length || previousClaimsForSpecies.some(claim => claim.data.herdId)
}
