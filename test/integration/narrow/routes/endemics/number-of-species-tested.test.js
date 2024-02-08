const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
jest.mock('../../../../../app/session')

describe('Eligibility test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-species-tested'

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
      expect($('h1').text()).toMatch('How many animals did the vet test?')
      expect($('title').text().trim()).toEqual('How many animals did the vet test? - Annual health and welfare review of livestock')
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
        payload: { crumb, numberAnimalsTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
    test.each([
      { numberAnimalsTested: '%%%%%%%%%%', error: 'Number of animals tested must only include numbers' },
      { numberAnimalsTested: '6697979779779', error: 'The number of animals tested should not exceed 9999' },
      { numberAnimalsTested: '', error: 'Enter the number of animals tested' }
    ])('show error message when the number of animals tested is not valid', async ({ numberAnimalsTested, error }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many animals did the vet test?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(error)
      expect($('#numberAnimalsTested-error').text()).toMatch(error)
    })
    test.each([
      { typeOfLivestock: 'beef', numberAnimalsTested: '5' },
      { typeOfLivestock: 'pigs', numberAnimalsTested: '30' },
      { typeOfLivestock: 'sheep', numberAnimalsTested: '10' }
    ])('Continue to vet name screen if the number of animals is  eligible', async ({ typeOfLivestock, numberAnimalsTested }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-name')
    })
    test.each([
      { typeOfLivestock: 'beef', numberAnimalsTested: '4' },
      { typeOfLivestock: 'pigs', numberAnimalsTested: '6' },
      { typeOfLivestock: 'sheep', numberAnimalsTested: '9' }
    ])('shows error page when number of animals to be tested is not eligible', async ({ typeOfLivestock, numberAnimalsTested }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
    })
  })
})
