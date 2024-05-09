const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { rcvs: rcvsErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { vetRcvs: rcvsKey } } = require('../../../../app/session/keys')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
  expect($('label[for=rcvs]').text()).toMatch('RCVS number')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toEqual('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number? - Annual health and welfare review of livestock')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/vet-name')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Vet, enter rcvs test', () => {
  const url = '/claim/vet-rcvs'
  const auth = { credentials: {}, strategy: 'cookie' }

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

    test('loads rcvs number if in session', async () => {
      const rcvs = '1234567'
      const options = {
        method: 'GET',
        url,
        auth
      }
      session.getClaim.mockReturnValue(rcvs)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#rcvs').val()).toEqual(rcvs)
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
        payload: { crumb, rcvs: '1234567' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { rcvs: undefined, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: null, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: '', errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: 'not-valid-ref', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: 'not-valid-ref' },
      { rcvs: '123456A', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '123456A' },
      { rcvs: '12345678', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '12345678' }
    ])('returns 400 when payload is invalid - %p', async ({ rcvs, errorMessage, expectedVal }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, rcvs },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#rcvs').val()).toEqual(expectedVal)
    })

    test.each([
      { rcvs: '1234567' },
      { rcvs: '123456X' },
      { rcvs: '  123456X  ' }
    ])('returns 200 when payload is valid and stores in session (rcvs = $rcvs)', async ({ rcvs }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, rcvs },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/urn-result')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, rcvsKey, rcvs.trim())
    })
  })
})
