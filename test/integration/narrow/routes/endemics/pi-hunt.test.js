import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../../app/lib/context-helper.js'
import { clearPiHuntSessionOnChange } from '../../../../../app/lib/clear-pi-hunt-session-on-change.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')
jest.mock('../../../../../app/lib/clear-pi-hunt-session-on-change')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/pi-hunt'

describe('PI Hunt tests when Optional PI Hunt is OFF', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', reference: 'TEMP-6GSE-PIR8' } })
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaim.mockImplementation(() => { })
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return false })
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('title').text().trim()).toContain('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-radios__item').length).toEqual(2)
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
      jest.resetAllMocks()
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })
    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no and clear PI Hunt data when relevantReviewForEndemics=R', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef', relevantReviewForEndemics: { type: 'R' } } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef', relevantReviewForEndemics: { type: 'R' } } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
      expect(clearPiHuntSessionOnChange).toHaveBeenCalled()
    })

    test('Continue to ineligible page if user select no and does not clear PI Hunt data when relevantReviewForEndemics=VV', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef', relevantReviewForEndemics: { type: 'VV' } } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef', relevantReviewForEndemics: { type: 'VV' } } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
      expect(clearPiHuntSessionOnChange).not.toHaveBeenCalled()
    })

    test('shows error when payload is invalid', async () => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHunt: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select yes if a PI hunt was done')
    })
  })
})

describe('PI Hunt tests when Optional PI Hunt is ON', () => {
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaim.mockImplementation(() => { })
    server = await createServer()
    await server.initialize()
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })
  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })
    test.each([
      { reviewTestResults: 'positive', expectedURL: '/claim/endemics/pi-hunt-all-animals' },
      { reviewTestResults: 'negative', expectedURL: '/claim/endemics/pi-hunt-recommended' }
    ])('Continue to eligible page if user select yes', async ({ reviewTestResults, expectedURL }) => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementationOnce(() => { return { reviewTestResults } })
        .mockImplementationOnce(() => { return { reviewTestResults } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(expectedURL)
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaim.mockImplementationOnce(() => { return { reviewTestResults: 'negative', relevantReviewForEndemics: { type: 'EE' } } })
        .mockImplementationOnce(() => { return { reviewTestResults: 'negative', relevantReviewForEndemics: { type: 'EE' } } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/biosecurity')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})
