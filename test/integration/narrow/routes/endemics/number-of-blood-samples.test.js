import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config/index.js'
import { thresholds } from '../../../../../app/constants/amounts.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

const { requiredNumberBloodSamples } = thresholds

describe('Number of blood samples test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-blood-samples'

  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaim.mockImplementation(() => { })
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
      expect($('h1').text()).toMatch('How many blood samples were tested?')
      expect($('title').text()).toContain('How many blood samples were tested? - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to /sign-in', async () => {
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

    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, numberOfBloodSamples: 30 },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many blood samples were tested?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the number of blood samples')
      expect($('#numberOfBloodSamples-error').text()).toMatch('Enter the number of blood samples')
    })

    test(`shows error page when number of blood samples is not exactly ${requiredNumberBloodSamples}`, async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfBloodSamples: 31 },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('redirects to next page when valid request', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfBloodSamples: 30 },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/test-results')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
  })
})
