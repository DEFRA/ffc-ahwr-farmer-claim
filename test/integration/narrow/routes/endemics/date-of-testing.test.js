import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import {
  isMultipleHerdsUserJourney,
  isVisitDateAfterPIHuntAndDairyGoLive,
  skipSameHerdPage
} from '../../../../../app/lib/context-helper.js'
import HttpStatus from 'http-status-codes'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')

let crumb
const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/date-of-testing'

const latestEndemicsApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: new Date('2022-01-01'),
  statusId: 1,
  type: 'EE'
}

describe('Date of testing', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef' },
      { typeOfLivestock: 'dairy' }
    ])('returns 200', async ({ typeOfLivestock }) => {
      getEndemicsClaim
        .mockReturnValue({
          typeOfReview: 'E',
          typeOfLivestock,
          latestEndemicsApplication,
          reference: 'TEMP-6GSE-PIR8',
          dateOfVisit: '2022-01-01'
        })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.OK)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toMatch('/claim/endemics/pi-hunt-all-animals')
      expectPhaseBanner.ok($)
      expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('This is the date samples were last taken for this follow-up. You can find it on the summary the vet gave you.')
    })
  })

  describe(`POST ${url} route`, () => {
    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('should redirect with an error if the user doesnt enter anything', async () => {
      getEndemicsClaim
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => ({
          dateOfVisit: '2024-01-01',
          typeOfReview: 'E',
          typeOfLivestock: 'sheep',
          previousClaims: [{
            type: 'R',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-01-01',
              testResults: 'negative'
            }
          }],
          latestEndemicsApplication
        }))
      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          whenTestingWasCarriedOut: undefined
        },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      const $ = cheerio.load(res.payload)
      const errorMessage = 'Enter the date samples were taken'

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect($('li > a').text().trim()).toContain(errorMessage)
    })

    test('should redirect with an error if the user selects it was a different date, but doesnt enter a date', async () => {
      getEndemicsClaim
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => ({
          dateOfVisit: '2024-01-01',
          typeOfReview: 'E',
          typeOfLivestock: 'sheep',
          previousClaims: [{
            type: 'R',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-01-01',
              testResults: 'negative'
            }
          }],
          latestEndemicsApplication
        }))
      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          whenTestingWasCarriedOut: 'onAnotherDate',
          'on-another-date-day': undefined,
          'on-another-date-month': undefined,
          'on-another-date-year': undefined
        },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect($('li > a').text().trim()).toContain('"on-another-date-day" is required')
    })

    test.each([
      {
        description: 'When vet visited the farm',
        whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
        dateOfVisit: today,
        typeOfLivestock: 'beef'
      },
      {
        description: 'When vet visited the farm',
        whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
        dateOfVisit: today,
        typeOfLivestock: 'dairy'
      }
    ])('returns 302 to next page when acceptable answer given - $description', async ({ whenTestingWasCarriedOut, dateOfVisit, typeOfLivestock }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { dateOfVisit, typeOfReview: 'E', typeOfLivestock } })
        .mockImplementationOnce(() => { return { dateOfVisit, typeOfReview: 'E', typeOfLivestock } })

      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(HttpStatus.MOVED_TEMPORARILY)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
    })

    test('should redirect to species number when endemics claim and previous review claim of different species with date of testing less than date of visit', async () => {
      getEndemicsClaim
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => ({
          dateOfVisit: '2024-01-01',
          typeOfReview: 'E',
          typeOfLivestock: 'sheep',
          previousClaims: [{
            type: 'R',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-01-01',
              testResults: 'negative'
            }
          }]
        }))
      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          whenTestingWasCarriedOut: 'onAnotherDate',
          dateOfVisit: '2024-01-01',
          dateOfAgreementAccepted: '2022-01-01',
          'on-another-date-day': '01',
          'on-another-date-month': '12',
          'on-another-date-year': '2023'
        },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.MOVED_TEMPORARILY)
      expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
      expect(raiseInvalidDataEvent).toHaveBeenCalledTimes(0)
    })

    test('should emit an invalid event when the date of visit is over 4 months away from the date of testing', async () => {
      getEndemicsClaim
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => ({
          dateOfVisit: '2024-01-01',
          typeOfReview: 'E',
          typeOfLivestock: 'sheep',
          previousClaims: [{
            type: 'R',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-01-01',
              testResults: 'negative'
            }
          }]
        }))
      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          whenTestingWasCarriedOut: 'onAnotherDate',
          dateOfVisit: '2024-01-01',
          dateOfAgreementAccepted: '2022-01-01',
          'on-another-date-day': '01',
          'on-another-date-month': '01',
          'on-another-date-year': '2023'
        },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfTesting', expect.stringContaining('is outside of the recommended 4 month period from the date of visit 2024-01-01'))
      expect(res.statusCode).toBe(HttpStatus.MOVED_TEMPORARILY)
      expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
    })

    test('should redirect to date of testing exception when endemics claim and previous review claim of same species with date of testing less than date of visit', async () => {
      getEndemicsClaim
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => ({
          dateOfVisit: '2024-01-01',
          typeOfReview: 'E',
          typeOfLivestock: 'sheep',
          previousClaims: [{
            type: 'R',
            data: {
              typeOfLivestock: 'sheep',
              dateOfVisit: '2024-01-01',
              testResults: 'negative'
            }
          }]
        }))

      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          whenTestingWasCarriedOut: 'onAnotherDate',
          dateOfVisit: '2024-01-01',
          dateOfAgreementAccepted: '2022-01-01',
          'on-another-date-day': '01',
          'on-another-date-month': '12',
          'on-another-date-year': '2023'
        },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(raiseInvalidDataEvent).toHaveBeenCalledTimes(1)
      expect($('.govuk-body').text()).toContain('You must do a review, including sampling, before you do the resulting follow-up.')
    })
  })
})

describe('Date of testing when isMultipleHerdsUserJourney=true', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  test('returns 200 and correct backlink when skipSameHerdPage=true', async () => {
    getEndemicsClaim.mockReturnValue({ typeOfReview: 'E', typeOfLivestock: 'beef', latestEndemicsApplication: { createdAt: new Date('2022-01-01') }, reference: 'TEMP-6GSE-PIR8' })
    skipSameHerdPage.mockImplementation(() => { return true })

    const res = await server.inject({ method: 'GET', url, auth })

    expect(res.statusCode).toBe(HttpStatus.OK)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-back-link').attr('href')).toMatch('/claim/endemics/check-herd-details')
  })

  test('returns 200 and correct backlink when skipSameHerdPage=false', async () => {
    getEndemicsClaim.mockReturnValue({ typeOfReview: 'E', typeOfLivestock: 'beef', latestEndemicsApplication: { createdAt: new Date('2022-01-01') }, reference: 'TEMP-6GSE-PIR8' })
    skipSameHerdPage.mockImplementation(() => { return false })

    const res = await server.inject({ method: 'GET', url, auth })

    expect(res.statusCode).toBe(HttpStatus.OK)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-back-link').attr('href')).toMatch('/claim/endemics/same-herd')
  })

  test('returns 200 and correct backlink when beef follow-up post PIHuntAndDairy golive', async () => {
    getEndemicsClaim.mockReturnValue({ typeOfReview: 'E', typeOfLivestock: 'beef', latestEndemicsApplication: { createdAt: new Date('2025-06-06') }, reference: 'TEMP-6GSE-PIR8' })
    skipSameHerdPage.mockImplementation(() => { return true })
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })

    const res = await server.inject({ method: 'GET', url, auth })

    expect(res.statusCode).toBe(HttpStatus.OK)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-back-link').attr('href')).toMatch('/claim/endemics/pi-hunt-all-animals')
  })
})
