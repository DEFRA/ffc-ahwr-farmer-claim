function getClaimType (claimData) {
  const { whichReview } = claimData
  if (whichReview) {
    return whichReview
  }
  throw new Error('No claim type found, \'whichReview\' property empty.')
}

module.exports = {
  getClaimType
}
