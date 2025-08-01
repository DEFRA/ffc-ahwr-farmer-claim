import appInsights from 'applicationinsights'

import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { visitDate } from '../../../../../app/config/visit-date.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { previousPageUrl } from '../../../../../app/routes/endemics/date-of-visit.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { getHerds } from '../../../../../app/api-requests/application-service-api.js'

const { labels } = visitDate

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

jest.mock('../../../../../app/api-requests/application-service-api.js')

function expectPageContentOk ($, previousPageUrl) {
  expect($('title').text()).toMatch(
    /Date of review|follow-up - Get funding to improve animal health and welfare/i
  )
  expect($('h1').text().trim()).toMatch(/(Date of review | follow-up)/i)
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
  expect(backLink.attr('href')).toMatch(previousPageUrl)
}

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
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    raiseInvalidDataEvent.mockResolvedValue({})
    getEndemicsClaim.mockImplementation(() => {
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

  test('returns 200 when you dont have any previous claims', async () => {
    getEndemicsClaim.mockImplementation(() => {
      return {
        latestEndemicsApplication,
        latestVetVisitApplication,
        typeOfReview: 'endemics',
        typeOfLivestock: 'beef',
        previousClaims: [],
        reference: 'TEMP-6GSE-PIR8'
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expectPageContentOk($, '/claim/endemics/which-type-of-review')
    expectPhaseBanner.ok($)
  })

  test('returns 200 when you do have previous claims', async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        reference: 'TEMP-6GSE-PIR8'
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expectPageContentOk($, '/claim/endemics/which-type-of-review')
    expectPhaseBanner.ok($)
  })

  test('returns 200 and fills input with value in session', async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        dateOfVisit: '2024-05-01',
        reference: 'TEMP-6GSE-PIR8'
      }
    })
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('#visit-date-day')[0].attribs.value).toEqual('1')
    expect($('#visit-date-month')[0].attribs.value).toEqual('5')
    expect($('#visit-date-year')[0].attribs.value).toEqual('2024')
    expectPageContentOk($, '/claim/endemics/which-type-of-review')
    expectPhaseBanner.ok($)
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
        'oauth2/v2.0/authorize'
      )
    )
  })
})

describe('POST /claim/endemics/date-of-visit handler', () => {
  let server

  beforeAll(async () => {
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
    getEndemicsClaim.mockImplementation(() => {
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

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('.govuk-error-summary__list > li > a').text().trim()).toEqual('Enter the date of review')
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2000-february-second',
        error: 'Enter the date of review'
      }
    })
  })

  test('redirect back to page with errors if the entered date is of a correct format, but the date isnt real', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('.govuk-error-summary__list > li > a').text().trim()).toEqual('The date of review must be a real date')
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2025-2-31',
        error: 'The date of review must be a real date'
      }
    })
  })

  test('redirect back to page with errors if the entered date is before the agreement date', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('.govuk-error-summary__list > li > a').text().trim()).toEqual('The date of review must be the same as or after the date of your agreement')
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2024-12-1',
        error: 'The date of review must be the same as or after the date of your agreement'
      }
    })
  })

  test('redirect back to page with errors if the entered date is in the future', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('.govuk-error-summary__list > li > a').text().trim()).toEqual(
      'The date of review must be today or in the past'
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: 'TEMP-6GSE-PIR8',
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '2040-2-2',
        error: 'The date of review must be today or in the past'
      }
    })
  })

  test('user makes a review claim and has zero previous claims', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and created an application on the same day', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication: {
          ...latestEndemicsApplication,
          createdAt: new Date('2025/01/01 14:30:00')
        },
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for the same species within the last 10 months', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1).toString()} is invalid. Error: There must be at least 10 months between your reviews.`)

    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for the same species over 10 months ago', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for a different species, no others for same species and is after MS was enabled', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-02-26'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '26',
        [labels.month]: '02',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 1, 26))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test(`user makes a review claim and has a previous review claim for a different species, 
    no others for same species and is before MS was enabled`, async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `User is attempting to claim for MS with a date of visit of ${new Date(2025, 0, 1).toString()} which is before MS was enabled.`)

    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim over 10 months later for the same species', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim over 10 months later for a different species', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim within 10 months for the same species', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-02'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 2).toString()} is invalid. Error: There must be at least 10 months between your reviews.`)

    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 2))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user has an old world claim, and makes a new world claim within 10 months for a different species', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-02'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 2))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics claim within 10 months of the same species of their initial review claim', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics dairy claim after dairy follow up release', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
              typeOfLivestock: 'dairy',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'dairy',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication,
        dateOfVisit: '2025-01-21'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '21',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/species-numbers')
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 21))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics dairy claim before dairy follow up release', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
              typeOfLivestock: 'dairy',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'dairy',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication,
        dateOfVisit: '2025-01-20'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '20',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)
    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `User is attempting to claim for dairy follow-up with a date of visit of ${new Date(2025, 0, 20).toString()} which is before dairy follow-ups was enabled.`)

    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 20))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of the same species', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('title').text()).toMatch(
      'You cannot continue with your claim - Get funding to improve animal health and welfare - GOV.UKGOV.UK'
    )
    const link = $('a.govuk-link[rel="external"]')
    expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
    expect(link.text()).toBe('There must be at least 10 months between your follow-ups.')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: There must be at least 10 months between your follow-ups.`)
  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of a different species, assuming everything else otherwise ok', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-02-27'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '27',
        [labels.month]: '02',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/date-of-testing')
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 1, 27))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes an endemics claim and the review in question is rejected', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('title').text()).toMatch(
      'You cannot continue with your claim - Get funding to improve animal health and welfare - GOV.UKGOV.UK'
    )
    const mainMessage = $('h1.govuk-heading-l').first().nextAll('p').first()
    expect(mainMessage.text().trim()).toBe('Farmer Johns - SBI 12345 had a failed review claim for beef cattle in the last 10 months.')
    expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', `Value ${new Date(2025, 0, 1)} is invalid. Error: Farmer Johns - SBI 12345 had a failed review claim for beef cattle in the last 10 months.`)
  })

  test('user makes an endemics claim and the review is not in READY_TO_PAY status (statusId: 9)', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('title').text()).toMatch(
      'You cannot continue with your claim - Get funding to improve animal health and welfare - GOV.UKGOV.UK'
    )
    const link = $('a.govuk-link[rel="external"]')
    expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
    expect(link.text()).toBe('Your review claim must have been approved before you claim for the follow-up that happened after it.')
  })

  test('user makes an endemics claim and the review is not in PAID status (statusId: 8)', async () => { // unhappy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(400)
    expect($('title').text()).toMatch(
      'You cannot continue with your claim - Get funding to improve animal health and welfare - GOV.UKGOV.UK'
    )
    const link = $('a.govuk-link[rel="external"]')
    expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
    expect(link.text()).toBe('Your review claim must have been approved before you claim for the follow-up that happened after it.')
  })

  test('user has an old world claim, and makes a new world endemics claim', async () => { // happy path
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 0, 1))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('for an endemics claim, it redirects to endemics date of testing page when claim is for beef or dairy, and the previous review test results are positive', async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'reviewTestResults', 'positive')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('should redirect to endemics date of testing page when endemics claim is for beef or dairy, the previous review test results has not been set and there are multiple previous reviews of different species with different test results', async () => {
    getEndemicsClaim.mockImplementation(() => {
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
              typeOfLivestock: 'sheep',
              dateOfVisit: '2024-09-01',
              testResults: 'negative'
            }
          },
          {
            reference: 'AHWR-C2EA-C718',
            applicationReference: 'AHWR-2470-6BA9',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'beef',
              dateOfVisit: '2024-09-01',
              testResults: 'positive'
            }
          }
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reference: 'TEMP-6GSE-PIR8',
        latestEndemicsApplication,
        dateOfVisit: '2024-10-01'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '27',
        [labels.month]: '02',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'relevantReviewForEndemics', {
      reference: 'AHWR-C2EA-C718',
      applicationReference: 'AHWR-2470-6BA9',
      statusId: 9,
      type: 'R',
      createdAt: '2024-09-01T10:25:11.318Z',
      data: {
        typeOfLivestock: 'beef',
        dateOfVisit: '2024-09-01',
        testResults: 'positive'
      }
    })
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date('2025/02/27'))
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'reviewTestResults', 'positive')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('for an endemics claim, it redirects to endemics species numbers page when claim is for beef or dairy, and the previous review test results are negative', async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-01'
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
        BUT visit date post go live`, async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-21'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        /* see PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE */
        [labels.day]: '21',
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

  test(`for an endemics claim, it redirects to endemics date of testing page when claim 
    is for beef or dairy, and the previous review test results are positive 
    AND optional PI hunt is enabled BUT visit date pre go live`, async () => {
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-01-20'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        /* see PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE */
        [labels.day]: '20',
        [labels.month]: '01',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('should redirect to select the herd page when there are previous herds and is multi herds journey', async () => {
    getHerds.mockResolvedValueOnce([{ id: '1', herdName: 'herd one' }])
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-05-13'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '13',
        [labels.month]: '05',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/select-the-herd')
  })

  test('should redirect to enter herd name page when there are not previous herds and is multi herds journey', async () => {
    getHerds.mockResolvedValueOnce([])
    getEndemicsClaim.mockImplementation(() => {
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
        latestEndemicsApplication,
        dateOfVisit: '2025-05-13'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '13',
        [labels.month]: '05',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
  })

  test('should redirect to species-numbers page when making a follow-up claim with visit date of pre-MH golive, against a pre-MH review, and already made post-MH review for another herd', async () => {
    getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'REBC-CBLH-B9BB',
            applicationReference: 'IAHW-T1EX-1R33',
            statusId: 9,
            type: 'R',
            createdAt: '2025-05-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'dairy',
              dateOfVisit: '2025-05-01',
              herdId: 'fake-herd-id'
            }
          },
          {
            reference: 'REBC-CBLH-A9AA',
            applicationReference: 'IAHW-T1EX-1R33',
            statusId: 9,
            type: 'R',
            createdAt: '2024-09-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'dairy',
              dateOfVisit: '2024-09-01'
            }
          }
        ],
        typeOfLivestock: 'dairy',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-CBLH-C9CC',
        latestEndemicsApplication,
        dateOfVisit: '2025-04-30'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '30',
        [labels.month]: '04',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/claim/endemics/species-numbers')
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'dateOfVisit', new Date(2025, 3, 30))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('should error when trying to follow-up against post-MH review and visit date is pre-MH golive', async () => {
    getEndemicsClaim.mockImplementation(() => {
      return {
        typeOfReview: 'E',
        previousClaims: [
          {
            reference: 'REBC-CBLH-B9BB',
            applicationReference: 'IAHW-T1EX-1R33',
            statusId: 9,
            type: 'R',
            createdAt: '2025-05-01T10:25:11.318Z',
            data: {
              typeOfLivestock: 'dairy',
              dateOfVisit: '2025-05-01',
              herdId: 'fake-herd-id'
            }
          }
        ],
        typeOfLivestock: 'dairy',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-CBLH-C9CC',
        latestEndemicsApplication,
        dateOfVisit: '2025-04-30'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '30',
        [labels.month]: '04',
        [labels.year]: '2025'
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('.govuk-heading-l').text().trim()).toEqual('You cannot continue with your claim')
    expect($('.govuk-link').filter(function () { return $(this).text().trim() === 'Tell us if you are claiming for a review or follow up.' }).length).toBe(1)
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
