import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { setOptionalPIHunt, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getReviewType } from '../../../../../app/lib/get-review-type.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import {
  isWithIn4MonthsBeforeOrAfterDateOfVisit
} from '../../../../../app/api-requests/claim-service-api.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { visitDate } from '../../../../../app/config/visit-date.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../../../../app/lib/context-helper.js'

const { labels } = visitDate
jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
  ...jest.requireActual('../../../../../app/api-requests/claim-service-api'),
  isWithIn4MonthsBeforeOrAfterDateOfVisit: jest.fn()
}))

function expectPageContentOk ($) {
  expect($('label[for=whenTestingWasCarriedOut-2]').text()).toMatch('On another date')
  expect($('.govuk-button').text()).toMatch('Continue')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/endemics/date-of-visit')
}

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')

const latestVetVisitApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: Date.now(),
  statusId: 1,
  type: 'VV'
}

let crumb
const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/date-of-testing'

describe('Date of testing when Optional PI Hunt is OFF', () => {
  let server

  beforeAll(async () => {
    setMultiSpecies(true)
    setMultiHerds(true)
    getEndemicsClaim.mockImplementation(() => { return { latestVetVisitApplication, latestEndemicsApplication: { createdAt: new Date('2022-01-01') }, reference: 'TEMP-6GSE-PIR8' } })
    setOptionalPIHunt({ optionalPIHuntEnabled: false })
    server = await createServer()
    await server.initialize()
    isPIHuntEnabledAndVisitDateAfterGoLive.mockImplementation(() => { return false })
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
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('This is the date samples were last taken for this review. You can find it on the summary the vet gave you.')
    })

    test('returns 200', async () => {
      const endemicsMockInfo = { typeOfReview: 'E', typeOfLivestock: 'sheep', dateOfVisit: yesterday, dateOfTesting: today, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } }
      getEndemicsClaim.mockReturnValueOnce(endemicsMockInfo)
        .mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })
        .mockReturnValueOnce(endemicsMockInfo)
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('h1').text()).toMatch('When were samples taken or sheep assessed?')
      expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('This is the last date samples were taken or sheep assessed for this follow-up. You can find it on the summary the vet gave you.')
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

    test.each([
      {
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: today.getDate(),
        onAnotherDateMonth: today.getMonth() + 1,
        onAnotherDateYear: today.getFullYear(),
        dateOfVisit: yesterday,
        typeOfReview: 'R'
      },
      {
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: today.getDate(),
        onAnotherDateMonth: today.getMonth() + 1,
        onAnotherDateYear: today.getFullYear(),
        dateOfVisit: yesterday,
        typeOfReview: 'E'
      }
    ])('Show the date fields if date of testing when not equal to date of vet visit', async ({ whenTestingWasCarriedOut, dateOfVisit, typeOfReview }) => {
      const { isReview } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'
      const endemicsMock = { typeOfReview, dateOfVisit, dateOfTesting: today, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } }
      getEndemicsClaim.mockImplementationOnce(() => { return endemicsMock })
        .mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })
        .mockImplementationOnce(() => { return endemicsMock })
      const options = {
        method: 'GET',
        url,
        payload: { crumb, whenTestingWasCarriedOut, dateOfVisit },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)
      expect($('#whenTestingWasCarriedOut-2').val()).toEqual(whenTestingWasCarriedOut)
      // On other date radio button shouldn't be hidden
      expect($('.govuk-radios__conditional--hidden').text()).toBeFalsy()
      expect($('#on-another-date-day').val()).toEqual(today.getDate().toString())
      expect($('#on-another-date-month').val()).toEqual((today.getMonth() + 1).toString())
      expect($('#on-another-date-year').val()).toEqual(today.getFullYear().toString())
      expect($('label[for=whenTestingWasCarriedOut]').text()).toContain(`When the vet last visited the farm for the ${reviewOrFollowUpText}`)
    })
  })

  describe(`POST ${url} route`, () => {
    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })
    const errorSummaryHref = '#when-was-endemic-disease-or-condition-testing-carried-out'
    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, [labels.day]: 31, [labels.month]: 12, [labels.year]: 2022 },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })
    test.each([
      {
        description: 'onAnotherDay - year of sampling must include 4 numbers',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: today.getDate(),
        onAnotherDateMonth: today.getMonth() + 1,
        onAnotherDateYear: 202,
        errorMessage: 'Year must include 4 numbers',
        errorHighlights: ['on-another-date-day'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must not be in the future',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: tomorrow.getDate(),
        onAnotherDateMonth: tomorrow.getMonth() + 1,
        onAnotherDateYear: tomorrow.getFullYear(),
        errorMessage: 'The date samples were taken must be in the past',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a day',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: '',
        onAnotherDateMonth: yesterday.getMonth() + 1,
        onAnotherDateYear: yesterday.getFullYear(),
        errorMessage: 'Date of sampling must include a day',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a month',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: tomorrow.getDate(),
        onAnotherDateMonth: '',
        onAnotherDateYear: yesterday.getFullYear(),
        errorMessage: 'Date of sampling must include a month',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a year',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: tomorrow.getDate(),
        onAnotherDateMonth: yesterday.getMonth() + 1,
        onAnotherDateYear: '',
        errorMessage: 'Date of sampling must include a year',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      }
    ])('returns error ($errorMessage) when partial or invalid input is given - $description', async ({ whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, errorMessage, dateOfVisit }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { dateOfVisit } })
        .mockImplementationOnce(() => { return { dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': `${onAnotherDateYear}`, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('#on-another-date-error').text().trim()).toEqual(`Error: ${errorMessage}`)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > div > ul > li > a').attr('href')).toMatch(errorSummaryHref)
    })

    test.each([
      {
        whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
        dateOfVisit: today
      }
    ])('Hide the date fields if date of testing equal to date of vet visit', async ({ whenTestingWasCarriedOut, dateOfVisit }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { dateOfVisit, dateOfTesting: dateOfVisit } })
        .mockImplementationOnce(() => { return { dateOfVisit, dateOfTesting: dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)
      expect($('#whenTestingWasCarriedOut').val()).toEqual(whenTestingWasCarriedOut)
      // On other date radio button should be hidden
      expect($('.govuk-radios__conditional--hidden').text()).toBeTruthy()
    })

    test.each([
      {
        dateOfVisit: today,
        errorMessage: 'Enter the date samples were taken'
      }
    ])('Show error when no option selected', async ({ dateOfVisit, errorMessage }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { dateOfVisit } })
        .mockImplementationOnce(() => { return { dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('#whenTestingWasCarriedOut-error').text().trim()).toEqual(`Error: ${errorMessage}`)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > div > ul > li > a').attr('href')).toMatch(errorSummaryHref)
    })

    test.each([
      {
        typeOfReview: 'R',
        claimGuidanceLinkText: 'Samples should have been taken no more than 4 months before or after the date of review.'
      },
      {
        typeOfReview: 'E',
        claimGuidanceLinkText: 'Samples should have been taken no more than 4 months before or after the date of follow-up.'
      }
    ])('Redirect to exception screen if type of review is $typeOfReview and claim guidance link text should be $claimGuidanceLinkText', async ({ typeOfReview, claimGuidanceLinkText }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { dateOfVisit: '2024-04-23', typeOfReview } })
        .mockImplementationOnce(() => { return { dateOfVisit: '2024-04-23', typeOfReview } })
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementationOnce(() => { return false })
      const options = {
        method: 'POST',
        url,
        auth,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', dateOfVisit: '2024-04-23', dateOfAgreementAccepted: '2022-01-01' }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('.govuk-body').text()).toContain(claimGuidanceLinkText)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('Redirect to exception screen if follow up date of testing is more than 4 months after date of visit for relative review', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          dateOfVisit: '2024-04-23',
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
        }
      })
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })

      const options = {
        method: 'POST',
        url,
        auth,
        headers: { cookie: `crumb=${crumb}` },
        payload: {
          crumb,
          whenTestingWasCarriedOut: 'onAnotherDate',
          'on-another-date-day': '01',
          'on-another-date-month': '01',
          'on-another-date-year': '2023',
          dateOfVisit: '2024-04-23',
          dateOfAgreementAccepted: '2022-01-01'
        }
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
      expect($('.govuk-body').text()).toContain('You must do a review, including sampling, before you do the resulting follow-up.')
    })
  })
})

describe('Date of testing when Optional PI Hunt is ON', () => {
  let server

  beforeAll(async () => {
    setMultiSpecies(true)
    setMultiHerds(true)
    server = await createServer()
    await server.initialize()
    setOptionalPIHunt({ optionalPIHuntEnabled: true })
    isPIHuntEnabledAndVisitDateAfterGoLive.mockImplementation(() => { return true })
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
        .mockReturnValue({ typeOfReview: 'E', typeOfLivestock, latestEndemicsApplication: { createdAt: new Date('2022-01-01') }, reference: 'TEMP-6GSE-PIR8' })

      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
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
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })

      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
    })

    test('should redirect to species number when endemics claim and previous review claim of differet species with date of testing less than date of visit', async () => {
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
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })
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

      expect(res.statusCode).toBe(302)
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
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })
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
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
      expect($('.govuk-body').text()).toContain('You must do a review, including sampling, before you do the resulting follow-up.')
    })
  })
})
