const { getClaimType } = require('./get-claim-type')

function getTypeOfReviewForDisplay (claimData) {
  return {
    beef: 'Beef cattle',
    dairy: 'Dairy cattle',
    pigs: 'Pigs',
    sheep: 'Sheep'
  }[getClaimType(claimData)]
}

function getSpeciesEligbileNumberForDisplay (claimData, isEndemicsClaims = false) {
  return {
    beef: '11 or more cattle ',
    dairy: '11 or more cattle ',
    pigs: '51 or more pigs',
    sheep: '21 or more sheep'
  }[getClaimType(claimData, isEndemicsClaims)]
}

function getTypeOfReviewRowForDisplay (claimData) {
  return { key: { text: 'Type of review' }, value: { text: getTypeOfReviewForDisplay(claimData) } }
}

function getEligibleNumberRowForDisplay (claimData) {
  return { key: { text: getSpeciesEligbileNumberForDisplay(claimData) }, value: { text: `${claimData.eligibleSpecies}, I had ${getSpeciesEligbileNumberForDisplay(claimData)}` } }
}

function upperFirstLetter (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  getTypeOfReviewRowForDisplay,
  getEligibleNumberRowForDisplay,
  upperFirstLetter,
  getSpeciesEligbileNumberForDisplay,
  getTypeOfReviewForDisplay
}
