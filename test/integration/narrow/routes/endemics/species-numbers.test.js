const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim

jest.mock('../../../../../app/session')
describe('Species numbers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/species-numbers'

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
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual('Did you have 11 or more cattle  on the date of the review?')
      expect($('title').text().trim()).toEqual('Number - Annual health and welfare review of livestock')
      expect($('.govuk-radios__item').length).toEqual(2)
      expectPhaseBanner.ok($)
    })

    test('returns 404 when there is no claim', async () => {
      getEndemicsClaimMock.mockReturnValue(undefined)
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(404)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
      expect($('#_404 div p').text()).toEqual('Not Found')
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
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/eligible' },
      { typeOfLivestock: 'dairy', nextPageUrl: '/claim/endemics/vet-name' },
      { typeOfLivestock: 'sheep', nextPageUrl: '/claim/endemics/eligible' },
      { typeOfLivestock: 'pigs', nextPageUrl: '/claim/endemics/eligible' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock', async ({ nextPageUrl, typeOfLivestock }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: 'yes' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageUrl))
    })

    test('shows error when payload is invalid', async () => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Did you have 11 or more cattle  on the date of the review?')
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch('Select a response')
    })
    test('redirect the user to 404 page in fail action and no claim object', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaimMock.mockReturnValue(undefined)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(404)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('404 - Not Found')
    })
  })
})
