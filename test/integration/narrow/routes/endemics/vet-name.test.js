import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { sessionKeys } from '../../../../../app/session/keys.js'
import { errorMessages } from '../../../../../app/lib/error-messages.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

const { endemicsClaim: { vetsName: vetsNameKey } } = sessionKeys
const { name: nameErrorMessages } = errorMessages

jest.mock('../../../../../app/session')

describe('Vet name test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-name'
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs' } })
    setEndemicsClaim.mockImplementation(() => { })

    jest.mock('../../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../../app/config')
      return {
        ...originalModule,
        endemics: {
          enabled: true
        }
      }
    })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([{ reviewTestResults: 'negative' }, { reviewTestResults: 'positive' }])('returns 200', async ({ reviewTestResults }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', typeOfReview: 'E', reviewTestResults, reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What is the vet\'s name?')
      expect($('title').text().trim()).toContain('What is the vet\'s name? - Get funding to improve animal health and welfare')
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
        payload: { crumb, numberAnimalsTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })
    test.each([
      { vetsName: '', error: nameErrorMessages.enterName },
      { vetsName: 'dfdddfdf6697979779779dfdddfdf669797977977955444556655', error: nameErrorMessages.nameLength },
      { vetsName: '****', error: nameErrorMessages.namePattern }
    ])('show error message when the vet name is not valid', async ({ vetsName, error }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetsName },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What is the vet\'s name?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(error)
      expect($('#vetsName-error').text()).toMatch(error)
    })
    test.each([
      { vetsName: 'Adam' },
      { vetsName: '(Sarah)' },
      { vetsName: 'Kevin&&' }
    ])('Continue to vet rvs screen if the vet name is valid', async ({ vetsName }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetsName },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-rcvs')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(res.request, vetsNameKey, vetsName)
    })
  })
})
