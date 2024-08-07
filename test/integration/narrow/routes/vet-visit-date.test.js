const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const { inputErrorClass, labels } = require('../../../../app/config/visit-date')

function expectPageContentOk ($) {
  expect($('h1').text()).toMatch('When was the review completed?')
  expect($(`label[for=${labels.day}]`).text()).toMatch('Day')
  expect($(`label[for=${labels.month}]`).text()).toMatch('Month')
  expect($(`label[for=${labels.year}]`).text()).toMatch('Year')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toContain('Date of visit - Annual health and welfare review of livestock')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/visit-review')
}

describe('Vet, enter date of visit', () => {
  describe('Vet, enter date of visit - toggle off', () => {
    let session
    const auth = { credentials: {}, strategy: 'cookie' }
    const url = '/claim/vet-visit-date'

    beforeAll(() => {
      session = require('../../../../app/session')
      jest.mock('../../../../app/session')

      jest.mock('../../../../app/config', () => {
        const originalModule = jest.requireActual('../../../../app/config')
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
            enabled: false
          },
          dateOfTesting: {
            enabled: false
          }
        }
      })
    })

    afterAll(() => {
      jest.resetModules()
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe(`GET ${url} route`, () => {
      test('returns 302 and redirects to defra id when not logged in', async () => {
        const options = {
          method: 'GET',
          url
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
      })

      test('returns 200 when logged in', async () => {
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

      test('loads input dates, if in session', async () => {
        const date = new Date()
        const options = {
          method: 'GET',
          url,
          auth
        }
        session.getClaim.mockReturnValue(date)

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(200)
        const $ = cheerio.load(res.payload)
        expectPageContentOk($)
        expectPhaseBanner.ok($)
        expect($(`#${labels.day}`).val()).toEqual(date.getDate().toString())
        expect($(`#${labels.month}`).val()).toEqual((date.getMonth() + 1).toString())
        expect($(`#${labels.year}`).val()).toEqual(date.getFullYear().toString())
        session.getClaim.mockRestore()
      })
    })

    describe(`POST to ${url} route`, () => {
      let crumb
      const method = 'POST'
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
      const before5Months = new Date(today)
      before5Months.setMonth(before5Months.getMonth() - 5)

      beforeEach(async () => {
        crumb = await getCrumbs(global.__SERVER__)
      })

      test('when not logged in redirects to defra id', async () => {
        const options = {
          method,
          url,
          payload: { crumb, [labels.day]: 31, [labels.month]: 12, [labels.year]: 2022 },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
      })

      const allErrorHighlights = [labels.day, labels.month, labels.year]

      test.each([
        { description: 'visit before application - application created today, visit date yesterday', day: yesterday.getDate(), month: yesterday.getMonth() === 0 ? 1 : yesterday.getMonth() + 1, year: yesterday.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: `Date of review must be the same or after ${(new Date(today)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`, errorHighlights: allErrorHighlights, applicationCreationDate: today },
        { description: 'visit date in future - application created today, visit date tomorrow', day: tomorrow.getDate(), month: tomorrow.getMonth() + 1, year: tomorrow.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'The date the review was completed must be in the past', errorHighlights: allErrorHighlights, applicationCreationDate: today },
        { description: 'missing day and month and year', day: '', month: '', year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Enter the date the vet completed the review', errorHighlights: allErrorHighlights, applicationCreationDate: today },
        { description: 'missing day', day: '', month: today.getMonth(), year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day', errorHighlights: [labels.day], applicationCreationDate: today },
        { description: 'missing month', day: today.getDate(), month: '', year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a month', errorHighlights: [labels.month], applicationCreationDate: today },
        { description: 'missing year', day: today.getDate(), month: today.getMonth(), year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a year', errorHighlights: [labels.year], applicationCreationDate: today },
        { description: 'missing day and month', day: '', month: '', year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day and a month', errorHighlights: [labels.day, labels.month], applicationCreationDate: today },
        { description: 'missing day and year', day: '', month: today.getMonth(), year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day and a year', errorHighlights: [labels.day, labels.year], applicationCreationDate: today },
        { description: 'missing month and year', day: today.getDate(), month: '', year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a month and a year', errorHighlights: [labels.month, labels.year], applicationCreationDate: today }
      ])('returns error ($errorMessage) when partial or invalid input is given - $description', async ({ day, month, year, whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, errorMessage, errorHighlights, applicationCreationDate }) => {
        session.getClaim.mockReturnValueOnce({ createdAt: applicationCreationDate })
        const options = {
          method,
          url,
          payload: { crumb, [labels.day]: day, [labels.month]: month, [labels.year]: `${year}`, dateOfAgreementAccepted: applicationCreationDate, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': onAnotherDateYear },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        const $ = cheerio.load(res.payload)
        expect(res.statusCode).toBe(400)
        expect($('p.govuk-error-message').text().trim()).toEqual(`Error: ${errorMessage}`)
        errorHighlights.forEach(label => {
          expect($(`#${label}`).hasClass(inputErrorClass)).toEqual(true)
        })
        session.getClaim.mockRestore()
      })

      test.each([
        { description: 'application created before 5 months, visit date today', applicationCreationDate: before5Months }
      ])('returns 302 to next page when acceptable answer given - $description', async ({ applicationCreationDate }) => {
        session.getClaim.mockReturnValue({ data: { whichReview: 'dairy' }, createdAt: applicationCreationDate })
        const options = {
          auth,
          method,
          url,
          payload: {
            crumb,
            [labels.day]: 5,
            [labels.month]: 6,
            [labels.year]: 2023,
            dateOfAgreementAccepted: new Date('1 January 2023') // before5Months
          },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toEqual('/claim/vet-name')
        session.getClaim.mockRestore()
      })

      test.each([
        { description: 'application created before 5 months, visit date today and no dairy', applicationCreationDate: before5Months }
      ])('returns 302 to next page when acceptable answer given - $description', async ({ applicationCreationDate }) => {
        session.getClaim.mockReturnValue({ data: { whichReview: 'other' }, createdAt: applicationCreationDate })
        const options = {
          auth,
          method,
          url,
          payload: {
            crumb,
            [labels.day]: 5,
            [labels.month]: 6,
            [labels.year]: 2023,
            dateOfAgreementAccepted: new Date('1 January 2023') // before5Months
          },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toEqual('/claim/animals-tested')
        session.getClaim.mockRestore()
      })
    })
  })

  describe('Vet, enter date of visit - toggle on', () => {
    let session
    const auth = { credentials: {}, strategy: 'cookie' }
    const url = '/claim/vet-visit-date'

    beforeAll(() => {
      session = require('../../../../app/session')
      jest.mock('../../../../app/session')

      jest.mock('../../../../app/config', () => {
        const originalModule = jest.requireActual('../../../../app/config')
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
            enabled: false
          },
          dateOfTesting: {
            enabled: true
          }
        }
      })
    })

    afterAll(() => {
      jest.resetModules()
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe(`GET ${url} route`, () => {
      test('returns 302 and redirects to defra id when not logged in', async () => {
        const options = {
          method: 'GET',
          url
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
      })

      test('returns 200 when logged in', async () => {
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

      test('loads input dates, if in session', async () => {
        const date = new Date()
        const options = {
          method: 'GET',
          url,
          auth
        }
        session.getClaim.mockReturnValue(date)

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(200)
        const $ = cheerio.load(res.payload)
        expectPageContentOk($)
        expectPhaseBanner.ok($)
        expect($(`#${labels.day}`).val()).toEqual(date.getDate().toString())
        expect($(`#${labels.month}`).val()).toEqual((date.getMonth() + 1).toString())
        expect($(`#${labels.year}`).val()).toEqual(date.getFullYear().toString())
        session.getClaim.mockRestore()
      })
    })

    describe(`POST to ${url} route`, () => {
      let crumb
      const method = 'POST'
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
      const before5Months = new Date(today)
      before5Months.setMonth(before5Months.getMonth() - 5)

      beforeEach(async () => {
        crumb = await getCrumbs(global.__SERVER__)
      })

      test('when not logged in redirects to defra id', async () => {
        const options = {
          method,
          url,
          payload: { crumb, [labels.day]: 31, [labels.month]: 12, [labels.year]: 2022 },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
      })

      const allErrorHighlights = [labels.day, labels.month, labels.year]

      test.each([
        {
          description: 'visit before application - application created today, visit date yesterday',
          day: yesterday.getDate(),
          month: yesterday.getMonth() === 0 ? 1 : yesterday.getMonth() + 1,
          year: yesterday.getFullYear(),
          whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
          errorMessage: `Date of review must be the same or after ${(new Date(today)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
          errorHighlights: allErrorHighlights,
          applicationCreationDate: today
        },
        { description: 'visit date in future - application created today, visit date tomorrow', day: tomorrow.getDate(), month: tomorrow.getMonth() + 1, year: tomorrow.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'The date the review was completed must be in the past', errorHighlights: allErrorHighlights, applicationCreationDate: today },
        { description: 'missing day and month and year', day: '', month: '', year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Enter the date the vet completed the review', errorHighlights: allErrorHighlights, applicationCreationDate: today },
        { description: 'missing day', day: '', month: today.getMonth(), year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day', errorHighlights: [labels.day], applicationCreationDate: today },
        { description: 'missing month', day: today.getDate(), month: '', year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a month', errorHighlights: [labels.month], applicationCreationDate: today },
        { description: 'missing year', day: today.getDate(), month: today.getMonth(), year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a year', errorHighlights: [labels.year], applicationCreationDate: today },
        { description: 'missing day and month', day: '', month: '', year: today.getFullYear(), whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day and a month', errorHighlights: [labels.day, labels.month], applicationCreationDate: today },
        { description: 'missing day and year', day: '', month: today.getMonth(), year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a day and a year', errorHighlights: [labels.day, labels.year], applicationCreationDate: today },
        { description: 'missing month and year', day: today.getDate(), month: '', year: '', whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview', errorMessage: 'Date of review must include a month and a year', errorHighlights: [labels.month, labels.year], applicationCreationDate: today },
        {
          description: 'missing whenTestingWasCarriedOut',
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          whenTestingWasCarriedOut: undefined,
          errorMessage: 'Select if testing was carried out when the vet visited the farm or on another date',
          errorHighlights: [],
          applicationCreationDate: today
        },
        { description: 'missing onAnotherDay', day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear(), whenTestingWasCarriedOut: 'onAnotherDate', onAnotherDateDay: '', onAnotherDateMonth: '', onAnotherDateYear: '', errorMessage: 'Enter the date the vet completed testing', errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'], applicationCreationDate: today },
        { description: 'missing onAnotherDay - missing day and month', day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear(), whenTestingWasCarriedOut: 'onAnotherDate', onAnotherDateDay: '', onAnotherDateMonth: '', onAnotherDateYear: 2023, errorMessage: 'Date of testing must include a day and a month', errorHighlights: ['on-another-date-day', 'on-another-date-month'], applicationCreationDate: today },
        { description: 'missing onAnotherDay - missing month', day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear(), whenTestingWasCarriedOut: 'onAnotherDate', onAnotherDateDay: 10, onAnotherDateMonth: '', onAnotherDateYear: 2023, errorMessage: 'Date of testing must include a month', errorHighlights: ['on-another-date-month'], applicationCreationDate: today },
        { description: 'missing onAnotherDay - missing year', day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear(), whenTestingWasCarriedOut: 'onAnotherDate', onAnotherDateDay: 10, onAnotherDateMonth: 10, onAnotherDateYear: '', errorMessage: 'Date of testing must include a year', errorHighlights: ['on-another-date-year'], applicationCreationDate: today },
        {
          description: 'onAnotherDay - must be a real date',
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          whenTestingWasCarriedOut: 'onAnotherDate',
          onAnotherDateDay: 29,
          onAnotherDateMonth: 2,
          onAnotherDateYear: '2023',
          errorMessage: 'Date of testing must be a real date',
          errorHighlights: ['on-another-date-day'],
          applicationCreationDate: today
        },
        {
          description: 'onAnotherDay (leap year) - must be a real date',
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          whenTestingWasCarriedOut: 'onAnotherDate',
          onAnotherDateDay: 29,
          onAnotherDateMonth: 2,
          onAnotherDateYear: '2020',
          errorMessage: `Date of testing must be the same or after ${today.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
          errorHighlights: ['on-another-date-day'],
          applicationCreationDate: today
        },
        {
          description: 'onAnotherDay - must not be in the future',
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          whenTestingWasCarriedOut: 'onAnotherDate',
          onAnotherDateDay: tomorrow.getDate(),
          onAnotherDateMonth: tomorrow.getMonth() + 1,
          onAnotherDateYear: tomorrow.getFullYear(),
          errorMessage: 'Date of testing must be in the past',
          errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
          applicationCreationDate: today
        },
        {
          description: 'onAnotherDay - must not be before agreement acceptance date',
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          whenTestingWasCarriedOut: 'onAnotherDate',
          onAnotherDateDay: yesterday.getDate(),
          onAnotherDateMonth: yesterday.getMonth() + 1,
          onAnotherDateYear: yesterday.getFullYear(),
          errorMessage: `Date of testing must be the same or after ${today.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
          errorHighlights: ['on-another-date-day', 'on-another-date-month', 'on-another-date-year'],
          applicationCreationDate: today
        }
      ])('returns error ($errorMessage) when partial or invalid input is given - $description', async ({ day, month, year, whenTestingWasCarriedOut, onAnotherDateDay, onAnotherDateMonth, onAnotherDateYear, errorMessage, errorHighlights, applicationCreationDate }) => {
        session.getClaim.mockReturnValueOnce({ createdAt: applicationCreationDate })
        const options = {
          method,
          url,
          payload: { crumb, [labels.day]: day, [labels.month]: month, [labels.year]: `${year}`, whenTestingWasCarriedOut, 'on-another-date-day': onAnotherDateDay, 'on-another-date-month': onAnotherDateMonth, 'on-another-date-year': `${onAnotherDateYear}`, dateOfAgreementAccepted: applicationCreationDate.toISOString().slice(0, 10) },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        const $ = cheerio.load(res.payload)
        expect(res.statusCode).toBe(400)
        expect($('p.govuk-error-message').text().trim()).toEqual(`Error: ${errorMessage}`)
        errorHighlights.forEach(label => {
          expect($(`#${label}`).hasClass(inputErrorClass)).toEqual(true)
        })
        session.getClaim.mockRestore()
      })

      test.each([
        { description: 'application created before 5 months, visit date today', applicationCreationDate: before5Months }
      ])('returns 302 to next page when acceptable answer given - $description', async ({ applicationCreationDate, description }) => {
        session.getClaim.mockReturnValue({ data: { whichReview: 'dairy' }, createdAt: applicationCreationDate })
        const options = {
          auth,
          method,
          url,
          payload: { crumb, [labels.day]: today.getDate(), [labels.month]: today.getMonth() === 0 ? 1 : today.getMonth() + 1, [labels.year]: `${today.getFullYear()}`, dateOfAgreementAccepted: before5Months, whenTestingWasCarriedOut: 'whenTheVetVisitedTheFarmToCarryOutTheReview' },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toEqual('/claim/vet-name')
        session.getClaim.mockRestore()
      })
    })
  })
})
