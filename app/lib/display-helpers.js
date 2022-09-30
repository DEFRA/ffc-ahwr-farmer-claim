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
    beef: 'More than 10 beef cattle ',
    dairy: 'More than 10 dairy cattle',
    pigs: 'More than 50 pigs ',
    sheep: 'More than 20 sheep '
  }[getClaimType(claimData)]
}

function getTypeOfReviewRowForDisplay (claimData) {
  return { key: { text: 'Type of review' }, value: { text: getTypeOfReviewForDisplay(claimData) } }
}

function getEligibleNumberRowForDisplay (claimData) {
  return { key: { text: getSpeciesEligbileNumberForDisplay(claimData) }, value: { text: claimData.eligibleSpecies } }
}

function upperFirstLetter (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  getTypeOfReviewRowForDisplay,
  getEligibleNumberRowForDisplay,
  upperFirstLetter
}
