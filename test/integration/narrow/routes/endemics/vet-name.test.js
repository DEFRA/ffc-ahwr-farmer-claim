const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const { name: nameErrorMessages } = require('../../../../../app/lib/error-messages')
jest.mock('../../../../../app/session')

describe('Vet name test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-name'

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
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s name?')
      expect($('title').text().trim()).toEqual('What is the vet\'s name? - Annual health and welfare review of livestock')
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
      { vetsName: '', error: nameErrorMessages.enterName },
      { vetsName: 'dfdddfdf6697979779779dfdddfdf669797977977955444556655', error: nameErrorMessages.nameLength },
      { vetsName: '****', error: nameErrorMessages.namePattern }
    ])('show error message when the vet name is not valid', async ({ vetsName, error }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetsName },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s name?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(error)
      expect($('#vetsName-error').text()).toMatch(error)
    })
    test.each([
      { vetsName: 'Adam' },
      { vetsName: '(Sarah)' },
      { vetsName: 'Kevin&&' }
    ])('Continue to vet rvs screen if the vet name is valid', async ({ vetsName }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetsName },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-rcvs')
    })
  })
})
