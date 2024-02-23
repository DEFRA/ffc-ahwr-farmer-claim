const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const { rcvs: rcvsErrorMessages } = require('../../../../../app/lib/error-messages')
jest.mock('../../../../../app/session')

describe('Vet name test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-rcvs'

  beforeAll(() => {
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
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
      expect($('title').text().trim()).toEqual('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number? - Annual health and welfare review of livestock')
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
        payload: { crumb, vetRCVSNumber: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { vetRCVSNumber: undefined, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { vetRCVSNumber: null, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { vetRCVSNumber: '', errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { vetRCVSNumber: 'not-valid-ref', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: 'not-valid-ref' },
      { vetRCVSNumber: '123456A', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '123456A' },
      { vetRCVSNumber: '12345678', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '12345678' }
    ])('returns 400 when payload is invalid - %p', async ({ vetRCVSNumber, errorMessage, expectedVal }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#vetRCVSNumber').val()).toEqual(expectedVal)
    })

    test.each([
      { vetRCVSNumber: '1234567' },
      { vetRCVSNumber: '123456X' },
      { vetRCVSNumber: '  123456X  ' }
    ])('returns 200 when payload is valid and stores in session (vetRCVSNumber= $vetRCVSNumber)', async ({ vetRCVSNumber }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
    })
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: true, nextPageURL: '/claim/endemics/test-results' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: true, nextPageURL: '/claim/endemics/test-results' },
      { typeOfLivestock: 'beef', typeOfReview: 'R', latestVetVisitApplication: true, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', latestVetVisitApplication: false, nextPageURL: '/claim/endemics/endemics-package' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: false, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: false, nextPageURL: '/claim/endemics/herd-vaccination-status' }
    ])('Redirect $nextPageURL When species $typeOfLivestock and type of review is $typeOfReview and aplication from old world is $latestVetVisitApplication ', async ({ typeOfLivestock, typeOfReview, latestVetVisitApplication, nextPageURL }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview, latestVetVisitApplication } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber: '1234567' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(nextPageURL)
    })
  })
})
