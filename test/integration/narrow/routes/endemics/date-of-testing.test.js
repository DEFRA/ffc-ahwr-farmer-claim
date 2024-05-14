const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const { labels } = require('../../../../../app/config/visit-date')
const { isWithIn4MonthsBeforeOrAfterDateOfVisit } = require('../../../../../app/api-requests/claim-service-api')

jest.mock('../../../../../app/api-requests/claim-service-api')

function expectPageContentOk ($) {
  expect($('h1').text()).toMatch('When were samples taken?')
  expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('his is the date samples were taken to test for health conditions or diseases.')
  expect($('label[for=whenTestingWasCarriedOut]').text()).toMatch('When the vet visited the farm for the review or follow-up')
  expect($('label[for=whenTestingWasCarriedOut-2]').text()).toMatch('On another date')
  expect($('.govuk-button').text()).toMatch('Continue')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/endemics/date-of-visit')
}

jest.mock('../../../../../app/session')

const latestReviewApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: Date.now(),
  statusId: 1,
  type: 'VV'
}

describe('Date of vet visit', () => {
  let crumb
  const today = new Date()
  const yearPast = new Date(today)
  yearPast.setDate(yearPast.getDate() - 365)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/date-of-testing'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { latestReviewApplication, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })

    jest.mock('../../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../../app/config')
      return {
        ...originalModule,
        authConfig: {
          defraId: {
            hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
            oAuthAuthorisePath: '/oauth2/v2.0/authorize',
            policy: 'b2c_1a_signupsigninsfi',
            redirectUri: 'http://localhost:3000/apply/signin-oidc',
            clientId: 'dummy_client_id',
            serviceId: 'dummy_service_id',
            scope: 'openid dummy_client_id offline_access'
          },
          ruralPaymentsAgency: {
            hostname: 'dummy-host-name',
            getPersonSummaryUrl: 'dummy-get-person-summary-url',
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: true
        }
      }
    })
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
        dateOfVisit: yesterday
      }
    ])('Show the date fields if date of testing when not equal to date of vet visit', async ({ whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, dateOfVisit }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit, dateOfTesting: today, latestEndemicsApplication: { createdAt: new Date('2022-01-01') } } })
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
        description: 'onAnotherDay - Year must include 4 numbers',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: today.getDate(),
        onAnotherDateMonth: today.getMonth(),
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
        errorMessage: 'Date of sampling must be a real date',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a day',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: '',
        onAnotherDateMonth: yesterday.getMonth() + 1,
        onAnotherDateYear: yesterday.getFullYear(),
        errorMessage: 'Date of testing must include a day',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a month',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: tomorrow.getDate(),
        onAnotherDateMonth: '',
        onAnotherDateYear: yesterday.getFullYear(),
        errorMessage: 'Date of testing must include a month',
        errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
        dateOfVisit: today
      },
      {
        description: 'onAnotherDay - must include a year',
        whenTestingWasCarriedOut: 'onAnotherDate',
        onAnotherDateDay: tomorrow.getDate(),
        onAnotherDateMonth: yesterday.getMonth() + 1,
        onAnotherDateYear: '',
        errorMessage: 'Date of testing must include a year',
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
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > ul > li > a').attr('href')).toMatch(errorSummaryHref)
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
        errorMessage: 'Enter the date the vet completed testing'
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
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > ul > li > a').attr('href')).toMatch(errorSummaryHref)
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
    })
  })
})
