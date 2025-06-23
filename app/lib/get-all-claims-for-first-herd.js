
export const getAllClaimsForFirstHerd = (previousClaims, typeOfLivestock) => {
  const prevLivestockClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const herdIdFromEarliestClaim = previousClaims
    ?.reduce((claim1, claim2) => {
      return new Date(claim1.createdAt) < new Date(claim2.createdAt) ? claim1 : claim2
    }, {})?.data?.herdId || undefined

  return prevLivestockClaims.filter(claim => claim.data.herdId === herdIdFromEarliestClaim)
}
