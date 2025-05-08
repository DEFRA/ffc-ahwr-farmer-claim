import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { setOptionalPIHunt } from '../../../../mocks/config.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { getAmount } from '../../../../../app/api-requests/claim-service-api.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/api-requests/claim-service-api')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/pi-hunt-all-animals'

describe('PI Hunt recommended tests', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    raiseInvalidDataEvent.mockImplementation(async () => { })
    setOptionalPIHunt({ optionalPIHuntEnabled: true })
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', reviewTestResults: 'positive', backLink: '/claim/endemics/pi-hunt', expectedQuestion: 'Was the PI hunt done on all beef cattle in the herd?' },
      { typeOfLivestock: 'dairy', reviewTestResults: 'negative', backLink: '/claim/endemics/pi-hunt-recommended', expectedQuestion: 'Was the PI hunt done on all dairy cattle in the herd?' }
    ])('returns 200', async ({ typeOfLivestock, reviewTestResults, backLink, expectedQuestion }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock, reviewTestResults } })
        .mockImplementationOnce(() => { return { reference: 'TEMP-6GSE-PIR8' } })
        .mockImplementationOnce(() => { return { typeOfLivestock, reviewTestResults } })

      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
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

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

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

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('Continue to ineligible page if user select no and show correct content with negative review test result', async () => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'negative' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'negative' } })
      const options = {
        method: 'POST',
        payload: { crumb, piHuntAllAnimals: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getAmount.mockResolvedValue(215)
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('There could be a problem with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('Continue to ineligible page if user select no and show correct content with positive review test result', async () => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        payload: { crumb, piHuntAllAnimals: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getAmount.mockResolvedValue(215)
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('shows error when payload is invalid', async () => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHuntAllAnimals: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text().trim()).toEqual('Was the PI hunt done on all beef cattle in the herd?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select if the PI hunt was done on all beef cattle in the herd')
    })
  })
})
