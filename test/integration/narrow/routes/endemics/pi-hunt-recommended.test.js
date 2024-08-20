const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const { setEndemicsAndOptionalPIHunt } = require('../../../../mocks/config')
const { getAmount } = require('../../../../../app/api-requests/claim-service-api')

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/api-requests/claim-service-api')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/pi-hunt-recommended'

describe('PI Hunt recommended tests', () => {
  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { } })
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaimMock.mockImplementation(() => { })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
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
      expect($('.govuk-heading-l').text().trim()).toEqual('Was the PI hunt recommended by the vet?')
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
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHuntRecommended: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/pi-hunt-all-animals')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHuntRecommended: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getAmount.mockResolvedValue(215)
      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('There could be a problem with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHuntRecommended: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text().trim()).toEqual('Was the PI hunt recommended by the vet?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select yes or no')
    })
  })
})
