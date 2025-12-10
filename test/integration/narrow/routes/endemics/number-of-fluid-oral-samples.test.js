import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('Number of fluid oral samples test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-fluid-oral-samples'

  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaim.mockImplementation(() => { })
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8', dateOfVisit: '2026-01-21' } })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    it('should return 200 and have back link to endemicsTestUrn when visit before Pigs&Payments golive', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many oral fluid samples were tested?')
      expect($('title').text()).toContain('How many oral fluid samples were tested? - Get funding to improve animal health and welfare')
      expect($('#back').attr('href')).toBe('/claim/endemics/test-urn')
      expectPhaseBanner.ok($)
    })

    it('should return 200 and have back link to endemicsTypeOfSamplesTaken when visit on/after Pigs&Payments golive', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8', dateOfVisit: '2026-01-22' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many oral fluid samples were tested?')
      expect($('title').text()).toContain('How many oral fluid samples were tested? - Get funding to improve animal health and welfare')
      expect($('#back').attr('href')).toBe('/claim/endemics/type-of-samples-taken')
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
        payload: { crumb, numberOfOralFluidSamples: '123' },
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
        payload: { crumb, numberOfOralFluidSamples: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many oral fluid samples were tested?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the number of oral fluid samples')
      expect($('#numberOfOralFluidSamples-error').text()).toMatch('Enter the number of oral fluid samples')
    })

    test('shows error page when number of tests is < 5', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfOralFluidSamples: '1' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('redirects to next page when number of tests is >= 5', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfOralFluidSamples: '5' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/test-results')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
  })
})
