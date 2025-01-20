const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const createServer = require('../../../../../app/server')
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('Number of samples tested test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-samples-tested'

  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => {})
    setEndemicsClaimMock.mockImplementation(() => {})
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'pigs' } })

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

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('title').text()).toContain('How many samples were tested - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, numberOfSamplesTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the number of samples tested')
      expect($('#numberOfSamplesTested-error').text()).toMatch('Enter the number of samples tested')
    })

    test.each([
      { numberOfSamplesTested: '6', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '30', lastReviewTestResults: 'negative' }
    ])('redirects to next page if $numberOfSamplesTested and $lastReviewTestResults', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/disease-status')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test.each([
      { numberOfSamplesTested: '5', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '7', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '29', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '31', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'negative' }
    ])('redirects to exception page if $numberOfSamplesTested and $lastReviewTestResults dont match validation', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})
