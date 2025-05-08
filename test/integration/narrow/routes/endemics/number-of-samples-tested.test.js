import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('Number of samples tested test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-samples-tested'

  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => {})
    setEndemicsClaim.mockImplementation(() => {})
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('title').text()).toContain('How many samples were tested - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
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
        payload: { crumb, numberOfSamplesTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the number of samples tested')
      expect($('#numberOfSamplesTested-error').text()).toMatch('Enter the number of samples tested')
    })

    test.each([
      { numberOfSamplesTested: '6', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '30', lastReviewTestResults: 'negative' }
    ])('redirects to next page if $numberOfSamplesTested and $lastReviewTestResults', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
      getEndemicsClaim.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/disease-status')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test.each([
      { numberOfSamplesTested: '5', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '7', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '29', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '31', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'negative' }
    ])('redirects to exception page if $numberOfSamplesTested and $lastReviewTestResults dont match validation', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
      getEndemicsClaim.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})
