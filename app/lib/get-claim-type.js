export function getClaimType (claimData, isEndemicsClaims = false) {
  if (!isEndemicsClaims) {
    const { whichReview } = claimData
    if (whichReview) {
      return whichReview
    }
    throw new Error('No claim type found, \'whichReview\' property empty.')
  }
  const { typeOfLivestock } = claimData
  if (typeOfLivestock && isEndemicsClaims) {
    return typeOfLivestock
  }
  throw new Error('No claim type found, \'typeOfLivestock\' property empty.')
}
