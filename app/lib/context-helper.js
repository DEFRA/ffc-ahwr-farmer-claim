const { getAllApplicationsBySbi } = require('../api-requests/application-service-api')
const { isWithin10Months } = require('./date-utils')
const session = require('../session')
const {
  endemicsClaim: {
    latestEndemicsApplication: latestEndemicsApplicationKey,
    latestVetVisitApplication: latestVetVisitApplicationKey,
    previousClaims: previousClaimsKey
  }
} = require('../session/keys')
const { getClaimsByApplicationReference } = require('../api-requests/claim-service-api')
const { getEndemicsClaim } = require('../session')
const { claimType } = require('../constants/claim')

async function refreshApplications (request) {
  // get ALL the applications
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

  session.setEndemicsClaim(request, latestVetVisitApplicationKey, latestVetVisitApplication)
  session.setEndemicsClaim(request, latestEndemicsApplicationKey, latestEndemicsApplication)

  return { latestEndemicsApplication, latestVetVisitApplication }
}

async function refreshClaims (request, applicationRef) {
  // fetch all the claims (all species)
  const claims = await getClaimsByApplicationReference(
    applicationRef,
    request.logger
  )

  session.setEndemicsClaim(request, previousClaimsKey, claims)

  return claims
}

function getLatestClaimForContext (request) {
  const { previousClaims, latestVetVisitApplication } = getEndemicsClaim(request)

  // When we add the MS code we can layer in here filtering by species
  // const { typeOfLivestock, previousClaims, latestVetVisitApplication } = getEndemicsClaim(request)
  // const latestEEClaim = previousClaims.find(claim => claim.data.typeOfLivestock === typeOfLivestock)
  const latestEEClaim = previousClaims?.find(claim => claim) // for now just latest

  return latestEEClaim ?? latestVetVisitApplication
}

function getTypeOfLivestockFromLatestClaim (request) {
  const claim = getLatestClaimForContext(request)

  return claim.data?.typeOfLivestock ?? claim.data?.whichReview
}

function canChangeSpecies (request, typeOfReview) {
  // for now we obey the following, we can manipulate this to consider MS
  const { previousClaims } = getEndemicsClaim(request)
  return claimType[typeOfReview] === claimType.review && !lockedToSpecies(previousClaims)
}

const lockedToSpecies = (previousEndemicClaims) => {
  // any endemic (new-world) claims means they have missed their opportunity to switch species
  return (previousEndemicClaims && previousEndemicClaims.length > 0)
}

module.exports = {
  canChangeSpecies,
  getTypeOfLivestockFromLatestClaim,
  refreshApplications,
  refreshClaims
}
