const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/test-results'

  beforeAll(() => {
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
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: true
        }
      }
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the test result?')
      expect($('title').text()).toEqual('Test Results - Annual health and welfare review of livestock')

      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

})
    describe(`POST ${url} route`, () => {
        let crumb

        beforeEach(async () => {
        crumb = await getCrumbs(global.__SERVER__)
        })

        test('when not logged in redirects to defra id', async () => {
            const options = {
                method: 'POST',
                url,
                payload: { crumb, testResults: 'positive' },
                headers: { cookie: `crumb=${crumb}` }
            }

            const res = await global.__SERVER__.inject(options)

            expect(res.statusCode).toBe(302)
            expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
        })

        test('redirects to check answers page when payload is valid', async () => {
            const options = {
                method: 'POST',
                url,
                auth,
                payload: { crumb, testResults: 'positive' },
                headers: { cookie: `crumb=${crumb}` }
            }

            const res = await global.__SERVER__.inject(options)

            expect(res.statusCode).toBe(302)
            expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/check-answers'))
        })

        test('shows error when payload is invalid', async () => {
            const options = {
                method: 'POST',
                url,
                auth,
                payload: { crumb, testResults: undefined },
                headers: { cookie: `crumb=${crumb}` }
            }

            const res = await global.__SERVER__.inject(options)

            expect(res.statusCode).toBe(400)
            expect(res.headers.location.toString()).toEqual(expect.stringContaining(url))
        })
    })
})
