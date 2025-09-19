import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-visits-review-test-results'
  let server

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', reference: 'TEMP-6GSE-PIR8' } })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('legend').text()).toMatch('What was the test result of your last animal health and welfare review?')
      expect($('title').text()).toContain('Vet Visits Review Test Results - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test('backLink test', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestocl: 'beef', reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/vet-rcvs')
      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
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
        payload: { crumb, testResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test.each([
      { typeOfLivestock: 'beef', nextPageURL: '/claim/endemics/date-of-visit' },
      { typeOfLivestock: 'pigs', nextPageURL: '/claim/endemics/vaccination' }
    ])('Redirect $nextPageURL When species $typeOfLivestock', async ({ typeOfLivestock, nextPageURL }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetVisitsReviewTestResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageURL))
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetVisitsReviewTestResults: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('legend').text()).toMatch('What was the review test result?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select a test result')
      expect($('#vetVisitsReviewTestResults-error').text()).toMatch('Select a test result')
    })
  })
})
