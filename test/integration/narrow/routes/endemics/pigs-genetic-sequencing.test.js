import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('pigs genetic sequencing test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/pigs-genetic-sequencing'

  let server

  beforeAll(async () => {
    config.pigUpdates = { enabled: true }
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
      expect($('h1').text()).toMatch(' What was the result of the genetic sequencing?')
      expect($('title').text()).toContain('What was the result of the genetic sequencing? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')

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

    afterEach(async () => {
      jest.resetAllMocks()
    })

    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, geneticSequencing: 'recomb' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test('shows error when payload is invalid', async () => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, geneticSequencing: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the result of the genetic sequencing?')
      expect($('#geneticSequencing-error').text()).toMatch('Select the result of the genetic sequencing')
    })

    test.each([
      { geneticSequencingValue: 'prrs1' },
      { geneticSequencingValue: 'prrs2' },
      { geneticSequencingValue: 'prrs1Plus' },
      { geneticSequencingValue: 'recomb' },
      { geneticSequencingValue: 'mlv' }
    ])('sets $geneticSequencingValue result into session and redirects to pigs biosecurity page', async ({ geneticSequencingValue }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, geneticSequencing: geneticSequencingValue },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/biosecurity')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.anything(), 'pigsGeneticSequencing', geneticSequencingValue)
    })
  })
})
