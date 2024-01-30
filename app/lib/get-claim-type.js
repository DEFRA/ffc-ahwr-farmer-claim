function getClaimType (claimData, isEndemicsClaims = false) {
  const { whichReview, typeOfLivestock } = claimData
  if (!isEndemicsClaims) {
    if (whichReview) {
      return whichReview
    }
    throw new Error('No claim type found, \'whichReview\' property empty.')
  }
  console.log('££££££££££££££££££', typeOfLivestock, isEndemicsClaims)
  if (typeOfLivestock && isEndemicsClaims) {
    return typeOfLivestock
  }
  throw new Error('No claim type found, \'typeOfLivestock\' property empty.')
}

module.exports = {
  getClaimType
}
