import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('pigs elisa result test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/pigs-elisa-result'

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
      expect($('h1').text()).toMatch('What was the result of the ELISA test?')
      expect($('title').text()).toContain('What was the result of the ELISA test? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')

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
      jest.resetAllMocks()
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, elisaResult: 'positive' },
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
        payload: { crumb, elisaResult: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What was the result of the ELISA test?')
      expect($('#elisaResult-error').text()).toMatch('Select the result of the test')
    })

    test('sets negative result into session and redirects to pigs biosecurity page', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, elisaResult: 'negative' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/biosecurity')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(2)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.anything(), 'pigsElisaTestResult', 'negative')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.anything(), 'pigsGeneticSequencing', undefined, { shouldEmitEvent: false })
    })

    test('sets positive result into session and redirects to pigs biosecurity page', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, elisaResult: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual('/claim/endemics/biosecurity')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(2)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.anything(), 'pigsElisaTestResult', 'positive')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.anything(), 'pigsGeneticSequencing', undefined, { shouldEmitEvent: false })
    })
  })
})
