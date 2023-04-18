const { getPersonSummary, getPersonName } = require('./person')
const { organisationIsEligible, getOrganisationAddress } = require('./organisation')

module.exports = {
  getPersonSummary,
  getPersonName,
  organisationIsEligible,
  getOrganisationAddress
}
