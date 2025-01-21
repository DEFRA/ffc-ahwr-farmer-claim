const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const { labels } = require('../../../../../app/config/visit-date')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const getEndemicsClaimMock =
  require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock =
  require('../../../../../app/session').setEndemicsClaim
const appInsights = require('applicationinsights')
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
  getReviewTestResultWithinLast10Months: jest.fn().mockReturnValue('negative'),
  getReviewWithinLast10Months: jest.fn()
}))
jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

function expectPageContentOk ($, previousPageUrl) {
  expect($('title').text()).toMatch(
    'Date of visit - Get funding to improve animal health and welfare'
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
  createdAt: '2023-01-01',
  data: {
    visitDate: '2023-01-01',
    whichReview: 'beef'
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
const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/date-of-visit'

describe('GET /claim/endemics/date-of-visit handler', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    raiseInvalidDataEvent.mockImplementation(() => { })
    getEndemicsClaimMock.mockImplementation(() => {
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

  test('returns 200', async () => {
    getEndemicsClaimMock.mockImplementation(() => {
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
    const $ = cheerio.load(res.payload)
    expectPageContentOk($, '/claim/endemics/which-type-of-review')
    expectPhaseBanner.ok($)
  })
  test('returns 200 and fills input with value in session', async () => {
    getEndemicsClaimMock.mockImplementation(() => {
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
        'https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'
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
  })

  // getEndemicsClaimMock.mockReturnValue({
  //   latestVetVisitApplication: {
  //     ...latestVetVisitApplication,
  //     createdAt: applicationCreationDate
  //   },
  //   previousClaims: [claim],
  //   typeOfLivestock: claim.data.typeOfLivestock,
  //   typeOfReview: 'E'
  // })

  test('redirect back to page with errors if the entered date is of an incorrect format', async () => { // unhappy path
    getEndemicsClaimMock.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        latestVetVisitApplication: {
          ...latestVetVisitApplication
          // createdAt: '2023-01-01'
        }
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '123',
        [labels.month]: '123',
        [labels.year]: '123',
        dateOfAgreementAccepted: '2025-01-01',
        review: true
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('p.govuk-error-message').text().trim()).toEqual(
      'Error: The date of review must be a real date'
    )
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'claim-invalid-date-of-visit',
      properties: {
        tempClaimReference: undefined,
        journeyType: 'review',
        dateOfAgreement: '2025-01-01',
        dateEntered: '123-123-123',
        error: 'The date of review must be a real date'
      }
    })
  })

  test('redirect back to page with errors if the entered date is before the agreement date', () => { // unhappy path

  })

  test('redirect back to page with errors if the entered date is in the future', () => { // unhappy path

  })

  test.only('user makes a review claim and has zero previous claims', async () => { // happy path
    getEndemicsClaimMock.mockImplementation(() => {
      return {
        typeOfReview: 'R',
        previousClaims: [
          {
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
        ],
        typeOfLivestock: 'beef',
        organisation: {
          name: 'Farmer Johns',
          sbi: '12345'
        },
        reviewTestResults: 'positive',
        reference: 'TEMP-6GSE-PIR8'
      }
    })
    const options = {
      method: 'POST',
      url,
      payload: {
        crumb,
        [labels.day]: '01',
        [labels.month]: '01',
        [labels.year]: '2025',
        dateOfAgreementAccepted: '2025-01-01',
        review: true
      },
      auth,
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(302)
    expectPageContentOk($, '/claim/endemics/which-type-of-review')
    expect(setEndemicsClaimMock).toHaveBeenCalledWith(options.payload, 'dateOfVisit', new Date(1, 0, 2025))
    expect(appInsights.defaultClient.trackEvent).not.toHaveBeenCalled()
  })

  test('user makes a review claim and has a previous review claim for the same species within the last 10 months', () => { // unhappy path

  })

  test('user makes a review claim and has a previous review claim for the same species over 10 months ago', () => { // happy path

  })

  test('user makes a review claim and has a previous review claim for a different species, and no others for same species', () => { // happy path

  })

  test('user has an old world claim, and makes a new world claim over 10 months later for the same species', () => { // happy path

  })

  test('user has an old world claim, and makes a new world claim over 10 months later for a different species', () => { // happy path

  })

  test('user has an old world claim, and makes a new world claim within 10 months for the same species', () => { // unhappy path

  })

  test('user has an old world claim, and makes a new world claim within 10 months for a different species', () => { // unhappy path

  })

  test('user makes an endemics claim within 10 months of the same species of their initial review claim', () => { // happy path

  })

  test('user makes an endemics claim and has no review of the same species', () => { // unhappy path

  })

  test('user makes an endemics claim and has no review of the same species within 10 months', () => { // unhappy path

  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of the same species', () => { // unhappy path

  })

  test('user makes an endemics claim within 10 months of a previous endemics claim of a different species, assuming everything else otherwise ok', () => { // happy path

  })

  test('user makes an endemics claim and the review in question is rejected', () => { // unhappy path

  })

  test('user makes an endemics claim and the review is not in READY_TO_PAY status (statusId: 9)', () => { // unhappy path

  })

  test('user makes an endemics claim and the review is not in PAID status (statusId: 8)', () => { // unhappy path

  })

  test('user has an old world claim, and makes a new world endemics claim', () => { // happy path

  })

  test('for an endemics claim, it redirects to endemics date of testing page when claim is for beef or dairy, and the previous review test results are positive', () => {

  })

  test('for an endemics claim, it redirects to endemics species numbers page when claim is for beef or dairy, and the previous review test results are negative', () => {

  })

  test(`for an endemics claim, it redirects to endemics species numbers page when claim 
        is for beef or dairy, and the previous review test results are positive 
        BUT optional PI hunt is enabled`, () => {
    //  setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
  })
})
