const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
// const { labels } = require('../../../../../app/config/visit-date')

function expectPageContentOk ($) {
  // expect($('title').text()).toEqual('When were samples taken? - Annual health and welfare review of livestock')
  expect($('h1').text()).toMatch('When were samples taken?')
  expect($('#whenTestingWasCarriedOut-hint').text()).toMatch('his is the date samples were taken to test for health conditions or diseases.')
  expect($('label[for=whenTestingWasCarriedOut]').text()).toMatch('When the vet visited the farm to carry out the review')
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
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/date-of-testing'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => { return { latestReviewApplication } })

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
  })

  describe(`POST ${url} route`, () => {
    let crumb
    const today = new Date()
    const yearPast = new Date(today)
    yearPast.setDate(yearPast.getDate() - 365)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    // test('when not logged in redirects to defra id', async () => {
    //   const options = {
    //     method: 'POST',
    //     url,
    //     payload: { crumb, [labels.day]: 31, [labels.month]: 12, [labels.year]: 2022 },
    //     headers: { cookie: `crumb=${crumb}` }
    //   }

    //   const res = await global.__SERVER__.inject(options)

    //   expect(res.statusCode).toBe(302)
    //   expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    // })
    // test.each([
    //   {
    //     description: 'onAnotherDay - Year must include 4 numbers',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: today.getDay(),
    //     onAnotherDateMonth: today.getMonth(),
    //     onAnotherDateYear: 202,
    //     errorMessage: 'Year must include 4 numbers',
    //     errorHighlights: ['on-another-date-day'],
    //     dateOfVisit: today.setDate(today.getDate() - 1)
    //   },
    //   {
    //     description: 'onAnotherDay - cannot be before the review visit date',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: 29,
    //     onAnotherDateMonth: 3,
    //     onAnotherDateYear: 2023,
    //     errorMessage: 'Date of testing cannot be before the review visit date',
    //     errorHighlights: ['on-another-date-day'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   },
    //   {
    //     description: 'onAnotherDay - must not be in the future',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: tomorrow.getDate(),
    //     onAnotherDateMonth: tomorrow.getMonth() + 1,
    //     onAnotherDateYear: tomorrow.getFullYear(),
    //     errorMessage: 'Date of sampling must be a real date',
    //     errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   },
    //   {
    //     description: 'onAnotherDay - must not be before review visit date',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: yesterday.getDate(),
    //     onAnotherDateMonth: yesterday.getMonth() + 1,
    //     onAnotherDateYear: yesterday.getFullYear(),
    //     errorMessage: 'Date of testing cannot be before the review visit date',
    //     errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   },
    //   {
    //     description: 'onAnotherDay - must include a day',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: '',
    //     onAnotherDateMonth: yesterday.getMonth() + 1,
    //     onAnotherDateYear: yesterday.getFullYear(),
    //     errorMessage: 'Date of testing must include a day',
    //     errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   },
    //   {
    //     description: 'onAnotherDay - must include a month',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: tomorrow.getDate(),
    //     onAnotherDateMonth: '',
    //     onAnotherDateYear: yesterday.getFullYear(),
    //     errorMessage: 'Date of testing must include a month',
    //     errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   },
    //   {
    //     description: 'onAnotherDay - must include a year',
    //     whenTestingWasCarriedOut: 'onAnotherDate',
    //     onAnotherDateDay: tomorrow.getDate(),
    //     onAnotherDateMonth: yesterday.getMonth() + 1,
    //     onAnotherDateYear: '',
    //     errorMessage: 'Date of testing must include a year',
    //     errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
    //     dateOfVisit: today.setDate(today.getDate())
    //   }
    // ])('returns error ($errorMessage) when partial or invalid input is given - $description', async ({ whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, errorMessage, dateOfVisit }) => {
    //   getEndemicsClaimMock.mockImplementationOnce(() => { return { dateOfVisit } })
    //   const options = {
    //     method: 'POST',
    //     url,
    //     payload: { crumb, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': `${onAnotherDateYear}`, dateOfVisit },
    //     auth,
    //     headers: { cookie: `crumb=${crumb}` }
    //   }

    //   const res = await global.__SERVER__.inject(options)

    //   const $ = cheerio.load(res.payload)
    //   expect(res.statusCode).toBe(400)
    //   expect($('#on-another-date-error').text().trim()).toEqual(`Error: ${errorMessage}`)
    // })

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
        payload: { crumb, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': onAnotherDateYear, dateOfVisit },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
    })
  })
})
