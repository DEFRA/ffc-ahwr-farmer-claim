const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { setEndemicsAndOptionalPIHunt } = require('../../../../mocks/config')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const { labels } = require('../../../../../app/config/visit-date')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const { getReviewType } = require('../../../../../app/lib/get-review-type')

const { isWithIn4MonthsBeforeOrAfterDateOfVisit, isDateOfTestingLessThanDateOfVisit, getReviewWithinLast10Months } = require('../../../../../app/api-requests/claim-service-api')

jest.mock('../../../../../app/api-requests/claim-service-api')

function expectPageContentOk ($) {
  expect($('label[for=whenTestingWasCarriedOut-2]').text()).toMatch('On another date')
  expect($('.govuk-button').text()).toMatch('Continue')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/endemics/date-of-visit')
}

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
const latestReviewApplication = {
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
  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { latestReviewApplication, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('This is the date samples were last taken for this review. You can find it on the summary the vet gave you.')
    })
    test('returns 200', async () => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfReview: 'E', typeOfLivestock: 'sheep', dateOfVisit: yesterday, dateOfTesting: today, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

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

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
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
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfReview, dateOfVisit, dateOfTesting: today, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })
      const options = {
        method: 'GET',
        url,
        payload: { crumb, whenTestingWasCarriedOut, dateOfVisit },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
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
      crumb = await getCrumbs(global.__SERVER__)
    })
    const errorSummaryHref = '#when-was-endemic-disease-or-condition-testing-carried-out'
    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, [labels.day]: 31, [labels.month]: 12, [labels.year]: 2022 },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
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
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': `${onAnotherDateYear}`, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('#on-another-date-error').text().trim()).toEqual(`Error: ${errorMessage}`)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > div > ul > li > a').attr('href')).toMatch(errorSummaryHref)
    })

    test.each([
      {
        description: 'When vet visited the farm',
        whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: today.getDate(),
        onAnotherDateMonth: today.getMonth() + 1,
        onAnotherDateYear: today.getFullYear(),
        dateOfVisit: yesterday
      }
    ])('returns 302 to next page when acceptable answer given - $description', async ({ whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, dateOfVisit }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': onAnotherDateYear, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
    })

    test.each([
      {
        whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
        dateOfVisit: today
      }
    ])('Hide the date fields if date of testing equal to date of vet visit', async ({ whenTestingWasCarriedOut, dateOfVisit }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit, dateOfTesting: dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
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
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
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
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit: '2024-04-23', typeOfReview } })
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementationOnce(() => { return false })
      const options = {
        method: 'POST',
        url,
        auth,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', dateOfVisit: '2024-04-23', dateOfAgreementAccepted: '2022-01-01' }
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('.govuk-body').text()).toContain(claimGuidanceLinkText)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('Redirect to exception screen if follow up date of testing is more than 4 months after date of visit for relative review', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { dateOfVisit: '2024-04-23', typeOfReview: 'E' } })
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })
      isDateOfTestingLessThanDateOfVisit.mockImplementation(() => { return true })
      getReviewWithinLast10Months.mockImplementation(() => { return { test: 'mockPreviousReview' } })

      const options = {
        method: 'POST',
        url,
        auth,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', dateOfVisit: '2024-04-23', dateOfAgreementAccepted: '2022-01-01' }
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
      expect($('.govuk-body').text()).toContain('You must do a review, including sampling, before you do the resulting follow-up.')
    })
  })
})

describe('Date of testing when Optional PI Hunt is ON', () => {
  beforeAll(() => {
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef' },
      { typeOfLivestock: 'dairy' }
    ])('returns 200', async ({ typeOfLivestock }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfReview: 'E', typeOfLivestock, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toMatch('/claim/endemics/pi-hunt-all-animals')
      expectPhaseBanner.ok($)
      expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('This is the date samples were last taken for this follow-up. You can find it on the summary the vet gave you.')
    })
  })
  describe(`POST ${url} route`, () => {
    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
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
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit, typeOfReview: 'E', typeOfLivestock } })
      isWithIn4MonthsBeforeOrAfterDateOfVisit.mockImplementation(() => { return true })

      const options = {
        method: 'POST',
        url,
        payload: { crumb, whenTestingWasCarriedOut, dateOfVisit, dateOfAgreementAccepted: '2022-01-01' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
    })
  })
})
