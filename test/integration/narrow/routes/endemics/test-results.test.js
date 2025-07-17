import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

jest.mock('../../../../../app/session')

describe('Test Results test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/test-results'
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', reference: 'TEMP-6GSE-PIR8' } })
    setEndemicsClaim.mockImplementation(() => { })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfReview: 'E', question: 'What was the follow-up test result?' },
      { typeOfReview: 'R', question: 'What was the test result?' }
    ])('returns 200', async ({ typeOfReview, question }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfReview, reference: 'TEMP-6GSE-PIR8' } })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(question)
      expect($('title').text()).toContain(
        `${question} - Get funding to improve animal health and welfare`
      )

      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', backLink: '/claim/endemics/number-of-fluid-oral-samples' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', backLink: '/claim/endemics/disease-status' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', backLink: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', backLink: '/claim/endemics/test-urn' }
    ])('backLink when species $typeOfLivestock and type of review is $typeOfReview', async ({ typeOfLivestock, typeOfReview, backLink }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
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
        payload: { crumb, testResults: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', nextPageURL: '/claim/endemics/biosecurity' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', nextPageURL: '/claim/endemics/biosecurity' },
      { typeOfLivestock: 'beef', typeOfReview: 'R', nextPageURL: '/claim/endemics/check-answers' }
    ])('Redirect $nextPageURL When species $typeOfLivestock and type of review is $typeOfReview', async ({ typeOfLivestock, typeOfReview, nextPageURL }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, testResults: 'positive' },
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
        payload: { crumb, testResults: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the test result?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select a test result')
      expect($('#testResults-error').text()).toMatch('Select a test result')
    })
  })
})
