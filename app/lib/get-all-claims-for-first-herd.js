import { MULTIPLE_HERDS_RELEASE_DATE } from '../constants/constants.js'

export const getAllClaimsForFirstHerd = (previousClaims, typeOfLivestock, earliestClaimCanBePostMH = false) => {
  const prevLivestockClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const earliestClaim = previousClaims
    ?.reduce((claim1, claim2) => {
      return new Date(claim1.createdAt) < new Date(claim2.createdAt) ? claim1 : claim2
    }, {})

  let herdIdFromEarliestClaim
  if (earliestClaim.data && (earliestClaimCanBePostMH || new Date(earliestClaim.data.dateOfVisit) < MULTIPLE_HERDS_RELEASE_DATE)) {
    herdIdFromEarliestClaim = earliestClaim.data?.herdId || undefined
  }

  return prevLivestockClaims.filter(claim => claim.data.herdId === herdIdFromEarliestClaim)
}
