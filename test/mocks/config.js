import { config } from '../../app/config/index.js'
import { authConfig } from '../../app/config/auth.js'

jest.mock('../../app/config', () => ({
  ...jest.requireActual('../../app/config')
}))
const {
  endemics, optionalPIHunt,
  multiSpecies
} = config

const defraId = {
  hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
  oAuthAuthorisePath: '/oauth2/v2.0/authorize',
  policy: 'b2c_1a_signupsigninsfi',
  dashboardRedirectUri: 'http://localhost:3003/signin-oidc',
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

export const setEndemicsAndOptionalPIHunt = ({ endemicsEnabled, optionalPIHuntEnabled }) => {
  endemics.enabled = endemicsEnabled
  optionalPIHunt.enabled = optionalPIHuntEnabled
  authConfig.defraId = defraId
  authConfig.ruralPaymentsAgency = ruralPaymentsAgency
}
export const setMultiSpecies = (enabled) => {
  multiSpecies.enabled = enabled
}
