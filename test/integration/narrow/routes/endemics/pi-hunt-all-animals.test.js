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
const url = '/claim/endemics/pi-hunt-all-animals'

describe('PI Hunt recommended tests', () => {
  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    raiseInvalidDataEvent.mockImplementation(async () => { })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', reviewTestResults: 'positive', backLink: '/claim/endemics/pi-hunt', expectedQuestion: 'Was the PI hunt done on all beef cattle in the herd?' },
      { typeOfLivestock: 'dairy', reviewTestResults: 'negative', backLink: '/claim/endemics/pi-hunt-recommended', expectedQuestion: 'Was the PI hunt done on all dairy cattle in the herd?' }
    ])('returns 200', async ({ typeOfLivestock, reviewTestResults, backLink, expectedQuestion }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, reviewTestResults } })

      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-heading-l').text().trim()).toEqual(expectedQuestion)
      expect($('.govuk-radios__item').length).toEqual(2)
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
        payload: { crumb, piHuntAllAnimals: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no and show correct content with negative review test result', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'negative' } })
      const options = {
        method: 'POST',
        payload: { crumb, piHuntAllAnimals: 'no' },
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
    test('Continue to ineligible page if user select no and show correct content with positive review test result', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        payload: { crumb, piHuntAllAnimals: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getAmount.mockResolvedValue(215)
      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHuntAllAnimals: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text().trim()).toEqual('Was the PI hunt done on all beef cattle in the herd?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select if the PI hunt was done on all beef cattle in the herd')
    })
  })
})
