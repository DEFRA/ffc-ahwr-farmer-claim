const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim

jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/sheep-tests'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => {
      return { typeOfLivestock: 'sheep' }
    })

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
      getEndemicsClaimMock.mockImplementation(() => {
        return { sheepEndemicsPackage: 'reducedExternalParasites' }
      })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toMatch('What did the vet test or sample for?')
      expect($('title').text()).toMatch('Sheep Tests - Get funding to improve animal health and welfare')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/sheep-endemics-package')

      expectPhaseBanner.ok($)
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('returns 400 when user didnt select any test', async () => {
      getEndemicsClaimMock.mockImplementation(() => {
        return { sheepEndemicsPackage: 'reducedExternalParasites' }
      })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('What did the vet test or sample for?')
      expect($('title').text()).toMatch('Sheep Tests - Get funding to improve animal health and welfare')
      expect($('a').text()).toMatch('You must select a disease')

      expectPhaseBanner.ok($)
    })

    test('returns 200  when user select multiple tests', async () => {
      getEndemicsClaimMock.mockImplementation(() => {
        return { sheepEndemicsPackage: 'reducedExternalParasites', sheepTestResults: [{ diseaseType: 'sheepScab', result: 'positive' }] }
      })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, sheepTests: ['flystrike', 'sheepScab', 'other'] },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/sheep-test-results')
    })

    test('returns 200  when user select one test', async () => {
      getEndemicsClaimMock.mockImplementation(() => {
        return { sheepEndemicsPackage: 'reducedExternalParasites' }
      })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, sheepTests: 'other' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/sheep-test-results')
    })
  })
})
