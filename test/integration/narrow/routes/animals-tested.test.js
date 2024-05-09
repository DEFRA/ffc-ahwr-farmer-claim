const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { animalsTested: atErrorMessages } = require('../../../../app/lib/error-messages')
const { claim: { animalsTested: animalsTestedKey } } = require('../../../../app/session/keys')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('How many animals did the vet test?')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toEqual('How many animals did the vet test? - Annual health and welfare review of livestock')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/vet-visit-date')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Number of animals tested', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/animals-tested'

  beforeAll(() => {
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
        }
      }
    })
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

    test('loads name if in session', async () => {
      const animalsTested = '22'
      const options = {
        method: 'GET',
        url,
        auth
      }

      session.getClaim.mockReturnValue(animalsTested)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#number-of-animals-tested').val()).toEqual(animalsTested)

      session.getClaim.mockRestore()
    })
  })

  describe(`POST to ${url} route`, () => {
    const method = 'POST'
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method,
        url,
        payload: { crumb, name: 'vetname' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { animalsTested: null, errorMessage: atErrorMessages.enterNumber, expectedVal: undefined },
      { animalsTested: '', errorMessage: atErrorMessages.enterNumber, expectedVal: undefined },
      { animalsTested: '99999999', errorMessage: atErrorMessages.numberMax, expectedVal: '99999999' },
      { animalsTested: '9AndLeters', errorMessage: atErrorMessages.numberPattern, expectedVal: '9AndLeters' }
    ])('returns 400 when payload is invalid - %p', async ({ animalsTested, errorMessage, expectedVal }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, animalsTested },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#number-of-animals-tested').val()).toEqual(expectedVal)
    })

    test.each([
      { whichReview: 'beef', animalsTested: '5', nextPage: '/claim/vet-name' },
      { whichReview: 'sheep', animalsTested: '10', nextPage: '/claim/vet-name' },
      { whichReview: 'pigs', animalsTested: '30', nextPage: '/claim/vet-name' }
    ])('returns 302 and redirect to /claim/vet-name when whichReview: $whichReview and animalsTested: $animalsTested.', async ({ whichReview, animalsTested }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, animalsTested },
        url,
        auth
      }

      session.getClaim.mockReturnValue({ whichReview })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/vet-name')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, animalsTestedKey, animalsTested)

      session.getClaim.mockRestore()
    })

    test.each([
      { whichReview: 'beef', animalsTested: '4' },
      { whichReview: 'sheep', animalsTested: '9' },
      { whichReview: 'pigs', animalsTested: '29' }
    ])('returns 302 and redirect to $nextPage when whichReview: $whichReview and animalsTested: $animalsTested.', async ({ whichReview, animalsTested, nextPage, status }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, animalsTested },
        url,
        auth
      }

      session.getClaim.mockReturnValue({ whichReview })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/number-of-animals-ineligible')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, animalsTestedKey, animalsTested, 'fail-threshold')

      session.getClaim.mockRestore()
    })
  })
})
