const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('Species numbers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/pi-hunt'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    raiseInvalidDataEvent.mockImplementation(() => { })
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
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('title').text().trim()).toContain('Number - Get funding to improve animal health and welfare')
      expect($('.govuk-radios__item').length).toEqual(2)
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
    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHunt: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select if the vet did a PI hunt')
    })
  })
})
