const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const sessionMock = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Check Answers test', () => {
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }
  const url = '/claim/check-answers'

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
        },
        dateOfTesting: {
          enabled: false
        }
      }
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200 when includes animals tested', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const organisation = {
        name: 'org-name',
        sbi: '1324243'
      }
      const claim = {
        data: {
          whichReview: 'beef'
        }
      }
      sessionMock.getClaim.mockReturnValueOnce('XYZ')
        .mockReturnValueOnce(23)
        .mockReturnValueOnce('2015-03-25')
        .mockReturnValueOnce('2015-03-26')
        .mockReturnValueOnce('1234567')
        .mockReturnValueOnce('URNREF')
        .mockReturnValueOnce(organisation)
        .mockReturnValueOnce(claim)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toContain('Check your answers - Annual health and welfare review of livestock')
      expect($('.govuk-summary-list__key').text()).toContain('Business name')
      expect($('.govuk-summary-list__key').text()).toContain('SBI')
      expect($('.govuk-summary-list__key').text()).toContain('11 or more cattle')
      expect($('.govuk-summary-list__key').text()).toContain('Type of review')
      expect($('.govuk-summary-list__key').text()).toContain('Date of visit')
      expect($('.govuk-summary-list__key').text()).toContain('Number of animals tested')
      expect($('.govuk-summary-list__key').text()).toContain('Vet\'s name')
      expect($('.govuk-summary-list__key').text()).toContain('Vet\'s RCVS number')
      expect($('.govuk-summary-list__key').text()).toContain('Test results URN')

      expectPhaseBanner.ok($)
    })

    test('returns 200 when it does not include animals tested', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const organisation = {
        name: 'org-name',
        sbi: '1324243'
      }
      const claim = {
        data: {
          whichReview: 'beef'
        }
      }
      sessionMock.getClaim.mockReturnValueOnce('XYZ')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('2015-03-25')
        .mockReturnValueOnce('2015-03-26')
        .mockReturnValueOnce('1234567')
        .mockReturnValueOnce('URNREF')
        .mockReturnValueOnce(organisation)
        .mockReturnValueOnce(claim)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toContain('Check your answers - Annual health and welfare review of livestock')
      expect($('.govuk-summary-list__key').text()).toContain('Business name')
      expect($('.govuk-summary-list__key').text()).toContain('SBI')
      expect($('.govuk-summary-list__key').text()).toContain('11 or more cattle')
      expect($('.govuk-summary-list__key').text()).toContain('Type of review')
      expect($('.govuk-summary-list__key').text()).toContain('Date of visit')
      expect($('.govuk-summary-list__key').text()).toContain('Vet\'s name')
      expect($('.govuk-summary-list__key').text()).toContain('Vet\'s RCVS number')
      expect($('.govuk-summary-list__key').text()).toContain('Test results URN')

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
})
