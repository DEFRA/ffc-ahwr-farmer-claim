jest.mock('../../app/config', () => ({
  ...jest.requireActual('../../app/config')
}))
const { endemics, optionalPIHunt, authConfig } = require('../../app/config')

const defraId = {
  hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
  oAuthAuthorisePath: '/oauth2/v2.0/authorize',
  policy: 'b2c_1a_signupsigninsfi',
  redirectUri: 'http://localhost:3000/apply/signin-oidc',
  clientId: 'dummy_client_id',
  serviceId: 'dummy_service_id',
  scope: 'openid dummy_client_id offline_access'
}
const ruralPaymentsAgency = {
  hostname: 'dummy-host-name',
  getPersonSummaryUrl: 'dummy-get-person-summary-url',
  getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
  getOrganisationUrl: 'dummy-get-organisation-url'
}

const setEndemicsAndOptionalPIHunt = ({ endemicsEnabled, optionalPIHuntEnabled }) => {
  endemics.enabled = endemicsEnabled
  optionalPIHunt.enabled = optionalPIHuntEnabled
  authConfig.defraId = defraId
  authConfig.ruralPaymentsAgency = ruralPaymentsAgency
}

module.exports = {
  setEndemicsAndOptionalPIHunt
}
