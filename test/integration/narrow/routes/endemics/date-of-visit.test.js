const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const { labels } = require('../../../../../app/config/visit-date')
const getEndemicsClaimMock =
  require('../../../../../app/session').getEndemicsClaim
const claimServiceApiMock = require('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/session')

function expectPageContentOk ($) {
  expect($('title').text()).toMatch(
    'Date of visit - Get funding to improve animal health and welfare'
  )
  expect($('h1').text()).toMatch(/(Date of review | follow-up)/i)
  expect($('p').text()).toMatch(
    /(This is the date the vet last visited the farm for this review. You can find it on the summary the vet gave you.| follow-up)/i
  )
  expect($('#visit-date-hint').text()).toMatch('For example, 27 3 2022')
  expect($(`label[for=${labels.day}]`).text()).toMatch('Day')
  expect($(`label[for=${labels.month}]`).text()).toMatch('Month')
  expect($(`label[for=${labels.year}]`).text()).toMatch('Year')
  expect($('.govuk-button').text()).toMatch('Continue')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/endemics/which-species')
}

const latestVetVisitApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: '2023-01-01',
  data: {
    visitDate: '2023-01-01'
  },
  statusId: 1,
  type: 'VV'
}

const latestEndemicsApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: '2023-01-01',
  statusId: 1,
  type: 'EE'
}

const landingPage = '/claim/endemics/which-species'

describe('Date of vet visit', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/date-of-visit'

  beforeAll(() => {
    getEndemicsClaimMock.mockImplementation(() => {
      return {
        latestVetVisitApplication,
        latestEndemicsApplication,
        landingPage
      }
    })

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
            getOrganisationPermissionsUrl:
              'dummy-get-organisation-permissions-url',
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
      expect(res.headers.location.toString()).toEqual(
        expect.stringContaining(
          'https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'
        )
      )
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb
    const allErrorHighlights = [labels.day, labels.month, labels.year]

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: {
          crumb,
          [labels.day]: 31,
          [labels.month]: 12,
          [labels.year]: 2021
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(
        expect.stringContaining(
          'https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'
        )
      )
    })
    test.each([
      {
        description:
          'visit before application - application created today, visit date yesterday',
        day: '9',
        month: '7',
        year: '2022',
        errorMessage:
          'Date of visit cannot be before the date your agreement began',
        errorHighlights: allErrorHighlights,
        applicationCreationDate: '2022-07-10'
      },
      {
        description:
          'visit date in future - application created today, visit date tomorrow',
        day: '1',
        month: '1',
        year: '3000',
        errorMessage: 'Date of visit must be in the past',
        errorHighlights: allErrorHighlights,
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing day and month and year',
        day: '',
        month: '',
        year: '',
        errorMessage: 'Enter the date the vet completed the review',
        errorHighlights: allErrorHighlights,
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing day',
        day: '',
        month: '05',
        year: '2023',
        errorMessage: 'Date of visit must include a day',
        errorHighlights: [labels.day],
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing month',
        day: '01',
        month: '',
        year: '2023',
        errorMessage: 'Date of visit must include a month',
        errorHighlights: [labels.month],
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing year',
        day: '01',
        month: '05',
        year: '',
        errorMessage: 'Date of visit must include a year',
        errorHighlights: [labels.year],
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing day and month',
        day: '',
        month: '',
        year: '2023',
        errorMessage: 'Date of visit must include a day and a month',
        errorHighlights: [labels.day, labels.month],
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing day and year',
        day: '',
        month: '05',
        year: '',
        errorMessage: 'Date of visit must include a day and a year',
        errorHighlights: [labels.day, labels.year],
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'missing month and year',
        day: '01',
        month: '',
        year: '',
        errorMessage: 'Date of visit must include a month and a year',
        errorHighlights: [labels.month, labels.year],
        applicationCreationDate: '2023-01-01'
      }
    ])(
      'returns error ($errorMessage) when partial or invalid input is given - $description',
      async ({
        day,
        month,
        year,
        errorMessage,
        errorHighlights,
        applicationCreationDate
      }) => {
        getEndemicsClaimMock.mockImplementationOnce(() => {
          return {
            latestVetVisitApplication: {
              ...latestVetVisitApplication,
              createdAt: applicationCreationDate
            }
          }
        })
        const options = {
          method: 'POST',
          url,
          payload: {
            crumb,
            [labels.day]: day,
            [labels.month]: month,
            [labels.year]: `${year}`,
            dateOfAgreementAccepted: applicationCreationDate,
            review: true
          },
          auth,
          headers: { cookie: `crumb=${crumb}` }

        }

        const res = await global.__SERVER__.inject(options)

        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(400)
        expect($('p.govuk-error-message').text().trim()).toEqual(
          `Error: ${errorMessage}`
        )
      }
    )

    test.each([
      {
        description: 'prior review claim difference is less than ten months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01',
        claim: {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2022-03-19T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2023-01-01'
          }
        }
      },
      {
        description: 'next review claim difference is less than 10 months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01',
        claim: {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2022-03-19T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2023-12-01'
          }
        }
      }
    ])(
      'Redirect to exception screen when ($description)',
      async ({ day, month, year, applicationCreationDate, claim }) => {
        getEndemicsClaimMock.mockImplementationOnce(() => {
          return {
            latestVetVisitApplication: {
              ...latestVetVisitApplication,
              createdAt: applicationCreationDate
            },
            previousClaims: [claim],
            typeOfReview: 'R'
          }
        })
        const options = {
          method: 'POST',
          url,
          payload: {
            crumb,
            [labels.day]: day.toString(),
            [labels.month]: month.toString(),
            [labels.year]: year.toString(),
            dateOfAgreementAccepted: applicationCreationDate
          },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }
        claimServiceApiMock.isValidDateOfVisit.mockImplementationOnce(() => ({
          isValid: false
        }))
        const res = await global.__SERVER__.inject(options)
        const $ = cheerio.load(res.payload)
        expect(res.statusCode).toBe(400)
        expect($('h1').text().trim()).toMatch(
          'You cannot continue with your claim'
        )
      }
    )

    test.each([
      {
        description: 'prior review claim difference is less than ten months and rejected',
        content: 'undefined - SBI undefined had a failed review claim for undefined cattle in the last 10 months.',
        dateOfVetVisitException: 'rejected review',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'previous review claim difference is more than 10 months',
        content: 'There must be no more than 10 months between your reviews and follow-ups.',
        dateOfVetVisitException: 'no review within 10 months past',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'previous review claim difference is more than 10 months',
        content: 'There must be at least 10 months between your follow-ups.',
        dateOfVetVisitException: 'another endemics within 10 months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'previous review claim difference is more than 10 months',
        content: 'There must be at least 10 months between your reviews.',
        dateOfVetVisitException: 'another review within 10 months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01'
      },
      {
        description: 'previous review claim is not ready to pay and user can not calim for endemics',
        content: 'You must have claimed for your review before you claim for the follow-up that happened after it.',
        dateOfVetVisitException: 'claim endemics before review status is ready to pay',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01'
      }
    ])(
      'Redirect to exception screen when ($description) and match content',
      async ({ day, month, year, applicationCreationDate, content, dateOfVetVisitException }) => {
        getEndemicsClaimMock.mockImplementationOnce(() => {
          return {
            typeOfReview: 'E'
          }
        })
        const options = {
          method: 'POST',
          url,
          payload: {
            crumb,
            [labels.day]: day.toString(),
            [labels.month]: month.toString(),
            [labels.year]: year.toString(),
            dateOfAgreementAccepted: applicationCreationDate
          },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }
        claimServiceApiMock.isValidDateOfVisit.mockImplementationOnce(() => ({
          isValid: false,
          reason: dateOfVetVisitException
        }))
        const res = await global.__SERVER__.inject(options)
        const $ = cheerio.load(res.payload)
        expect(res.statusCode).toBe(400)
        expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
        expect($('p.govuk-body').html()).toContain(content)
      }
    )

    test.each([
      {
        description: 'prior review claim difference is more than ten months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01',
        claim: {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2022-03-19T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2022-01-01'
          }
        }
      },
      {
        description: 'next review claim difference is more than 10 months',
        day: '01',
        month: '05',
        year: '2023',
        applicationCreationDate: '2023-01-01',
        claim: {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2022-03-19T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2025-01-01'
          }
        }
      }
    ])(
      'Redirect to next page when ($description)',
      async ({ day, month, year, applicationCreationDate, claim }) => {
        getEndemicsClaimMock.mockImplementationOnce(() => {
          return {
            latestVetVisitApplication: {
              ...latestVetVisitApplication,
              createdAt: applicationCreationDate
            },
            previousClaims: [claim],
            typeOfReview: 'R'
          }
        })
        const options = {
          method: 'POST',
          url,
          payload: {
            crumb,
            [labels.day]: day.toString(),
            [labels.month]: month.toString(),
            [labels.year]: year.toString(),
            dateOfAgreementAccepted: applicationCreationDate
          },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }
        claimServiceApiMock.isValidDateOfVisit.mockImplementationOnce(() => ({
          isValid: true
        }))

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
      }
    )
  })

  test('checks if typeOfReview is "R" or "EE"', () => {
    const typeOfReview = 'R'
    const type = 'EE'
    const review = ['R', type].includes(typeOfReview)
    expect(review).toBeTruthy()
  })
})
