const getCrumbs = require('../../../../utils/get-crumbs')
const { labels } = require('../../../../../app/config/visit-date')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const session = require('../../../../../app/session')
const appInsights = require('applicationinsights')
const createServer = require('../../../../../app/server')
const config = require('../../../../../app/config')
const { previousPageUrl } = require('../../../../../app/routes/endemics/date-of-visit-ms')
const { sanitizeHTML } = require('../../../../utils/sanitize-html')

jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
  getReviewTestResultWithinLast10Months: jest.fn().mockReturnValue('negative'),
  getReviewWithinLast10Months: jest.fn()
}))
jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const latestVetVisitApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: new Date('2023/01/01'),
  data: {
    visitDate: '2023-01-01',
    whichReview: 'beef'
  },
  statusId: 1,
  type: 'VV'
}

const latestEndemicsApplication = {
  reference: 'AHWR-2470-6BA9',
  createdAt: new Date('2025/01/01'),
  statusId: 1,
  type: 'EE'
}

const landingPage = '/claim/endemics/which-species'
const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/date-of-visit'

describe('GET /claim/endemics/date-of-visit handler', () => {
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
      }
    }
  })

  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    raiseInvalidDataEvent.mockResolvedValue({})
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        latestVetVisitApplication,
        latestEndemicsApplication,
        landingPage
      }
    })
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  test('returns 200', async () => {
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        latestEndemicsApplication,
        latestVetVisitApplication,
        typeOfReview: 'endemics',
        typeOfLivestock: 'beef',
        previousClaims: []
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
  })

  test('returns 200', async () => {
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        latestEndemicsApplication,
        latestVetVisitApplication,
        typeOfReview: 'endemics',
        typeOfLivestock: 'beef',
        previousClaims: [{
          data: {
            typeOfReview: 'R'
          }
        }]
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
  })
  test('returns 200 and fills input with value in session', async () => {
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        latestEndemicsApplication,
        latestVetVisitApplication,
        typeOfReview: 'endemics',
        typeOfLivestock: 'beef',
        previousClaims: [{
          data: {
            typeOfReview: 'R'
          }
        }],
        dateOfVisit: '2024-05-01'
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
  })

  test('when not logged in redirects to defra id', async () => {
    const options = {
      method: 'GET',
      url
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location.toString()).toEqual(
      expect.stringContaining(
        'https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'
      )
    )
  })
})

describe('POST /claim/endemics/date-of-visit handler', () => {
  let server

  beforeAll(async () => {
    config.optionalPIHunt.enabled = false
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(server)
    jest.clearAllMocks()
  })

  test('redirect back to page with errors if the entered date is of an incorrect format', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: 'second',
        [labels.month]: 'february',
        [labels.year]: '2000'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2000-february-second',
        error: 'Enter a date in the boxes below'
      }
    })
  })

  test('redirect back to page with errors if the entered date is of a correct format, but the date isnt real', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '31',
        [labels.month]: '2',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2025-2-31',
        error: 'Error: The date of review must be a real date'
      }
    })
  })

  test('redirect back to page with errors if the entered date is before the agreement date', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '1',
        [labels.month]: '12',
        [labels.year]: '2024'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2024-12-1',
        error: 'Error: The date of review cannot be before the date your agreement began'
      }
    })
  })

  test('redirect back to page with errors if the entered date is in the future', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '2',
        [labels.month]: '2',
        [labels.year]: '2040'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2040-2-2',
        error: 'Error: The date of review must be in the past'
      }
    })
  })

  test('user makes a review claim and has zero previous claims', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for the same species within the last 10 months', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2024-12-12'
          }
        }],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1).toString()} is invalid. Error: There must be at least 10 months between your reviews.`)

    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for the same species over 10 months ago', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2023-12-12'
          }
        }],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for a different species, and no others for same species', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'dairy',
            dateOfVisit: '2024-12-12'
          }
        }],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim over 10 months later for the same species', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestVetVisitApplication,
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim over 10 months later for a different species', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'pigs',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestVetVisitApplication,
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim within 10 months for the same species', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestVetVisitApplication: {
          ...latestVetVisitApplication,
          data: {
            visitDate: '2024-12-01',
            whichReview: 'beef'
          }
        },
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '02',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 2).toString()} is invalid. Error: There must be at least 10 months between your reviews.`)

    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 2))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim within 10 months for a different species', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestVetVisitApplication: {
          ...latestVetVisitApplication,
          data: {
            visitDate: '2024-12-01',
            whichReview: 'pigs'
          }
        },
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '02',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 2))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics claim within 10 months of the same species of their initial review claim', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  // Below test is an example of where we dont have an appropriate error page
  test('user makes an endemics claim and has no review of the same species', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'REPI-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'pigs',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: There must be no more than 10 months between your reviews and follow-ups.`)
  })

  test('user makes an endemics claim and has no review of the same species within 10 months', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'REPI-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'pigs',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: There must be no more than 10 months between your reviews and follow-ups.`)
  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of the same species', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          },
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'E',
            createdAt: '2024-10-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-10-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: There must be at least 10 months between your follow-ups.`)
  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of a different species, assuming everything else otherwise ok', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          },
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'E',
            createdAt: '2024-10-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-10-01'
            }
          },
          {
            reference: 'AHWR-4E4T-5TR3',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'pigs',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'pigs',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics claim and the review in question is rejected', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 10,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: Farmer Johns - SBI 12345 had a failed review claim for beef cattle in the last 10 months.`)
  })

  test('user makes an endemics claim and the review is not in READY_TO_PAY status (statusId: 9)', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 1,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
  })

  test('user makes an endemics claim and the review is not in PAID status (statusId: 8)', async () => { // unhappy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 1,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    const html = sanitizeHTML(res.payload)
    expect(html).toMatchSnapshot()
  })

  test('user has an old world claim, and makes a new world endemics claim', async () => { // happy path
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestVetVisitApplication: {
          ...latestVetVisitApplication,
          data: {
            visitDate: '2024-12-01',
            whichReview: 'beef'
          },
          statusId: 9
        },
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('for an endemics claim, it redirects to endemics date of testing page when claim is for beef or dairy, and the previous review test results are positive', async () => {
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    expect(session.setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'reviewTestResults', 'positive')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('for an endemics claim, it redirects to endemics species numbers page when claim is for beef or dairy, and the previous review test results are negative', async () => {
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'negative',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test(`for an endemics claim, it redirects to endemics species numbers page when claim 
        is for beef or dairy, and the previous review test results are positive 
        BUT optional PI hunt is enabled`, async () => {
    config.optionalPIHunt.enabled = true
    session.getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/species-numbers')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })
})

describe('previousPageUrl', () => {
  test('should return url of endemicsVetVisitsReviewTestResults if endemics, old world claim is species of current user journey, and no relevant new world claims', () => {
    const latestVetVisitApplication = {
      data: {
        whichReview: 'beef'
      }
    }

    const typeOfReview = 'E'
    const previousClaims = []
    const typeOfLivestock = 'beef'

    expect(previousPageUrl(latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock)).toBe('/claim/endemics/vet-visits-review-test-results')
  })

  test('should return url of endemicsWhichTypeOfReview if claim type is review', () => {
    const latestVetVisitApplication = {
      data: {
        whichReview: 'beef'
      }
    }

    const typeOfReview = 'R'
    const previousClaims = []
    const typeOfLivestock = 'beef'

    expect(previousPageUrl(latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock)).toBe('/claim/endemics/which-type-of-review')
  })

  test('should return url of endemicsWhichTypeOfReview if old world review type of livestock is not beef or dairy', () => {
    const latestVetVisitApplication = {
      data: {
        whichReview: 'pigs'
      }
    }

    const typeOfReview = 'E'
    const previousClaims = []
    const typeOfLivestock = 'beef'

    expect(previousPageUrl(latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock)).toBe('/claim/endemics/which-type-of-review')
  })

  test('should return url of endemicsWhichTypeOfReview if there are relevant new world claims (i.e. for the same species as the current journey)', () => {
    const latestVetVisitApplication = {
      data: {
        whichReview: 'beef'
      }
    }

    const typeOfReview = 'E'
    const previousClaims = [{
      reference: 'REBC-C2EA-C718',
      applicationReference: 'AHWR-2470-6BA9',
      statusId: 1,
      type: 'R',
      createdAt: '2024-12-12T10:25:11.318Z',
      data: {
        typeOfLivestock: 'beef',
        dateOfVisit: '2024-12-12'
      }
    }]
    const typeOfLivestock = 'beef'

    expect(previousPageUrl(latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock)).toBe('/claim/endemics/which-type-of-review')
  })
})
