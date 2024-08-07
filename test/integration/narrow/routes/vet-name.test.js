const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { name: nameErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { vetName: nameKey } } = require('../../../../app/session/keys')

function expectPageContentOk ($, backLinkUrl = '/claim/animals-tested') {
  expect($('.govuk-heading-l').text()).toEqual('What is the vet’s name?')
  expect($('label[for=name]').text()).toMatch('Vet\'s full name')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toContain('What is the vet’s name? - Annual health and welfare review of livestock')
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch(backLinkUrl)
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Vet, enter name test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/vet-name'

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
      session.getClaim.mockReturnValue({})

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
    })

    test('loads name if in session', async () => {
      const name = 'vet name'
      const mockClaim = { data: { whichReview: 'beef' }, [`${nameKey}`]: name }
      const options = {
        method: 'GET',
        url,
        auth
      }
      session.getClaim.mockReturnValue(mockClaim)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#name').val()).toEqual(name)
    })

    test('back to vet visit date if dairy', async () => {
      const name = 'vet name'
      const mockClaim = { data: { whichReview: 'dairy' }, [`${nameKey}`]: name }
      const options = {
        method: 'GET',
        url,
        auth
      }
      session.getClaim.mockReturnValue(mockClaim)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($, '/claim/vet-visit-date')
      expectPhaseBanner.ok($)
      expect($('#name').val()).toEqual(name)
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
      { name: undefined, errorMessage: nameErrorMessages.enterName, expectedVal: undefined },
      { name: null, errorMessage: nameErrorMessages.enterName, expectedVal: undefined },
      { name: '', errorMessage: nameErrorMessages.enterName, expectedVal: '' },
      { name: 'a'.repeat(51), errorMessage: nameErrorMessages.nameLength, expectedVal: 'a'.repeat(51) },
      { name: 'aa%%', errorMessage: nameErrorMessages.namePattern, expectedVal: 'aa%%' }
    ])('returns 400 when payload is invalid - %p', async ({ name, errorMessage, expectedVal }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, name },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#name').val()).toEqual(expectedVal)
    })

    test.each([
      { name: 'a' },
      { name: 'a'.repeat(50) },
      { name: `  ${'a'.repeat(50)}  ` },
      { name: 'aa11', errorMessage: nameErrorMessages.namePattern, expectedVal: 'aa11' },
      { name: "a&,' -/()" }
    ])('returns 200 when payload is valid and stores in session (name = $name)', async ({ name }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, name },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/vet-rcvs')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, nameKey, name.trim())
    })
  })
})
