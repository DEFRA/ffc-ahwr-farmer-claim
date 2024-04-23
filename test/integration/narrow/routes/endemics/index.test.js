const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const urlPrefix = require('../../../../../app/config').urlPrefix
const applicationServiceApiMock = require('../../../../../app/api-requests/application-service-api')
const claimServiceApiMock = require('../../../../../app/api-requests/claim-service-api')
const logoutMock = require('../../../../../app/lib/logout')
jest.mock('../../../../../app/api-requests/application-service-api')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/lib/logout')

describe('Claim endemics home page test', () => {
  const url = `${urlPrefix}/endemics?from=dashboard&sbi=1234567`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }

  beforeAll(() => {
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

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Redirects us to endemicsWhichTypeOfReviewURI if latest claim is within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'R'
      }
    ])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
  })

  test('Redirects us to endemicsWhichSpeciesURI if latest application is within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-species')
  })

  test('Redirects us to endemicsWhichSpeciesURI if latest application is NOT within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(false)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-species')
  })

  test('Renders index page if no url parameters', async () => {
    const options = {
      method: 'GET',
      url: `${urlPrefix}/endemics`,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text().trim()).toMatch('Claim funding to improve livestock health and welfare')
    expect($('title').text().trim()).toEqual('Claim funding - Get funding to improve animal health and welfare')
    expectPhaseBanner.ok($)
  })
})
