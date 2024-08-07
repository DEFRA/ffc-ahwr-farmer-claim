const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/test-results'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    setEndemicsClaimMock.mockImplementation(() => { })

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
    test.each([
      { typeOfReview: 'E', question: 'What was the follow-up test result' },
      { typeOfReview: 'R', question: 'What was the test result?' }
    ])('returns 200', async ({ typeOfReview, question }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfReview } })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(question)
      expect($('title').text()).toContain(
        'Test Results - Get funding to improve animal health and welfare'
      )

      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', backLink: '/claim/endemics/number-of-fluid-oral-samples' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', backLink: '/claim/endemics/disease-status' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', backLink: '/claim/endemics/test-urn' }
    ])('backLink when species $typeOfLivestock and type of review is $typeOfReview', async ({ typeOfLivestock, typeOfReview, backLink }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain(backLink)
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

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', nextPageURL: '/claim/endemics/biosecurity' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', nextPageURL: '/claim/endemics/biosecurity' },
      { typeOfLivestock: 'beef', typeOfReview: 'R', nextPageURL: '/claim/endemics/check-answers' }
    ])('Redirect $nextPageURL When species $typeOfLivestock and type of review is $typeOfReview', async ({ typeOfLivestock, typeOfReview, nextPageURL }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, testResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageURL))
      expect(setEndemicsClaimMock).toHaveBeenCalled()
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
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the test result?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select a test result')
      expect($('#testResults-error').text()).toMatch('Select a test result')
    })
  })
})
