const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const { claimType } = require('../../../../../app/constants/claim')
const { getSpeciesEligibleNumberForDisplay } = require('../../../../../app/lib/display-helpers')
const { getReviewType } = require('../../../../../app/lib/get-review-type')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('Species numbers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/species-numbers'
  beforeAll(() => {
    raiseInvalidDataEvent.mockImplementation(() => { })
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
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', reviewTestResults: 'negative' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', reviewTestResults: 'positive' }
    ])('returns 200', async ({ typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reviewTestResults } })
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual(`Did you have 11 or more ${typeOfLivestock} cattle  on the date of the ${typeOfReview === claimType.review ? 'review' : 'follow-up'}?`)
      expect($('title').text().trim()).toEqual('Number - Get funding to improve animal health and welfare')
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
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'dairy', nextPageUrl: '/claim/endemics/vet-name' },
      { typeOfLivestock: 'sheep', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'pigs', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/vet-name', typeOfReview: 'E', reviewTestResults: 'negative' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock', async ({ nextPageUrl, typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, reviewTestResults } })
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
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, speciesNumbers: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/number-of-species-tested')
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, speciesNumbers: 'no' },
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
      const { isReview } = getReviewType('E')
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
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
      expect($('h1').text().trim()).toMatch(`Did you have ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)} on the date of the ${isReview ? 'review' : 'follow-up'}?`)
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(`Select if you had ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)} on the date of the ${isReview ? 'review' : 'follow-up'}.`)
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
