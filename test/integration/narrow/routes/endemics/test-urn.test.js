import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { isURNUnique } from '../../../../../app/api-requests/claim-service-api.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../../app/lib/context-helper.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/test-urn'

describe('Test URN test when Optional PI Hunt is off', () => {
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
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
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) or certificate number of the test results?', reviewTestResults: 'positive' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) or certificate number of the test results?' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', title: 'What’s the laboratory unique reference number (URN) for the test results?' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', title: 'What’s the laboratory unique reference number (URN) for the test results?' }
    ])('Return 200 with Title $title when type of species is $typeOfLivestock and type of review is $typeOfReview', async ({ title, typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reviewTestResults, reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch(title)
      expect($('title').text()).toContain(`${title} - Get funding to improve animal health and welfare`)

      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/vaccination' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vaccination' }
    ])('backLink when species $typeOfLivestock and type of review is $typeOfReview and application from old world is $latestVetVisitApplication ', async ({ typeOfLivestock, typeOfReview, latestVetVisitApplication, backLink }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, latestVetVisitApplication, reference: 'TEMP-6GSE-PIR8' } })
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
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', nextPageUrl: '/claim/endemics/test-results' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', nextPageUrl: '/claim/endemics/test-results' },
      { typeOfLivestock: 'sheep', typeOfReview: 'R', nextPageUrl: '/claim/endemics/check-answers' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', nextPageUrl: '/claim/endemics/number-of-fluid-oral-samples' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', nextPageUrl: '/claim/endemics/number-of-samples-tested' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock and $typeOfReview', async ({ nextPageUrl, typeOfLivestock, typeOfReview }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, laboratoryURN: '12345', organisation: { sbi: '12345678' } } })
      isURNUnique.mockImplementation(() => { return { isURNUnique: true } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageUrl))
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', message: 'This test result unique reference number (URN) or certificate number was used in a previous claim.' },
      { typeOfLivestock: 'beef', typeOfReview: 'R', message: 'This test result unique reference number (URN) was used in a previous claim.' }
    ])('redirects to exception screen when the URN number is not unique', async ({ typeOfLivestock, typeOfReview, message }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, laboratoryURN: '12345', organisation: { sbi: '12345678' } } })
        .mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, laboratoryURN: '12345', organisation: { sbi: '12345678' } } })
      isURNUnique.mockImplementationOnce(() => { return { isURNUnique: false } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect($('p').text()).toContain(message)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, laboratoryURN: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('What’s the laboratory unique reference number (URN) for the test results?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the URN')
      expect($('#laboratoryURN-error').text()).toMatch('Enter the URN')
    })
  })
})

describe('Test URN test when Optional PI Hunt is on', () => {
  let server

  beforeAll(async () => {
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    setEndemicsClaim.mockImplementation(() => { })
    server = await createServer()
    await server.initialize()
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/date-of-testing' },
      { typeOfLivestock: 'beef', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/date-of-testing' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'dairy', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/date-of-testing' },
      { typeOfLivestock: 'pigs', typeOfReview: 'R', latestVetVisitApplication: false, backLink: '/claim/endemics/vet-rcvs' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: true, backLink: '/claim/endemics/vaccination' },
      { typeOfLivestock: 'pigs', typeOfReview: 'E', latestVetVisitApplication: false, backLink: '/claim/endemics/vaccination' }
    ])('backLink when species $typeOfLivestock and type of review is $typeOfReview and application from old world is $latestVetVisitApplication ', async ({ typeOfLivestock, typeOfReview, latestVetVisitApplication, backLink }) => {
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, latestVetVisitApplication, reference: 'TEMP-6GSE-PIR8' } })
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
  })
})
