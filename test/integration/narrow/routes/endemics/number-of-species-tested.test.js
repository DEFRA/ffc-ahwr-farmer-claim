import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../../app/lib/context-helper.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')

describe('Number of species tested test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/number-of-species-tested'

  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => {})
    setEndemicsClaim.mockImplementation(() => {})
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })

    server = await createServer()
    await server.initialize()
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
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
      expect($('h1').text()).toMatch('How many animals were samples taken from?')
      expect($('title').text().trim()).toContain('How many animals were samples taken from? - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R' }
    ])('returns 200 for review $typeOfLivestock journey', async ({ typeOfLivestock, typeOfReview }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reference: 'TEMP-6GSE-PIR8' } })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(typeOfLivestock === 'dairy' ? 'How many animals were samples taken from or assessed?' : 'How many animals were samples taken from?')
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
        payload: { crumb, numberAnimalsTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })
    test.each([
      { numberAnimalsTested: '%%%%%%%%%%', error: 'The amount of animals samples were taken from must only include numbers' },
      { numberAnimalsTested: '6697979779779', error: 'The number of animals tested should not exceed 9999' },
      { numberAnimalsTested: '', error: 'Enter the number of animals tested or assessed' }
    ])('show error message when the number of animals tested is not valid', async ({ numberAnimalsTested, error }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many animals were samples taken from or assessed?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(error)
      expect($('#numberAnimalsTested-error').text()).toMatch(error)
    })
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', numberAnimalsTested: '5' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', numberAnimalsTested: '30' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', numberAnimalsTested: '10' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', numberAnimalsTested: '5' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', numberAnimalsTested: '11' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', numberAnimalsTested: '30' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', numberAnimalsTested: '1' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', numberAnimalsTested: '1' }
    ])('Continue to vet name screen if the number of $typeOfLivestock is eligible', async ({ typeOfLivestock, typeOfReview, numberAnimalsTested }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-name')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', numberAnimalsTested: '4' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', numberAnimalsTested: '20' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', numberAnimalsTested: '8' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', numberAnimalsTested: '3' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', numberAnimalsTested: '18' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', numberAnimalsTested: '9' }
    ])('shows error page when number of $typeOfLivestock to be tested is not eligible', async ({ typeOfLivestock, typeOfReview, numberAnimalsTested }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview } })
        .mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      const title = typeOfLivestock === 'sheep' ? 'There could be a problem with your claim' : 'You cannot continue with your claim'

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(title)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error page when number of animals tested is 0 ', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'sheep', typeOfReview: 'E' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested: '0' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many sheep were samples taken from or assessed?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('The number of animals tested cannot be 0')
      expect($('#numberAnimalsTested-error').text()).toMatch('The number of animals tested cannot be 0')
    })

    test('error page shows 2 bullet points when PI Hunt env variable is true', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', typeOfReview: 'R' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested: '1' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('#main-content > div > div > ul').children().length).toBe(2)
    })

    test('error page shows 3 bullet points when PI Hunt env variable is false', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', typeOfReview: 'R' } })
      isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return false })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberAnimalsTested: '1' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('#main-content > div > div > ul').children().length).toBe(3)
    })
  })
})
