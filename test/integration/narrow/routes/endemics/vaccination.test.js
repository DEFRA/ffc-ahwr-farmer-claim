const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
jest.mock('../../../../../app/session')

describe('Vaccination test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vaccination'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'pigs' } })
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
    test('Returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text()).toEqual('Herd Vaccination Status - Get funding to improve animal health and welfare')
      expect($('h1').text()).toMatch('What is the herd porcine reproductive and respiratory syndrome (PRRS) vaccination status?')
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

    test.each([
      { typeOfLivestock: 'pigs', vetVisitsReviewTestResults: false, backLink: '/claim/endemics/test-results' },
      { typeOfLivestock: 'pigs', vetVisitsReviewTestResults: true, backLink: '/claim/endemics/vet-rcvs' }
    ])('backLink when species is pigs and application from old world is $vetVisitsReviewTestResults', async ({ typeOfLivestock, vetVisitsReviewTestResults, backLink }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, vetVisitsReviewTestResults } })
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
        payload: { crumb, herdVaccinationStatus: 'vaccinated' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { herdVaccinationStatus: undefined, errorMessage: 'Select a vaccination status' },
      { herdVaccinationStatus: null, errorMessage: 'Select a vaccination status' },
      { herdVaccinationStatus: 'impossible', errorMessage: 'Select a vaccination status' }
    ])('returns 400 when payload is invalid - %p', async ({ herdVaccinationStatus, errorMessage }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, herdVaccinationStatus },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What is the herd porcine reproductive and respiratory syndrome (PRRS) vaccination status?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#herdVaccinationStatus-error').text()).toMatch(errorMessage)
    })

    test.each([
      { herdVaccinationStatus: 'vaccinated' },
      { herdVaccinationStatus: 'notVaccinated' }
    ])('returns 200 when payload is valid and stores in session (herdVaccinationStatus= $herdVaccinationStatus)', async ({ herdVaccinationStatus }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, herdVaccinationStatus },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
  })
})
