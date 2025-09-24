import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { errorMessages } from '../../../../../app/lib/error-messages.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../../app/lib/context-helper.js'
import { config } from '../../../../../app/config/index.js'

const { rcvs: rcvsErrorMessages } = errorMessages

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/lib/context-helper.js')

describe('Vet rcvs test when Optional PI Hunt is OFF', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-rcvs'
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })
    setEndemicsClaim.mockImplementation(() => { })
    server = await createServer()
    await server.initialize()
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return false })
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

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
      expect($('title').text().trim()).toContain('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number? - Get funding to improve animal health and welfare')
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
        payload: { crumb, vetRCVSNumber: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test.each([
      { vetRCVSNumber: undefined, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { vetRCVSNumber: null, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { vetRCVSNumber: '', errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: '' },
      { vetRCVSNumber: 'not-valid-ref', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: 'not-valid-ref' },
      { vetRCVSNumber: '123456A', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '123456A' },
      { vetRCVSNumber: '12345678', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '12345678' }
    ])('returns 400 when payload is invalid - %p', async ({ vetRCVSNumber, errorMessage, expectedVal }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1 > label').text().trim()).toMatch('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#vetRCVSNumber').val()).toEqual(expectedVal)
    })

    test.each([
      { vetRCVSNumber: '1234567', reviewTestResults: 'positive', nextPageURL: '/claim/endemics/pi-hunt' },
      { vetRCVSNumber: '123456X', reviewTestResults: 'negative', nextPageURL: '/claim/endemics/biosecurity' },
      { vetRCVSNumber: '123456X', reviewTestResults: undefined, nextPageURL: '/claim/endemics/test-urn' }
    ])('returns 200 when payload is valid and stores in session (vetRCVSNumber= $vetRCVSNumber)', async ({ vetRCVSNumber, reviewTestResults, nextPageURL }) => {
      getEndemicsClaim.mockImplementation(() => { return { reviewTestResults, typeOfLivestock: 'beef' } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(nextPageURL)
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', relevantReviewForEndemics: { type: 'VV' }, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', relevantReviewForEndemics: { type: 'VV' }, nextPageURL: '/claim/endemics/sheep-endemics-package' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', relevantReviewForEndemics: { type: 'VV' }, nextPageURL: '/claim/endemics/vet-visits-review-test-results' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', relevantReviewForEndemics: { type: undefined }, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', relevantReviewForEndemics: { type: undefined }, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'sheep', typeOfReview: 'E', relevantReviewForEndemics: { type: undefined }, nextPageURL: '/claim/endemics/sheep-endemics-package' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', relevantReviewForEndemics: { type: undefined }, nextPageURL: '/claim/endemics/vaccination' },
      { typeOfLivestock: 'beef', typeOfReview: 'R', relevantReviewForEndemics: undefined, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', relevantReviewForEndemics: undefined, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', relevantReviewForEndemics: undefined, nextPageURL: '/claim/endemics/test-urn' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', relevantReviewForEndemics: undefined, nextPageURL: '/claim/endemics/test-urn' }
    ])('Redirect $nextPageURL When species $typeOfLivestock and type of review is $typeOfReview and application from old world is $relevantReviewForEndemics ', async ({ typeOfLivestock, typeOfReview, relevantReviewForEndemics, nextPageURL }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, relevantReviewForEndemics } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber: '1234567' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(nextPageURL)
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
  })
})

describe('Vet rcvs test when Optional PI Hunt is ON', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/vet-rcvs'
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs' } })
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
      { typeOfLivestock: 'beef' },
      { typeOfLivestock: 'dairy' }
    ])('Redirect $nextPageURL When species $typeOfLivestock and type of review is $typeOfReview and application from old world is $relevantReviewForEndemics ', async ({ typeOfLivestock }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview: 'E', relevantReviewForEndemics: { type: undefined } } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, vetRCVSNumber: '1234567' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/pi-hunt')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
  })
})
