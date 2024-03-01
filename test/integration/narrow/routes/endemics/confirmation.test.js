const cheerio = require('cheerio')
const { getEndemicsClaim } = require('../../../../../app/session')
const { endemicsConfirmation } = require('../../../../../app/config/routes')
jest.mock('../../../../../app/session')

describe('Claim confirmation', () => {
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
    return {
      ...originalModule,
      authConfig: {
        defraId: {
          hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'b2c_1a_signupsigninsfi',
          redirectUri: 'http://localhost:3000/apply/signin-oidc',
          clientId: 'dummy_client_id',
          serviceId: 'dummy_service_id',
          scope: 'openid dummy_client_id offline_access'
        },
        ruralPaymentsAgency: {
          hostname: 'dummy-host-name',
          getPersonSummaryUrl: 'dummy-get-person-summary-url',
          getOrganisationPermissionsUrl:
            'dummy-get-organisation-permissions-url',
          getOrganisationUrl: 'dummy-get-organisation-url'
        }
      },
      endemics: {
        enabled: true
      }
    }
  })
  const reference = 'TBD-F021-723B'
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = `/claim/${endemicsConfirmation}`

  test('GET endemicsConfirmation route', async () => {
    const options = {
      method: 'GET',
      url,
      auth
    }

    getEndemicsClaim.mockImplementation(() => {
      return {
        reference
      }
    })
    const res = await global.__SERVER__.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#reference').text().trim()).toEqual(reference)
  })
})
