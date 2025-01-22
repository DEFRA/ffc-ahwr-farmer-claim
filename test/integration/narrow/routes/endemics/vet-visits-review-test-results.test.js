const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-visits-review-test-results'
  let server

  beforeAll(async () => {
    setEndemicsClaimMock.mockImplementation(() => { })
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })

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
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toMatch('What was the test result of your last animal health and welfare review?')
      expect($('title').text()).toContain('Vet Visits Review Test Results - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test('backLink test', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestocl: 'beef' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/vet-rcvs')
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
        payload: { crumb, testResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { typeOfLivestock: 'beef', nextPageURL: '/claim/endemics/date-of-visit' },
      { typeOfLivestock: 'pigs', nextPageURL: '/claim/endemics/vaccination' }
    ])('Redirect $nextPageURL When species $typeOfLivestock', async ({ typeOfLivestock, nextPageURL }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetVisitsReviewTestResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageURL))
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetVisitsReviewTestResults: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the review test result?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select a test result')
      expect($('#vetVisitsReviewTestResults-error').text()).toMatch('Select a test result')
    })
  })
})
