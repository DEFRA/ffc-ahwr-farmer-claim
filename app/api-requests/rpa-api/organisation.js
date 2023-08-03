const { get } = require('./base')
const config = require('../../config')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const jwtDecode = require('../../auth/token-verify/jwt-decode')
const hostname = config.authConfig.ruralPaymentsAgency.hostname
const getOrganisationPermissionsUrl = config.authConfig.ruralPaymentsAgency.getOrganisationPermissionsUrl
const getOrganisationUrl = config.authConfig.ruralPaymentsAgency.getOrganisationUrl
const validPermissions = ['Submit - bps', 'Full permission - business']
let apimToken

function getOrganisationAddress (address) {
  return [
    address.address1,
    address.address2,
    address.address3,
    address.address4,
    address.address5,
    address.pafOrganisationName,
    address.flatName,
    address.buildingNumberRange,
    address.buildingName,
    address.street,
    address.city,
    address.county,
    address.postalCode,
    address.country
  ].filter(Boolean).join(',')
}

function parsedAccessToken (request) {
  const accessToken = session.getToken(request, tokens.accessToken)
  return jwtDecode(accessToken)
}

const getOrganisationAuthorisation = async (request, organisationId) => {
  const response = await get(hostname, getOrganisationPermissionsUrl.replace('organisationId', organisationId), request, { Authorization: apimToken })
  return response?.data
}

const permissionMatcher = (permissions, permissionToMatch) => {
  return permissions.every(value => permissionToMatch.includes(value))
}

const organisationHasPermission = async (request, permissions, personId, organisationId) => {
  const organisationAuthorisation = await getOrganisationAuthorisation(request, organisationId)
  const personPrivileges = organisationAuthorisation.personPrivileges.filter(privilege => privilege.personId === personId)
  const hasPermission = personPrivileges.some(privilege => permissionMatcher(privilege.privilegeNames, permissions))
  return hasPermission
}

const getOrganisation = async (request, organisationId) => {
  const response = await get(hostname, getOrganisationUrl.replace('organisationId', organisationId), request, { Authorization: apimToken })
  return response?._data
}

const organisationIsEligible = async (request, personId, apimAccessToken) => {
  apimToken = apimAccessToken
  const organisationId = parsedAccessToken(request).currentRelationshipId
  const organisationPermission = await organisationHasPermission(request, validPermissions, personId, organisationId)
  const organisation = await getOrganisation(request, organisationId)

  return {
    organisationPermission,
    organisation
  }
}

module.exports = {
  organisationIsEligible,
  getOrganisationAddress
}
