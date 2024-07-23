const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { urn: urnErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { urnResult: urnResultKey } } = require('../../../../app/session/keys')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('What is the laboratory unique reference number for the test results?')
  expect($('label[for=urn]').text()).toMatch('Enter the unique reference number (URN) for the laboratory test results. You can find it on the review summary the vet has given you.')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toContain('What is the laboratory unique reference number for the test results? - Annual health and welfare review of livestock')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/claim/vet-rcvs')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Enter URN test result test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/urn-result'

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

    test('loads urn if in session', async () => {
      const urn = 'fakeurn'
      const options = {
        method: 'GET',
        url,
        auth
      }
      session.getClaim.mockReturnValue(urn)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#urn').val()).toEqual(urn)
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
        payload: { crumb, urn: 'urnfake' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { urn: undefined, errorMessage: urnErrorMessages.enterUrn, expectedVal: undefined },
      { urn: null, errorMessage: urnErrorMessages.enterUrn, expectedVal: undefined },
      { urn: '', errorMessage: urnErrorMessages.enterUrn, expectedVal: '' },
      { urn: 'a'.repeat(51), errorMessage: urnErrorMessages.urnLength, expectedVal: 'a'.repeat(51) },
      { urn: 'aa&12', errorMessage: urnErrorMessages.urnPattern, expectedVal: 'aa&12' }
    ])('returns 400 when payload is invalid - %p', async ({ urn, errorMessage, expectedVal }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, urn },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#urn').val()).toEqual(expectedVal)
    })

    test.each([
      { urn: 'a' },
      { urn: 'a'.repeat(50) },
      { urn: `  ${'a'.repeat(50)}  ` }
    ])('returns 200 when payload is valid and stores in session (urn = $urn)', async ({ urn }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, urn },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/check-answers')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, urnResultKey, urn.trim())
    })
  })
})
