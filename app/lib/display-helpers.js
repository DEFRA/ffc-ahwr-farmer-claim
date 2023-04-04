const { getClaimType } = require('./get-claim-type')

function getTypeOfReviewForDisplay (claimData) {
  return {
    beef: 'Beef cattle',
    dairy: 'Dairy cattle',
    pigs: 'Pigs',
    sheep: 'Sheep'
  }[getClaimType(claimData)]
}

function getSpeciesEligbileNumberForDisplay (claimData) {
  return {
    beef: '11 beef cattle or more ',
    dairy: '11 dairy cattle or more ',
    pigs: '51 pigs or more ',
    sheep: '21 sheep or more'
  }[getClaimType(claimData)]
}

function getTypeOfReviewRowForDisplay (claimData) {
  return { key: { text: 'Type of review' }, value: { text: getTypeOfReviewForDisplay(claimData) } }
}

function getEligibleNumberRowForDisplay (claimData) {
  return { key: { text: getSpeciesEligbileNumberForDisplay(claimData) }, value: { text: `${claimData.eligibleSpecies}, I have ${getSpeciesEligbileNumberForDisplay(claimData)}` } }
}

function upperFirstLetter (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  getTypeOfReviewRowForDisplay,
  getEligibleNumberRowForDisplay,
  upperFirstLetter
}
