const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const { labels } = require('../../../../../app/config/visit-date')

function expectPageContentOk ($) {
  expect($('title').text()).toEqual('Date of visit - Annual health and welfare review of livestock')
  expect($('h1').text()).toMatch('Date of visit')
  expect($('p').text()).toMatch('When the vet last visited the farm for the review.')
  expect($('#visit-date-hint').text()).toMatch('For example, 27 3 2022')
  expect($(`label[for=${labels.day}]`).text()).toMatch('Day')
  expect($(`label[for=${labels.month}]`).text()).toMatch('Month')
  expect($(`label[for=${labels.year}]`).text()).toMatch('Year')
  expect($('.govuk-button').text()).toMatch('Continue')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/endemics/which-review-annual')
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
  const url = '/claim/endemics/date-of-visit'

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
    const yearPastMinusOneApplicationDate = new Date(today)
    yearPastMinusOneApplicationDate.setFullYear(yearPastMinusOneApplicationDate.getFullYear() - 1)
    yearPastMinusOneApplicationDate.setDate(yearPastMinusOneApplicationDate.getDate() - 1)
    const yearPast = new Date(today)
    yearPast.setDate(yearPast.getDate() - 365)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const after6Months = new Date(today)
    after6Months.setMonth(after6Months.getMonth() + 7)
    const before10Months = new Date(today)
    before10Months.setMonth(before10Months.getMonth() - 10)

    const allErrorHighlights = [labels.day, labels.month, labels.year]

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

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
      { description: 'visit before application - application created today, visit date yesterday', day: yesterday.getDate(), month: yesterday.getMonth() === 0 ? 1 : yesterday.getMonth() + 1, year: yesterday.getFullYear(), errorMessage: 'Date of visit cannot be before the date your agreement began', errorHighlights: allErrorHighlights, applicationCreationDate: today },
      { description: 'visit date in future - application created today, visit date tomorrow', day: tomorrow.getDate(), month: tomorrow.getMonth() + 1, year: tomorrow.getFullYear(), errorMessage: 'Date of visit must be a real date', errorHighlights: allErrorHighlights, applicationCreationDate: today },
      { description: 'missing day and month and year', day: '', month: '', year: '', errorMessage: 'Enter the date the vet completed the review', errorHighlights: allErrorHighlights, applicationCreationDate: today },
      { description: 'missing day', day: '', month: today.getMonth(), year: today.getFullYear(), errorMessage: 'Date of visit must include a day', errorHighlights: [labels.day], applicationCreationDate: today },
      { description: 'missing month', day: today.getDate(), month: '', year: today.getFullYear(), errorMessage: 'Date of visit must include a month', errorHighlights: [labels.month], applicationCreationDate: today },
      { description: 'missing year', day: today.getDate(), month: today.getMonth(), year: '', errorMessage: 'Date of visit must include a year', errorHighlights: [labels.year], applicationCreationDate: today },
      { description: 'missing day and month', day: '', month: '', year: today.getFullYear(), errorMessage: 'Date of visit must include a day and a month', errorHighlights: [labels.day, labels.month], applicationCreationDate: today },
      { description: 'missing day and year', day: '', month: today.getMonth(), year: '', errorMessage: 'Date of visit must include a day and a year', errorHighlights: [labels.day, labels.year], applicationCreationDate: today },
      { description: 'missing month and year', day: today.getDate(), month: '', year: '', errorMessage: 'Date of visit must include a month and a year', errorHighlights: [labels.month, labels.year], applicationCreationDate: today }
    ])('returns error ($errorMessage) when partial or invalid input is given - $description', async ({ day, month, year, errorMessage, errorHighlights, applicationCreationDate }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { latestReviewApplication: { ...latestReviewApplication, createdAt: applicationCreationDate } } })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, [labels.day]: day, [labels.month]: month, [labels.year]: `${year}`, dateOfAgreementAccepted: applicationCreationDate },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('p.govuk-error-message').text().trim()).toEqual(`Error: ${errorMessage}`)
    })
    test.each([
      { description: 'application created before 10 months, visit date today', applicationCreationDate: before10Months }
    ])('returns 302 to next page when acceptable answer given - $description', async ({ applicationCreationDate, description }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { latestReviewApplication: { ...latestReviewApplication, createdAt: applicationCreationDate } } })
      const options = {
        auth,
        method: 'POST',
        url,
        payload: { crumb, [labels.day]: today.getDate(), [labels.month]: today.getMonth() === 0 ? 1 : today.getMonth() + 1, [labels.year]: `${today.getFullYear()}`, dateOfAgreementAccepted: before10Months },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    })
  })
})