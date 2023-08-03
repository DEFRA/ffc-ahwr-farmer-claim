const amounts = require('../constants/amounts')
const { getClaimType } = require('./get-claim-type')

function getClaimAmount (claimData) {
  return amounts[getClaimType(claimData)]
}

module.exports = {
  getClaimAmount
}
