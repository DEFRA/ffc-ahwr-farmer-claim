const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('You cannot continue with your claim at this time')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/animals-tested')
}

describe('Number of animals ineligible test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/number-of-animals-ineligible'

  beforeAll(() => {
    jest.mock('../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../app/config')
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
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: false
        }
      }
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 302 and redirects to defra id when not logged in', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test('returns 200 when logged in', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
    })
  })
})
