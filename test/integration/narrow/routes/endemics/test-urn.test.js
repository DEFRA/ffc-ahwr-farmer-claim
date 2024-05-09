const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
jest.mock('../../../../../app/session')

describe('Test URN test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/test-urn'

  beforeAll(() => {
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
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) or certificate number of the test results?' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) or certificate number of the test results?' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', title: 'What’s the laboratory unique reference number (URN) for the test results?' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) for the test results?' }
    ])('Return 200 with Title $title when type of species is $typeOfLivestock and type of review is $typeOfReview', async ({ title, typeOfLivestock, typeOfReview }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(title)
      expect($('title').text()).toEqual('Laboratory URN - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/vaccination' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vaccination' }
    ])('backLink when species $typeOfLivestock and type of review is $typeOfReview and application from old world is $latestVetVisitApplication ', async ({ typeOfLivestock, typeOfReview, latestVetVisitApplication, backLink }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview, latestVetVisitApplication } })
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
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', nextPageUrl: '/claim/endemics/test-results' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', nextPageUrl: '/claim/endemics/test-results' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', nextPageUrl: '/claim/endemics/check-answers' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', nextPageUrl: '/claim/endemics/number-of-fluid-oral-samples' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', nextPageUrl: '/claim/endemics/number-of-samples-tested' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock and $typeOfReview', async ({ nextPageUrl, typeOfLivestock, typeOfReview }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageUrl))
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, laboratoryURN: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What’s the laboratory unique reference number (URN) for the test results?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch('Enter the URN')
      expect($('#laboratoryURN-error').text()).toMatch('Enter the URN')
    })
  })
})
